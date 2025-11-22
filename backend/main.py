from fastapi import FastAPI
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import google.generativeai as genai

# 1. Load Keys
load_dotenv()

# 2. Configure AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

# 3. Define Data Model (What the frontend sends us)
class PromptRequest(BaseModel):
    topic: str

# 4. Create a Test Endpoint
@app.get("/")
def read_root():
    return {"status": "FoundrKit Brain is Online 🧠"}

@app.post("/test-ai")
def test_ai(request: PromptRequest):
    # Ask Gemini a simple question
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(f"Write a one-sentence motivational quote about: {request.topic}")
    return {"message": response.text}