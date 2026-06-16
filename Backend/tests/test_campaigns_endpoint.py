from fastapi.testclient import TestClient
from main import app


def test_campaigns_endpoint_exists():
    client = TestClient(app)
    response = client.get("/api/campaigns?page=1&per_page=1000")

    assert response.status_code == 200
