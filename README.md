# Notes App — Full Stack on Kubernetes

A full-stack note-taking application built with React, FastAPI, and PostgreSQL.
Deployed on Kubernetes (OpenShift) with Helm, and automated with Tekton CI/CD.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + TailwindCSS |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (Bitnami) |
| Container | Docker + Nginx (unprivileged) |
| Orchestration | Kubernetes / OpenShift |
| Package Manager | Helm |
| CI/CD | Tekton Pipelines |

---

## Project Structure

```
.
├── backend/              # FastAPI application
├── frontend/             # React application
├── docker-compose.yml    # Local development
├── k8s/                  # Raw Kubernetes manifests (learning reference)
│   ├── config/           # ConfigMaps + Secret examples
│   ├── services/         # Services + Ingress
│   ├── storage/          # PVC
│   ├── hpa/              # HorizontalPodAutoscaler
│   └── rbac/             # ServiceAccount, Role, RoleBinding
├── helm/                 # Helm chart (use this for deployment)
│   └── notes-app/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
├── tekton/               # CI/CD pipeline
│   ├── workspace/        # Shared PVC for pipeline
│   ├── rbac/             # Pipeline ServiceAccount + permissions
│   ├── tasks/            # Individual pipeline steps
│   ├── pipeline/         # Full pipeline definition
│   └── triggers/         # GitHub webhook trigger
└── learning.md           # Kubernetes learning notes (Day 1–7 + Helm + Tekton)
```

---

## Local Development

### Prerequisites
- Docker Desktop
- Python 3.12
- Node.js 20

### Run with Docker Compose

```bash
docker-compose up --build
```

App runs at: `http://localhost:5173`
API runs at: `http://localhost:8000`

### Run without Docker

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL
python -m uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Kubernetes Deployment

### Prerequisites
- `oc` or `kubectl` CLI
- `helm` CLI
- Access to an OpenShift/Kubernetes cluster

### 1. Create secrets (never committed to git)

```bash
# Copy examples and fill in real values
cp k8s/config/postgres-secret.yml.example k8s/config/postgres-secret.yml
cp k8s/config/backend-secret.yml.example  k8s/config/backend-secret.yml

# Edit both files with base64-encoded credentials
# Generate base64: echo -n "your-value" | base64

# Apply secrets
oc apply -f k8s/config/postgres-config.yml
oc apply -f k8s/config/postgres-secret.yml
oc apply -f k8s/config/backend-secret.yml
```

### 2. Deploy with Helm

```bash
helm install notes-app ./helm/notes-app
```

### 3. Watch pods come up

```bash
oc get pods -n notes-app -w
```

### Upgrade (new image tag)

```bash
helm upgrade notes-app ./helm/notes-app --set backend.image.tag=<new-tag>
```

### Uninstall

```bash
helm uninstall notes-app
```

---

## Tekton CI/CD

### Prerequisites
- OpenShift Pipelines operator installed
- `tkn` CLI installed

### 1. Create pipeline secrets

```bash
# Docker Hub credentials
oc create secret docker-registry dockerhub-secret \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=<username> \
  --docker-password=<access-token> \
  -n notes-app

# GitHub webhook secret
oc create secret generic github-webhook-secret \
  --from-literal=secret=<your-random-secret> \
  -n notes-app
```

### 2. Apply Tekton resources

```bash
oc apply -f tekton/workspace/pipeline-pvc.yml
oc apply -f tekton/rbac/pipeline-sa.yml
oc apply -f tekton/rbac/pipeline-role.yml
oc apply -f tekton/rbac/pipeline-role-binding.yml
oc apply -f tekton/tasks/clone-task.yml
oc apply -f tekton/tasks/build-push-task.yml
oc apply -f tekton/tasks/update-tag-task.yml
oc apply -f tekton/pipeline/pipeline.yml
oc apply -f tekton/triggers/event-listener.yml
```

### 3. Test manually

```bash
tkn pipeline start notes-app-pipeline \
  --param repo-url=https://github.com/<your-user>/<your-repo> \
  --param revision=main \
  --param image-tag=test-001 \
  --workspace name=shared-workspace,claimName=pipeline-workspace-pvc \
  --serviceaccount pipeline-sa \
  -n notes-app

tkn pipelinerun logs --last -f -n notes-app
```

### 4. Connect GitHub webhook

```bash
# Get EventListener URL
oc get route -n notes-app | grep listener
```

Add webhook in GitHub: `Repo → Settings → Webhooks → Add webhook`
- Payload URL: `https://<listener-route>/`
- Content type: `application/json`
- Secret: same value used in `github-webhook-secret`
- Events: `Just the push event`

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notes` | Get all notes |
| POST | `/api/notes` | Create a note |
| GET | `/api/notes/:id` | Get one note |
| PUT | `/api/notes/:id` | Update a note |
| PATCH | `/api/notes/:id` | Partial update |
| DELETE | `/api/notes/:id` | Delete a note |

---

## Learning Reference

See `learning.md` for detailed notes on:
- Kubernetes concepts (Day 1–7)
- Helm chart creation
- Tekton pipeline setup
- Troubleshooting and errors encountered
