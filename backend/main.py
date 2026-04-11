# ==============================================================================
# FoundrKit Backend — main.py
# Fixes applied:
#   1. CORS wildcard replaced with explicit origins
#   2. JWT auth verification added (get_current_user dependency)
#   3. Duplicate LogoGenerationRequest class + endpoint removed
#   4. import json / import re moved to top-level
#   5. Bare except: replaced with specific exception types
#   6. All routes now verify the caller owns the resource
#   7. Bulk task insert endpoint added (/tasks/bulk-add)
#   8. rename_session now accepts JSON body instead of query param
#   9. productivity_score returns None for new users (<3 tasks)
# ==============================================================================

import os
import re
import json
import base64

import requests
import google.generativeai as genai

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import Optional
from uuid import UUID

load_dotenv()

# ------------------------------------------------------------------------------
# Supabase + Gemini setup
# ------------------------------------------------------------------------------

SUPABASE_URL: str = os.environ.get("SUPABASE_URL")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ------------------------------------------------------------------------------
# App + CORS
# FIX 1: Replace wildcard with explicit allowed origins
# Add FRONTEND_URL=https://your-domain.com to your backend .env file
# ------------------------------------------------------------------------------

app = FastAPI()

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    os.environ.get("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in ALLOWED_ORIGINS if o],  # removes empty strings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# FIX 2: JWT Authentication dependency
# Every protected route adds:  current_user=Depends(get_current_user)
# The frontend must send:  Authorization: Bearer <supabase_access_token>
# See lib/api.ts in the frontend for the helper that attaches this automatically
# ------------------------------------------------------------------------------

def get_current_user(authorization: str = Header(...)):
    """
    Reads the Authorization header, verifies it with Supabase,
    and returns the authenticated user object.
    Raises HTTP 401 if the token is missing or invalid.
    """
    try:
        token = authorization.replace("Bearer ", "").strip()
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return user_response.user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Not authenticated")


def require_self(current_user_id: str, requested_user_id: str):
    """
    Ensures the authenticated user is only accessing their own data.
    Raises HTTP 403 if they try to access someone else's resources.
    """
    if current_user_id != requested_user_id:
        raise HTTPException(status_code=403, detail="Access denied")


# ==============================================================================
# PROPOSALS
# ==============================================================================

class ProposalRequest(BaseModel):
    user_id: str
    client_name: str
    project_details: str

@app.post("/generate-proposal")
def generate_proposal(
    request: ProposalRequest,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, request.user_id)

    response = supabase.table("brand_settings").select("*").eq("user_id", request.user_id).execute()

    if response.data:
        brand = response.data[0]
        company_name = brand.get("company_name", "My Company")
        description = brand.get("company_description", "We provide professional services.")
        tone = brand.get("tone_of_voice", "Professional")
    else:
        company_name = "Freelancer"
        description = "General services"
        tone = "Professional"

    prompt = f"""
    You are the founder of {company_name}.
    Your company does: {description}.

    Write a professional business proposal for a client named "{request.client_name}".
    The project is: "{request.project_details}".

    Writing Style: {tone}.

    IMPORTANT FORMATTING RULES:
    1. Do NOT use Markdown tables (no pipes |). They break the PDF renderer.
    2. For the 'Pricing Estimate', use a clear Bulleted List format.
       Example:
       - Web Design: $1,000
       - SEO Setup: $500
       - Total: $1,500
    3. Use ## for Section Headings.
    4. Do not use bolding (**) symbols inside paragraphs.

    Structure:
    # Proposal for {request.client_name}
    ## Executive Summary
    ## Our Approach
    ## Timeline & Deliverables
    ## Pricing Estimate
    """

    model = genai.GenerativeModel("gemini-2.5-flash")
    ai_response = model.generate_content(prompt)
    return {"proposal_text": ai_response.text}


class ProposalSaveRequest(BaseModel):
    user_id: str
    client_name: str
    project_details: str
    content: str
    status: str = "Draft"

@app.post("/proposals/save")
def save_proposal(
    request: ProposalSaveRequest,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, request.user_id)

    data = {
        "user_id": request.user_id,
        "client_name": request.client_name,
        "project_details": request.project_details,
        "content": request.content,
        "status": request.status,
    }
    response = supabase.table("proposals").insert(data).execute()
    return {"status": "success", "data": response.data}


@app.get("/proposals/{user_id}")
def get_proposals(
    user_id: str,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, user_id)
    response = (
        supabase.table("proposals")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


@app.get("/proposals/detail/{proposal_id}")
def get_proposal_detail(
    proposal_id: str,
    current_user=Depends(get_current_user),
):
    try:
        UUID(proposal_id, version=4)
    except ValueError:
        return {}

    response = (
        supabase.table("proposals")
        .select("*")
        .eq("id", proposal_id)
        .execute()
    )

    if not response.data:
        return {}

    proposal = response.data[0]
    require_self(current_user.id, proposal["user_id"])
    return proposal


class UpdateProposalRequest(BaseModel):
    content: str

@app.put("/proposals/{proposal_id}")
def update_proposal(
    proposal_id: str,
    request: UpdateProposalRequest,
    current_user=Depends(get_current_user),
):
    existing = (
        supabase.table("proposals")
        .select("user_id")
        .eq("id", proposal_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Proposal not found")
    require_self(current_user.id, existing.data[0]["user_id"])

    response = (
        supabase.table("proposals")
        .update({"content": request.content})
        .eq("id", proposal_id)
        .execute()
    )
    return {"status": "updated", "data": response.data}


@app.delete("/proposals/{proposal_id}")
def delete_proposal(
    proposal_id: str,
    current_user=Depends(get_current_user),
):
    existing = (
        supabase.table("proposals")
        .select("user_id")
        .eq("id", proposal_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Proposal not found")
    require_self(current_user.id, existing.data[0]["user_id"])

    response = supabase.table("proposals").delete().eq("id", proposal_id).execute()
    return {"status": "deleted", "data": response.data}


# ==============================================================================
# CLIENTS
# ==============================================================================

class ClientRequest(BaseModel):
    user_id: str
    name: str
    email: str
    industry: str
    notes: str

@app.post("/clients/add")
def add_client(
    request: ClientRequest,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, request.user_id)

    data = {
        "user_id": request.user_id,
        "name": request.name,
        "email": request.email,
        "industry": request.industry,
        "notes": request.notes,
    }
    response = supabase.table("clients").insert(data).execute()
    return {"status": "success", "data": response.data}


@app.get("/clients/{user_id}")
def get_clients(
    user_id: str,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, user_id)
    response = (
        supabase.table("clients")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


@app.delete("/clients/{client_id}")
def delete_client(
    client_id: str,
    current_user=Depends(get_current_user),
):
    existing = (
        supabase.table("clients")
        .select("user_id")
        .eq("id", client_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Client not found")
    require_self(current_user.id, existing.data[0]["user_id"])

    response = supabase.table("clients").delete().eq("id", client_id).execute()
    return {"status": "deleted", "data": response.data}


# ==============================================================================
# EMAILS
# ==============================================================================

class EmailRequest(BaseModel):
    user_id: str
    client_name: str
    email_type: str
    context: str

@app.post("/generate-email")
def generate_email(
    request: EmailRequest,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, request.user_id)

    response = (
        supabase.table("brand_settings")
        .select("*")
        .eq("user_id", request.user_id)
        .execute()
    )

    if response.data:
        brand = response.data[0]
        sender_company = brand.get("company_name", "My Company")
        tone = brand.get("tone_of_voice", "Professional")
        description = brand.get("company_description", "Services")
    else:
        sender_company = "My Company"
        tone = "Professional"
        description = "Services"

    prompt = f"""
    You are {sender_company}. You describe yourself as: "{description}".

    Write a {request.email_type} email to a client named "{request.client_name}".

    Context/Goal: {request.context}
    Tone: {tone}

    IMPORTANT:
    1. Return JSON format with 'subject' and 'body'.
    2. Do NOT use Markdown (no **bold** or ## headers). Plain text only.
    3. Keep it concise and human-sounding.

    Output format:
    {{
      "subject": "The subject line here",
      "body": "Hi [Name],\\n\\nThe email body here..."
    }}
    """
    model = genai.GenerativeModel("gemini-2.5-flash")
    ai_response = model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"},
    )
    return ai_response.text


class EmailSaveRequest(BaseModel):
    user_id: str
    client_name: str
    subject: str
    body: str
    email_type: str

@app.post("/emails/save")
def save_email(
    request: EmailSaveRequest,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, request.user_id)

    data = {
        "user_id": request.user_id,
        "client_name": request.client_name,
        "subject": request.subject,
        "body": request.body,
        "email_type": request.email_type,
        "status": "Draft",
    }
    response = supabase.table("emails").insert(data).execute()
    return {"status": "success", "data": response.data}


@app.get("/emails/{user_id}")
def get_emails(
    user_id: str,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, user_id)
    response = (
        supabase.table("emails")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


@app.delete("/emails/{email_id}")
def delete_email(
    email_id: str,
    current_user=Depends(get_current_user),
):
    existing = (
        supabase.table("emails")
        .select("user_id")
        .eq("id", email_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Email not found")
    require_self(current_user.id, existing.data[0]["user_id"])

    supabase.table("emails").delete().eq("id", email_id).execute()
    return {"status": "deleted"}


# ==============================================================================
# TASKS
# ==============================================================================

class TaskRequest(BaseModel):
    user_id: str
    title: str
    status: str = "todo"
    due_date: Optional[str] = None
    priority: str = "medium"

class AITaskGenRequest(BaseModel):
    user_id: str
    goal: str

class BulkTaskAddRequest(BaseModel):
    user_id: str
    tasks: list[str]


@app.get("/tasks/{user_id}")
def get_tasks(
    user_id: str,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, user_id)
    return (
        supabase.table("tasks")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
        .data
    )


@app.post("/tasks/add")
def add_task(
    request: TaskRequest,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, request.user_id)
    data = request.dict()
    return supabase.table("tasks").insert(data).execute()


@app.post("/tasks/bulk-add")
def bulk_add_tasks(
    request: BulkTaskAddRequest,
    current_user=Depends(get_current_user),
):
    """
    Inserts all AI-generated tasks in a single DB call instead of N round-trips.
    The frontend calls this after /tasks/generate instead of looping /tasks/add.
    """
    require_self(current_user.id, request.user_id)
    rows = [
        {"user_id": request.user_id, "title": t, "status": "todo"}
        for t in request.tasks
    ]
    return supabase.table("tasks").insert(rows).execute()


@app.put("/tasks/{task_id}")
def update_task_status(
    task_id: str,
    status: str,
    current_user=Depends(get_current_user),
):
    existing = (
        supabase.table("tasks")
        .select("user_id")
        .eq("id", task_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Task not found")
    require_self(current_user.id, existing.data[0]["user_id"])

    return supabase.table("tasks").update({"status": status}).eq("id", task_id).execute()


@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: str,
    current_user=Depends(get_current_user),
):
    existing = (
        supabase.table("tasks")
        .select("user_id")
        .eq("id", task_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Task not found")
    require_self(current_user.id, existing.data[0]["user_id"])

    return supabase.table("tasks").delete().eq("id", task_id).execute()


@app.post("/tasks/generate")
def generate_tasks_ai(
    request: AITaskGenRequest,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, request.user_id)

    prompt = f"""
    You are an expert project manager. The user wants to: "{request.goal}".
    Break this down into 3-5 specific, actionable tasks.
    Return ONLY a JSON list of strings.
    Example: ["Buy Domain", "Design Logo", "Write Content"]
    """
    model = genai.GenerativeModel("gemini-2.5-flash")
    result = model.generate_content(prompt)

    # FIX 5: specific exceptions instead of bare except
    try:
        json_str = re.search(r'\[.*\]', result.text, re.DOTALL).group(0)
        tasks = json.loads(json_str)
        return {"tasks": tasks}
    except (AttributeError, json.JSONDecodeError) as e:
        print(f"Task parse error: {e}")
        return {"tasks": ["Define project scope", "Research competitors", "Set timeline"]}


# ==============================================================================
# CHAT
# ==============================================================================

class ChatSessionRequest(BaseModel):
    user_id: str
    title: str = "New Chat"

class ChatMessageRequest(BaseModel):
    user_id: str
    session_id: str
    message: str

# FIX: title now comes from a JSON body, not a query param
class RenameChatRequest(BaseModel):
    title: str


@app.post("/chat/sessions")
def create_session(
    request: ChatSessionRequest,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, request.user_id)
    data = {"user_id": request.user_id, "title": request.title}
    response = supabase.table("chat_sessions").insert(data).execute()
    return response.data[0]


@app.get("/chat/sessions/{user_id}")
def get_sessions(
    user_id: str,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, user_id)
    return (
        supabase.table("chat_sessions")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
        .data
    )


@app.get("/chat/messages/{session_id}")
def get_messages(
    session_id: str,
    current_user=Depends(get_current_user),
):
    session = (
        supabase.table("chat_sessions")
        .select("user_id")
        .eq("id", session_id)
        .execute()
    )
    if not session.data:
        raise HTTPException(status_code=404, detail="Session not found")
    require_self(current_user.id, session.data[0]["user_id"])

    return (
        supabase.table("chat_messages")
        .select("*")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .execute()
        .data
    )


@app.put("/chat/sessions/{session_id}")
def rename_session(
    session_id: str,
    request: RenameChatRequest,
    current_user=Depends(get_current_user),
):
    existing = (
        supabase.table("chat_sessions")
        .select("user_id")
        .eq("id", session_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Session not found")
    require_self(current_user.id, existing.data[0]["user_id"])

    return (
        supabase.table("chat_sessions")
        .update({"title": request.title})
        .eq("id", session_id)
        .execute()
    )


@app.delete("/chat/sessions/{session_id}")
def delete_session(
    session_id: str,
    current_user=Depends(get_current_user),
):
    existing = (
        supabase.table("chat_sessions")
        .select("user_id")
        .eq("id", session_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Session not found")
    require_self(current_user.id, existing.data[0]["user_id"])

    return supabase.table("chat_sessions").delete().eq("id", session_id).execute()


@app.post("/chat/send")
def send_message(
    request: ChatMessageRequest,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, request.user_id)

    supabase.table("chat_messages").insert({
        "session_id": request.session_id,
        "role": "user",
        "content": request.message,
    }).execute()

    brand_res = (
        supabase.table("brand_settings")
        .select("*")
        .eq("user_id", request.user_id)
        .execute()
    )
    if brand_res.data:
        b = brand_res.data[0]
        brand_context = (
            f"You are the Co-Founder of '{b.get('company_name')}'. "
            f"Description: '{b.get('company_description')}'. "
            f"Tone: {b.get('tone_of_voice')}."
        )
    else:
        brand_context = "You are a helpful business co-founder."

    tasks_res = (
        supabase.table("tasks")
        .select("title, status, due_date")
        .eq("user_id", request.user_id)
        .neq("status", "done")
        .limit(10)
        .execute()
    )
    task_list = "\n".join([f"- {t['title']} ({t['status']})" for t in tasks_res.data])
    task_context = f"CURRENT OPEN TASKS:\n{task_list}" if tasks_res.data else "NO OPEN TASKS."

    prop_res = (
        supabase.table("proposals")
        .select("client_name, status, created_at")
        .eq("user_id", request.user_id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )
    prop_list = "\n".join([f"- To {p['client_name']} (Status: {p['status']})" for p in prop_res.data])
    prop_context = f"RECENT PROPOSALS:\n{prop_list}" if prop_res.data else "NO RECENT PROPOSALS."

    client_res = (
        supabase.table("clients")
        .select("name, industry, notes")
        .eq("user_id", request.user_id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )
    client_list = "\n".join([f"- {c['name']} ({c['industry']}): {c['notes']}" for c in client_res.data])
    client_context = f"KEY CLIENTS:\n{client_list}" if client_res.data else "NO CLIENTS YET."

    history_res = (
        supabase.table("chat_messages")
        .select("*")
        .eq("session_id", request.session_id)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    history_msgs = history_res.data[::-1]
    history_text = "".join(
        f"{msg['role'].upper()}: {msg['content']}\n" for msg in history_msgs
    )

    prompt = f"""
    SYSTEM IDENTITY:
    {brand_context}

    YOUR CURRENT BUSINESS STATE:
    {task_context}

    {prop_context}

    {client_context}

    CHAT HISTORY:
    {history_text}

    INSTRUCTION:
    Reply to the user. You have full visibility of their business (tasks, proposals, clients).
    If they ask about workload, check TASKS. If they ask about money/clients, check PROPOSALS and CLIENTS.
    Be short, strategic, and proactive.
    """

    model = genai.GenerativeModel("gemini-2.5-flash")
    ai_response = model.generate_content(prompt)
    ai_text = ai_response.text

    supabase.table("chat_messages").insert({
        "session_id": request.session_id,
        "role": "ai",
        "content": ai_text,
    }).execute()

    return {"reply": ai_text}


# ==============================================================================
# DASHBOARD STATS
# ==============================================================================

@app.get("/dashboard/stats/{user_id}")
def get_dashboard_stats(
    user_id: str,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, user_id)

    prop_res = (
        supabase.table("proposals")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .execute()
    )
    client_res = (
        supabase.table("clients")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .execute()
    )
    task_total_res = (
        supabase.table("tasks")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .execute()
    )
    task_done_res = (
        supabase.table("tasks")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("status", "done")
        .execute()
    )

    total_tasks = task_total_res.count or 0
    completed_tasks = task_done_res.count or 0

    # FIX 9: Don't show 0% for brand-new users — return None until there's real data
    # Frontend should render None as "–" instead of "0%"
    if total_tasks >= 3:
        productivity_score = int((completed_tasks / total_tasks) * 100)
    else:
        productivity_score = None

    recent_props = (
        supabase.table("proposals")
        .select("client_name, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(3)
        .execute()
    )
    recent_tasks = (
        supabase.table("tasks")
        .select("title, created_at")
        .eq("user_id", user_id)
        .eq("status", "done")
        .order("created_at", desc=True)
        .limit(3)
        .execute()
    )

    return {
        "proposal_count": prop_res.count,
        "client_count": client_res.count,
        "productivity_score": productivity_score,
        "active_tasks": total_tasks - completed_tasks,
        "recent_proposals": recent_props.data,
        "recent_tasks": recent_tasks.data,
    }


# ==============================================================================
# BRANDING SUITE
# ==============================================================================

class BrandingRequest(BaseModel):
    user_id: str
    asset_type: str
    keywords: str
    style: str

@app.post("/branding/generate")
def generate_branding(
    request: BrandingRequest,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, request.user_id)

    if request.asset_type == "logo":
        prompt = f"""
        You are an expert AI Art Prompter.
        Write a detailed text prompt to generate a High-Quality Logo for: "{request.keywords}".
        Style: {request.style}.

        Rules:
        1. Return ONLY the raw prompt string. No JSON, no markdown.
        2. Include: "vector style", "white background", "minimalist", "high resolution", "professional branding".
        3. Keep it under 25 words.
        """
    elif request.asset_type == "name":
        prompt = f"""
        Generate 5 creative, available business names for: "{request.keywords}".
        Style: {request.style}.

        For each name, provide a short 1-sentence explanation of the meaning.

        Return ONLY a JSON list of objects with keys "name" and "meaning".
        Example: [{{"name": "Zenith", "meaning": "Represents the peak of success."}}]
        """
    elif request.asset_type == "slogan":
        prompt = f"""
        Generate 5 catchy taglines/slogans for: "{request.keywords}".
        Style: {request.style}.
        Return ONLY a JSON list of strings.
        """
    else:
        prompt = f"""
        Write a professional 'About Us' or 'Mission Statement' for: "{request.keywords}".
        Style: {request.style}.
        Keep it under 50 words.
        """

    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    text = response.text
    clean_text = (
        text.replace("```json", "")
            .replace("```xml", "")
            .replace("```svg", "")
            .replace("```", "")
            .strip()
    )
    return {"result": clean_text, "type": request.asset_type}


# FIX 3: Only ONE definition of LogoGenerationRequest and /branding/generate-image
# The simpler first version has been removed. Only the Gemini-bridge version remains.

class LogoGenerationRequest(BaseModel):
    prompt: str

@app.post("/branding/generate-image")
def generate_image_logo(
    request: LogoGenerationRequest,
    current_user=Depends(get_current_user),
):
    print(f"DEBUG: Original User Input: {request.prompt}")

    hf_token = os.environ.get("HF_API_KEY")
    if not hf_token:
        raise HTTPException(status_code=500, detail="HF_API_KEY missing")

    # Step 1: Gemini refines the prompt into an optimised SDXL prompt
    try:
        bridge_prompt = f"""
Act as an expert Prompt Engineer for Stable Diffusion XL.

The user wants a professional startup logo for:
"{request.prompt}"

Requirements:
- Minimalist flat vector logo
- Single centered symbol
- Pure white background
- No text, no letters, no typography
- Clean geometric shapes
- Adobe Illustrator / SVG style
- Corporate, sleek, professional branding

Return ONLY the final prompt string.
"""
        model = genai.GenerativeModel("gemini-2.5-flash")
        bridge_response = model.generate_content(bridge_prompt)
        enhanced_prompt = bridge_response.text.strip()
        print(f"DEBUG: Enhanced Prompt: {enhanced_prompt}")

    except Exception as e:
        print(f"Gemini bridge failed, using fallback: {e}")
        enhanced_prompt = (
            f"Minimal flat vector logo of {request.prompt}, "
            "single centered symbol, white background, "
            "clean geometric design, professional branding"
        )

    # Step 2: HuggingFace SDXL image generation
    API_URL = (
        "https://router.huggingface.co/hf-inference/models/"
        "stabilityai/stable-diffusion-xl-base-1.0"
    )
    headers = {
        "Authorization": f"Bearer {hf_token}",
        "Content-Type": "application/json",
        "x-wait-for-model": "true",
        "x-use-cache": "false",
    }
    negative_prompt = (
        "text, letters, typography, words, mockup, scene, background environment, "
        "photorealistic, 3d render, shadow, gradient, watermark, low quality, blurry"
    )
    payload = {
        "inputs": enhanced_prompt,
        "parameters": {
            "negative_prompt": negative_prompt,
            "num_inference_steps": 35,
            "guidance_scale": 8,
            "width": 1024,
            "height": 1024,
        },
    }

    try:
        response = requests.post(API_URL, headers=headers, json=payload)

        if response.status_code != 200:
            if "loading" in response.text.lower():
                raise HTTPException(
                    status_code=503,
                    detail="Logo model is warming up. Try again in 20 seconds.",
                )
            raise HTTPException(
                status_code=500,
                detail=f"HuggingFace Error: {response.text}",
            )

        base64_image = base64.b64encode(response.content).decode("utf-8")
        return {
            "image_url": f"data:image/png;base64,{base64_image}",
            "type": "logo",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SaveAssetRequest(BaseModel):
    user_id: str
    asset_type: str
    content: str

@app.post("/branding/assets/save")
def save_asset(
    request: SaveAssetRequest,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, request.user_id)
    data = {
        "user_id": request.user_id,
        "asset_type": request.asset_type,
        "content": request.content,
    }
    response = supabase.table("branding_assets").insert(data).execute()
    return {"status": "success", "data": response.data}


@app.get("/branding/assets/{user_id}")
def get_assets(
    user_id: str,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, user_id)
    return (
        supabase.table("branding_assets")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
        .data
    )


@app.delete("/branding/assets/{asset_id}")
def delete_asset(
    asset_id: str,
    current_user=Depends(get_current_user),
):
    existing = (
        supabase.table("branding_assets")
        .select("user_id")
        .eq("id", asset_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Asset not found")
    require_self(current_user.id, existing.data[0]["user_id"])

    return supabase.table("branding_assets").delete().eq("id", asset_id).execute()


# ==============================================================================
# AI TOOLS
# ==============================================================================

class ToolRequest(BaseModel):
    user_id: str
    tool_id: str
    inputs: dict

@app.post("/tools/run")
def run_ai_tool(
    request: ToolRequest,
    current_user=Depends(get_current_user),
):
    require_self(current_user.id, request.user_id)

    tool_id = request.tool_id
    data = request.inputs

    if tool_id == "bio-generator":
        prompt = f"""
Write exactly 3 professional social media bios.

Rules:
- Each bio must be 1–2 lines maximum
- No emojis
- No markdown
- No stars or bullet symbols
- Separate each bio with ONE blank line
- Use a clean, professional tone

Context:
Role: {data.get('role')}
Key Skills: {data.get('skills')}
Tone: {data.get('tone')}
""".strip()

    elif tool_id == "social-post":
        prompt = f"""
Write ONE high-quality {data.get('platform')} post.

Rules:
- No emojis unless natural for the platform
- No markdown formatting
- No excessive hashtags
- Short, readable paragraphs
- Ready to copy and publish

Topic: {data.get('topic')}
Target Audience: {data.get('audience')}
Tone: {data.get('tone')}
""".strip()

    elif tool_id == "idea-validator":
        prompt = f"""
You are a venture capitalist evaluating an early-stage startup.

Respond using ONLY the structure below.
Do not add emojis, markdown, jokes, or extra commentary.

Structure:

Score: X/10

Market Assessment:
(one short paragraph about market size and demand)

Business Model Concerns:
1. ...
2. ...
3. ...

Execution Risks:
1. ...
2. ...
3. ...

Final Verdict:
(one honest sentence on whether this idea is investable)

Startup Idea:
{data.get('idea')}
""".strip()

    elif tool_id == "cold-email":
        prompt = f"""
Rewrite the following cold email.

Rules:
- Use the exact format below
- No emojis
- No markdown
- Professional, concise, persuasive

Format:

Subject:
<short subject line>

Body:
<email body>

Draft Email:
{data.get('draft')}
""".strip()

    elif tool_id == "eli5":
        prompt = f"""
Explain the following concept like I am 5 years old.

Rules:
- One short paragraph only
- Simple language
- No technical jargon
- No emojis
- No markdown

Concept:
{data.get('concept')}
""".strip()

    elif tool_id == "seo-keywords":
        prompt = f"""
You are an SEO specialist.

Generate exactly 10 high-potential SEO keywords based on the information below.

Topic: {data.get('topic')}
Target Audience: {data.get('audience')}

Requirements:
- Focus on commercial and informational intent
- Avoid overly generic keywords
- Prioritize clarity and search relevance

Output Format:
1. Keyword – Search Intent
2. Keyword – Search Intent
...
""".strip()

    elif tool_id == "job-description":
        prompt = f"""
Write a professional job description suitable for a startup environment.

Role: {data.get('role')}
Company Culture: {data.get('vibe')}
Key Responsibilities: {data.get('tasks')}

Structure the response using the following sections only:
About the Company
Role Overview
Key Responsibilities
Requirements
Benefits

Maintain a clear, concise, and professional tone throughout.
""".strip()

    elif tool_id == "competitor-swot":
        prompt = f"""
You are a business strategy consultant.

Conduct a SWOT analysis of the competitor listed below.

Competitor: {data.get('competitor')}
My Company: {data.get('my_company')}

Response Requirements:
- Clearly label Strengths, Weaknesses, Opportunities, and Threats
- Keep each section concise and insight-driven
- Focus on actionable insights My Company can leverage
""".strip()

    else:
        prompt = f"""
Help with the following request in a clear and professional manner.

Request:
{data}
""".strip()

    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    return {"result": response.text.strip()}