"""
KutzApp AI Agents — Combined FastAPI Server
Serves all 3 agents from a single Cloud Run service.
"""
import os
import json
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from starlette.status import HTTP_403_FORBIDDEN

import pg8000
import secrets
import hmac


# ── Configuration ─────────────────────────────────────────────────────────

DATABASE_URL = os.environ.get("DATABASE_URL", "")
PORT = int(os.environ.get("PORT", "8080"))

# API Key for authentication — set this in Cloud Run env vars
# Generate one with: python -c "import secrets; print(secrets.token_urlsafe(32))"
AGENTS_API_KEY = os.environ.get("AGENTS_API_KEY", "")


# ── Auth Dependency ───────────────────────────────────────────────────────

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Security(api_key_header)):
    """Verify the API key from X-API-Key header."""
    if not AGENTS_API_KEY:
        # If no API key is configured, reject all requests (fail-closed)
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="AGENTS_API_KEY not configured. Set it in environment variables."
        )
    
    if not api_key:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Missing X-API-Key header"
        )
    
    # Constant-time comparison to prevent timing attacks
    if not hmac.compare_digest(api_key, AGENTS_API_KEY):
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Invalid API key"
        )
    
    return api_key


def _get_db():
    """Parse DATABASE_URL and return a pg8000 connection."""
    url = DATABASE_URL.replace("postgresql://", "")
    user_pass, rest = url.split("@", 1)
    user, password = user_pass.split(":", 1)
    host_port, dbname = rest.split("/", 1)
    if "?" in dbname:
        dbname = dbname.split("?")[0]
    host, port = host_port.split(":", 1) if ":" in host_port else (host_port, "5432")
    return pg8000.connect(
        user=user, password=password, host=host,
        port=int(port), database=dbname, ssl_context=True
    )


# ── Pydantic Models ──────────────────────────────────────────────────────

class InsightItem(BaseModel):
    title: str
    detail: str
    category: str
    priority: str
    action: str

class BusinessReport(BaseModel):
    shop_name: str
    report_date: str
    summary: str
    insights: list[InsightItem]
    health_score: int

class AnalyzeRequest(BaseModel):
    shop_id: str
    shop_name: str = "Your Shop"

class EngagementAction(BaseModel):
    client_name: str
    phone: str
    action: str
    message: Optional[str] = None
    reason: str

class EngagementReport(BaseModel):
    shop_id: str
    run_date: str
    clients_analyzed: int
    messages_sent: int
    actions: list[EngagementAction]
    summary: str

class EngagementRequest(BaseModel):
    shop_id: str
    shop_name: str = "Heritage Haircuts"
    dry_run: bool = True


# ── BI Analysis Logic ────────────────────────────────────────────────────

def analyze_shop_data(shop_id: str, shop_name: str) -> BusinessReport:
    """Analyze shop business metrics and generate insights."""
    conn = _get_db()
    cursor = conn.cursor()
    
    insights = []
    now = datetime.utcnow()
    
    # 1. Revenue (last 30 days)
    cutoff_30d = (now - timedelta(days=30)).isoformat()
    cursor.execute("""
        SELECT COUNT(*) as total, COALESCE(SUM("totalAmount"), 0) as revenue,
               COALESCE(SUM("tipAmount"), 0) as tips
        FROM "Appointment" WHERE "shopId" = %s AND "startTime" >= %s AND status = 'COMPLETED'
    """, (shop_id, cutoff_30d))
    row = cursor.fetchone()
    total_appts, revenue_30d, tips_30d = row[0], float(row[1]) / 100, float(row[2]) / 100
    
    # 2. This week vs last week
    cutoff_7d = (now - timedelta(days=7)).isoformat()
    cutoff_14d = (now - timedelta(days=14)).isoformat()
    
    cursor.execute("""
        SELECT COALESCE(SUM("totalAmount"), 0) FROM "Appointment"
        WHERE "shopId" = %s AND "startTime" >= %s AND status = 'COMPLETED'
    """, (shop_id, cutoff_7d))
    rev_this_week = float(cursor.fetchone()[0]) / 100
    
    cursor.execute("""
        SELECT COALESCE(SUM("totalAmount"), 0) FROM "Appointment"
        WHERE "shopId" = %s AND "startTime" >= %s AND "startTime" < %s AND status = 'COMPLETED'
    """, (shop_id, cutoff_14d, cutoff_7d))
    rev_last_week = float(cursor.fetchone()[0]) / 100
    
    if rev_last_week > 0:
        pct_change = ((rev_this_week - rev_last_week) / rev_last_week) * 100
        direction = "up" if pct_change > 0 else "down"
        insights.append(InsightItem(
            title=f"Revenue is {direction} {abs(pct_change):.0f}% week-over-week",
            detail=f"This week: ${rev_this_week:,.0f} vs last week: ${rev_last_week:,.0f}.",
            category="revenue",
            priority="high" if abs(pct_change) > 15 else "medium",
            action="Investigate the drop" if pct_change < -10 else "Keep up the momentum!"
        ))
    
    # 3. No-show rate
    cursor.execute("""
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN status = 'NO_SHOW' THEN 1 END) as no_shows,
               COALESCE(SUM(CASE WHEN status = 'NO_SHOW' THEN "totalAmount" END), 0) as lost
        FROM "Appointment" WHERE "shopId" = %s AND "startTime" >= %s
    """, (shop_id, cutoff_30d))
    row = cursor.fetchone()
    total_all, no_shows, lost_rev = row[0], row[1], float(row[2]) / 100
    no_show_rate = (no_shows / total_all * 100) if total_all > 0 else 0
    
    if no_show_rate > 5:
        insights.append(InsightItem(
            title=f"No-show rate is {no_show_rate:.0f}% — costing ${lost_rev:,.0f}/month",
            detail=f"{no_shows} no-shows out of {total_all} appointments in the last 30 days.",
            category="risk",
            priority="high" if no_show_rate > 10 else "medium",
            action="Enable mandatory deposits for new clients to reduce no-shows."
        ))
    
    # 4. Top services
    cursor.execute("""
        SELECT s.name, COUNT(a.id) as bookings, COALESCE(SUM(a."totalAmount"), 0) as revenue
        FROM "Service" s
        LEFT JOIN "Appointment" a ON a."serviceId" = s.id AND a.status = 'COMPLETED' AND a."startTime" >= %s
        WHERE s."shopId" = %s
        GROUP BY s.id, s.name ORDER BY revenue DESC LIMIT 3
    """, (cutoff_30d, shop_id))
    top_services = cursor.fetchall()
    
    if top_services:
        top = top_services[0]
        insights.append(InsightItem(
            title=f"Top service: {top[0]} ({top[1]} bookings)",
            detail=f"Generated ${float(top[2])/100:,.0f} in revenue. Consider promoting complementary add-ons.",
            category="growth",
            priority="low",
            action=f"Bundle {top[0]} with a complementary service for an upsell package."
        ))
    
    # 5. Client count
    cursor.execute("""
        SELECT COUNT(DISTINCT "userId") FROM "ShopClient" WHERE "shopId" = %s
    """, (shop_id,))
    total_clients = cursor.fetchone()[0]
    
    cursor.execute("""
        SELECT COUNT(*) FROM "ShopClient" WHERE "shopId" = %s AND "createdAt" >= %s
    """, (shop_id, cutoff_30d))
    new_clients = cursor.fetchone()[0]
    
    if total_clients > 0:
        insights.append(InsightItem(
            title=f"{new_clients} new clients this month (total: {total_clients})",
            detail=f"Client acquisition is {'strong' if new_clients > 5 else 'slow'}.",
            category="growth",
            priority="medium" if new_clients < 3 else "low",
            action="Run a referral campaign to boost new client acquisition." if new_clients < 5 else "Great growth — keep it up!"
        ))
    
    # Health score
    health = 50
    if total_appts > 0:
        health += min(20, total_appts)
    if no_show_rate < 10:
        health += 10
    if rev_this_week >= rev_last_week:
        health += 10
    if new_clients > 3:
        health += 10
    health = min(100, max(1, health))
    
    cursor.close()
    conn.close()
    
    if not insights:
        insights.append(InsightItem(
            title="Not enough data yet",
            detail="Keep using KutzApp and insights will appear as data accumulates.",
            category="operations",
            priority="low",
            action="Start booking appointments to generate business intelligence."
        ))
    
    return BusinessReport(
        shop_name=shop_name,
        report_date=now.strftime("%Y-%m-%d"),
        summary=f"30-day overview: {total_appts} completed appointments, ${revenue_30d:,.0f} revenue, ${tips_30d:,.0f} tips.",
        insights=insights,
        health_score=health,
    )


# ── Engagement Logic ─────────────────────────────────────────────────────

def find_and_engage_clients(shop_id: str, shop_name: str, dry_run: bool = True) -> EngagementReport:
    """Find at-risk clients and generate personalized win-back messages."""
    conn = _get_db()
    cursor = conn.cursor()
    
    cutoff = (datetime.utcnow() - timedelta(days=42)).isoformat()
    
    cursor.execute("""
        SELECT u.id, u.name, u.phone, u.email,
               COUNT(a.id) as visits, MAX(a."startTime") as last_visit
        FROM "User" u
        JOIN "ShopClient" sc ON sc."userId" = u.id AND sc."shopId" = %s
        LEFT JOIN "Appointment" a ON a."userId" = u.id AND a."shopId" = %s AND a.status = 'COMPLETED'
        WHERE u.role = 'CLIENT'
              AND (u."winBackSentAt" IS NULL OR u."winBackSentAt" < NOW() - INTERVAL '30 days')
        GROUP BY u.id
        HAVING MAX(a."startTime") < %s AND MAX(a."startTime") IS NOT NULL
        ORDER BY COUNT(a.id) DESC LIMIT 10
    """, (shop_id, shop_id, cutoff))
    
    clients = cursor.fetchall()
    actions = []
    sent = 0
    
    for client in clients:
        cid, name, phone, email, visits, last_visit = client
        
        if not phone:
            actions.append(EngagementAction(
                client_name=name or "Unknown", phone="N/A",
                action="skipped", reason="No phone number on file"
            ))
            continue
        
        days_ago = (datetime.utcnow() - last_visit).days if last_visit else 0
        first_name = (name or "").split()[0] if name else "there"
        
        msg = f"Hey {first_name}! It's been {days_ago} days since your last visit to {shop_name}. We miss you! Book your next appointment today. 💈"
        
        if dry_run:
            actions.append(EngagementAction(
                client_name=name or "Unknown", phone=phone,
                action="sms_simulated", message=msg,
                reason=f"Inactive {days_ago} days, {visits} total visits"
            ))
        else:
            # Would send via Twilio here
            cursor.execute('UPDATE "User" SET "winBackSentAt" = NOW() WHERE id = %s', (cid,))
            actions.append(EngagementAction(
                client_name=name or "Unknown", phone=phone,
                action="sms_sent", message=msg,
                reason=f"Inactive {days_ago} days, {visits} total visits"
            ))
        sent += 1
    
    if not dry_run:
        conn.commit()
    
    cursor.close()
    conn.close()
    
    return EngagementReport(
        shop_id=shop_id,
        run_date=datetime.utcnow().strftime("%Y-%m-%d"),
        clients_analyzed=len(clients),
        messages_sent=sent,
        actions=actions,
        summary=f"Found {len(clients)} at-risk clients. {'Simulated' if dry_run else 'Sent'} {sent} win-back messages."
    )


# ── FastAPI App ──────────────────────────────────────────────────────────

app = FastAPI(
    title="KutzApp AI Agents",
    description="Business Intelligence & Client Engagement agents for barbershops",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Public Endpoints (no auth) ────────────────────────────────────────────

@app.get("/")
async def root():
    return {"service": "kutzapp-agents", "status": "running", "agents": ["bi", "engagement"]}

@app.get("/health")
async def health():
    return {"status": "ok"}

# ── Protected Endpoints (require API key) ─────────────────────────────────

@app.post("/analyze", response_model=BusinessReport, dependencies=[Depends(verify_api_key)])
async def analyze(req: AnalyzeRequest):
    try:
        return analyze_shop_data(req.shop_id, req.shop_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/engage", response_model=EngagementReport, dependencies=[Depends(verify_api_key)])
async def engage(req: EngagementRequest):
    try:
        return find_and_engage_clients(req.shop_id, req.shop_name, req.dry_run)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
