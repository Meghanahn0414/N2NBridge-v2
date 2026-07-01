"""
CRM Management System - FastAPI Application
"""
import logging
import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.exception_handlers import http_exception_handler as _default_http_handler
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException

# sys.path must be set before importing local modules
_src_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src')
sys.path.insert(0, _src_path)

from alerts.routes import router as alerts_router  # noqa: E402
from analytics.routes import router as analytics_router  # noqa: E402
from auth.routes import (  # noqa: E402
    rep_router     as auth_rep_router,
    staff_router   as auth_staff_router,
    citizen_router as auth_citizen_router,
    compat_router  as auth_compat_router,
)
from campaigns.routes import router as campaigns_router  # noqa: E402
from citizens.routes import router as citizens_router  # noqa: E402
from config.cache import close_cache, init_cache  # noqa: E402
from config.database import MongoDatabase  # noqa: E402
from config.rate_limit import limiter  # noqa: E402
from config.settings import settings  # noqa: E402
from dashboard.routes import router as dashboard_router  # noqa: E402
from events.routes import router as events_router  # noqa: E402
from grievances.routes import rep_router as grievances_rep_router  # noqa: E402
from grievances.routes import router as grievances_router  # noqa: E402
from lookups.routes import router as lookups_router  # noqa: E402
from mla.routes import router as mla_router  # noqa: E402
from staff.routes import router as staff_router  # noqa: E402
from notifications.routes import router as notifications_router  # noqa: E402
from surveys.routes import router as surveys_router  # noqa: E402
from tasks.routes import router as tasks_router  # noqa: E402
from users.routes import router as users_router  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: DB + Redis cache. Shutdown: clean close."""
    logger.info("Starting CRM Management System...")
    try:
        # Connect to master DB (crm_master); tenant DBs are accessed on-demand
        MongoDatabase.connect(settings.MONGODB_URL, settings.MONGODB_MASTER_DB)
        logger.info(f"Master database connected: {settings.MONGODB_MASTER_DB}")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

    await init_cache()

    yield

    logger.info("Shutting down CRM Management System...")
    await close_cache()
    MongoDatabase.close()
    logger.info("Shutdown complete")


app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ── Rate limiter ───────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ───────────────────────────────────────────────────────────────────────
_cors_origins = list(settings.CORS_ORIGINS)
if settings.FRONTEND_ORIGIN:
    _cors_origins.append(settings.FRONTEND_ORIGIN)
    logger.info(f"Added production FRONTEND_ORIGIN to CORS: {settings.FRONTEND_ORIGIN}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=settings.CORS_ALLOW_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# ── Static files ───────────────────────────────────────────────────────────────
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
try:
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
    logger.info("Static files mounted at /uploads")
except Exception as e:
    logger.warning(f"Could not mount static files: {e}")


# ── Request logger ─────────────────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests; handle CORS preflight."""
    start_time = datetime.now(timezone.utc)

    if request.method == "OPTIONS":
        origin = request.headers.get("origin", "*")
        requested_headers = request.headers.get(
            "access-control-request-headers", "content-type, authorization"
        )
        return JSONResponse(
            content={},
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": requested_headers,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Max-Age": "600",
            },
        )

    response = await call_next(request)
    duration = (datetime.now(timezone.utc) - start_time).total_seconds()
    if duration > 2.0 or response.status_code >= 500:
        logger.warning(f"SLOW {request.method} {request.url.path} - {response.status_code} - {duration:.3f}s")
    return response


# ── Root / health ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    return {
        "name": settings.API_TITLE,
        "version": settings.API_VERSION,
        "description": settings.API_DESCRIPTION,
        "docs": "/api/docs",
        "status": "operational",
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": settings.API_TITLE,
    }


# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth_rep_router)
app.include_router(auth_staff_router)
app.include_router(auth_citizen_router)
app.include_router(auth_compat_router)
app.include_router(users_router)
app.include_router(grievances_router)
app.include_router(grievances_rep_router)
app.include_router(staff_router)
app.include_router(alerts_router)
app.include_router(campaigns_router)
app.include_router(events_router)
app.include_router(tasks_router)
app.include_router(notifications_router)
app.include_router(analytics_router)
app.include_router(dashboard_router)
app.include_router(lookups_router)
app.include_router(citizens_router)
app.include_router(mla_router)
app.include_router(surveys_router)


# ── Global exception handler ───────────────────────────────────────────────────
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Re-delegate HTTPException to FastAPI's default handler so detail is preserved."""
    return await _default_http_handler(request, exc)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "success": False, "statusCode": 500},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
    )
