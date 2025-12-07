# NairaAI 2.0 (Next.js + Python) 🚀

The final, production-ready NairaAI 2.0. Built with Next.js 14 (Frontend) and Python (Backend) in a single codebase, optimized for Vercel.

## 🛠 Tech Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion, TypeScript.
- **Backend**: Next.js API Routes (TypeScript).
- **Database**: Supabase (PostgreSQL).
- **Auth**: NextAuth.js.
- **Deposits**: Shared BEP-20 Address + Memo System.

## 📂 Project Structure
- `app/`: Next.js Frontend.
- `api/`: Python Backend (Vercel Serverless).
- `components/`: UI Components.
- `public/`: Static Assets.

## 🚀 One-Click Deploy to Vercel

1. **Push to GitHub**.
2. **Import Project** in Vercel.
3. **Settings**:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `next build` (Default)
   - Install Command: `npm install` (Default)
4. **Environment Variables**:
   - `NEXTAUTH_SECRET`: Generate one (`openssl rand -base64 32`)
   - `NEXTAUTH_URL`: Your Vercel URL (e.g. `https://naira-ai.vercel.app`)
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_ANON_KEY`: Your Supabase Anon Key

## 💻 Local Development

1. **Install JS Dependencies**:
   ```bash
   npm install
   ```

2. **Install Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   (Note: You need to run the Python backend separately or use `vercel dev` CLI for full integration locally).

## 🐍 Python Backend
The Python logic resides in `api/index.py`. Vercel automatically detects this as a serverless function and maps it to `/api/py/*` via `vercel.json` rewrites.
