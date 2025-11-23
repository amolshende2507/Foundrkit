from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # <--- NEW IMPORT
from pydantic import BaseModel
from supabase import create_client, Client # <--- NEW IMPORT
import os
from dotenv import load_dotenv
import google.generativeai as genai

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