# 🚀 FoundrKit — The AI Virtual Co-Founder

![Status](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge)  
![Stack](https://img.shields.io/badge/Stack-Next.js_|_FastAPI_|_Supabase-blue?style=for-the-badge)

**Live Demo:**  
👉 https://foundrkit.vercel.app

---

## 📖 Overview

**FoundrKit** is an AI-powered Operating System built for solo founders and entrepreneurs.

It eliminates expensive tool stacks and constant context switching by combining the roles of:

- 🧠 CEO  
- 📢 CMO  
- 🎨 Designer  
- 🧾 Legal Assistant  
- 📊 Operations Manager  

… into one intelligent, context-aware dashboard.

Instead of paying for 5+ subscriptions (Proposal software, Logo maker, CRM, AI Writer, Task manager), FoundrKit provides everything inside one unified platform.

---

## ✨ Key Features

### 🧠 1. AI Proposal Generator
- Generates structured, professional business proposals in seconds  
- Uses **Google Gemini 1.5 Flash**  
- Creates:
  - Executive Summaries  
  - Scope of Work  
  - Timelines  
  - Pricing  
- Automatically saves drafts to the database  

---

### 🎨 2. Intelligent Branding Suite

#### 🔤 Business Namer
- Generates creative brand names
- Includes semantic reasoning behind suggestions

#### 🖼 AI Logo Creator
- Uses **Stable Diffusion XL (via Hugging Face)**  
- Generates clean, vector-style startup logos

#### 🔄 Smart Bridge Layer
- Takes simple user prompts  
- Expands them into detailed artistic instructions  
- Optimizes outputs before image generation  

---

### 🧰 3. AI Tool Drawer (Scalable Micro-Tool Architecture)

A modular “Swiss Army Knife” of startup utilities:

- ✍️ Viral Post Generator (LinkedIn/X)
- 📄 NDA & Legal Document Drafter
- 🔥 Idea Roast (VC-style feedback)
- 👩‍💼 Hiring Assistant (Job descriptions)
- 📢 Marketing Copy Generator

Designed for rapid expansion — new tools can be added easily.

---

### 📊 4. Founder CRM & Workflow System

- 👥 Client Management  
- 📁 Proposal Linking  
- ✅ Smart Task Management  
- 📈 Dashboard Analytics  
- 🔄 Real-time updates via Supabase  

---

### 🔐 5. Enterprise-Grade Security

- 🔐 Google OAuth + Magic Link Authentication (Supabase)
- 🛡 Row Level Security (RLS)
- 🔒 Users can only access their own data
- ⚡ Secure server-side API architecture

---

## 🛠️ Tech Stack

### 🎨 Frontend (The Face)

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn/UI
- **Icons:** Lucide
- **Deployment:** Vercel

---

### 🧠 Backend (The Brain)

- **Framework:** Python FastAPI
- **AI Models:**
  - Text → Google Gemini 1.5 Flash
  - Image → StabilityAI SDXL-Turbo (via Hugging Face)
- **Deployment:** Render

---

### 🗄 Database (The Memory)

- **Provider:** Supabase
- **Database:** PostgreSQL
- **Features:**
  - Authentication
  - Realtime subscriptions
  - Row Level Security (RLS)

---

# 🚀 Running FoundrKit Locally

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/foundrkit.git
cd foundrkit
```

---

## 2️⃣ Setup Frontend

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on:
```
http://localhost:3000
```

---

## 3️⃣ Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# macOS / Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn main:app --reload
```

Backend runs on:
```
http://localhost:8000
```

---

# 🔑 Environment Variables

You need **two environment files**.

---

## Backend → `.env`

```env
SUPABASE_URL="your_supabase_url"
SUPABASE_KEY="your_supabase_service_role_key"

GEMINI_API_KEY="your_google_gemini_key"
HF_API_KEY="your_hugging_face_token"
```

---

## Frontend → `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

NEXT_PUBLIC_API_URL="http://localhost:8000"
# Use your Render URL in production
```

---

# 🏗 Architecture Overview

```
Next.js (Frontend)
        ↓
FastAPI (AI Processing Layer)
        ↓
Supabase (Auth + PostgreSQL + RLS)
```

AI requests flow through FastAPI to ensure:
- Secure API key handling
- Controlled prompt expansion
- Clean separation of frontend & model logic

---

# 📈 Roadmap

- [ ] Stripe Subscription Integration
- [ ] AI Email Assistant
- [ ] Investor Pitch Deck Generator
- [ ] Multi-user Team Accounts
- [ ] FoundrKit Mobile App

---

# 🧠 Why FoundrKit?

Because solo founders don’t need more tools.

They need:
- Context
- Speed
- Automation
- Leverage

FoundrKit is designed to be the **AI Co-Founder that never sleeps.**

---

# 📜 License

MIT License
