---
name: containers
description: Write, review and optimise Dockerfiles, container images and Docker Compose setups - multi-stage builds, small and secure base images, layer caching, non-root users, secrets at build time, signal handling and graceful shutdown, health checks, image scanning, SBOMs, multi-architecture builds and local development with Compose - for Node.js/Next.js, Python, Go and other services. Use this whenever creating or editing a Dockerfile, .dockerignore, compose.yaml or container build step, when images are large, slow to build or flagged by a scanner, when a container will not stop cleanly or behaves differently from local, or when containerising an app for deployment. Use it even for a quick "add a Dockerfile", because defaults like root users and fat images become production defaults.
---

# Containers

A good image is small, rebuilds fast, runs as an unprivileged user, contains only what the
process needs, starts and stops cleanly, and is the same artifact in every environment. Most
problems come from copying a development setup into an image: the whole repo, dev
dependencies, root, a shell wrapper that swallows signals.

## 1. Read what exists first

- The app's runtime version source (`.nvmrc`, `engines`, `pyproject.toml`, `go.mod`), how it
  builds and starts (`package.json` scripts, Procfile), what it listens on, and what it writes to
  disk.
- Existing Dockerfiles, Compose files, CI build steps and the target platform (Kubernetes, ECS,
  Cloud Run, Fly, a PaaS). Some platforms build from source (buildpacks); check before adding a
  Dockerfile nobody uses.

## 2. Dockerfile essentials

- **Multi-stage**: a `deps` stage installs dependencies, a `build` stage compiles, and a minimal
  `runtime` stage copies only the output and production dependencies.
- **Pin the base image** to a specific version (`node:24.11-slim`, `python:3.13-slim`), and pin
  by digest (`@sha256:...`) for reproducibility, updated by Renovate or Dependabot. Never `latest`.
- **Choose small, maintained bases**: `-slim` Debian variants are the safe default;
  distroless or Chainguard images for the smallest attack surface; Alpine (musl) only when the
  app and its native modules are known to work on it.
- **Order for caching**: copy the lockfile and install dependencies before copying source, so a
  code change does not reinstall everything. Use BuildKit cache mounts for package caches.
- **Lockfile installs**: `npm ci`, `pnpm install --frozen-lockfile`, `pip install --require-hashes`
  or `uv sync --frozen`, `go mod download`.
- **`.dockerignore`** excludes `node_modules`, `.git`, `.next`, `dist`, `.env*`, tests and local
  files. It speeds builds and keeps secrets out of the context.
- **Non-root**: create or use an unprivileged user (`USER node`, `USER 65532` in distroless) and
  make only the directories the app writes to writable. Prefer a read-only root filesystem at
  runtime.
- **No secrets in layers**: never `COPY .env` or pass secrets as `ARG`/`ENV` (they persist in the
  image history). Use BuildKit secret mounts (`RUN --mount=type=secret,id=npmrc ...`) for build
  time, and runtime environment or a secret store for run time.
- **Exec-form `CMD`/`ENTRYPOINT`** (`CMD ["node", "server.js"]`) so the process is PID 1 and
  receives `SIGTERM`. Shell form (`CMD node server.js`) and `npm start` wrappers often swallow
  signals, so the container is killed after the grace period instead of shutting down. Add
  `--init` / `tini` if the process spawns children it does not reap.
- **One process per container.** Run migrations, workers and the web server as separate
  commands of the same image, not a supervisor inside it.
- `EXPOSE` the port, set `NODE_ENV=production` (or equivalent), and label the image with the
  source revision (`org.opencontainers.image.revision`).

Complete Dockerfiles for Node, Next.js (standalone output), Python and Go are in
`references/dockerfiles.md`.

## 3. Runtime behaviour

- **Configuration from the environment** (12-factor). The same image runs in staging and
  production with different variables.
- **Graceful shutdown**: on `SIGTERM`, stop accepting connections, finish in-flight requests and
  jobs, close pools, exit. Keep it under the orchestrator's grace period (30 seconds by default
  in Kubernetes).
- **Logs to stdout/stderr**, structured (see the `observability` skill); no log files inside the
  container.
- **Health**: the orchestrator's probes (Kubernetes liveness/readiness) or the platform's health
  check call HTTP endpoints; a Dockerfile `HEALTHCHECK` matters only for plain Docker/Compose.
- **Writable paths** explicit: a `tmpfs` or volume for `/tmp` and caches when the root
  filesystem is read-only.
- **Resource awareness**: Node's heap and Python's worker counts should follow the container's
  memory and CPU limits, not the host's (`--max-old-space-size`, workers = CPU limit).

## 4. Size and speed

Check with `docker image ls` and `docker history <image>`, or `dive` for layer-by-layer
contents. Typical wins:

- runtime stage without compilers, dev dependencies, package-manager caches or source;
- Next.js `output: 'standalone'`, which copies only the traced server files;
- `npm ci --omit=dev` (or prune) in the runtime stage;
- combine `apt-get update && apt-get install --no-install-recommends ... && rm -rf /var/lib/apt/lists/*`
  in one layer;
- cache mounts (`--mount=type=cache,target=/root/.npm`) and CI layer caching
  (`cache-from/cache-to: type=gha` or a registry cache).

## 5. Security

- Scan images in CI (Trivy, Grype, Docker Scout) and fail on fixable critical and high issues;
  rebuild regularly so base-image patches land even without code changes.
- Generate an SBOM and provenance attestation at build (`docker buildx build --sbom=true --provenance=true`).
- Sign images (cosign) if the platform verifies signatures.
- Drop capabilities and privileges at runtime: no `--privileged`, `allowPrivilegeEscalation: false`,
  `capabilities: drop: [ALL]`, `runAsNonRoot: true` (see the `deployment` skill).
- Do not install `curl`, shells or package managers in the runtime image unless needed.

## 6. Multi-architecture

Build for the platforms you run on: `docker buildx build --platform linux/amd64,linux/arm64`.
Apple Silicon laptops build `arm64` by default; an image built locally may not run on `amd64`
servers. Native modules must be installed inside the target platform's stage, never copied from
the host.

## 7. Local development with Compose

- `compose.yaml` runs the app's dependencies (Postgres, Redis, a mail catcher) with health checks,
  named volumes and ports bound to localhost.
- Run the app itself natively for fast reloads, or in a container with the source bind-mounted
  and dependencies in a separate volume.
- `depends_on` with `condition: service_healthy` so the app does not start before the database.
- Keep production settings out of Compose; it is a developer tool.

A Compose template is in the reference.

## 8. Reviewing a Dockerfile

Check: base pinned and minimal; multi-stage with a clean runtime stage; lockfile install;
dependency layer before source; `.dockerignore` present; non-root user; no secrets in `COPY`,
`ARG` or `ENV`; exec-form command and correct signal handling; only production dependencies in the
runtime stage; image size reasonable for the stack; scan results. Report the fix and the size or
time saved where measurable.

## Reference files

- `references/dockerfiles.md` - Dockerfiles for a Node API, Next.js standalone, Python (uv) and
  Go (distroless), `.dockerignore`, BuildKit secrets for private registries, a Compose file for
  local development, and debugging commands.
