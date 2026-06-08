import React, { useState, useEffect, useRef } from "react";
import api from "../../shared/services/api";
import "./NewMLA.css";

const COUNTRY_OPTIONS = [
  { label: "India", dialCode: "+91", flag: "🇮🇳" },
  { label: "United States", dialCode: "+1", flag: "🇺🇸" },
  { label: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { label: "Australia", dialCode: "+61", flag: "🇦🇺" },
];

export default function NewMLA() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    constituencyId: "",
    address: "",
    password: "",
    confirmPassword: "",
    profileImage: null,
  });

  const [photoPreview, setPhotoPreview] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [constituencies, setConstituencies] = useState([]);
  const [country, setCountry] = useState(COUNTRY_OPTIONS[0]);
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const countryDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch constituencies on component mount
  useEffect(() => {
    fetchConstituencies();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchConstituencies = async () => {
    try {
      const response = await api.get("/api/users/constituencies");
      if (response.data && response.data.data) {
        setConstituencies(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch constituencies:", err);
      // Silently fail, constituencies are optional
    }
  };

  const countryOptions = COUNTRY_OPTIONS.filter((opt) =>
    opt.label.toLowerCase().includes(countrySearch.toLowerCase()) ||
    opt.dialCode.includes(countrySearch)
  );

  const normalizePhone = (value) => {
    const raw = value.trim().replace(/\s+/g, "");
    if (!raw) return "";
    if (raw.startsWith("+")) {
      return raw;
    }
    const digits = raw.replace(/^0+/, "");
    return `${country.dialCode}${digits}`;
  };

  const validateForm = () => {
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.mobile.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      return "Please fill in all required fields.";
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      return "Please enter a valid email address.";
    }
    const normalized = normalizePhone(formData.mobile);
    if (!/^\+?\d{7,15}$/.test(normalized.replace(/\s+/g, ""))) {
      return "Please enter a valid phone number (7-15 digits).";
    }
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters.";
    }
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match.";
    }
    return "";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      
      // Store the file object for later upload
      setPhotoFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result;
        setPhotoPreview(base64String);
        setFormData((prev) => ({
          ...prev,
          profileImage: base64String,
        }));
        setError("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview("");
    setPhotoFile(null);
    setFormData((prev) => ({
      ...prev,
      profileImage: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);
    let photoUploadFailed = false;
    let photoUploadError = "";

    try {
      // Step 1: Register user without photo
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        mobile: normalizePhone(formData.mobile),
        role: "REPRESENTATIVE",
        constituencyId: formData.constituencyId || null,
        address: formData.address.trim() || null,
        password: formData.password,
      };

      const response = await api.post("/api/auth/register", payload);
      const newUserId = response.data.user.id;

      // Step 2: Upload photo if selected
      if (photoFile) {
        setUploadingPhoto(true);
        try {
          const formDataWithFile = new FormData();
          formDataWithFile.append("file", photoFile);

          console.log("[NewMLA] Uploading photo for user:", newUserId, "File:", photoFile.name, "Size:", photoFile.size);
          
          const uploadResponse = await api.post(`/api/users/${newUserId}/upload-profile-photo`, formDataWithFile);
          
          console.log("[NewMLA] Photo uploaded successfully:", uploadResponse.data);
        } catch (uploadErr) {
          const uploadErrorMsg = uploadErr.response?.data?.detail || 
                                uploadErr.response?.data?.message || 
                                uploadErr.message || 
                                "Failed to upload photo";
          console.error("[NewMLA] Photo upload failed:", uploadErrorMsg, uploadErr);
          
          photoUploadFailed = true;
          photoUploadError = uploadErrorMsg;
        }
        setUploadingPhoto(false);
      }
      
      // Show appropriate success/warning message
      if (photoUploadFailed) {
        setSuccess(""); // Clear any success message
        setError(`⚠️ MLA registered successfully, but photo upload failed: ${photoUploadError}`);
      } else {
        setSuccess("✅ MLA registered successfully!" + (photoFile ? " Photo uploaded." : ""));
        setError(""); // Clear any error messages
      }
      
      setFormData({
        fullName: "",
        email: "",
        mobile: "",
        constituencyId: "",
        address: "",
        password: "",
        confirmPassword: "",
        profileImage: null,
      });
      setPhotoPreview("");
      setPhotoFile(null);
      
      // Clear messages after 4 seconds if photo upload failed, 3 seconds if successful
      setTimeout(() => {
        setSuccess("");
        if (photoUploadFailed) {
          setError("");
        }
      }, photoUploadFailed ? 4000 : 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error?.details ||
                          err.message ||
                          "Failed to register MLA. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="new-mla-container">
      <div className="new-mla-card">
        <div className="new-mla-header">
          <h1 className="new-mla-title">Register New MLA</h1>
          <p className="new-mla-subtitle">Add a new Member of Legislative Assembly to the system</p>
        </div>

        <form onSubmit={handleSubmit} className="new-mla-form">
          {error && <div className="new-mla-alert new-mla-alert--error">{error}</div>}
          {success && <div className="new-mla-alert new-mla-alert--success">{success}</div>}

          {/* Full Name */}
          <div className="new-mla-group">
            <label className="new-mla-label">Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Enter full name"
              className="new-mla-input"
              required
            />
          </div>

          {/* Email */}
          <div className="new-mla-group">
            <label className="new-mla-label">Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email address"
              className="new-mla-input"
              required
            />
          </div>

          {/* Phone Number */}
          <div className="new-mla-group" ref={countryDropdownRef}>
            <label className="new-mla-label">Phone Number *</label>
            <div className="new-mla-phone-field">
              <button
                type="button"
                className="new-mla-country-button"
                onClick={() => setShowCountryDropdown((prev) => !prev)}
              >
                <span className="new-mla-country-flag">{country.flag}</span>
                <span className="new-mla-country-code">{country.dialCode}</span>
                <span className="new-mla-country-arrow">▾</span>
              </button>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                className="new-mla-input new-mla-input--phone"
                required
              />
              {showCountryDropdown && (
                <div className="new-mla-country-dropdown">
                  <input
                    type="text"
                    placeholder="Search country..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="new-mla-country-search"
                    autoFocus
                  />
                  <div className="new-mla-country-list">
                    {countryOptions.map((opt) => (
                      <div
                        key={opt.label}
                        className="new-mla-country-item"
                        onClick={() => {
                          setCountry(opt);
                          setShowCountryDropdown(false);
                          setCountrySearch("");
                        }}
                      >
                        <span className="new-mla-country-flag">{opt.flag}</span>
                        <span>{opt.label}</span>
                        <span className="new-mla-country-dial">{opt.dialCode}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Constituency */}
          <div className="new-mla-group">
            <label className="new-mla-label">Constituency</label>
            <select
              name="constituencyId"
              value={formData.constituencyId}
              onChange={handleInputChange}
              className="new-mla-input"
            >
              <option value="">-- Select Constituency (Optional) --</option>
              {constituencies.map((constituency) => (
                <option key={constituency._id || constituency.id} value={constituency._id || constituency.id}>
                  {constituency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div className="new-mla-group">
            <label className="new-mla-label">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter address (optional)"
              className="new-mla-input new-mla-textarea"
              rows="3"
            ></textarea>
          </div>

          {/* Photo Upload */}
          <div className="new-mla-group">
            <label className="new-mla-label">Photo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="new-mla-file-input"
              style={{ display: "none" }}
            />
            {photoPreview ? (
              <div className="new-mla-photo-preview">
                <img src={photoPreview} alt="Preview" className="new-mla-photo-img" />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="new-mla-remove-photo"
                >
                  Remove Photo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="new-mla-upload-button"
              >
                + Upload Photo
              </button>
            )}
          </div>

          {/* Password */}
          <div className="new-mla-group">
            <label className="new-mla-label">Password *</label>
            <div className="new-mla-password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password (min 6 characters)"
                className="new-mla-input"
                required
              />
              <button
                type="button"
                className="new-mla-toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="new-mla-group">
            <label className="new-mla-label">Confirm Password *</label>
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm password"
              className="new-mla-input"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || uploadingPhoto}
            className="new-mla-submit"
          >
            {uploadingPhoto ? "Uploading photo..." : loading ? "Registering..." : "Register MLA"}
          </button>
        </form>

        <div className="new-mla-footer">
          <p className="new-mla-footer-text">
            * Required fields
          </p>
        </div>
      </div>
    </div>
  );
}
