# Personal Financial Dashboard

A full-stack personal finance tracker with Gmail integration, partner sharing, and AI-powered insights.

## Features

- **Gmail Integration**: Automatically import expenses from labeled emails
- **Partner Sharing**: Link accounts with your partner for combined expense tracking
- **Three Dashboards**: Global (combined), Personal, and Partner views
- **Manual Entry**: Add expenses that don't come through email
- **AI Analysis**: Get insights and recommendations using Google Gemini
- **Category Management**: Auto-categorization with AI

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS (hosted on Vercel)
- **Backend**: Python + FastAPI (hosted on Railway)
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth
- **AI**: Google Gemini (free tier)

## Setup

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the SQL from `backend/app/database.py` (the `SETUP_SQL` variable)
3. Get your project URL and keys from Settings > API

### 2. Google Cloud Setup

1. Create a project at [Google Cloud Console](https://console.cloud.google.com)
2. Enable the Gmail API
3. Create OAuth 2.0 credentials (Web application type)
4. Add authorized redirect URIs:
   - `http://localhost:8000/auth/google/callback` (development)
   - `https://your-railway-app.up.railway.app/auth/google/callback` (production)
5. Enable Google Gemini API and get an API key

### 3. Backend Setup (Local)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Run the server
uvicorn app.main:app --reload
```

### 4. Frontend Setup (Local)

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials and API URL

# Run the development server
npm run dev
```

### 5. Deployment

#### Backend (Railway)

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Select the `backend` directory
4. Add environment variables from `.env.example`
5. Deploy

#### Frontend (Vercel)

1. Create a new project on [Vercel](https://vercel.com)
2. Connect your GitHub repository
3. Set the root directory to `frontend`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (your Railway backend URL)
5. Deploy

## Usage

### Gmail Expense Tracking

1. In Gmail, create a label called "Expenses"
2. Apply this label to emails containing receipts or transaction notifications
3. In the app, go to Settings and connect your Gmail
4. Click "Sync Gmail" on your Personal dashboard to import expenses

### Partner Linking

1. Go to the Partner tab
2. Enter your partner's email and send an invite
3. Your partner creates an account and accepts the invite
4. Both of you can now see combined expenses on the Global dashboard

### AI Insights

1. Go to AI Insights tab
2. Select a timeframe
3. Toggle "Include partner" for combined analysis
4. View summary, insights, and recommendations

## Environment Variables

### Backend (.env)

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
SECRET_KEY=your_random_secret_key
EXPENSE_EMAIL_LABEL=Expenses
```

### Frontend (.env)

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

## API Endpoints

- `GET /expenses` - List expenses
- `POST /expenses` - Create expense
- `PUT /expenses/{id}` - Update expense
- `DELETE /expenses/{id}` - Delete expense
- `GET /expenses/stats` - Get dashboard statistics
- `POST /gmail/sync` - Sync expenses from Gmail
- `POST /analysis` - Get AI analysis
- `POST /partners/invite` - Send partner invite
- `GET /categories` - List categories

## License

MIT
