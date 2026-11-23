# Kubernetes manifests

A production-ready baseline for a stateless HTTP service. Adjust numbers from observed usage.

## Contents

1. Deployment
2. Service, HPA and PodDisruptionBudget
3. Migration Job
4. Kustomize overlays
5. Rollout commands

## 1. Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: billing-api
  labels: { app.kubernetes.io/name: billing-api }
spec:
  replicas: 3
  revisionHistoryLimit: 5
  selector:
    matchLabels: { app.kubernetes.io/name: billing-api }
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 25%
  template:
    metadata:
      labels: { app.kubernetes.io/name: billing-api }
    spec:
      terminationGracePeriodSeconds: 45
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels: { app.kubernetes.io/name: billing-api }
      securityContext:
        runAsNonRoot: true
        seccompProfile: { type: RuntimeDefault }
      containers:
        - name: app
          image: registry.example.com/billing-api:3f9c2a1   # commit SHA; kustomize sets it per release
          ports:
            - { name: http, containerPort: 3000 }
          envFrom:
            - configMapRef: { name: billing-api-config }
            - secretRef: { name: billing-api-secrets }       # synced from a secret manager
          resources:
            requests: { cpu: 250m, memory: 384Mi }
            limits: { memory: 768Mi }
          readinessProbe:
            httpGet: { path: /readyz, port: http }
            periodSeconds: 5
            failureThreshold: 3
          livenessProbe:
            httpGet: { path: /healthz, port: http }
            periodSeconds: 10
            failureThreshold: 6
          startupProbe:
            httpGet: { path: /healthz, port: http }
            periodSeconds: 2
            failureThreshold: 60                             # up to 2 minutes to start
          lifecycle:
            preStop:
              sleep: { seconds: 10 }                         # let endpoints update before SIGTERM handling
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities: { drop: [ALL] }
          volumeMounts:
            - { name: tmp, mountPath: /tmp }
      volumes:
        - name: tmp
          emptyDir: {}
```

The `sleep` preStop handler needs a recent Kubernetes version; on older clusters use
`exec: { command: ["sleep", "10"] }` (which needs a `sleep` binary in the image).

## 2. Service, HPA and PodDisruptionBudget

```yaml
apiVersion: v1
kind: Service
metadata:
  name: billing-api
spec:
  selector: { app.kubernetes.io/name: billing-api }
  ports:
    - { name: http, port: 80, targetPort: http }
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: billing-api
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: billing-api }
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target: { type: Utilization, averageUtilization: 65 }
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: billing-api
spec:
  maxUnavailable: 1
  selector:
    matchLabels: { app.kubernetes.io/name: billing-api }
```

When an HPA manages replicas, remove `replicas` from the Deployment applied by GitOps, or every
sync resets the count.

## 3. Migration Job

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: billing-api-migrate-3f9c2a1          # unique per release
spec:
  backoffLimit: 0                            # a failed migration needs a human, not retries
  activeDeadlineSeconds: 900
  ttlSecondsAfterFinished: 86400
  template:
    spec:
      restartPolicy: Never
      securityContext: { runAsNonRoot: true }
      containers:
        - name: migrate
          image: registry.example.com/billing-api:3f9c2a1
          command: ["node", "dist/migrate.js"]
          envFrom:
            - secretRef: { name: billing-api-secrets }
```

Run it (CI step, Argo CD `PreSync` hook or Helm `pre-upgrade` hook) and wait for completion before
rolling out the Deployment. Migrations must be compatible with the currently running version.

## 4. Kustomize overlays

```
k8s/
  base/        deployment.yaml service.yaml hpa.yaml pdb.yaml kustomization.yaml
  overlays/
    staging/   kustomization.yaml  config.env  patch-resources.yaml
    production/kustomization.yaml  config.env
```

```yaml
# k8s/overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: billing
resources: [../../base]
images:
  - name: registry.example.com/billing-api
    newTag: 3f9c2a1                          # CI updates this line per release (kustomize edit set image)
configMapGenerator:
  - name: billing-api-config
    envs: [config.env]
```

## 5. Rollout commands

```bash
kubectl rollout status deploy/billing-api -n billing --timeout=5m    # wait, fail CI on timeout
kubectl rollout history deploy/billing-api -n billing
kubectl rollout undo deploy/billing-api -n billing                   # back to previous ReplicaSet
kubectl rollout undo deploy/billing-api -n billing --to-revision=12
kubectl get events -n billing --sort-by=.lastTimestamp | tail -20    # why pods are not starting
kubectl describe pod <pod> -n billing                                # probe failures, OOMKilled, image pull errors
kubectl logs deploy/billing-api -n billing --since=10m --all-containers
```

With GitOps (Argo CD, Flux), roll back by reverting the commit that changed the image tag; a
manual `kubectl rollout undo` will be overwritten by the next sync.
