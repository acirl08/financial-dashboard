from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import auth, expenses, gmail, analysis, partners, categories

settings = get_settings()

app = FastAPI(
    title="Financial Dashboard API",
    description="Personal financial dashboard with Gmail integration and AI analysis",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(expenses.router)
app.include_router(gmail.router)
app.include_router(analysis.router)
app.include_router(partners.router)
app.include_router(categories.router)


@app.get("/")
async def root():
    return {
        "message": "Financial Dashboard API",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
