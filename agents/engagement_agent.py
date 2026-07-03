# KutzApp Client Engagement Agent
# Powered by Google Antigravity SDK
#
# Autonomous agent that proactively identifies at-risk clients, generates
# personalized win-back campaigns, and manages client lifecycle engagement.
# Designed to run on a schedule (replaces/enhances Inngest cron jobs).

import asyncio
import os
import json
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel, Field

from google.antigravity import Agent, LocalAgentConfig
from google.antigravity.tools import tool

import pg8000


# ── Configuration ─────────────────────────────────────────────────────────

DATABASE_URL = os.environ.get("DATABASE_URL", "")
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.environ.get("TWILIO_FROM_NUMBER", "")


# ── Database Helper ───────────────────────────────────────────────────────

def _get_db():
    url = DATABASE_URL.replace("postgresql://", "")
    user_pass, rest = url.split("@", 1)
    user, password = user_pass.split(":", 1)
    host_port, dbname = rest.split("/", 1)
    if "?" in dbname:
        dbname = dbname.split("?")[0]
    host, port = host_port.split(":", 1) if ":" in host_port else (host_port, "5432")
    return pg8000.connect(user=user, password=password, host=host, port=int(port), database=dbname, ssl_context=True)


# ── Tools ─────────────────────────────────────────────────────────────────

@tool
def find_at_risk_clients(shop_id: str, inactive_days: int = 42) -> str:
    """Find clients who haven't visited in X days and might be churning.
    
    Args:
        shop_id: The shop's unique ID
        inactive_days: Days since last visit to consider "at risk" (default 42 = 6 weeks)
    
    Returns:
        JSON list of at-risk clients with their history summary
    """
    conn = _get_db()
    cursor = conn.cursor()
    
    cutoff = (datetime.utcnow() - timedelta(days=inactive_days)).isoformat()
    
    cursor.execute("""
        WITH client_stats AS (
            SELECT 
                u.id, u.name, u.phone, u.email,
                COUNT(a.id) as total_visits,
                MAX(a."startTime") as last_visit,
                COALESCE(AVG(a."totalAmount"), 0) as avg_spend,
                u."winBackSentAt"
            FROM "User" u
            JOIN "ShopClient" sc ON sc."userId" = u.id AND sc."shopId" = %s
            LEFT JOIN "Appointment" a ON a."userId" = u.id 
                AND a."shopId" = %s AND a.status = 'COMPLETED'
            WHERE u.role = 'CLIENT'
            GROUP BY u.id
            HAVING MAX(a."startTime") < %s AND MAX(a."startTime") IS NOT NULL
        )
        SELECT *, 
            EXTRACT(DAY FROM NOW() - last_visit)::int as days_since_visit
        FROM client_stats
        WHERE ("winBackSentAt" IS NULL OR "winBackSentAt" < NOW() - INTERVAL '30 days')
        ORDER BY avg_spend DESC
        LIMIT 20
    """, (shop_id, shop_id, cutoff))
    
    columns = [d[0] for d in cursor.description]
    rows = cursor.fetchall()
    
    clients = []
    for row in rows:
        record = {}
        for col, val in zip(columns, row):
            if hasattr(val, 'isoformat'):
                record[col] = val.isoformat()
            elif isinstance(val, (int, float)):
                record[col] = val
            else:
                record[col] = str(val) if val else None
        clients.append(record)
    
    cursor.close()
    conn.close()
    
    return json.dumps({
        "shop_id": shop_id,
        "inactive_threshold_days": inactive_days,
        "clients_found": len(clients),
        "clients": clients
    })


@tool
def get_client_preferences(shop_id: str, client_id: str) -> str:
    """Get detailed preference data for a specific client to personalize outreach.
    
    Args:
        shop_id: The shop's unique ID
        client_id: The client's user ID
    
    Returns:
        JSON with favorite service, favorite barber, visit frequency, total spent
    """
    conn = _get_db()
    cursor = conn.cursor()
    
    # Favorite service
    cursor.execute("""
        SELECT s.name, s.id, COUNT(*) as times, COALESCE(AVG(a."totalAmount"), 0) as avg_price
        FROM "Appointment" a
        JOIN "Service" s ON s.id = a."serviceId"
        WHERE a."userId" = %s AND a."shopId" = %s AND a.status = 'COMPLETED'
        GROUP BY s.id, s.name ORDER BY times DESC LIMIT 3
    """, (client_id, shop_id))
    top_services = [{"name": r[0], "id": r[1], "times": r[2], "avg_price": float(r[3])} 
                    for r in cursor.fetchall()]
    
    # Favorite barber
    cursor.execute("""
        SELECT u.name, u.id, COUNT(*) as times
        FROM "Appointment" a
        JOIN "User" u ON u.id = a."staffId"
        WHERE a."userId" = %s AND a."shopId" = %s AND a.status = 'COMPLETED'
        GROUP BY u.id, u.name ORDER BY times DESC LIMIT 1
    """, (client_id, shop_id))
    fav_barber = cursor.fetchone()
    
    # Visit pattern (avg days between visits)
    cursor.execute("""
        SELECT 
            COUNT(*) as total_visits,
            COALESCE(SUM("totalAmount"), 0) as lifetime_value,
            MIN("startTime") as first_visit,
            MAX("startTime") as last_visit
        FROM "Appointment"
        WHERE "userId" = %s AND "shopId" = %s AND status = 'COMPLETED'
    """, (client_id, shop_id))
    stats = cursor.fetchone()
    
    total_visits = stats[0] or 0
    lifetime_value = float(stats[1] or 0)
    first_visit = stats[2]
    last_visit = stats[3]
    
    avg_days_between = None
    if total_visits > 1 and first_visit and last_visit:
        span = (last_visit - first_visit).days
        avg_days_between = round(span / (total_visits - 1), 1)
    
    cursor.close()
    conn.close()
    
    return json.dumps({
        "client_id": client_id,
        "top_services": top_services,
        "favorite_barber": {"name": fav_barber[0], "id": fav_barber[1]} if fav_barber else None,
        "total_visits": total_visits,
        "lifetime_value_dollars": lifetime_value / 100,
        "avg_days_between_visits": avg_days_between,
        "first_visit": str(first_visit) if first_visit else None,
        "last_visit": str(last_visit) if last_visit else None,
    })


@tool
def check_active_promotions(shop_id: str) -> str:
    """Check what promotions or loyalty programs the shop currently has active.
    
    Args:
        shop_id: The shop's unique ID
    
    Returns:
        JSON with active campaigns, loyalty programs, and gamification
    """
    conn = _get_db()
    cursor = conn.cursor()
    
    # Active campaigns
    cursor.execute("""
        SELECT id, name, type, "discountType", "discountValue", "startDate", "endDate"
        FROM "Campaign"
        WHERE "shopId" = %s AND status = 'ACTIVE'
        ORDER BY "createdAt" DESC LIMIT 5
    """, (shop_id,))
    campaigns = [{"id": r[0], "name": r[1], "type": r[2], 
                  "discount_type": r[3], "discount_value": float(r[4]) if r[4] else 0}
                 for r in cursor.fetchall()]
    
    # Loyalty programs
    cursor.execute("""
        SELECT id, name, "pointsPerDollar", "rewardThreshold"
        FROM "LoyaltyProgram"
        WHERE "shopId" = %s AND "isActive" = true
        LIMIT 3
    """, (shop_id,))
    loyalty = [{"id": r[0], "name": r[1], "points_per_dollar": r[2], 
                "reward_threshold": r[3]} for r in cursor.fetchall()]
    
    cursor.close()
    conn.close()
    
    return json.dumps({
        "active_campaigns": campaigns,
        "loyalty_programs": loyalty,
    })


@tool
def send_personalized_sms(phone: str, message: str, client_name: str) -> str:
    """Send a personalized SMS to a client. Use this for win-back campaigns.
    
    Args:
        phone: Client's phone number
        message: The personalized message to send (max 160 chars)
        client_name: Client's name (for logging)
    
    Returns:
        JSON with send status
    """
    if not TWILIO_ACCOUNT_SID:
        return json.dumps({
            "status": "simulated",
            "message": f"[DRY RUN] Would send to {phone}: {message}",
            "client": client_name
        })
    
    # Real Twilio send
    import httpx
    
    response = httpx.post(
        f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json",
        auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
        data={
            "From": TWILIO_FROM_NUMBER,
            "To": phone,
            "Body": message,
        }
    )
    
    return json.dumps({
        "status": "sent" if response.status_code == 201 else "error",
        "client": client_name,
        "phone": phone,
    })


@tool
def mark_winback_sent(client_id: str) -> str:
    """Mark that a win-back message was sent to prevent duplicate sends.
    
    Args:
        client_id: The client's user ID
    
    Returns:
        Confirmation
    """
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE "User" SET "winBackSentAt" = NOW() WHERE id = %s',
        (client_id,)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return json.dumps({"status": "marked", "client_id": client_id})


# ── Structured Output ─────────────────────────────────────────────────────

class EngagementAction(BaseModel):
    client_name: str
    client_id: str
    phone: str
    action: str = Field(description="One of: sms_sent, skipped, error")
    message: Optional[str] = Field(default=None, description="The message sent")
    reason: str = Field(description="Why this action was taken or skipped")


class EngagementReport(BaseModel):
    shop_id: str
    run_date: str
    clients_analyzed: int
    messages_sent: int
    messages_skipped: int
    actions: list[EngagementAction]
    summary: str = Field(description="Executive summary of the engagement run")
    top_recommendation: str = Field(description="Best overall recommendation for the shop owner")


# ── Agent Configuration ───────────────────────────────────────────────────

ENGAGEMENT_SYSTEM_PROMPT = """You are an expert client retention strategist for barbershops.

## Your Mission:
Proactively identify clients at risk of churning and craft personalized win-back messages
that feel genuine — not spammy.

## Your Process:
1. Find at-risk clients (inactive 42+ days)
2. For the top 10 highest-value clients, get their preferences
3. Check active promotions the shop offers
4. For each client, craft a UNIQUE, personalized message based on:
   - Their favorite service and barber
   - How long since their last visit
   - Any active promotions they'd care about
   - Their visit frequency pattern
5. Send the messages via SMS
6. Mark each client as contacted to prevent duplicate sends

## Message Guidelines:
- Keep under 160 characters
- Use their first name
- Reference their usual service or barber
- Include a specific offer when possible
- Don't sound like a robot — sound like their barber texting them
- Examples:
  - "Hey Mike! It's been a minute. John has a spot open this Saturday for your usual fade. Want me to book it? 💈"
  - "Sarah, we miss you at Heritage! Your favorite beard trim is 20% off this week. Book: [link]"

## Rules:
- NEVER send to clients who already received a win-back in the last 30 days
- Skip clients without phone numbers
- Maximum 10 messages per run to avoid spam flags
- Log ALL actions (sent and skipped) with reasons
"""


async def run_engagement(shop_id: str, shop_name: str = "Heritage Haircuts", dry_run: bool = True) -> EngagementReport:
    """Run the client engagement agent for a shop."""
    
    if dry_run:
        os.environ.pop("TWILIO_ACCOUNT_SID", None)  # Force dry-run mode
    
    config = LocalAgentConfig(
        tools=[
            find_at_risk_clients, get_client_preferences,
            check_active_promotions, send_personalized_sms,
            mark_winback_sent,
        ],
    )
    
    async with Agent(config) as agent:
        response = await agent.chat(
            f"""Run the client engagement campaign for "{shop_name}" (ID: {shop_id}).
            
            Today is {datetime.utcnow().strftime('%Y-%m-%d')}.
            {"THIS IS A DRY RUN — simulate SMS sends." if dry_run else "LIVE MODE — actually send SMS messages."}
            
            Find at-risk clients, analyze their preferences, craft personalized messages,
            and send them. Report back with a complete summary.""",
            response_schema=EngagementReport,
            system_prompt=ENGAGEMENT_SYSTEM_PROMPT,
        )
        
        return response.parsed


# ── FastAPI Server ────────────────────────────────────────────────────────

def create_app():
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    
    app = FastAPI(title="KutzApp Engagement Agent", version="1.0.0")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://barber-shop-website-ashy.vercel.app",
            "https://kutzapp.com",
            "http://localhost:3000",
        ],
        allow_methods=["POST"],
        allow_headers=["*"],
    )
    
    class EngagementRequest(BaseModel):
        shop_id: str
        shop_name: str = "Heritage Haircuts"
        dry_run: bool = True
    
    @app.post("/engage", response_model=EngagementReport)
    async def engage(req: EngagementRequest):
        try:
            report = await run_engagement(req.shop_id, req.shop_name, req.dry_run)
            return report
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/health")
    async def health():
        return {"status": "ok", "agent": "kutzapp-engagement"}
    
    return app


# ── CLI Entry Point ───────────────────────────────────────────────────────

async def main():
    import sys
    
    shop_id = sys.argv[1] if len(sys.argv) > 1 else "cm3shop001heritage0001"
    shop_name = sys.argv[2] if len(sys.argv) > 2 else "Heritage Haircuts"
    dry_run = "--live" not in sys.argv
    
    mode = "🧪 DRY RUN" if dry_run else "🔴 LIVE"
    print(f"\n{mode} — Client Engagement Agent for {shop_name}\n")
    
    report = await run_engagement(shop_id, shop_name, dry_run)
    
    print(f"📊 Analyzed: {report.clients_analyzed} clients")
    print(f"📤 Sent: {report.messages_sent} messages")
    print(f"⏭️  Skipped: {report.messages_skipped}")
    print(f"\n📋 Summary: {report.summary}")
    print(f"\n💡 Top Recommendation: {report.top_recommendation}")
    
    print(f"\n--- Actions ---")
    for action in report.actions:
        emoji = "✅" if action.action == "sms_sent" else "⏭️"
        print(f"{emoji} {action.client_name}: {action.reason}")
        if action.message:
            print(f"   📱 \"{action.message}\"")


if __name__ == "__main__":
    asyncio.run(main())
