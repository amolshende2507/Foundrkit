from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
import os
import requests
import base64
import json
import re
from dotenv import load_dotenv
from typing import Optional
from uuid import UUID

load_dotenv()

# Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://foundrkit.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# GEMINI via REST  (no SDK — bypasses geo-block)
# ──────────────────────────────────────────────
def call_gemini(prompt: str, json_mode: bool = False) -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set")

    endpoint = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    )

    payload: dict = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    if json_mode:
        payload["generationConfig"] = {"response_mime_type": "application/json"}

    resp = requests.post(endpoint, json=payload, timeout=60)

    if resp.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini error {resp.status_code}: {resp.text[:300]}"
        )

    data = resp.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise HTTPException(status_code=500, detail=f"Unexpected Gemini response: {data}")


# ──────────────────────────────────────────────
# HEALTH CHECK
# ──────────────────────────────────────────────
@app.get("/ping")
def ping():
    return {"status": "alive"}


# ──────────────────────────────────────────────
# MODELS
# ──────────────────────────────────────────────
class ProposalRequest(BaseModel):
    user_id: str
    client_name: str
    project_details: str

class ChatRequest(BaseModel):
    user_id: str
    message: str

class ProposalSaveRequest(BaseModel):
    user_id: str
    client_name: str
    project_details: str
    content: str
    status: str = "Draft"

class ClientRequest(BaseModel):
    user_id: str
    name: str
    email: str
    industry: str
    notes: str

class EmailRequest(BaseModel):
    user_id: str
    client_name: str
    email_type: str
    context: str

class EmailSaveRequest(BaseModel):
    user_id: str
    client_name: str
    subject: str
    body: str
    email_type: str

class TaskRequest(BaseModel):
    user_id: str
    title: str
    status: str = "todo"
    due_date: Optional[str] = None
    priority: str = "medium"

class AITaskGenRequest(BaseModel):
    user_id: str
    goal: str

class ChatSessionRequest(BaseModel):
    user_id: str
    title: str = "New Chat"

class ChatMessageRequest(BaseModel):
    user_id: str
    session_id: str
    message: str

class BrandingRequest(BaseModel):
    user_id: str
    asset_type: str
    keywords: str
    style: str

class LogoGenerationRequest(BaseModel):
    prompt: str

class SaveAssetRequest(BaseModel):
    user_id: str
    asset_type: str
    content: str

class ToolRequest(BaseModel):
    user_id: str
    tool_id: str
    inputs: dict

class UpdateProposalRequest(BaseModel):
    content: str


# ──────────────────────────────────────────────
# PROPOSALS
# ──────────────────────────────────────────────
@app.post("/generate-proposal")
def generate_proposal(request: ProposalRequest):
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

FORMATTING RULES:
1. No Markdown tables (no pipes |).
2. For Pricing Estimate use a Bulleted List:
   - Item: $X
   - Total: $Y
3. Use ## for Section Headings.
4. No bolding (**) inside paragraphs.

Structure:
# Proposal for {request.client_name}
## Executive Summary
## Our Approach
## Timeline & Deliverables
## Pricing Estimate
"""
    return {"proposal_text": call_gemini(prompt)}


@app.post("/proposals/save")
def save_proposal(request: ProposalSaveRequest):
    data = {
        "user_id": request.user_id,
        "client_name": request.client_name,
        "project_details": request.project_details,
        "content": request.content,
        "status": request.status
    }
    response = supabase.table("proposals").insert(data).execute()
    return {"status": "success", "data": response.data}

@app.get("/proposals/{user_id}")
def get_proposals(user_id: str):
    return supabase.table("proposals").select("*").eq("user_id", user_id).order("created_at", desc=True).execute().data

@app.get("/proposals/detail/{proposal_id}")
def get_proposal_detail(proposal_id: str):
    try:
        UUID(proposal_id, version=4)
    except ValueError:
        return {}
    response = supabase.table("proposals").select("*").eq("id", proposal_id).execute()
    return response.data[0] if response.data else {}

@app.put("/proposals/{proposal_id}")
def update_proposal(proposal_id: str, request: UpdateProposalRequest):
    response = supabase.table("proposals").update({"content": request.content}).eq("id", proposal_id).execute()
    return {"status": "updated", "data": response.data}

@app.delete("/proposals/{proposal_id}")
def delete_proposal(proposal_id: str):
    response = supabase.table("proposals").delete().eq("id", proposal_id).execute()
    return {"status": "deleted", "data": response.data}


# ──────────────────────────────────────────────
# CLIENTS
# ──────────────────────────────────────────────
@app.post("/clients/add")
def add_client(request: ClientRequest):
    data = {
        "user_id": request.user_id,
        "name": request.name,
        "email": request.email,
        "industry": request.industry,
        "notes": request.notes
    }
    response = supabase.table("clients").insert(data).execute()
    return {"status": "success", "data": response.data}

@app.get("/clients/{user_id}")
def get_clients(user_id: str):
    return supabase.table("clients").select("*").eq("user_id", user_id).order("created_at", desc=True).execute().data

@app.delete("/clients/{client_id}")
def delete_client(client_id: str):
    response = supabase.table("clients").delete().eq("id", client_id).execute()
    return {"status": "deleted", "data": response.data}


# ──────────────────────────────────────────────
# EMAILS
# ──────────────────────────────────────────────
@app.post("/generate-email")
def generate_email(request: EmailRequest):
    response = supabase.table("brand_settings").select("*").eq("user_id", request.user_id).execute()

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
Write a {request.email_type} email to "{request.client_name}".
Context/Goal: {request.context}
Tone: {tone}

Return JSON with 'subject' and 'body'. No Markdown. Plain text only.
{{
  "subject": "...",
  "body": "Hi [Name],\n\n..."
}}
"""
    return call_gemini(prompt, json_mode=True)


@app.post("/emails/save")
def save_email(request: EmailSaveRequest):
    data = {
        "user_id": request.user_id,
        "client_name": request.client_name,
        "subject": request.subject,
        "body": request.body,
        "email_type": request.email_type,
        "status": "Draft"
    }
    response = supabase.table("emails").insert(data).execute()
    return {"status": "success", "data": response.data}

@app.get("/emails/{user_id}")
def get_emails(user_id: str):
    return supabase.table("emails").select("*").eq("user_id", user_id).order("created_at", desc=True).execute().data

@app.delete("/emails/{email_id}")
def delete_email(email_id: str):
    response = supabase.table("emails").delete().eq("id", email_id).execute()
    return {"status": "deleted"}


# ──────────────────────────────────────────────
# TASKS
# ──────────────────────────────────────────────
@app.get("/tasks/{user_id}")
def get_tasks(user_id: str):
    return supabase.table("tasks").select("*").eq("user_id", user_id).order("created_at", desc=True).execute().data

@app.post("/tasks/add")
def add_task(request: TaskRequest):
    return supabase.table("tasks").insert(request.dict()).execute()

@app.put("/tasks/{task_id}")
def update_task_status(task_id: str, status: str):
    return supabase.table("tasks").update({"status": status}).eq("id", task_id).execute()

@app.delete("/tasks/{task_id}")
def delete_task(task_id: str):
    return supabase.table("tasks").delete().eq("id", task_id).execute()

@app.post("/tasks/generate")
def generate_tasks_ai(request: AITaskGenRequest):
    prompt = f"""
You are an expert project manager. The user wants to: "{request.goal}".
Break this into 3-5 specific actionable tasks.
Return ONLY a JSON list of strings. Example: ["Task 1", "Task 2", "Task 3"]
"""
    text = call_gemini(prompt)
    try:
        json_str = re.search(r'\[.*\]', text, re.DOTALL).group(0)
        return {"tasks": json.loads(json_str)}
    except Exception:
        return {"tasks": ["Define project scope", "Research competitors", "Set timeline"]}


# ──────────────────────────────────────────────
# CHAT
# ──────────────────────────────────────────────
@app.post("/chat")
def chat_with_cofounder(request: ChatRequest):
    response = supabase.table("brand_settings").select("*").eq("user_id", request.user_id).execute()
    if response.data:
        b = response.data[0]
        context = f"You are the Virtual Co-Founder of '{b.get('company_name')}'. Company: '{b.get('company_description')}'. Tone: {b.get('tone_of_voice')}."
    else:
        context = "You are a helpful business consultant."

    prompt = f"{context}\n\nUser asks: \"{request.message}\"\nGive a short, strategic, actionable answer."
    return {"reply": call_gemini(prompt)}


@app.post("/chat/sessions")
def create_session(request: ChatSessionRequest):
    response = supabase.table("chat_sessions").insert({"user_id": request.user_id, "title": request.title}).execute()
    return response.data[0]

@app.get("/chat/sessions/{user_id}")
def get_sessions(user_id: str):
    return supabase.table("chat_sessions").select("*").eq("user_id", user_id).order("created_at", desc=True).execute().data

@app.get("/chat/messages/{session_id}")
def get_messages(session_id: str):
    return supabase.table("chat_messages").select("*").eq("session_id", session_id).order("created_at", desc=False).execute().data

@app.put("/chat/sessions/{session_id}")
def rename_session(session_id: str, title: str):
    return supabase.table("chat_sessions").update({"title": title}).eq("id", session_id).execute()

@app.delete("/chat/sessions/{session_id}")
def delete_session(session_id: str):
    return supabase.table("chat_sessions").delete().eq("id", session_id).execute()

@app.post("/chat/send")
def send_message(request: ChatMessageRequest):
    supabase.table("chat_messages").insert({
        "session_id": request.session_id, "role": "user", "content": request.message
    }).execute()

    brand_res = supabase.table("brand_settings").select("*").eq("user_id", request.user_id).execute()
    if brand_res.data:
        b = brand_res.data[0]
        brand_context = f"You are Co-Founder of '{b.get('company_name')}'. Description: '{b.get('company_description')}'. Tone: {b.get('tone_of_voice')}."
    else:
        brand_context = "You are a helpful business co-founder."

    tasks_res = supabase.table("tasks").select("title, status").eq("user_id", request.user_id).neq("status", "done").limit(10).execute()
    task_context = "OPEN TASKS:\n" + "\n".join([f"- {t['title']} ({t['status']})" for t in tasks_res.data]) if tasks_res.data else "NO OPEN TASKS."

    prop_res = supabase.table("proposals").select("client_name, status").eq("user_id", request.user_id).order("created_at", desc=True).limit(5).execute()
    prop_context = "RECENT PROPOSALS:\n" + "\n".join([f"- {p['client_name']} ({p['status']})" for p in prop_res.data]) if prop_res.data else "NO PROPOSALS."

    client_res = supabase.table("clients").select("name, industry").eq("user_id", request.user_id).limit(5).execute()
    client_context = "KEY CLIENTS:\n" + "\n".join([f"- {c['name']} ({c['industry']})" for c in client_res.data]) if client_res.data else "NO CLIENTS."

    history_res = supabase.table("chat_messages").select("*").eq("session_id", request.session_id).order("created_at", desc=True).limit(10).execute()
    history_text = "".join(f"{m['role'].upper()}: {m['content']}\n" for m in reversed(history_res.data))

    prompt = f"""
{brand_context}

{task_context}
{prop_context}
{client_context}

CHAT HISTORY:
{history_text}

Reply short, strategic, proactive.
"""
    ai_text = call_gemini(prompt)
    supabase.table("chat_messages").insert({"session_id": request.session_id, "role": "ai", "content": ai_text}).execute()
    return {"reply": ai_text}


# ──────────────────────────────────────────────
# DASHBOARD
# ──────────────────────────────────────────────
@app.get("/dashboard/stats/{user_id}")
def get_dashboard_stats(user_id: str):
    prop_res = supabase.table("proposals").select("id", count="exact").eq("user_id", user_id).execute()
    client_res = supabase.table("clients").select("id", count="exact").eq("user_id", user_id).execute()
    task_total_res = supabase.table("tasks").select("id", count="exact").eq("user_id", user_id).execute()
    task_done_res = supabase.table("tasks").select("id", count="exact").eq("user_id", user_id).eq("status", "done").execute()

    total = task_total_res.count or 1
    done = task_done_res.count
    recent_props = supabase.table("proposals").select("client_name, created_at").eq("user_id", user_id).order("created_at", desc=True).limit(3).execute()
    recent_tasks = supabase.table("tasks").select("title, created_at").eq("user_id", user_id).eq("status", "done").order("created_at", desc=True).limit(3).execute()

    return {
        "proposal_count": prop_res.count,
        "client_count": client_res.count,
        "productivity_score": int((done / total) * 100),
        "active_tasks": task_total_res.count - done,
        "recent_proposals": recent_props.data,
        "recent_tasks": recent_tasks.data
    }


# ──────────────────────────────────────────────
# BRANDING
# ──────────────────────────────────────────────
@app.post("/branding/generate")
def generate_branding(request: BrandingRequest):
    if request.asset_type == "logo":
        prompt = f'Write a Stable Diffusion prompt for a professional logo for: "{request.keywords}". Style: {request.style}. Include: vector style, white background, minimalist, professional branding. Under 25 words. Return ONLY the prompt string.'
    elif request.asset_type == "name":
        prompt = f'Generate 5 business names for: "{request.keywords}". Style: {request.style}. Return ONLY a JSON list: [{{"name": "...", "meaning": "..."}}]'
    elif request.asset_type == "slogan":
        prompt = f'Generate 5 slogans for: "{request.keywords}". Style: {request.style}. Return ONLY a JSON list of strings.'
    else:
        prompt = f'Write a professional About Us / Mission Statement for: "{request.keywords}". Style: {request.style}. Under 50 words.'

    text = call_gemini(prompt)
    return {"result": text.replace("```json","").replace("```","").strip(), "type": request.asset_type}


@app.post("/branding/generate-image")
def generate_image_logo(request: LogoGenerationRequest):
    hf_token = os.environ.get("HF_API_KEY")
    if not hf_token:
        raise HTTPException(status_code=500, detail="HF_API_KEY missing")

    try:
        enhanced_prompt = call_gemini(
            f'Write a Stable Diffusion XL prompt for a minimalist startup logo for: "{request.prompt}". '
            'Flat vector, white background, no text, geometric, professional. Return ONLY the prompt string.'
        )
    except Exception:
        enhanced_prompt = f"Minimal flat vector logo of {request.prompt}, white background, geometric, professional branding"

    hf_resp = requests.post(
        "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
        headers={"Authorization": f"Bearer {hf_token}", "Content-Type": "application/json", "x-wait-for-model": "true", "x-use-cache": "false"},
        json={
            "inputs": enhanced_prompt,
            "parameters": {"negative_prompt": "text, letters, mockup, photorealistic, 3d render, shadow, watermark, blurry", "num_inference_steps": 35, "guidance_scale": 8, "width": 1024, "height": 1024}
        },
        timeout=120
    )

    if hf_resp.status_code != 200:
        detail = "Logo model warming up. Try again in 20s." if "loading" in hf_resp.text.lower() else f"HuggingFace Error: {hf_resp.text}"
        raise HTTPException(status_code=503 if "loading" in hf_resp.text.lower() else 500, detail=detail)

    return {"image_url": f"data:image/png;base64,{base64.b64encode(hf_resp.content).decode()}", "type": "logo"}


@app.post("/branding/assets/save")
def save_asset(request: SaveAssetRequest):
    response = supabase.table("branding_assets").insert({"user_id": request.user_id, "asset_type": request.asset_type, "content": request.content}).execute()
    return {"status": "success", "data": response.data}

@app.get("/branding/assets/{user_id}")
def get_assets(user_id: str):
    return supabase.table("branding_assets").select("*").eq("user_id", user_id).order("created_at", desc=True).execute().data

@app.delete("/branding/assets/{asset_id}")
def delete_asset(asset_id: str):
    return supabase.table("branding_assets").delete().eq("id", asset_id).execute()


# ──────────────────────────────────────────────
# AI TOOLS
# ──────────────────────────────────────────────
@app.post("/tools/run")
def run_ai_tool(request: ToolRequest):
    tool_id = request.tool_id
    d = request.inputs

    prompts = {
        "bio-generator": f"Write 3 professional social media bios (1-2 lines each, no emojis, separated by blank lines).\nRole: {d.get('role')}\nSkills: {d.get('skills')}\nTone: {d.get('tone')}",
        "social-post": f"Write ONE {d.get('platform')} post. No excessive emojis/hashtags. Ready to publish.\nTopic: {d.get('topic')}\nAudience: {d.get('audience')}\nTone: {d.get('tone')}",
        "idea-validator": f"Evaluate this startup idea as a VC. Structure: Score X/10, Market Assessment, Business Model Concerns (3 points), Execution Risks (3 points), Final Verdict.\nIdea: {d.get('idea')}",
        "cold-email": f"Rewrite this cold email.\nFormat: Subject: ...\nBody: ...\n\nDraft: {d.get('draft')}",
        "eli5": f"Explain like I'm 5: {d.get('concept')}. One short paragraph, simple language, no jargon.",
        "seo-keywords": f"Generate 10 SEO keywords.\nTopic: {d.get('topic')}\nAudience: {d.get('audience')}\nFormat: 1. Keyword – Intent",
        "job-description": f"Write a startup job description.\nRole: {d.get('role')}\nCulture: {d.get('vibe')}\nTasks: {d.get('tasks')}\nSections: About, Role Overview, Responsibilities, Requirements, Benefits.",
        "competitor-swot": f"SWOT analysis.\nCompetitor: {d.get('competitor')}\nMy Company: {d.get('my_company')}\nFocus on actionable insights.",
    }

    prompt = prompts.get(tool_id, f"Help with: {d}")
    return {"result": call_gemini(prompt)}