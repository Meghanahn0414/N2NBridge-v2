import httpx

from main import app


def test_health_endpoint():
    transport = httpx.ASGITransport(app=app)
    with httpx.Client(transport=transport, base_url="http://test") as client:
        response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
