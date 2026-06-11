import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./complaint-form.css";

export default function CreateComplaint() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    category: "Roads",
    description: "",
    photos: [],
    location: "",
    ward: "",
    latitude: null,
    longitude: null,
    priority: "Normal",
    contactPhone: "",
    confirmAccuracy: false, // Add checkbox state
  });

  const categories = ["Roads", "Water", "Waste", "Electricity", "Parks", "Drainage", "Street Light", "Other"];
  const priorities = ["Low", "Normal", "High"];

  // Step 1: Category Selection
  const renderStep1 = () => (
    <div className="complaint-step">
      <div className="step-header">
        <h2 className="step-title">File a complaint</h2>
        <p className="step-subtitle">Step 1 of 4 — category</p>
      </div>

      <div className="form-section">
        <label className="form-label">SELECT CATEGORY *</label>
        <div className="category-grid">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-btn ${formData.category === cat ? "active" : ""}`}
              onClick={() => setFormData({ ...formData, category: cat })}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="form-section">
        <label className="form-label">PRIORITY LEVEL</label>
        <div className="priority-options">
          {priorities.map((priority) => (
            <label key={priority} className="radio-label">
              <input
                type="radio"
                name="priority"
                value={priority}
                checked={formData.priority === priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              />
              <span>{priority}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  // Step 2: Description & Photo
  const renderStep2 = () => (
    <div className="complaint-step">
      <div className="step-header">
        <h2 className="step-title">File a complaint</h2>
        <p className="step-subtitle">Step 2 of 4 — details</p>
      </div>

      <div className="form-section">
        <label className="form-label">DESCRIBE THE ISSUE *</label>
        <textarea
          className="complaint-textarea"
          placeholder="Describe the issue in detail. Include what, where, and when..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows="4"
          required
        />
        <div className="char-count">
          {formData.description.length}/500 characters
        </div>
      </div>

      <div className="form-section">
        <label className="form-label">ATTACH PHOTO</label>
        <div className="photo-upload">
          <input
            type="file"
            id="photo-input"
            multiple
            accept="image/*"
            className="hidden-input"
            onChange={handlePhotoUpload}
          />
          <label htmlFor="photo-input" className="upload-label">
            <span className="upload-icon">📷</span>
            <span className="upload-text">Tap to add photo</span>
            <span className="upload-hint">Max 5 photos, 5MB each</span>
          </label>
        </div>

        {formData.photos.length > 0 && (
          <div className="photo-preview">
            <div className="photos-grid">
              {formData.photos.map((photo, index) => (
                <div key={index} className="photo-item">
                  <img src={photo} alt={`Photo ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-photo"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        photos: formData.photos.filter((_, i) => i !== index),
                      })
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <p className="photos-count">{formData.photos.length} photo(s) added</p>
          </div>
        )}
      </div>
    </div>
  );

  // Step 3: Location
  const renderStep3 = () => (
    <div className="complaint-step">
      <div className="step-header">
        <h2 className="step-title">File a complaint</h2>
        <p className="step-subtitle">Step 3 of 4 — location</p>
      </div>

      <div className="form-section">
        <label className="form-label">LOCATION DETAILS *</label>
        <input
          type="text"
          className="form-input"
          placeholder="Enter street, area, or landmark"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          required
        />
      </div>

      <div className="form-section">
        <label className="form-label">WARD *</label>
        <select
          className="form-select"
          value={formData.ward}
          onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
          required
        >
          <option value="">Select Ward</option>
          {Array.from({ length: 50 }, (_, i) => i + 1).map((ward) => (
            <option key={ward} value={ward}>
              Ward {ward}
            </option>
          ))}
        </select>
      </div>

      <div className="form-section">
        <label className="form-label">USE CURRENT LOCATION</label>
        <button
          type="button"
          className="location-btn"
          onClick={getCurrentLocation}
        >
          📍 Get GPS Location
        </button>
        {formData.latitude && (
          <p className="location-info">
            ✓ Location: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
          </p>
        )}
      </div>

      <div className="form-section">
        <label className="form-label">CONTACT PHONE (OPTIONAL)</label>
        <input
          type="tel"
          className="form-input"
          placeholder="Phone number for updates"
          value={formData.contactPhone}
          onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
        />
      </div>
    </div>
  );

  // Step 4: Review & Submit
  const renderStep4 = () => (
    <div className="complaint-step">
      <div className="step-header">
        <h2 className="step-title">File a complaint</h2>
        <p className="step-subtitle">Step 4 of 4 — review</p>
      </div>

      <div className="review-section">
        <div className="review-item">
          <span className="review-label">Category:</span>
          <span className="review-value">{formData.category}</span>
        </div>
        <div className="review-item">
          <span className="review-label">Priority:</span>
          <span className="review-value">{formData.priority}</span>
        </div>
        <div className="review-item">
          <span className="review-label">Description:</span>
          <span className="review-value">{formData.description}</span>
        </div>
        <div className="review-item">
          <span className="review-label">Location:</span>
          <span className="review-value">{formData.location}</span>
        </div>
        <div className="review-item">
          <span className="review-label">Ward:</span>
          <span className="review-value">Ward {formData.ward}</span>
        </div>
        {formData.photos.length > 0 && (
          <div className="review-item">
            <span className="review-label">Photos:</span>
            <span className="review-value">{formData.photos.length} attached</span>
          </div>
        )}
      </div>

      <div className="form-section">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={formData.confirmAccuracy}
            onChange={(e) => setFormData({ ...formData, confirmAccuracy: e.target.checked })}
            required 
          />
          <span>I confirm that the information is accurate and factual</span>
        </label>
      </div>
    </div>
  );

  // Handle photo upload
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (formData.photos.length + files.length > 5) {
      alert("Maximum 5 photos allowed");
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert("Each photo must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, event.target.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  // Get GPS location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        alert("Unable to get location: " + error.message);
      }
    );
  };

  // Validate current step
  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return formData.category;
      case 2:
        return formData.description.trim().length > 0;
      case 3:
        return formData.location.trim().length > 0 && formData.ward;
      case 4:
        return formData.confirmAccuracy; // Must check the checkbox
      default:
        return false;
    }
  };

  // Handle next/previous
  const handleNext = () => {
    if (!validateStep()) {
      alert("Please fill in all required fields");
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateStep()) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      const userId = localStorage.getItem("userId");
      const user = userStr ? JSON.parse(userStr) : null;

      if (!token) {
        alert("Session expired. Please login again.");
        navigate("/citizen-login");
        return;
      }

      // Get citizen ID from various possible sources
      const citizenId = user?.citizenId || user?.id || userId;
      
      if (!citizenId) {
        alert("User information not found. Please login again.");
        navigate("/citizen-login");
        return;
      }

      // Validate required fields
      if (!formData.category || !formData.description.trim() || !formData.location.trim() || !formData.ward) {
        alert("Please fill in all required fields");
        setLoading(false);
        return;
      }

      // Prepare complaint data - match backend schema exactly
      const complaintPayload = {
        citizenId: String(citizenId), // Ensure string
        category: String(formData.category), // Must match enum
        description: String(formData.description).trim(),
        location: String(formData.location).trim(),
        ward: parseInt(formData.ward, 10), // Convert to integer
        priority: String(formData.priority) || "Normal",
        photos: Array.isArray(formData.photos) ? formData.photos : [], // Ensure array
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        contactPhone: formData.contactPhone?.trim() || null,
      };

      // Validate ward is within range
      if (complaintPayload.ward < 1 || complaintPayload.ward > 50) {
        alert("Ward must be between 1 and 50");
        setLoading(false);
        return;
      }

      console.log("📤 Submitting complaint with data:", {
        ...complaintPayload,
        photos: `[${complaintPayload.photos.length} images]` // Don't log full base64
      });

      // Submit to backend
      const response = await fetch("http://10.62.179.92:8000/api/complaints/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(complaintPayload),
      });

      const responseData = await response.json();
      console.log("📥 Backend response:", responseData);

      if (!response.ok) {
        // Extract detailed error message
        let errorMessage = "Failed to file complaint";
        
        if (responseData.detail) {
          errorMessage = responseData.detail;
          // Parse FastAPI validation errors
          if (Array.isArray(responseData.detail)) {
            errorMessage = responseData.detail
              .map(err => `${err.loc?.join(".")} - ${err.msg}`)
              .join("\n");
          }
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        }
        
        console.error("❌ Backend error:", errorMessage);
        throw new Error(errorMessage);
      }

      // Extract complaint ID from response
      const complaintId = responseData.data?.complaintId || 
                          responseData.complaintId || 
                          responseData.data?.message?.complaintId ||
                          "CMP-" + Date.now();

      alert(`✅ Complaint filed successfully!\n\nComplaint ID: ${complaintId}`);
      
      // Reset form and navigate
      setFormData({
        category: "Roads",
        description: "",
        photos: [],
        location: "",
        ward: "",
        latitude: null,
        longitude: null,
        priority: "Normal",
        contactPhone: "",
      });
      setCurrentStep(1);
      
      navigate("/citizen/complaints");
    } catch (error) {
      console.error("❌ Error filing complaint:", error);
      const errorMsg = error.message || "Unknown error occurred";
      alert(`Failed to file complaint:\n\n${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="complaint-container">
      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
        <div className="step-indicators">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`step-indicator ${
                step === currentStep
                  ? "active"
                  : step < currentStep
                  ? "completed"
                  : ""
              }`}
            >
              {step < currentStep ? "✓" : step}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="form-content">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      {/* Navigation Buttons */}
      <div className="form-navigation">
        <button
          type="button"
          className="btn-secondary"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          ← Back
        </button>

        {currentStep < 4 ? (
          <button
            type="button"
            className="btn-primary"
            onClick={handleNext}
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            className="btn-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>
        )}
      </div>
    </div>
  );
}
