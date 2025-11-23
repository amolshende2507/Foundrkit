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