# Dockerfile recipes

Version numbers in `FROM` lines are examples: match the project's runtime version and pin a
digest in production builds.

## Contents

1. `.dockerignore`
2. Node.js API (TypeScript)
3. Next.js (standalone output)
4. Python (uv)
5. Go (distroless)
6. Private registry tokens with BuildKit secrets
7. Compose for local development
8. Debugging images and containers

## 1. `.dockerignore`

```
.git
.github
node_modules
.next
dist
build
coverage
*.log
.env*
!.env.example
Dockerfile*
compose*.yaml
.vscode
.idea
**/__pycache__
.venv
tests
```

## 2. Node.js API (TypeScript)

```dockerfile
# syntax=docker/dockerfile:1
ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-slim AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --include=dev

FROM deps AS build
COPY . .
RUN npm run build && npm prune --omit=dev

FROM base AS runtime
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.revision=$GIT_SHA
ENV GIT_SHA=$GIT_SHA
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

Run migrations from the same image with a different command (`node dist/migrate.js`), as a
separate job before the new version receives traffic.

## 3. Next.js (standalone output)

```ts
// next.config.ts
const nextConfig = { output: 'standalone' }
export default nextConfig
```

```dockerfile
# syntax=docker/dockerfile:1
ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN --mount=type=cache,target=/app/.next/cache npm run build

FROM base AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

`NEXT_PUBLIC_*` variables are inlined at build time, so they must be present during
`npm run build` (as build args) and an image built for one environment shows that environment's
public values. Keep environment-specific values server-side, read at runtime, so one image can be
promoted across environments. Check the installed version's
`node_modules/next/dist/docs/01-app/02-guides/self-hosting.md` for caching and image
optimization settings.

## 4. Python (uv)

```dockerfile
# syntax=docker/dockerfile:1
FROM python:3.13-slim AS build
COPY --from=ghcr.io/astral-sh/uv:0.9 /uv /usr/local/bin/uv
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv uv sync --frozen --no-dev --no-install-project
COPY . .
RUN --mount=type=cache,target=/root/.cache/uv uv sync --frozen --no-dev

FROM python:3.13-slim AS runtime
RUN useradd --create-home --uid 10001 app
WORKDIR /app
COPY --from=build --chown=app:app /app /app
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1
USER app
EXPOSE 8000
CMD ["gunicorn", "app.main:app", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "--graceful-timeout", "25"]
```

## 5. Go (distroless)

```dockerfile
# syntax=docker/dockerfile:1
FROM golang:1.25 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download
COPY . .
RUN --mount=type=cache,target=/go/pkg/mod --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/server /server
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/server"]
```

## 6. Private registry tokens with BuildKit secrets

```dockerfile
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
```

```bash
docker buildx build --secret id=npmrc,src=$HOME/.npmrc -t app .
# GitHub Actions: docker/build-push-action with `secrets: |` npmrc=${{ secrets.NPMRC }}
```

The secret is mounted only for that `RUN` and never stored in a layer.

## 7. Compose for local development

```yaml
# compose.yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app_dev
    ports: ['127.0.0.1:5432:5432']
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U app -d app_dev']
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:8-alpine
    ports: ['127.0.0.1:6379:6379']
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s

  mail:
    image: axllent/mailpit
    ports: ['127.0.0.1:8025:8025', '127.0.0.1:1025:1025']

  # Optional: run the app in a container too
  app:
    build: { context: ., target: deps }
    command: npm run dev
    environment:
      DATABASE_URL: postgres://app:app@postgres:5432/app_dev
      REDIS_URL: redis://redis:6379
    ports: ['127.0.0.1:3000:3000']
    volumes:
      - .:/app
      - /app/node_modules          # keep the container's node_modules
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }
    profiles: [app]

volumes:
  pgdata:
```

`docker compose up -d` starts the dependencies; `docker compose --profile app up` adds the app.

## 8. Debugging images and containers

```bash
docker image ls app                         # size
docker history --no-trunc app:latest        # what each layer added
dive app:latest                             # interactive layer explorer
docker run --rm -it --entrypoint sh app     # poke around (not available in distroless; use a :debug variant)
docker run --rm --read-only --tmpfs /tmp --user 10001 app   # test production-like restrictions locally
docker stop -t 30 <id> && docker logs <id>  # check graceful shutdown: logs should show a clean exit before 30s
trivy image --severity HIGH,CRITICAL --ignore-unfixed app:latest
```

If `docker stop` takes exactly the timeout and then the container exits with code 137, the
process did not handle `SIGTERM` (shell-form `CMD`, `npm start` wrapper, or no handler).
