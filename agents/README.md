# KutzApp AI Agents

AI agents powered by the **Google Antigravity SDK** that enhance KutzApp with autonomous, multi-step intelligence.

## Agents

| Agent | File | Purpose | Deployment |
|-------|------|---------|------------|
| **Business Intelligence** | `bi_agent.py` | Autonomous data analysis & insights | Cloud Run API |
| **Smart Booking** | `booking_agent.py` | Multi-turn conversational booking with upselling | Cloud Run API / CLI |
| **Client Engagement** | `engagement_agent.py` | Proactive win-back campaigns & churn prevention | Cloud Run / Cron |

## Quick Start

```bash
# Install
pip install -e .

# Set environment
export DATABASE_URL="postgresql://..."
export GEMINI_API_KEY="..."

# Run BI Agent
python bi_agent.py <shop_id> "<shop_name>"

# Run Booking Agent (interactive CLI)
python booking_agent.py <shop_id> "<shop_name>"

# Run Engagement Agent (dry run)
python engagement_agent.py <shop_id> "<shop_name>"

# Run Engagement Agent (live — actually sends SMS)
python engagement_agent.py <shop_id> "<shop_name>" --live
```

## Deploy to Cloud Run

```bash
gcloud run deploy kutzapp-agents \
  --source . \
  --region us-central1 \
  --set-env-vars "DATABASE_URL=...,GEMINI_API_KEY=..."
```

## Architecture

```
KutzApp (Next.js)  →  HTTP POST  →  Agents (Python/Cloud Run)  →  Supabase DB
     ↑                                      ↓
     └──── Typed JSON Response ←────────────┘
```

Each agent uses the Antigravity SDK's autonomous agentic loop:
1. Receives a task
2. Decides what tools to call (3-8 per session)
3. Explores data iteratively 
4. Returns structured Pydantic output
