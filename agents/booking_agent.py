# KutzApp Smart Booking Agent
# Powered by Google Antigravity SDK
#
# A multi-turn conversational agent that handles appointment booking,
# rescheduling, and cancellation with intelligent upselling and 
# personalization based on client history.

import asyncio
import os
import json
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel, Field

from google.antigravity import Agent, LocalAgentConfig
from google.antigravity.tools import tool

import httpx  # Async HTTP client for calling KutzApp API


# ── Configuration ─────────────────────────────────────────────────────────

KUTZAPP_API_URL = os.environ.get("KUTZAPP_API_URL", "https://barber-shop-website-ashy.vercel.app")


# ── API Client Helper ─────────────────────────────────────────────────────

async def _api_get(path: str) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{KUTZAPP_API_URL}{path}")
        return resp.json()


async def _api_post(path: str, data: dict) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(f"{KUTZAPP_API_URL}{path}", json=data)
        return resp.json()


# ── Tools ─────────────────────────────────────────────────────────────────

@tool
def list_services(shop_id: str) -> str:
    """Get all available services for a shop, including prices and durations.
    
    Args:
        shop_id: The shop's unique ID
    
    Returns:
        JSON list of services with id, name, price (in cents), durationMinutes
    """
    import asyncio
    data = asyncio.get_event_loop().run_until_complete(
        _api_get(f"/api/shops/{shop_id}/services")
    )
    # Simplify for the agent
    services = []
    for s in (data if isinstance(data, list) else data.get("services", [])):
        services.append({
            "id": s.get("id"),
            "name": s.get("name"),
            "price_dollars": s.get("price", 0) / 100,
            "duration_minutes": s.get("durationMinutes", 30),
            "description": s.get("description", ""),
        })
    return json.dumps(services)


@tool
def list_staff(shop_id: str) -> str:
    """Get all staff members (barbers/stylists) for a shop.
    
    Args:
        shop_id: The shop's unique ID
    
    Returns:
        JSON list of staff with id, name, role, imageUrl
    """
    import asyncio
    data = asyncio.get_event_loop().run_until_complete(
        _api_get(f"/api/shops/{shop_id}/staff")
    )
    staff = []
    for s in (data if isinstance(data, list) else data.get("staff", [])):
        staff.append({
            "id": s.get("id"),
            "name": s.get("name"),
            "role": s.get("role"),
            "image": s.get("imageUrl"),
        })
    return json.dumps(staff)


@tool
def check_availability(shop_id: str, date: str, service_id: str, staff_id: str = "") -> str:
    """Check available time slots for a specific date, service, and optionally a specific barber.
    
    Args:
        shop_id: The shop's unique ID
        date: Date in YYYY-MM-DD format
        service_id: The service ID
        staff_id: Optional specific barber. If empty, checks all barbers.
    
    Returns:
        JSON with available time slots
    """
    import asyncio
    
    params = f"?date={date}&serviceId={service_id}"
    if staff_id:
        params += f"&staffId={staff_id}"
    
    data = asyncio.get_event_loop().run_until_complete(
        _api_get(f"/api/shops/{shop_id}/appointments{params}")
    )
    return json.dumps(data)


@tool
def get_client_history(shop_id: str, phone: str) -> str:
    """Look up a client's appointment history to personalize recommendations.
    
    Args:
        shop_id: The shop's unique ID
        phone: Client's phone number
    
    Returns:
        JSON with past appointments, favorite service, favorite barber, total visits
    """
    import pg8000
    
    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url:
        return json.dumps({"error": "Database not configured"})
    
    # Parse DB URL
    url = db_url.replace("postgresql://", "")
    user_pass, rest = url.split("@", 1)
    user, password = user_pass.split(":", 1)
    host_port, dbname = rest.split("/", 1)
    if "?" in dbname:
        dbname = dbname.split("?")[0]
    host, port = host_port.split(":", 1) if ":" in host_port else (host_port, "5432")
    
    conn = pg8000.connect(user=user, password=password, host=host, port=int(port), database=dbname, ssl_context=True)
    cursor = conn.cursor()
    
    # Find client by phone
    cursor.execute("""
        SELECT u.id, u.name, u.email,
               COUNT(a.id) as total_visits,
               MAX(a."startTime") as last_visit
        FROM "User" u
        LEFT JOIN "Appointment" a ON a."userId" = u.id AND a.status = 'COMPLETED'
        LEFT JOIN "ShopClient" sc ON sc."userId" = u.id AND sc."shopId" = %s
        WHERE u.phone = %s
        GROUP BY u.id
    """, (shop_id, phone))
    
    row = cursor.fetchone()
    if not row:
        cursor.close()
        conn.close()
        return json.dumps({"found": False, "message": "New client — no history"})
    
    user_id = row[0]
    
    # Get favorite service
    cursor.execute("""
        SELECT s.name, COUNT(*) as times
        FROM "Appointment" a
        JOIN "Service" s ON s.id = a."serviceId"
        WHERE a."userId" = %s AND a.status = 'COMPLETED'
        GROUP BY s.name ORDER BY times DESC LIMIT 1
    """, (user_id,))
    fav_service = cursor.fetchone()
    
    # Get favorite barber
    cursor.execute("""
        SELECT u.name, COUNT(*) as times
        FROM "Appointment" a
        JOIN "User" u ON u.id = a."staffId"
        WHERE a."userId" = %s AND a.status = 'COMPLETED'
        GROUP BY u.name ORDER BY times DESC LIMIT 1
    """, (user_id,))
    fav_barber = cursor.fetchone()
    
    # Get last 3 appointments
    cursor.execute("""
        SELECT s.name as service, st.name as barber, 
               a."startTime", a."totalAmount"
        FROM "Appointment" a
        LEFT JOIN "Service" s ON s.id = a."serviceId"
        LEFT JOIN "User" st ON st.id = a."staffId"
        WHERE a."userId" = %s AND a.status = 'COMPLETED'
        ORDER BY a."startTime" DESC LIMIT 3
    """, (user_id,))
    recent = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return json.dumps({
        "found": True,
        "client_name": row[1],
        "email": row[2],
        "total_visits": row[3],
        "last_visit": str(row[4]) if row[4] else None,
        "favorite_service": fav_service[0] if fav_service else None,
        "favorite_barber": fav_barber[0] if fav_barber else None,
        "recent_appointments": [
            {"service": r[0], "barber": r[1], "date": str(r[2]), "total": float(r[3]) if r[3] else 0}
            for r in recent
        ]
    })


@tool
def book_appointment(
    shop_id: str,
    service_id: str,
    staff_id: str,
    date: str,
    time: str,
    client_name: str,
    client_phone: str,
    client_email: str = "",
) -> str:
    """Book an appointment. Only call this after confirming the details with the client.
    
    Args:
        shop_id: The shop's unique ID
        service_id: ID of the service
        staff_id: ID of the barber/stylist
        date: Date in YYYY-MM-DD format
        time: Time in HH:MM 24-hour format
        client_name: Client's full name
        client_phone: Client's phone number
        client_email: Optional client email for calendar invite
    
    Returns:
        JSON with booking confirmation or error
    """
    import asyncio
    
    data = asyncio.get_event_loop().run_until_complete(
        _api_post(f"/api/shops/{shop_id}/appointments", {
            "serviceId": service_id,
            "staffId": staff_id,
            "date": date,
            "time": time,
            "clientName": client_name,
            "clientPhone": client_phone,
            "clientEmail": client_email,
        })
    )
    return json.dumps(data)


@tool
def cancel_appointment(appointment_id: str) -> str:
    """Cancel an existing appointment.
    
    Args:
        appointment_id: The appointment ID to cancel
    
    Returns:
        JSON confirmation
    """
    import asyncio
    
    data = asyncio.get_event_loop().run_until_complete(
        _api_post(f"/api/appointments/{appointment_id}/cancel", {})
    )
    return json.dumps(data)


# ── Structured Output ─────────────────────────────────────────────────────

class BookingResult(BaseModel):
    status: str = Field(description="One of: booked, cancelled, rescheduled, inquiry, error")
    appointment_id: Optional[str] = Field(default=None, description="ID if appointment was created")
    summary: str = Field(description="Human-friendly summary of what happened")
    upsell_offered: bool = Field(default=False, description="Whether an upsell was suggested")
    client_name: Optional[str] = Field(default=None)
    service: Optional[str] = Field(default=None)
    barber: Optional[str] = Field(default=None)
    date_time: Optional[str] = Field(default=None)
    total_price: Optional[float] = Field(default=None)


# ── Agent Configuration ───────────────────────────────────────────────────

BOOKING_SYSTEM_PROMPT = """You are a friendly, professional booking assistant for a barbershop.

## Your Personality:
- Warm and conversational — like a receptionist who knows regulars by name
- Efficient — don't waste the client's time with unnecessary questions
- Proactive — suggest add-ons and preferred barbers based on history

## Booking Flow:
1. **Greet** the client warmly
2. **Identify** them (ask for phone number)  
3. **Look up history** to personalize (use get_client_history)
4. **Understand** what they want (service, barber preference, date/time)
5. **Check availability** and present options
6. **Upsell** relevant add-ons based on history (e.g., "Last time you also got a beard trim — want to add that?")
7. **Confirm** all details before booking
8. **Book** and provide confirmation

## Rules:
- ALWAYS look up client history if they provide a phone number
- NEVER book without explicit client confirmation
- If a preferred barber is unavailable, suggest alternatives
- Mention the total price before confirming
- If the client is new (no history), welcome them warmly
- Keep responses concise — 2-3 sentences max per turn
"""


async def create_booking_session(shop_id: str, shop_name: str = "Heritage Haircuts"):
    """Create an interactive booking session."""
    
    config = LocalAgentConfig(
        tools=[
            list_services, list_staff, check_availability,
            get_client_history, book_appointment, cancel_appointment,
        ],
    )
    
    async with Agent(config) as agent:
        # Initial context-setting message
        initial_msg = (
            f"You are now the booking assistant for '{shop_name}' (shop ID: {shop_id}). "
            f"Today's date is {datetime.utcnow().strftime('%Y-%m-%d')}. "
            f"Start by loading the shop's services and staff so you know what's available."
        )
        
        await agent.chat(initial_msg, system_prompt=BOOKING_SYSTEM_PROMPT)
        
        print(f"\n💈 Welcome to {shop_name}! How can I help you today?\n")
        print("(Type 'quit' to exit)\n")
        
        while True:
            user_input = input("You: ").strip()
            if user_input.lower() in ("quit", "exit", "bye"):
                print("\nThanks for visiting! See you soon. 💈")
                break
            
            response = await agent.chat(user_input)
            print(f"\n🤖 {await response.text()}\n")


# ── FastAPI Server ────────────────────────────────────────────────────────

def create_app():
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    
    app = FastAPI(title="KutzApp Booking Agent", version="1.0.0")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Embedded widget — needs broad CORS
        allow_methods=["POST", "OPTIONS"],
        allow_headers=["*"],
    )
    
    # Store active sessions in memory (use Redis in production)
    sessions: dict[str, Agent] = {}
    
    class ChatRequest(BaseModel):
        shop_id: str
        session_id: str
        message: str
        shop_name: str = "Heritage Haircuts"
    
    class ChatResponse(BaseModel):
        reply: str
        session_id: str
    
    @app.post("/chat", response_model=ChatResponse)
    async def chat(req: ChatRequest):
        try:
            # For now, stateless per-request agent (session management 
            # requires Redis/Firestore in production)
            config = LocalAgentConfig(
                tools=[
                    list_services, list_staff, check_availability,
                    get_client_history, book_appointment, cancel_appointment,
                ],
            )
            
            async with Agent(config) as agent:
                # Pre-load context
                context = (
                    f"Shop: {req.shop_name} (ID: {req.shop_id}). "
                    f"Today: {datetime.utcnow().strftime('%Y-%m-%d')}. "
                    f"Load services/staff first, then respond to the client."
                )
                await agent.chat(context, system_prompt=BOOKING_SYSTEM_PROMPT)
                
                response = await agent.chat(req.message)
                reply = await response.text()
            
            return ChatResponse(reply=reply, session_id=req.session_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/health")
    async def health():
        return {"status": "ok", "agent": "kutzapp-booking"}
    
    return app


# ── CLI Entry Point ───────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    
    shop_id = sys.argv[1] if len(sys.argv) > 1 else "cm3shop001heritage0001"
    shop_name = sys.argv[2] if len(sys.argv) > 2 else "Heritage Haircuts"
    
    asyncio.run(create_booking_session(shop_id, shop_name))
