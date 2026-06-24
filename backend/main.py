from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
import os
import requests  # <--- NEW IMPORT for Image API
import base64    # <--- NEW IMPORT for Image Encoding
from dotenv import load_dotenv

from typing import Optional
from uuid import UUID


load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def ask_gemini(prompt, json_mode=False):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

    headers = {
        "Content-Type": "application/json"
    }

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    # Optional JSON mode
    if json_mode:
        payload["generationConfig"] = {
            "responseMimeType": "application/json"
        }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code != 200:
        print("GEMINI ERROR:", response.text)
        raise HTTPException(
            status_code=500,
            detail=f"Gemini API Error: {response.text}"
        )

    data = response.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        print(data)
        raise HTTPException(
            status_code=500,
            detail="Invalid Gemini response"
        )
# Configure Supabase & AI
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)


app = FastAPI()

# --- CORS Configuration ---
# Get allowed origins from environment or use defaults
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000,https://foundrkit.vercel.app").split(",")
allowed_origins = [origin.strip() for origin in allowed_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# 1. Define what data the frontend sends us
class ProposalRequest(BaseModel):
    user_id: str
    client_name: str
    project_details: str

@app.post("/generate-proposal")
def generate_proposal(request: ProposalRequest):
    # Step A: Fetch User's Brand DNA from Supabase
    response = supabase.table("brand_settings").select("*").eq("user_id", request.user_id).execute()
    
    # Check if they have settings, otherwise use defaults
    if response.data:
        brand = response.data[0]
        company_name = brand.get("company_name", "My Company")
        description = brand.get("company_description", "We provide professional services.")
        tone = brand.get("tone_of_voice", "Professional")
    else:
        # Fallback if they skipped onboarding
        company_name = "Freelancer"
        description = "General services"
        tone = "Professional"

    # Step B: Construct the "God Prompt"
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
    4. Do not use bolding (**) symbols inside the paragraphs, it looks messy.
    
    Structure:
    # Proposal for {request.client_name}
    ## Executive Summary
    ## Our Approach
    ## Timeline & Deliverables
    ## Pricing Estimate
    """

    # Step C: Ask Gemini

    
    ai_text = ask_gemini(prompt)

    return {"proposal_text": ai_text}


class ChatRequest(BaseModel):
    user_id: str
    message: str

@app.post("/chat")
def chat_with_cofounder(request: ChatRequest):
    # Step A: Fetch Context
    response = supabase.table("brand_settings").select("*").eq("user_id", request.user_id).execute()
    
    if response.data:
        brand = response.data[0]
        company = brand.get('company_name')
        desc = brand.get('company_description')
        tone = brand.get('tone_of_voice')
        context = f"You are the Virtual Co-Founder of '{company}'. Your company does: '{desc}'. Tone: {tone}."
    else:
        context = "You are a helpful business consultant for a freelancer."

    # Step B: Construct the Prompt
    prompt = f"""
    {context}
    
    The user (your co-founder) asks: "{request.message}"
    
    Give a short, strategic, and actionable answer. 
    Do not be generic. Use the company context to give specific advice.
    """

    # Step C: Generate Answer
    ai_text = ask_gemini(prompt)

    return {"reply": ai_text}

class ProposalSaveRequest(BaseModel):
    user_id: str
    client_name: str
    project_details: str
    content: str
    status: str = "Draft"

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
    response = supabase.table("proposals").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return response.data

@app.get("/proposals/detail/{proposal_id}")
def get_proposal_detail(proposal_id: str):
    try:
        val = UUID(proposal_id, version=4)
    except ValueError:
        return {}
    response = supabase.table("proposals").select("*").eq("id", proposal_id).execute()
    return response.data[0] if response.data else {}


class ClientRequest(BaseModel):
    user_id: str
    name: str
    email: str
    industry: str
    notes: str

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
    response = supabase.table("clients").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return response.data

@app.delete("/clients/{client_id}")
def delete_client(client_id: str):
    response = supabase.table("clients").delete().eq("id", client_id).execute()
    return {"status": "deleted", "data": response.data}

@app.delete("/proposals/{proposal_id}")
def delete_proposal(proposal_id: str):
    response = supabase.table("proposals").delete().eq("id", proposal_id).execute()
    return {"status": "deleted", "data": response.data}

class UpdateProposalRequest(BaseModel):
    content: str

@app.put("/proposals/{proposal_id}")
def update_proposal(proposal_id: str, request: UpdateProposalRequest):
    response = supabase.table("proposals").update({"content": request.content}).eq("id", proposal_id).execute()
    return {"status": "updated", "data": response.data}

class EmailRequest(BaseModel):
    user_id: str
    client_name: str
    email_type: str
    context: str

@app.post("/generate-email")
def generate_email(request: EmailRequest):
    response = supabase.table("brand_settings").select("*").eq("user_id", request.user_id).execute()
    
    if response.data:
        brand = response.data[0]
        sender_company = brand.get("company_name")
        tone = brand.get("tone_of_voice")
        description = brand.get("company_description")
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
    2. Do NOT use Markdown (no **bold** or ## headers). Keep it plain text ready for Gmail.
    3. Keep it concise and human-sounding.
    
    Output format:
    {{
      "subject": "The subject line here",
      "body": "Hi [Name],\n\nThe email body here..."
    }}
    """
    ai_text = ask_gemini(prompt, json_mode=True)

    return ai_text

class EmailSaveRequest(BaseModel):
    user_id: str
    client_name: str
    subject: str
    body: str
    email_type: str

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
    response = supabase.table("emails").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return response.data

@app.delete("/emails/{email_id}")
def delete_email(email_id: str):
    response = supabase.table("emails").delete().eq("id", email_id).execute()
    return {"status": "deleted"}

class TaskRequest(BaseModel):
    user_id: str
    title: str
    status: str = "todo"
    due_date: Optional[str] = None
    priority: str = "medium"

class AITaskGenRequest(BaseModel):
    user_id: str
    goal: str

@app.get("/tasks/{user_id}")
def get_tasks(user_id: str):
    return supabase.table("tasks").select("*").eq("user_id", user_id).order("created_at", desc=True).execute().data

@app.post("/tasks/add")
def add_task(request: TaskRequest):
    data = request.dict()
    return supabase.table("tasks").insert(data).execute()

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
    Break this down into 3-5 specific, actionable tasks.
    Return ONLY a JSON list of strings. Example: ["Buy Domain", "Design Logo", "Write Content"]
    """
    result = ask_gemini(prompt)
    
    import json
    import re
    try:
        json_str = re.search(r'\[.*\]', result, re.DOTALL).group(0)
        tasks = json.loads(json_str)
        return {"tasks": tasks}
    except:
        return {"tasks": ["Define project scope", "Research competitors", "Set timeline"]}

class ChatSessionRequest(BaseModel):
    user_id: str
    title: str = "New Chat"

class ChatMessageRequest(BaseModel):
    user_id: str
    session_id: str
    message: str

@app.post("/chat/sessions")
def create_session(request: ChatSessionRequest):
    data = {"user_id": request.user_id, "title": request.title}
    response = supabase.table("chat_sessions").insert(data).execute()
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
        "session_id": request.session_id,
        "role": "user",
        "content": request.message
    }).execute()

    brand_res = supabase.table("brand_settings").select("*").eq("user_id", request.user_id).execute()
    if brand_res.data:
        b = brand_res.data[0]
        brand_context = f"You are the Co-Founder of '{b.get('company_name')}'. Description: '{b.get('company_description')}'. Tone: {b.get('tone_of_voice')}."
    else:
        brand_context = "You are a helpful business co-founder."

    tasks_res = supabase.table("tasks").select("title, status, due_date").eq("user_id", request.user_id).neq("status", "done").limit(10).execute()
    task_list = "\n".join([f"- {t['title']} ({t['status']})" for t in tasks_res.data])
    task_context = f"CURRENT OPEN TASKS:\n{task_list}" if tasks_res.data else "NO OPEN TASKS."

    prop_res = supabase.table("proposals").select("client_name, status, created_at").eq("user_id", request.user_id).order("created_at", desc=True).limit(5).execute()
    prop_list = "\n".join([f"- To {p['client_name']} (Status: {p['status']})" for p in prop_res.data])
    prop_context = f"RECENT PROPOSALS:\n{prop_list}" if prop_res.data else "NO RECENT PROPOSALS."

    client_res = supabase.table("clients").select("name, industry, notes").eq("user_id", request.user_id).order("created_at", desc=True).limit(5).execute()
    client_list = "\n".join([f"- {c['name']} ({c['industry']}): {c['notes']}" for c in client_res.data])
    client_context = f"KEY CLIENTS:\n{client_list}" if client_res.data else "NO CLIENTS YET."

    history_res = supabase.table("chat_messages").select("*").eq("session_id", request.session_id).order("created_at", desc=True).limit(10).execute()
    history_msgs = history_res.data[::-1]
    history_text = ""
    for msg in history_msgs:
        history_text += f"{msg['role'].upper()}: {msg['content']}\n"

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
    If they ask about their workload, check the TASKS section.
    If they ask about money/clients, check PROPOSALS and CLIENTS.
    Be short, strategic, and proactive.
    """

    ai_text = ask_gemini(prompt)
    

    supabase.table("chat_messages").insert({
        "session_id": request.session_id,
        "role": "ai",
        "content": ai_text
    }).execute()

    return {"reply": ai_text}

@app.get("/dashboard/stats/{user_id}")
def get_dashboard_stats(user_id: str):
    prop_res = supabase.table("proposals").select("id", count="exact").eq("user_id", user_id).execute()
    proposal_count = prop_res.count

    client_res = supabase.table("clients").select("id", count="exact").eq("user_id", user_id).execute()
    client_count = client_res.count

    task_total_res = supabase.table("tasks").select("id", count="exact").eq("user_id", user_id).execute()
    task_done_res = supabase.table("tasks").select("id", count="exact").eq("user_id", user_id).eq("status", "done").execute()
    
    total_tasks = task_total_res.count or 1
    completed_tasks = task_done_res.count
    productivity_score = int((completed_tasks / total_tasks) * 100)

    recent_props = supabase.table("proposals").select("client_name, created_at").eq("user_id", user_id).order("created_at", desc=True).limit(3).execute()
    recent_tasks = supabase.table("tasks").select("title, created_at").eq("user_id", user_id).eq("status", "done").order("created_at", desc=True).limit(3).execute()

    return {
        "proposal_count": proposal_count,
        "client_count": client_count,
        "productivity_score": productivity_score,
        "active_tasks": task_total_res.count - completed_tasks,
        "recent_proposals": recent_props.data,
        "recent_tasks": recent_tasks.data
    }


# --- BRANDING SUITE ENDPOINTS ---

class BrandingRequest(BaseModel):
    user_id: str
    asset_type: str
    keywords: str
    style: str

@app.post("/branding/generate")
def generate_branding(request: BrandingRequest):
    if request.asset_type == "logo":
        # Generate Text Prompt for Logo
        prompt = f"""
        You are an expert AI Art Prompter.
        Write a detailed text prompt to generate a High-Quality Logo for: "{request.keywords}".
        Style: {request.style}.
        
        Rules:
        1. Return ONLY the raw prompt string. No JSON, no markdown.
        2. Include keywords like: "vector style", "white background", "minimalist", "high resolution", "professional branding".
        3. Keep it under 25 words.
        """
    elif request.asset_type == "name":
        # UPDATED PROMPT: Ask for name AND meaning
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

    text = ask_gemini(prompt)
    clean_text = text.replace("```json", "").replace("```xml", "").replace("```svg", "").replace("```", "").strip()

    return {"result": clean_text, "type": request.asset_type}


class SaveAssetRequest(BaseModel):
    user_id: str
    asset_type: str
    content: str

@app.post("/branding/assets/save")
def save_asset(request: SaveAssetRequest):
    print("========== SAVE REQUEST ==========")
    print(request)

    data = {
        "user_id": request.user_id,
        "asset_type": request.asset_type,
        "content": request.content
    }

    response = supabase.table("branding_assets").insert(data).execute()

    print("========== RESPONSE ==========")
    print(response)

    return {
        "status": "success",
        "data": response.data
    }

@app.get("/branding/assets/{user_id}")
def get_assets(user_id: str):
    return supabase.table("branding_assets").select("*").eq("user_id", user_id).order("created_at", desc=True).execute().data

@app.delete("/branding/assets/{asset_id}")
def delete_asset(asset_id: str):
    return supabase.table("branding_assets").delete().eq("id", asset_id).execute()



# --- AI TOOLS DRAWER ENDPOINT ---

class ToolRequest(BaseModel):
    user_id: str
    tool_id: str
    inputs: dict

@app.post("/tools/run")
def run_ai_tool(request: ToolRequest):
    tool_id = request.tool_id
    data = request.inputs

    # ------------------------------------------------------------------
    # 1. SELECT PROMPT (STRICT, PROFESSIONAL OUTPUT)
    # ------------------------------------------------------------------

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

Topic:
{data.get('topic')}

Target Audience:
{data.get('audience')}

Tone:
{data.get('tone')}
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

Topic:
{data.get('topic')}

Target Audience:
{data.get('audience')}

Requirements:
- Focus on commercial and informational intent
- Avoid overly generic keywords
- Prioritize clarity and search relevance

Output Format:
1. Keyword – Search Intent
2. Keyword – Search Intent
3. Keyword – Search Intent
...
""".strip()


    elif tool_id == "job-description":
        prompt = f"""
Write a professional job description suitable for a startup environment.

Role:
{data.get('role')}

Company Culture:
{data.get('vibe')}

Key Responsibilities:
{data.get('tasks')}

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

Conduct a SWOT analysis of the competitor listed below, with a strong emphasis on competitive positioning.

Competitor:
{data.get('competitor')}

My Company:
{data.get('my_company')}

Response Requirements:
- Clearly label Strengths, Weaknesses, Opportunities, and Threats
- Keep each section concise and insight-driven
- Focus on actionable insights that My Company can leverage to outperform the competitor
""".strip()


    else:
        prompt = f"""
Help with the following request in a clear and professional manner.

Request:
{data}
""".strip()

    response = ask_gemini(prompt)

    return {
        "result": response.strip()
    }



# --- UPGRADED LOGO GENERATOR WITH GEMINI BRIDGE (PRODUCTION READY) ---

class LogoGenerationRequest(BaseModel):
    prompt: str


@app.post("/branding/generate-image")
def generate_image_logo(request: LogoGenerationRequest):
    print(f"DEBUG: Original User Input: {request.prompt}")

    hf_token = os.environ.get("HF_API_KEY")
    if not hf_token:
        raise HTTPException(status_code=500, detail="HF_API_KEY missing")

    # ======================================================
    # 1️⃣ GEMINI PROMPT ENGINEERING BRIDGE
    # ======================================================
    try:
        # Changed the prompt to be more generalized since we're pivoting models
        bridge_prompt = f"""
Act as an expert Prompt Engineer for a high-end AI Image Generator.

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
        enhanced_prompt = ask_gemini(bridge_prompt).strip()

        print(f"DEBUG: Enhanced Prompt: {enhanced_prompt}")
        print("========== START ==========")
        print("HF_API_KEY Exists:", os.environ.get("HF_API_KEY") is not None)

    except Exception as e:
        print(f"⚠️ Gemini bridge failed, using fallback: {e}")
        enhanced_prompt = (
            f"Minimal flat vector logo of {request.prompt}, "
            "single centered symbol, white background, "
            "clean geometric design, professional branding"
        )

    # ======================================================
    # 2️⃣ HUGGING FACE INFERENCE ROUTER
    # ======================================================
    # ✨ FIX 1: We migrated from SDXL to FLUX.1-schnell (the current flagship HF free tier model)
    API_URL = (
        "https://router.huggingface.co/hf-inference/models/"
        "black-forest-labs/FLUX.1-schnell"
    )

    # ✨ FIX 2: Added "Accept": "image/png" to force HF to return image bytes, not JSON
    headers = {
        "Authorization": f"Bearer {hf_token}",
        "Content-Type": "application/json",
        "Accept": "image/png", 
        "x-wait-for-model": "true",
        "x-use-cache": "false",
    }

    # ✨ FIX 3: FLUX doesn't process negative_prompt kwargs natively on HF, 
    # so we append the constraints directly into the prompt string.
    final_prompt = enhanced_prompt + " (Ensure pure white background, no text, no letters, no watermark, flat vector, no shadows)."

    payload = {
        "inputs": final_prompt,
        "parameters": {
            "width": 1024,
            "height": 1024,
        },
    }

    try:
        response = requests.post(
            API_URL,
            headers=headers,
            json=payload,
            timeout=120
        )

        print("HF STATUS:", response.status_code)

        if response.status_code != 200:
            print("HF ERROR:", response.text)

            raise HTTPException(
                status_code=response.status_code,
                detail=response.text
            )

        content_type = response.headers.get("content-type", "")

        if "image" not in content_type:
            print("INVALID RESPONSE:", response.text)

            raise HTTPException(
                status_code=500,
                detail=f"HF did not return an image. It returned content-type: {content_type}"
            )

        base64_image = base64.b64encode(response.content).decode("utf-8")

        return {
            "image_url": f"data:image/png;base64,{base64_image}",
            "type": "logo"
        }

    except HTTPException as e:
        raise e

    except Exception as e:
        print("IMAGE GENERATION ERROR:", str(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/ping")
def ping():
    return {"status": "alive"}