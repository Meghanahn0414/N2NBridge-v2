"""N2Bridge Central Platform — FastAPI entry point.

Mounts every module's router under /api/v1. One deployable, clean module seams.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.settings import settings

# Routers (each module exposes `router`)
from app.auth import router as auth
from app.citizens import router as citizens
from app.citizens import cases_router as cases
from app.tenants import router as tenants
from app.directory import router as directory
from app.subscriptions import router as subscriptions
from app.onboarding import router as onboarding
from app.notifications import router as notifications
from app.admin import router as admin

app = FastAPI(title="N2Bridge Central Platform", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (
    auth,
    citizens,
    cases,
    tenants,
    directory,
    subscriptions,
    onboarding,
    notifications,
    admin,
):
    app.include_router(module.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
