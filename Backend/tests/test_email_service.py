import os
import sys
from types import SimpleNamespace

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from utils import email_service


def test_send_otp_via_email_uses_smtp_settings(monkeypatch):
    calls = {}

    class DummySMTP:
        def __init__(self, host, port):
            calls["host"] = host
            calls["port"] = port

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def starttls(self):
            calls["tls"] = True

        def login(self, username, password):
            calls["login"] = (username, password)

        def send_message(self, message):
            calls["message"] = message

    monkeypatch.setattr(email_service.smtplib, "SMTP", DummySMTP)
    monkeypatch.setattr(
        email_service,
        "settings",
        SimpleNamespace(
            SMTP_SERVER="smtp.test.local",
            SMTP_PORT=2525,
            SMTP_USERNAME="sender@example.com",
            SMTP_PASSWORD="super-secret",
            SENDER_EMAIL="sender@example.com",
        ),
    )
    monkeypatch.delenv("SMTP_SERVER", raising=False)
    monkeypatch.delenv("SMTP_PORT", raising=False)
    monkeypatch.delenv("SMTP_USERNAME", raising=False)
    monkeypatch.delenv("SMTP_PASSWORD", raising=False)
    monkeypatch.delenv("SENDER_EMAIL", raising=False)
    monkeypatch.delenv("SMTP_EMAIL", raising=False)

    result = email_service.send_otp_via_email("recipient@example.com", "123456")

    assert result is True
    assert calls["host"] == "smtp.test.local"
    assert calls["port"] == 2525
    assert calls["login"] == ("sender@example.com", "super-secret")
