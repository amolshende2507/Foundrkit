from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # <--- NEW IMPORT
from pydantic import BaseModel
from supabase import create_client, Client # <--- NEW IMPORT
import os
from dotenv import load_dotenv
import google.generativeai as genai
from typing import Optional
from uuid import UUID
load_dotenv()

# Configure Supabase & AI
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

# --- FIX CORS HERE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Allow Next.js
    allow_credentials=True,
    allow_methods=["*"], # Allow all (GET, POST, etc.)
    allow_headers=["*"],
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
    # We explicitly tell it NOT to use tables for the pricing section.
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
    model = genai.GenerativeModel("gemini-2.5-flash")
    ai_response = model.generate_content(prompt)

    return {"proposal_text": ai_response.text}


    # 1. Define the Chat Request
class ChatRequest(BaseModel):
    user_id: str
    message: str
@app.post("/chat")
def chat_with_cofounder(request: ChatRequest):
    print(f"DEBUG: Chat request from User ID: {request.user_id}") # <--- Debug 1

    # Step A: Fetch Context
    # We use the Admin Key now, so this WILL find the data.
    response = supabase.table("brand_settings").select("*").eq("user_id", request.user_id).execute()
    
    print(f"DEBUG: Database Data found: {response.data}") # <--- Debug 2

    if response.data:
        brand = response.data[0]
        company = brand.get('company_name')
        desc = brand.get('company_description')
        tone = brand.get('tone_of_voice')
        
        print(f"DEBUG: Using Context -> {company} | {desc}") # <--- Debug 3
        
        context = f"You are the Virtual Co-Founder of '{company}'. Your company does: '{desc}'. Tone: {tone}."
    else:
        print("DEBUG: No data found. Using GENERIC context.") # <--- Debug 4
        context = "You are a helpful business consultant for a freelancer."

    # Step B: Construct the Prompt
    prompt = f"""
    {context}
    
    The user (your co-founder) asks: "{request.message}"
    
    Give a short, strategic, and actionable answer. 
    Do not be generic. Use the company context to give specific advice.
    """

    # Step C: Generate Answer
    model = genai.GenerativeModel("gemini-2.5-flash")
    ai_response = model.generate_content(prompt)

    return {"reply": ai_response.text}

# 1. Data Model for Saving
class ProposalSaveRequest(BaseModel):
    user_id: str
    client_name: str
    project_details: str
    content: str
    status: str = "Draft"

# 2. API: Save a Proposal
@app.post("/proposals/save")
def save_proposal(request: ProposalSaveRequest):
    data = {
        "user_id": request.user_id,
        "client_name": request.client_name,
        "project_details": request.project_details,
        "content": request.content,
        "status": request.status
    }
    # Insert into Supabase
    response = supabase.table("proposals").insert(data).execute()
    return {"status": "success", "data": response.data}

# 3. API: Get All Proposals for a User
@app.get("/proposals/{user_id}")
def get_proposals(user_id: str):
    response = supabase.table("proposals").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return response.data

# 4. API: Get Single Proposal

@app.get("/proposals/detail/{proposal_id}")
def get_proposal_detail(proposal_id: str):
    # 1. Validate if it is a real UUID before asking Database
    try:
        val = UUID(proposal_id, version=4)
    except ValueError:
        # If it's "undefined" or "abc", return empty instead of crashing
        return {}

    # 2. If valid, query Supabase
    response = supabase.table("proposals").select("*").eq("id", proposal_id).execute()
    return response.data[0] if response.data else {}



# 1. Client Data Model
class ClientRequest(BaseModel):
    user_id: str
    name: str
    email: str
    industry: str
    notes: str

# 2. API: Add a Client
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

# 3. API: List Clients
@app.get("/clients/{user_id}")
def get_clients(user_id: str):
    response = supabase.table("clients").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return response.data


# --- DELETE & EDIT API ENDPOINTS ---

# 1. Delete a Client
@app.delete("/clients/{client_id}")
def delete_client(client_id: str):
    response = supabase.table("clients").delete().eq("id", client_id).execute()
    return {"status": "deleted", "data": response.data}

# 2. Delete a Proposal
@app.delete("/proposals/{proposal_id}")
def delete_proposal(proposal_id: str):
    response = supabase.table("proposals").delete().eq("id", proposal_id).execute()
    return {"status": "deleted", "data": response.data}

# 3. Update (Edit) a Proposal Text
class UpdateProposalRequest(BaseModel):
    content: str

@app.put("/proposals/{proposal_id}")
def update_proposal(proposal_id: str, request: UpdateProposalRequest):
    response = supabase.table("proposals").update({"content": request.content}).eq("id", proposal_id).execute()
    return {"status": "updated", "data": response.data}

# 1. Email Request Model
class EmailRequest(BaseModel):
    user_id: str
    client_name: str
    email_type: str  # e.g. "Cold Outreach", "Follow Up", "Payment Reminder"
    context: str     # Extra details like "They haven't replied in 3 days"

# 2. API: Generate Email
@app.post("/generate-email")
def generate_email(request: EmailRequest):
    # A. Fetch Brand DNA
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

    # B. The "Email Architect" Prompt
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

    # C. Generate
    model = genai.GenerativeModel("gemini-2.5-flash")
    ai_response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})

    # D. Return Parsed JSON
    # Gemini 1.5 Flash is good at returning strict JSON if asked.
    return ai_response.text


# --- EMAIL CRUD ENDPOINTS ---

# 1. Save Email
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

# 2. Get Emails List
@app.get("/emails/{user_id}")
def get_emails(user_id: str):
    response = supabase.table("emails").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return response.data

# 3. Delete Email
@app.delete("/emails/{email_id}")
def delete_email(email_id: str):
    response = supabase.table("emails").delete().eq("id", email_id).execute()
    return {"status": "deleted"}

# --- TASK MANAGER ENDPOINTS ---

# 1. Models
class TaskRequest(BaseModel):
    user_id: str
    title: str
    status: str = "todo"
    due_date: Optional[str] = None
    priority: str = "medium"

class AITaskGenRequest(BaseModel):
    user_id: str
    goal: str # e.g. "Launch a new website"

# 2. CRUD Operations
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

# 3. AI TASK GENERATOR (The "Co-Founder" Feature)
@app.post("/tasks/generate")
def generate_tasks_ai(request: AITaskGenRequest):
    # Ask Gemini to break down a goal into tasks
    prompt = f"""
    You are an expert project manager. The user wants to: "{request.goal}".
    Break this down into 3-5 specific, actionable tasks.
    Return ONLY a JSON list of strings. Example: ["Buy Domain", "Design Logo", "Write Content"]
    """
    model = genai.GenerativeModel("gemini-2.5-flash")
    result = model.generate_content(prompt)
    
    # Simple cleaning to get list from text
    import json
    import re
    try:
        # Extract JSON part if Gemini adds markdown text
        json_str = re.search(r'\[.*\]', result.text, re.DOTALL).group(0)
        tasks = json.loads(json_str)
        return {"tasks": tasks}
    except:
        return {"tasks": ["Define project scope", "Research competitors", "Set timeline"]} # Fallback
    


# --- ADVANCED CHAT ENDPOINTS ---

class ChatSessionRequest(BaseModel):
    user_id: str
    title: str = "New Chat"

class ChatMessageRequest(BaseModel):
    user_id: str
    session_id: str
    message: str

# 1. Create a New Session
@app.post("/chat/sessions")
def create_session(request: ChatSessionRequest):
    data = {"user_id": request.user_id, "title": request.title}
    response = supabase.table("chat_sessions").insert(data).execute()
    return response.data[0]

# 2. Get All Sessions (Sidebar List)
@app.get("/chat/sessions/{user_id}")
def get_sessions(user_id: str):
    return supabase.table("chat_sessions").select("*").eq("user_id", user_id).order("created_at", desc=True).execute().data

# 3. Get Messages for a Session (Load History)
@app.get("/chat/messages/{session_id}")
def get_messages(session_id: str):
    return supabase.table("chat_messages").select("*").eq("session_id", session_id).order("created_at", desc=False).execute().data

# 4. Rename Session (Editable Title)
@app.put("/chat/sessions/{session_id}")
def rename_session(session_id: str, title: str):
    return supabase.table("chat_sessions").update({"title": title}).eq("id", session_id).execute()

# 5. Delete Session
@app.delete("/chat/sessions/{session_id}")
def delete_session(session_id: str):
    return supabase.table("chat_sessions").delete().eq("id", session_id).execute()

# 6. THE SMART CHAT ENGINE (Sends Message + History)
@app.post("/chat/send")
def send_message(request: ChatMessageRequest):
    # A. Save User Message
    supabase.table("chat_messages").insert({
        "session_id": request.session_id,
        "role": "user",
        "content": request.message
    }).execute()

    # --- B. GATHER BUSINESS INTELLIGENCE (The New Part) ---
    
    # 1. Fetch Brand Settings
    brand_res = supabase.table("brand_settings").select("*").eq("user_id", request.user_id).execute()
    if brand_res.data:
        b = brand_res.data[0]
        brand_context = f"You are the Co-Founder of '{b.get('company_name')}'. Description: '{b.get('company_description')}'. Tone: {b.get('tone_of_voice')}."
    else:
        brand_context = "You are a helpful business co-founder."

    # 2. Fetch Open Tasks (Todo / In Progress)
    tasks_res = supabase.table("tasks").select("title, status, due_date").eq("user_id", request.user_id).neq("status", "done").limit(10).execute()
    task_list = "\n".join([f"- {t['title']} ({t['status']})" for t in tasks_res.data])
    task_context = f"CURRENT OPEN TASKS:\n{task_list}" if tasks_res.data else "NO OPEN TASKS."

    # 3. Fetch Recent Proposals
    prop_res = supabase.table("proposals").select("client_name, status, created_at").eq("user_id", request.user_id).order("created_at", desc=True).limit(5).execute()
    prop_list = "\n".join([f"- To {p['client_name']} (Status: {p['status']})" for p in prop_res.data])
    prop_context = f"RECENT PROPOSALS:\n{prop_list}" if prop_res.data else "NO RECENT PROPOSALS."

    # 4. Fetch Recent Clients
    client_res = supabase.table("clients").select("name, industry, notes").eq("user_id", request.user_id).order("created_at", desc=True).limit(5).execute()
    client_list = "\n".join([f"- {c['name']} ({c['industry']}): {c['notes']}" for c in client_res.data])
    client_context = f"KEY CLIENTS:\n{client_list}" if client_res.data else "NO CLIENTS YET."

    # --- C. BUILD THE SUPER PROMPT ---

    # Fetch Chat History
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

    # D. Generate AI Response
    model = genai.GenerativeModel("gemini-2.5-flash")
    ai_response = model.generate_content(prompt)
    ai_text = ai_response.text

    # E. Save Response
    supabase.table("chat_messages").insert({
        "session_id": request.session_id,
        "role": "ai",
        "content": ai_text
    }).execute()

    return {"reply": ai_text}


# --- ANALYTICS ENDPOINTS ---

@app.get("/dashboard/stats/{user_id}")
def get_dashboard_stats(user_id: str):
    # 1. Count Proposals
    prop_res = supabase.table("proposals").select("id", count="exact").eq("user_id", user_id).execute()
    proposal_count = prop_res.count

    # 2. Count Clients
    client_res = supabase.table("clients").select("id", count="exact").eq("user_id", user_id).execute()
    client_count = client_res.count

    # 3. Task Metrics (Completed vs Total)
    task_total_res = supabase.table("tasks").select("id", count="exact").eq("user_id", user_id).execute()
    task_done_res = supabase.table("tasks").select("id", count="exact").eq("user_id", user_id).eq("status", "done").execute()
    
    total_tasks = task_total_res.count or 1 # Avoid division by zero
    completed_tasks = task_done_res.count
    productivity_score = int((completed_tasks / total_tasks) * 100)

    # 4. Recent Activity Log (Combine Proposals + Tasks)
    # Fetch last 3 proposals
    recent_props = supabase.table("proposals").select("client_name, created_at").eq("user_id", user_id).order("created_at", desc=True).limit(3).execute()
    # Fetch last 3 completed tasks
    recent_tasks = supabase.table("tasks").select("title, created_at").eq("user_id", user_id).eq("status", "done").order("created_at", desc=True).limit(3).execute()

    return {
        "proposal_count": proposal_count,
        "client_count": client_count,
        "productivity_score": productivity_score,
        "active_tasks": task_total_res.count - completed_tasks,
        "recent_proposals": recent_props.data,
        "recent_tasks": recent_tasks.data
    }