# KutzApp Business Intelligence Agent
# Powered by Google Antigravity SDK
#
# This agent connects to the KutzApp Supabase database and autonomously
# explores business data to surface actionable insights for shop owners.

import asyncio
import os
import json
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel, Field

from google.antigravity import Agent, LocalAgentConfig
from google.antigravity.tools import tool

import pg8000  # Pure-python PostgreSQL driver (no compilation needed)


# ── Configuration ─────────────────────────────────────────────────────────

DATABASE_URL = os.environ.get("DATABASE_URL", "")
KUTZAPP_API_URL = os.environ.get("KUTZAPP_API_URL", "http://localhost:3000")


# ── Database Helper ───────────────────────────────────────────────────────

def _get_db_connection():
    """Parse DATABASE_URL and return a pg8000 connection."""
    # postgresql://user:password@host:port/dbname
    url = DATABASE_URL
    if url.startswith("postgresql://"):
        url = url[len("postgresql://"):]
    
    user_pass, rest = url.split("@", 1)
    user, password = user_pass.split(":", 1)
    host_port, dbname = rest.split("/", 1)
    
    # Strip query params
    if "?" in dbname:
        dbname = dbname.split("?")[0]
    
    host, port = host_port.split(":", 1) if ":" in host_port else (host_port, "5432")
    
    return pg8000.connect(
        user=user,
        password=password,
        host=host,
        port=int(port),
        database=dbname,
        ssl_context=True
    )


# ── Tools ─────────────────────────────────────────────────────────────────

@tool
def query_shop_metrics(shop_id: str, metric: str, days: int = 30) -> str:
    """Query key business metrics for a shop.
    
    Args:
        shop_id: The shop's unique ID
        metric: One of 'revenue', 'appointments', 'no_shows', 'new_clients', 
                'returning_clients', 'avg_ticket', 'staff_utilization', 'reviews'
        days: Number of days to look back (default 30)
    
    Returns:
        JSON string with the metric data grouped by day/week
    """
    conn = _get_db_connection()
    cursor = conn.cursor()
    
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    
    queries = {
        "revenue": """
            SELECT DATE("startTime") as day, 
                   COUNT(*) as appointments,
                   COALESCE(SUM("totalAmount"), 0) as revenue,
                   COALESCE(SUM("tipAmount"), 0) as tips
            FROM "Appointment" 
            WHERE "shopId" = %s AND "startTime" >= %s AND status = 'COMPLETED'
            GROUP BY DATE("startTime") ORDER BY day
        """,
        "appointments": """
            SELECT DATE("startTime") as day, 
                   status, COUNT(*) as count
            FROM "Appointment" 
            WHERE "shopId" = %s AND "startTime" >= %s
            GROUP BY DATE("startTime"), status ORDER BY day
        """,
        "no_shows": """
            SELECT DATE("startTime") as day, COUNT(*) as no_shows,
                   COALESCE(SUM("totalAmount"), 0) as lost_revenue
            FROM "Appointment" 
            WHERE "shopId" = %s AND "startTime" >= %s AND status = 'NO_SHOW'
            GROUP BY DATE("startTime") ORDER BY day
        """,
        "new_clients": """
            SELECT DATE("createdAt") as day, COUNT(*) as new_clients
            FROM "ShopClient"
            WHERE "shopId" = %s AND "createdAt" >= %s
            GROUP BY DATE("createdAt") ORDER BY day
        """,
        "avg_ticket": """
            SELECT DATE("startTime") as day,
                   ROUND(AVG("totalAmount")::numeric, 2) as avg_ticket,
                   ROUND(AVG("tipAmount")::numeric, 2) as avg_tip
            FROM "Appointment"
            WHERE "shopId" = %s AND "startTime" >= %s AND status = 'COMPLETED'
            GROUP BY DATE("startTime") ORDER BY day
        """,
        "staff_utilization": """
            SELECT u.name as staff_name, u.id as staff_id,
                   COUNT(a.id) as total_appointments,
                   COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) as completed,
                   COUNT(CASE WHEN a.status = 'NO_SHOW' THEN 1 END) as no_shows,
                   COALESCE(SUM(CASE WHEN a.status = 'COMPLETED' THEN a."totalAmount" END), 0) as revenue
            FROM "User" u
            LEFT JOIN "Appointment" a ON a."staffId" = u.id AND a."startTime" >= %s
            WHERE u."shopId" = %s AND u.role IN ('STAFF', 'SHOP_ADMIN', 'BOOTH_RENTER')
            GROUP BY u.id, u.name ORDER BY revenue DESC
        """,
        "reviews": """
            SELECT DATE("createdAt") as day, 
                   ROUND(AVG(rating)::numeric, 2) as avg_rating,
                   COUNT(*) as review_count
            FROM "Review"
            WHERE "shopId" = %s AND "createdAt" >= %s
            GROUP BY DATE("createdAt") ORDER BY day
        """,
    }
    
    if metric not in queries:
        return json.dumps({"error": f"Unknown metric. Available: {list(queries.keys())}"})
    
    sql = queries[metric]
    
    # staff_utilization has reversed parameter order
    if metric == "staff_utilization":
        cursor.execute(sql, (cutoff, shop_id))
    else:
        cursor.execute(sql, (shop_id, cutoff))
    
    columns = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    
    result = []
    for row in rows:
        record = {}
        for col, val in zip(columns, row):
            if hasattr(val, 'isoformat'):
                record[col] = val.isoformat()
            elif isinstance(val, (int, float)):
                record[col] = val
            else:
                record[col] = str(val)
        result.append(record)
    
    cursor.close()
    conn.close()
    
    return json.dumps({
        "metric": metric,
        "period_days": days,
        "shop_id": shop_id,
        "data": result,
        "total_records": len(result)
    })


@tool
def run_custom_query(shop_id: str, sql_description: str) -> str:
    """Run a custom READ-ONLY SQL query against the shop's data.
    
    This tool generates and executes a safe, read-only SQL query based on
    a natural language description. The query is automatically scoped to
    the specified shop for tenant isolation.
    
    Args:
        shop_id: The shop's unique ID (used for tenant isolation)
        sql_description: Natural language description of the data you want.
            Example: "top 5 services by revenue in the last 60 days"
    
    Returns:
        JSON string with query results
    """
    # This is a pre-defined safe query builder — NOT raw SQL execution
    # Maps common analysis patterns to parameterized queries
    
    conn = _get_db_connection()
    cursor = conn.cursor()
    
    safe_queries = {
        "top_services": """
            SELECT s.name, COUNT(a.id) as bookings, 
                   COALESCE(SUM(a."totalAmount"), 0) as revenue
            FROM "Service" s
            LEFT JOIN "Appointment" a ON a."serviceId" = s.id AND a.status = 'COMPLETED'
            WHERE s."shopId" = %s
            GROUP BY s.id, s.name ORDER BY revenue DESC LIMIT 10
        """,
        "busiest_hours": """
            SELECT EXTRACT(HOUR FROM "startTime")::int as hour, 
                   COUNT(*) as appointments
            FROM "Appointment"
            WHERE "shopId" = %s AND status = 'COMPLETED'
            GROUP BY hour ORDER BY appointments DESC
        """,
        "client_retention": """
            SELECT 
                COUNT(DISTINCT CASE WHEN visit_count = 1 THEN user_id END) as one_time,
                COUNT(DISTINCT CASE WHEN visit_count BETWEEN 2 AND 3 THEN user_id END) as returning,
                COUNT(DISTINCT CASE WHEN visit_count > 3 THEN user_id END) as loyal
            FROM (
                SELECT "userId" as user_id, COUNT(*) as visit_count
                FROM "Appointment"
                WHERE "shopId" = %s AND status = 'COMPLETED' AND "userId" IS NOT NULL
                GROUP BY "userId"
            ) sub
        """,
        "day_of_week": """
            SELECT EXTRACT(DOW FROM "startTime")::int as day_of_week,
                   COUNT(*) as appointments,
                   COALESCE(SUM("totalAmount"), 0) as revenue
            FROM "Appointment"
            WHERE "shopId" = %s AND status = 'COMPLETED'
            GROUP BY day_of_week ORDER BY day_of_week
        """,
        "cancellation_rate": """
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled,
                COUNT(CASE WHEN status = 'NO_SHOW' THEN 1 END) as no_shows,
                ROUND(
                    100.0 * COUNT(CASE WHEN status IN ('CANCELLED', 'NO_SHOW') THEN 1 END) / 
                    NULLIF(COUNT(*), 0), 1
                ) as loss_rate_pct
            FROM "Appointment"
            WHERE "shopId" = %s
        """,
    }
    
    # Simple keyword matching to select the right query
    desc_lower = sql_description.lower()
    
    if any(w in desc_lower for w in ["service", "popular", "top"]):
        query_key = "top_services"
    elif any(w in desc_lower for w in ["hour", "busy", "peak", "time"]):
        query_key = "busiest_hours"
    elif any(w in desc_lower for w in ["retention", "loyal", "repeat", "returning"]):
        query_key = "client_retention"
    elif any(w in desc_lower for w in ["day", "week", "weekday"]):
        query_key = "day_of_week"
    elif any(w in desc_lower for w in ["cancel", "no-show", "no show", "loss"]):
        query_key = "cancellation_rate"
    else:
        return json.dumps({
            "error": "Could not map your question to a safe query.",
            "available_analyses": list(safe_queries.keys()),
            "hint": "Try asking about: top services, busiest hours, client retention, day of week patterns, or cancellation rates"
        })
    
    cursor.execute(safe_queries[query_key], (shop_id,))
    columns = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    
    result = []
    for row in rows:
        record = {}
        for col, val in zip(columns, row):
            if hasattr(val, 'isoformat'):
                record[col] = val.isoformat()
            elif isinstance(val, (int, float)):
                record[col] = val
            else:
                record[col] = str(val)
        result.append(record)
    
    cursor.close()
    conn.close()
    
    return json.dumps({
        "query_type": query_key,
        "shop_id": shop_id,
        "data": result
    })


@tool
def compare_periods(shop_id: str, metric: str, current_days: int = 7, previous_days: int = 7) -> str:
    """Compare a metric between two time periods (e.g., this week vs last week).
    
    Args:
        shop_id: The shop's unique ID
        metric: 'revenue', 'appointments', or 'avg_ticket'
        current_days: Days in the current period (default 7)
        previous_days: Days in the previous period (default 7)
    
    Returns:
        JSON with current vs previous period values and percent change
    """
    conn = _get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.utcnow()
    current_start = (now - timedelta(days=current_days)).isoformat()
    previous_start = (now - timedelta(days=current_days + previous_days)).isoformat()
    previous_end = current_start
    
    metric_sql = {
        "revenue": "COALESCE(SUM(\"totalAmount\"), 0)",
        "appointments": "COUNT(*)",
        "avg_ticket": "COALESCE(ROUND(AVG(\"totalAmount\")::numeric, 2), 0)"
    }
    
    if metric not in metric_sql:
        return json.dumps({"error": f"Unknown metric. Available: {list(metric_sql.keys())}"})
    
    agg = metric_sql[metric]
    
    # Current period
    cursor.execute(f"""
        SELECT {agg} as value FROM "Appointment" 
        WHERE "shopId" = %s AND "startTime" >= %s AND status = 'COMPLETED'
    """, (shop_id, current_start))
    current_val = float(cursor.fetchone()[0])
    
    # Previous period
    cursor.execute(f"""
        SELECT {agg} as value FROM "Appointment" 
        WHERE "shopId" = %s AND "startTime" >= %s AND "startTime" < %s AND status = 'COMPLETED'
    """, (shop_id, previous_start, previous_end))
    previous_val = float(cursor.fetchone()[0])
    
    pct_change = ((current_val - previous_val) / previous_val * 100) if previous_val else 0
    
    cursor.close()
    conn.close()
    
    return json.dumps({
        "metric": metric,
        "current_period": {"days": current_days, "value": current_val},
        "previous_period": {"days": previous_days, "value": previous_val},
        "change_pct": round(pct_change, 1),
        "direction": "up" if pct_change > 0 else "down" if pct_change < 0 else "flat"
    })


# ── Structured Output Schema ─────────────────────────────────────────────

class InsightItem(BaseModel):
    title: str = Field(description="Short headline for this insight")
    detail: str = Field(description="2-3 sentence explanation with specific numbers")
    category: str = Field(description="One of: revenue, operations, growth, risk")
    priority: str = Field(description="One of: high, medium, low")
    action: str = Field(description="Specific, actionable recommendation")


class BusinessReport(BaseModel):
    shop_name: str = Field(description="Name of the shop")
    report_date: str = Field(description="Today's date (YYYY-MM-DD)")
    summary: str = Field(description="Executive summary in 2-3 sentences")
    insights: list[InsightItem] = Field(description="Top 3-5 actionable insights")
    health_score: int = Field(description="Overall business health 1-100", ge=1, le=100)


# ── Agent Configuration ───────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a sharp, data-driven business intelligence analyst for barbershops.

Your job is to analyze a shop's operational data and produce actionable insights that 
help the shop owner grow their business. You are NOT a chatbot — you are an autonomous 
analyst that proactively explores the data.

## Your Analysis Process:
1. Start by checking revenue trends (last 30 days)
2. Look at appointment volume and no-show rates
3. Compare this week vs last week
4. Analyze staff performance
5. Check client retention patterns
6. Identify the biggest opportunity and biggest risk

## Rules:
- Always cite specific numbers (e.g., "Revenue was $4,230, up 12% from last week")
- Focus on ACTIONABLE insights, not just observations
- Prioritize findings by business impact
- If data is sparse, say so — don't make things up
- Express monetary values in dollars (divide cents by 100 if needed)
"""


async def analyze_shop(shop_id: str, shop_name: str = "Your Shop") -> BusinessReport:
    """Run the BI agent to analyze a shop and return structured insights."""
    
    config = LocalAgentConfig(
        tools=[query_shop_metrics, run_custom_query, compare_periods],
    )
    
    async with Agent(config) as agent:
        response = await agent.chat(
            f"""Analyze the business data for shop "{shop_name}" (ID: {shop_id}).
            
            Use the available tools to explore revenue, appointments, staff performance, 
            client retention, and any other patterns you find interesting.
            
            Produce a comprehensive business intelligence report with your findings.""",
            response_schema=BusinessReport,
            system_prompt=SYSTEM_PROMPT,
        )
        
        return response.parsed


# ── FastAPI Server (for Cloud Run deployment) ─────────────────────────────

def create_app():
    """Create the FastAPI app for serving the BI agent."""
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    
    app = FastAPI(
        title="KutzApp BI Agent",
        description="AI-powered business intelligence for barbershops",
        version="1.0.0",
    )
    
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
    
    class AnalyzeRequest(BaseModel):
        shop_id: str
        shop_name: str = "Your Shop"
    
    @app.post("/analyze", response_model=BusinessReport)
    async def analyze(req: AnalyzeRequest):
        try:
            report = await analyze_shop(req.shop_id, req.shop_name)
            return report
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/health")
    async def health():
        return {"status": "ok", "agent": "kutzapp-bi"}
    
    return app


# ── CLI Entry Point ───────────────────────────────────────────────────────

async def main():
    """Run the agent from the command line for testing."""
    import sys
    
    shop_id = sys.argv[1] if len(sys.argv) > 1 else "cm3shop001heritage0001"
    shop_name = sys.argv[2] if len(sys.argv) > 2 else "Heritage Haircuts"
    
    print(f"\n🔍 Analyzing {shop_name} ({shop_id})...\n")
    
    report = await analyze_shop(shop_id, shop_name)
    
    print(f"📊 Business Health Score: {report.health_score}/100")
    print(f"\n📋 Summary: {report.summary}\n")
    
    for i, insight in enumerate(report.insights, 1):
        emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}[insight.priority]
        print(f"{emoji} [{insight.category.upper()}] {insight.title}")
        print(f"   {insight.detail}")
        print(f"   💡 Action: {insight.action}\n")


if __name__ == "__main__":
    asyncio.run(main())
