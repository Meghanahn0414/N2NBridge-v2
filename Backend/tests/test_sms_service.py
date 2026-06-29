import importlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))


def test_send_otp_via_sms_falls_back_to_console_when_no_provider_is_configured(monkeypatch, capsys):
    sms_service = importlib.import_module("utils.sms_service")

    monkeypatch.delenv("FAST2SMS_API_KEY", raising=False)
    monkeypatch.delenv("VONAGE_API_KEY", raising=False)
    monkeypatch.delenv("TWOFACTOR_API_KEY", raising=False)
    monkeypatch.setattr(sms_service.settings, "TWILIO_ACCOUNT_SID", None)
    monkeypatch.setattr(sms_service.settings, "TWILIO_AUTH_TOKEN", None)
    monkeypatch.setattr(sms_service.settings, "TWILIO_PHONE_NUMBER", None)
    monkeypatch.setattr(sms_service.settings, "AWS_ACCESS_KEY_ID", None)
    monkeypatch.setattr(sms_service.settings, "AWS_SECRET_ACCESS_KEY", None)
    monkeypatch.setattr(sms_service.settings, "SMS_API_URL", None)
    monkeypatch.setattr(sms_service.settings, "FAST2SMS_API_KEY", None)
    monkeypatch.setattr(sms_service.settings, "VONAGE_API_KEY", None)
    monkeypatch.setattr(sms_service.settings, "TWOFACTOR_API_KEY", None)

    result = sms_service.send_otp_via_sms("+919999999999", "123456")

    captured = capsys.readouterr().out
    assert result is True
    assert "Falling back to console OTP delivery" in captured
    assert "OTP Code" in captured
