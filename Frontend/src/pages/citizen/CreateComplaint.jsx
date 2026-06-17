import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createComplaint, fetchComplaintCategories, getCurrentUserId, uploadComplaintAttachment } from "../../features/complaints/complaintService";
import "./complaint-form.css";

export default function CreateComplaint() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState("Roads");
  const [validationErrors, setValidationErrors] = useState({});
  const [locationStatus, setLocationStatus] = useState("");

  // Form data - match backend schema
  const [formData, setFormData] = useState({
    category:'Roads',
    description: "",
    address: "",
    wardId: "",
    priority: "MEDIUM",
    latitude: null,
    longitude: null,
    confirmAccuracy: false,
    photoFiles: [],
    photoPreview: [],
  });
    const category = [ "Roads","Water","Noise","Electricity","Waste","Other"];  
    const priority = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    
    // Category mapping to backend category IDs
    const categoryMapping = {
      "Roads": "ROAD_ISSUE",
      "Water": "WATER_SUPPLY",
      "Waste": "GARBAGE",
      "Electricity": "ELECTRICITY",
      "Noise": "NOISE_POLLUTION",
      "Other": "OTHER"
    };
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
          {category.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-btn ${formData.category === cat ? "active" : ""} ${validationErrors.category ? "field-error" : ""}`}
              onClick={() => {
                setFormData({ ...formData, category: cat });
                setSelectedCategoryName(cat);
                setValidationErrors((prev) => ({ ...prev, category: "" }));
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        {validationErrors.category && <p className="field-error-message">{validationErrors.category}</p>}
      </div>

      
         

      <div className="form-section">
        <label className="form-label">PRIORITY LEVEL</label>
        <div className="priority-options">
          {priority.map((priorityOption) => (
            <label key={priorityOption} className="radio-label">
              <input
                type="radio"
                name="priority"
                value={priorityOption}
                checked={formData.priority === priorityOption}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              />
              <span>{priorityOption}</span>
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
          className={`complaint-textarea ${validationErrors.description ? "field-error" : ""}`}
          aria-label="description"
          placeholder="Describe the issue in detail. Include what, where, and when..."
          value={formData.description}
          onChange={(e) => {
            setFormData({ ...formData, description: e.target.value });
            setValidationErrors((prev) => ({ ...prev, description: "" }));
          }}
          rows="4"
          required
        />
        <div className="char-count">
          {formData.description.length}/500 characters
        </div>
        {validationErrors.description && <p className="field-error-message">{validationErrors.description}</p>}
      </div>

      <div className="form-section">
        <label className="form-label">ATTACH PHOTOS (OPTIONAL)</label>
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

        {formData.photoPreview.length > 0 && (
          <div className="photo-preview">
            <div className="photos-grid">
              {formData.photoPreview.map((photo, index) => (
                <div key={index} className="photo-item">
                  <img src={photo} alt={`Photo ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-photo"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        photoFiles: formData.photoFiles.filter((_, i) => i !== index),
                        photoPreview: formData.photoPreview.filter((_, i) => i !== index),
                      });
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <p className="photos-count">{formData.photoPreview.length} photo(s) added</p>
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
          className={`form-input ${validationErrors.address ? "field-error" : ""}`}
          aria-label="location"
          placeholder="Enter street, area, or landmark"
          value={formData.address}
          onChange={(e) => {
            setFormData({ ...formData, address: e.target.value });
            setValidationErrors((prev) => ({ ...prev, address: "" }));
          }}
          required
        />
        {validationErrors.address && <p className="field-error-message">{validationErrors.address}</p>}
      </div>

      <div className="form-section">
        <label className="form-label">WARD *</label>
        <select
          className={`form-select ${validationErrors.wardId ? "field-error" : ""}`}
          aria-label="ward"
          value={formData.wardId}
          onChange={(e) => {
            setFormData({ ...formData, wardId: e.target.value });
            setValidationErrors((prev) => ({ ...prev, wardId: "" }));
          }}
          required
        >
          <option value="">Select Ward</option>
          {Array.from({ length: 50 }, (_, i) => i + 1).map((ward) => (
            <option key={ward} value={String(ward)}>
              Ward {ward}
            </option>
          ))}
        </select>
        {validationErrors.wardId && <p className="field-error-message">{validationErrors.wardId}</p>}
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
        {locationStatus && <p className="field-error-message">{locationStatus}</p>}
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
          <span className="review-value">{selectedCategoryName}</span>
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
          <span className="review-value">{formData.address}</span>
        </div>
        <div className="review-item">
          <span className="review-label">Ward:</span>
          <span className="review-value">Ward {formData.wardId}</span>
        </div>
        {formData.photoPreview.length > 0 && (
          <div className="review-item">
            <span className="review-label">Photos:</span>
            <span className="review-value">{formData.photoPreview.length} attached</span>
          </div>
        )}
      </div>

      <div className="form-section">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            className={validationErrors.confirmAccuracy ? "field-error" : ""}
            checked={formData.confirmAccuracy}
            onChange={(e) => {
              const isChecked = e.target.checked;
              setFormData((prev) => ({ ...prev, confirmAccuracy: isChecked }));
              setValidationErrors((prev) => ({ ...prev, confirmAccuracy: "" }));

              if (isChecked) {
                getCurrentLocation();
              } else {
                setLocationStatus("");
              }
            }}
            required 
          />
          <span>I confirm that the information is accurate and factual</span>
        </label>
        {locationStatus && <p className="field-error-message">{locationStatus}</p>}
        {validationErrors.confirmAccuracy && <p className="field-error-message">{validationErrors.confirmAccuracy}</p>}
      </div>
    </div>
  );

  // Handle photo upload
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (formData.photoFiles.length + files.length > 5) {
      alert("Maximum 5 photos allowed");
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is larger than 5MB. Please choose a smaller file.`);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          photoFiles: [...prev.photoFiles, file],
          photoPreview: [...prev.photoPreview, event.target.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  // Get GPS location
  const getCurrentLocation = () => {
    setLocationStatus("Fetching live GPS location...");

    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by this browser.");
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));
        setLocationStatus(`Live GPS location captured successfully: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      },
      (error) => {
        setLocationStatus("Unable to fetch live GPS location. Please allow location access.");
        alert("Unable to get location: " + error.message);
      }
    );
  };

  const getValidationErrors = () => {
    const errors = {};

    if (currentStep === 1 && !formData.category) {
      errors.category = "Please select a category.";
    }
    if (currentStep === 2 && !formData.description.trim()) {
      errors.description = "Please describe the issue.";
    }
    if (currentStep === 3) {
      if (!formData.address.trim()) errors.address = "Please enter a location.";
      if (!formData.wardId) errors.wardId = "Please select a ward.";
    }
    if (currentStep === 4 && !formData.confirmAccuracy) {
      errors.confirmAccuracy = "Please confirm the details are accurate.";
    }

    return errors;
  };

  const focusFirstError = (errors) => {
    const selectorMap = {
      category: ".category-btn",
      description: "textarea[aria-label='description']",
      address: "input[aria-label='location']",
      wardId: "select[aria-label='ward']",
      confirmAccuracy: "input[type='checkbox']",
    };

    const firstErrorKey = Object.keys(errors)[0];
    const selector = selectorMap[firstErrorKey];

    if (selector) {
      const element = document.querySelector(selector);
      if (element) {
        element.focus({ preventScroll: true });
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const validateStep = () => {
    const errors = getValidationErrors();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      focusFirstError(errors);
      return false;
    }

    return true;
  };

  // Handle next/previous
  const handleNext = () => {
    if (!validateStep()) {
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setValidationErrors({});
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
      return;
    }

    setLoading(true);
    try {
      // Get citizen ID from JWT token
      const citizenId = getCurrentUserId();
      
      if (!citizenId) {
        alert("User information not found. Please login again.");
        navigate("/citizen-login");
        setLoading(false);
        return;
      }

      // Validate required fields
      if (!formData.category || !formData.description.trim() || !formData.address.trim() || !formData.wardId) {
        alert("Please fill in all required fields");
        setLoading(false);
        return;
      }

      // Prepare grievance data - match backend schema
      const grievancePayload = {
        citizenId: String(citizenId),
        categoryId: String(categoryMapping[formData.category] || formData.category),
        description: String(formData.description).trim(),
        address: String(formData.address).trim(),
        wardId: String(formData.wardId),
        priority: String(formData.priority),
        // Convert coordinates to GeoJSON format if available
        gpsLocation: formData.latitude && formData.longitude 
          ? {
              type: "Point",
              coordinates: [formData.longitude, formData.latitude]
            }
          : null
      };

      console.log("📤 Submitting grievance with data:", grievancePayload);

      // Submit to backend using service
      const response = await createComplaint(grievancePayload);
      
      console.log("📥 Backend response:", response);

      const complaintId = response.id || response._id || response.complaintNumber || "Created";

      // Upload photos if any
      if (formData.photoFiles.length > 0) {
        console.log("📸 Uploading photos...");
        for (let i = 0; i < formData.photoFiles.length; i++) {
          try {
            const uploadResult = await uploadComplaintAttachment(complaintId, formData.photoFiles[i]);
            console.log(`✅ Photo ${i + 1} uploaded:`, uploadResult);
          } catch (photoError) {
            console.warn(`⚠️ Failed to upload photo ${i + 1}:`, photoError);
            // Don't stop submission if photo upload fails
          }
        }
      }

      alert(`✅ Complaint filed successfully!\n\nComplaint ID: ${complaintId}\n\n${formData.photoFiles.length > 0 ? formData.photoFiles.length + ' photo(s) uploaded' : 'No photos attached'}`);
      
      // Reset form and navigate
      setFormData({
        category: "Roads",
        description: "",
        address: "",
        wardId: "",
        priority: "MEDIUM",
        latitude: null,
        longitude: null,
        confirmAccuracy: false,
        photoFiles: [],
        photoPreview: [],
      });
      setCurrentStep(1);
      setSelectedCategoryName("");
      
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
