import asyncio

import httpx
import main


def test_health_endpoint():
    async def run_test():
        transport = httpx.ASGITransport(app=main.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.get("/api/health")

    response = asyncio.run(run_test())

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_health_endpoint_when_database_startup_fails(monkeypatch):
    def fail_connect(*args, **kwargs):
        raise RuntimeError("database unavailable")

    monkeypatch.setattr(main.MongoDatabase, "connect", fail_connect)

    async def run_test():
        async with main.lifespan(main.app):
            transport = httpx.ASGITransport(app=main.app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                return await client.get("/api/health")

    response = asyncio.run(run_test())

    assert response.status_code == 200
    assert response.json()["status"] == "degraded"
    assert response.json()["dependencies"]["database"] == "unavailable"
