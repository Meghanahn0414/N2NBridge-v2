"""
CRM Management System - FastAPI Application
"""
import logging
import os
import sys
from datetime import datetime

# Add src directory to Python path BEFORE importing local modules
_src_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src')
sys.path.insert(0, _src_path)

from alerts.routes import router as alerts_router
from analytics.routes import router as analytics_router
from auth.routes import router as auth_router
from config.database import MongoDatabase
from config.settings import settings
from dashboard.routes import router as dashboard_router
from events.routes import router as events_router
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from grievances.routes import router as grievances_router
from notifications.routes import router as notifications_router
from tasks.routes import router as tasks_router
from users.routes import router as users_router
from lookups.routes import router as lookups_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Mount static files for uploads
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
try:
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
    logger.info("Static files mounted at /uploads")
except Exception as e:
    logger.warning(f"Could not mount static files: {e}")


# Middleware for logging requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests"""
    start_time = datetime.utcnow()
    
    # Log Authorization header for protected endpoints
    if request.url.path.startswith("/api/"):
        auth_header = request.headers.get("authorization")
        if auth_header:
            logger.info(f"[MIDDLEWARE] {request.method} {request.url.path} - Auth: {auth_header[:30]}...")
        else:
            logger.warning(f"[MIDDLEWARE] {request.method} {request.url.path} - ⚠️ NO Authorization header!")
    
    response = await call_next(request)
    
    process_time = (datetime.utcnow() - start_time).total_seconds()
    logger.info(
        f"{request.method} {request.url.path} - Status: {response.status_code} - "
        f"Duration: {process_time:.3f}s"
    )
    
    return response


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database and application"""
    logger.info("Starting CRM Management System...")
    try:
        MongoDatabase.connect(settings.MONGODB_URL, settings.MONGODB_DB)
        logger.info("Database connection established")
        logger.info("Collections and indexes created")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down CRM Management System...")
    MongoDatabase.close()
    logger.info("Database connection closed")


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """API Information"""
    return {
        "name": settings.API_TITLE,
        "version": settings.API_VERSION,
        "description": settings.API_DESCRIPTION,
        "docs": "/api/docs",
        "status": "operational"
    }


# Health check endpoint
@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.API_TITLE
    }


# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(grievances_router)
app.include_router(alerts_router)
app.include_router(events_router)
app.include_router(tasks_router)
app.include_router(notifications_router)
app.include_router(analytics_router)
app.include_router(dashboard_router)
app.include_router(lookups_router)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle global exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "statusCode": 500
        }
    )


# Run application
if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
