import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateCitizenProfile } from "../../shared/services/citizenService";
import "./profile-creation.css";

export default function ProfileCreation() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    aadhaar: "",
    ward: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.fullName.trim()) {
        setError("Please enter your full name");
        return false;
      }
      if (formData.fullName.trim().length < 3) {
        setError("Name must be at least 3 characters");
        return false;
      }
    } else if (step === 2) {
      if (!formData.mobile.trim()) {
        setError("Please enter your mobile number");
        return false;
      }
      if (!/^\d{10}$/.test(formData.mobile.trim())) {
        setError("Mobile number must be 10 digits");
        return false;
      }
    } else if (step === 3) {
      if (!formData.aadhaar.trim()) {
        setError("Please enter your Aadhaar number");
        return false;
      }
      if (!/^\d{12}$/.test(formData.aadhaar.trim())) {
        setError("Aadhaar must be 12 digits");
        return false;
      }
    } else if (step === 4) {
      if (!formData.ward.trim()) {
        setError("Please select your ward");
        return false;
      }
    }
    setError("");
    return true;
  };

  const handleNext = () => {
    if (validateStep() && step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError("");
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError("");

    try {
      // Update user profile
      const response = await updateCitizenProfile({
        fullName: formData.fullName,
        phone: formData.mobile,
        aadhaar: formData.aadhaar,
        ward: formData.ward,
      });

      // Store profile created flag
      sessionStorage.setItem("profileCreated", "true");
      
      // Navigate to dashboard
      navigate("/citizen");
    } catch (err) {
      setError(err.message || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

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
        return (
          <div className="form-step">
            <h2>Mobile number</h2>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="10 digit mobile"
              className="step-input"
              maxLength="10"
              autoFocus
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
      default:
        return null;
    }
  };

  return (
    <div className="profile-creation-container">
      <div className="profile-card">
        {/* Progress Bar */}
        <div className="progress-header">
          <h1>Create Account</h1>
          <p className="step-indicator">
            Step {step} of 4
          </p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Content */}
        <div className="form-content">{renderStep()}</div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Form Steps Summary */}
        <div className="form-summary">
          <div className={`summary-item ${step >= 1 ? "completed" : ""}`}>
            <span className="summary-step">1</span>
            <span className="summary-text">Name</span>
          </div>
          <div className={`summary-item ${step >= 2 ? "completed" : ""}`}>
            <span className="summary-step">2</span>
            <span className="summary-text">Mobile</span>
          </div>
          <div className={`summary-item ${step >= 3 ? "completed" : ""}`}>
            <span className="summary-step">3</span>
            <span className="summary-text">Aadhaar</span>
          </div>
          <div className={`summary-item ${step >= 4 ? "completed" : ""}`}>
            <span className="summary-step">4</span>
            <span className="summary-text">Ward</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="form-actions">
          <button
            onClick={handleBack}
            className="btn-secondary"
            disabled={step === 1}
          >
            Back
          </button>

          {step < 4 ? (
            <button onClick={handleNext} className="btn-primary">
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
