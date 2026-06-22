import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { updateCitizenProfile, getCitizenProfile } from "../../shared/services/citizenService";
import PhoneInput from "../../components/PhoneInput";
import { sanitizePhoneInput } from "../../utils/phoneUtils";
import "./profile-creation.css";

const TOTAL_STEPS = 5;

export default function ProfileCreation() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // If the citizen already has a completed profile, skip this page entirely
  useEffect(() => {
    getCitizenProfile()
      .then((profile) => {
        if (profile?.fullName && profile.fullName.trim()) {
          navigate("/citizen", { replace: true });
        }
      })
      .catch(() => {
        // Profile fetch failed — let the form render normally
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect login method so we ask for the opposite contact detail
  const authState = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("authValue") || "{}");
    } catch {
      return {};
    }
  })();
  const loginByPhone = authState.type !== "email"; // default to phone login

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    aadhaar: "",
    ward: "",
    age: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: sanitizePhoneInput(value) }));
  };

  const validateStep = () => {
    setError("");
    if (step === 1) {
      if (!formData.fullName.trim()) return setError("Please enter your full name"), false;
      if (formData.fullName.trim().length < 3) return setError("Name must be at least 3 characters"), false;
    } else if (step === 2) {
      if (loginByPhone) {
        if (!formData.email.trim()) return setError("Please enter your email address"), false;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
          return setError("Please enter a valid email address"), false;
      } else {
        if (!formData.mobile.trim()) return setError("Please enter your mobile number"), false;
        if (!/^\d{10}$/.test(formData.mobile.trim()))
          return setError("Mobile number must be 10 digits"), false;
      }
    } else if (step === 3) {
      if (!formData.aadhaar.trim()) return setError("Please enter your Aadhaar number"), false;
      if (!/^\d{12}$/.test(formData.aadhaar.trim()))
        return setError("Aadhaar must be 12 digits"), false;
    } else if (step === 4) {
      if (!formData.ward.trim()) return setError("Please select your ward"), false;
    } else if (step === 5) {
      const age = parseInt(formData.age, 10);
      if (!formData.age.trim()) return setError("Please enter your age"), false;
      if (isNaN(age) || age < 1 || age > 120)
        return setError("Please enter a valid age (1–120)"), false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep() && step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) { setStep(step - 1); setError(""); }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError("");
    try {
      await updateCitizenProfile({
        name: formData.fullName,
        ...(loginByPhone ? { email: formData.email } : { phone: formData.mobile }),
        age: parseInt(formData.age, 10),
        ...(formData.ward ? { wardId: formData.ward } : {}),
      });
      sessionStorage.setItem("profileCreated", "true");
      navigate("/citizen");
    } catch (err) {
      setError(err.message || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 label depends on login method
  const step2Label = loginByPhone ? "Email" : "Mobile";

  const STEP_LABELS = ["Name", step2Label, "Aadhaar", "Ward", "Age"];

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="form-step">
            <h2>What's your full name?</h2>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full name"
              className="step-input"
              autoFocus
            />
          </div>
        );

      case 2:
        return loginByPhone ? (
          <div className="form-step">
            <h2>Your email address</h2>
            <p className="step-hint">Add your email so we can reach you with updates</p>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="step-input"
              autoFocus
            />
          </div>
        ) : (
          <div className="form-step">
            <h2>Mobile number</h2>
            <p className="step-hint">Add your mobile number for important notifications</p>
            <PhoneInput
              value={formData.mobile}
              onChange={handlePhoneChange}
              name="mobile"
              placeholder="10 digit mobile"
              className="profile-phone-input"
              inputClassName="profile-phone-field"
              maxLength={10}
            />
          </div>
        );

      case 3:
        return (
          <div className="form-step">
            <h2>Aadhaar number</h2>
            <input
              type="text"
              name="aadhaar"
              value={formData.aadhaar}
              onChange={handleChange}
              placeholder="12 digit Aadhaar"
              className="step-input"
              maxLength="12"
              autoFocus
            />
          </div>
        );

      case 4:
        return (
          <div className="form-step">
            <h2>Select your ward</h2>
            <select
              name="ward"
              value={formData.ward}
              onChange={handleChange}
              className="step-input"
              autoFocus
            >
              <option value="">Choose your ward</option>
              {Array.from({ length: 50 }, (_, i) => (
                <option key={i + 1} value={`Ward ${i + 1}`}>
                  Ward {i + 1}
                </option>
              ))}
            </select>
          </div>
        );

      case 5:
        return (
          <div className="form-step">
            <h2>How old are you?</h2>
            <p className="step-hint">Your age helps us understand how residents feel by age group</p>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Enter your age"
              className="step-input"
              min="1"
              max="120"
              autoFocus
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="profile-creation-container">
      <div className="profile-card">
        {/* Header */}
        <div className="progress-header">
          <h1>Create Account</h1>
          <p className="step-indicator">Step {step} of {TOTAL_STEPS}</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="form-content">{renderStep()}</div>

        {/* Error */}
        {error && <div className="error-message">{error}</div>}

        {/* Step indicators */}
        <div className="form-summary">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className={`summary-item ${step >= i + 1 ? "completed" : ""}`}>
              <span className="summary-step">{i + 1}</span>
              <span className="summary-text">{label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button onClick={handleBack} className="btn-secondary" disabled={step === 1}>
            Back
          </button>
          {step < TOTAL_STEPS ? (
            <button onClick={handleNext} className="btn-primary">
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
