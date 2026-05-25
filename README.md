# 🛡️ RepoGuard Copilot

RepoGuard Copilot is an autonomous AI repository-maintenance co-pilot designed to reduce open-source maintainer burnout through intelligent issue triage, codebase grounding, and real-time telemetry workflows.

The system listens for incoming GitHub issue events, reads repository structure using the GitHub Contents API, performs long-horizon reasoning with NVIDIA Nemotron-3 Super, and generates structured triage outputs including:

- Accurate issue labels
- Runtime summaries
- Local reproduction steps
- Codebase analysis
- Contributor onboarding guidance

All results are streamed live to a React monitoring dashboard through persistent WebSocket connections.

---
SYSTEM ARCHITECTURE
  
![RepoGuard Architecture](./assets/architecture.png)

# ⚡ Core Features

- AI-powered issue triage
- Codebase-aware debugging analysis
- Automatic label generation
- Local reproduction strategy generation
- Contributor onboarding assistance
- Real-time telemetry dashboard
- WebSocket event streaming
- Deterministic structured outputs using Pydantic schemas
- Zero infrastructure cost using OpenRouter free-tier

---

# 🧠 Rubric Alignment

## Issue Triage Quality
Uses low-temperature structured inference with strict schema validation to generate highly accurate labels while minimizing hallucinations.

## Codebase Grounding
Reads actual repository assets such as Dockerfiles, requirements, and configuration files before generating analysis.

## PR Review Helpfulness
Produces dependency-aware analysis and patch review assistance for maintainers.

## Newcomer Friendliness
Identifies beginner-friendly tasks and generates onboarding guidance for first-time contributors.

## Automation Reliability
Built with deterministic type-safe response schemas for consistent long-form outputs.

---

# 📊 Success Metrics

- Manual triage reduced from ~15 minutes to ~4.5 seconds
- Less than 3% label variance
- $0.00 operational infrastructure cost
- Real-time monitoring and event streaming

---

# 🖥️ Tech Stack

## Frontend
- React
- TailwindCSS
- WebSockets

## Backend
- FastAPI
- Pydantic
- GitHub API
- OpenRouter API

## AI Model
- NVIDIA Nemotron-3 Super

---

# 🚀 Quick Start

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Create a `.env` file:

```env id="n0ls9m"
GITHUB_TOKEN=your_github_token
OPENROUTER_API_KEY=your_openrouter_key
REPO_NAME=your_repo_name
```

---

## Frontend

```bash id="k3rm7x"
cd frontend
npm install
npm run dev
```

Open:

```txt id="s6vnd4"
http://localhost:5173
```

---

# 🔄 Workflow

1. GitHub webhook event is received
2. Repository files are fetched using GitHub Contents API
3. Nemotron-3 Super performs structured reasoning
4. Labels, summaries, repro steps, and onboarding guides are generated
5. Results are streamed live to the dashboard through WebSockets
6. Maintainers receive instant actionable triage output

---

# 🤝 Acknowledgement

Built for the NVIDIA Nemotron 3 Super Build Contest Hackathon in collaboration with NVIDIA, Docker Bangalore, and Collabnix.
