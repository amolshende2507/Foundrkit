# FoundrKit — AI-Powered Virtual Co-Founder

FoundrKit is an integrated productivity platform designed to act as a digital co-founder for solo entrepreneurs and small teams. It automates high-value operational tasks—such as writing proposals, generating brand assets, and managing tasks—using advanced Generative AI.

![FoundrKit Dashboard Preview](https://placehold.co/1200x600/1e293b/ffffff?text=FoundrKit+Dashboard+Preview)
<!-- Replace this placeholder with a real screenshot later -->

---

## 🚀 Live Demo

- **Frontend (Vercel):** https://foundrkit-app.vercel.app  
- **Backend API (Render):** https://foundrkit-api.onrender.com  

---

## ✨ Key Features

### 🧠 AI Proposal Generator
- Generate professional, client-ready business proposals in seconds.
- Customizable tone, pricing tables, and project summaries.
- Powered by **Google Gemini 1.5 Flash**.

### 🎨 AI Branding Suite
- Generate startup-friendly business names.
- Create catchy slogans and taglines.
- AI-powered logo generation with vector-style output.
- Powered by **Google Gemini (Text)** and **Stable Diffusion XL (Hugging Face)**.

### ✅ Smart Task Management
- Create and manage tasks with priorities and deadlines.
- AI task breakdown from high-level goals into actionable steps.

### 💬 Virtual Co-Founder Chat
- Context-aware AI chat interface.
- Understands your business, tasks, and clients.
- Provides strategic and actionable advice.

### 🔐 Secure Architecture
- Email/password authentication via Supabase Auth.
- PostgreSQL database with Row Level Security (RLS).

---

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js 15 (React)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Deployment:** Vercel

### Backend
- **Framework:** FastAPI (Python)
- **AI Models:** Google Gemini 1.5 Flash, Stable Diffusion XL
- **Deployment:** Render

### Database & Auth
- **Provider:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js & npm
- Python 3.9+
- Git

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/foundrkit-app.git
cd foundrkit-app
### 2️⃣ Backend Setup
cd backend
python -m venv venv
Activate the virtual environment:

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
Install dependencies:

pip install -r requirements.txt
Create a .env file inside the backend folder:

SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_google_gemini_api_key
HF_API_KEY=your_hugging_face_api_key


Run the backend server:

uvicorn main:app --reload


Backend will run at:
http://localhost:8000

3️⃣ Frontend Setup

Open a new terminal and return to the project root:

cd ..
npm install


Create a .env.local file in the root directory:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000


Start the frontend:

npm run dev


Frontend will run at:
http://localhost:3000

📂 Project Structure
FoundrKit/
├── app/                  # Next.js App Router pages
│   ├── dashboard/        # Protected user routes
│   ├── login/            # Authentication pages
│   └── page.tsx          # Landing page
├── backend/              # FastAPI backend
│   ├── main.py           # API routes and logic
│   └── requirements.txt  # Python dependencies
├── components/           # Reusable UI components
├── lib/                  # Utility functions (Supabase client)
└── public/               # Static assets

🛡️ Security

Row Level Security (RLS): Users can only access their own data.

Environment Variables: Sensitive keys are never exposed to the client.

CORS: Restricted to approved frontend origins.

🤝 Contributing

Contributions are welcome!

Fork the repository

Create a new branch

Make your changes

Submit a pull request

📄 License

This project is licensed under the MIT License.


---



