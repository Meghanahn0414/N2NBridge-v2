# Main application entry point
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from src.modules.auth.routes import router as auth_router
from src.modules.voters.routes import router as voters_router
from src.modules.roles.service import init_roles
from src.config.database import get_database
from src.config.settings import UPLOAD_DIR
import os

app = FastAPI(title="CRM API", version="1.0.0", description="CRM System with Aadhar Verification")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
if os.path.exists(UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(voters_router, prefix="/api/voters", tags=["voters"])

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    print("🚀 Starting CRM API...")
    try:
        get_database()
        print("✅ Database connected!")
        
        # Initialize roles
        print("📋 Initializing roles...")
        init_roles()
        print("✅ Roles initialized!")
    except Exception as e:
        print(f"⚠️  Database initialization warning: {str(e)}")

@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "🎉 CRM API is running",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    try:
        db = get_database()
        return {
            "status": "healthy",
            "database": db.name,
            "collections": db.list_collection_names()
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

