"""
N2N Lookup Service — FastAPI Application

The one fixed, always-reachable service that maps a citizen's chosen
constituency (Ward ID / Assembly Name / Parliamentary Name) to the
representative's OWN, independently deployed server_url.

Holds NO citizen or grievance data. Every representative runs their own
separate Backend + separate MongoDB (see ../Backend, deployed in
DEPLOYMENT_MODE=SINGLE_TENANT — see Backend/README.md) and is invisible to
every other representative. This service is purely a lookup table.
"""
import logging
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

_src_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src")
sys.path.insert(0, _src_path)

from config import settings          # noqa: E402
from database import LookupDatabase  # noqa: E402
from routes import router as lookup_router  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting N2N Lookup Service...")
    LookupDatabase.connect(settings.MONGODB_URL, settings.MONGODB_DB)
    yield
    logger.info("Shutting down N2N Lookup Service...")
    LookupDatabase.close()


app = FastAPI(
    title="N2N Lookup Service",
    description="Maps representative constituencies to their independently deployed servers.",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

_origins = settings.CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _origins.strip() == "*" else [o.strip() for o in _origins.split(",") if o.strip()],
    allow_credentials=_origins.strip() != "*",
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(lookup_router)


@app.get("/", tags=["Root"])
async def root():
    return {"name": "N2N Lookup Service", "status": "operational", "docs": "/api/docs"}


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG, log_level="info")
