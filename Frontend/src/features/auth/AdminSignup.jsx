import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerAdmin } from "./authService";
import api from "../../shared/services/api";
import "./AdminSignup.css";

const COUNTRY_OPTIONS = [
  { label: "India", dialCode: "+91", flag: "🇮🇳" },
  { label: "United States", dialCode: "+1", flag: "🇺🇸" },
  { label: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { label: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { label: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { label: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { label: "France", dialCode: "+33", flag: "🇫🇷" },
  { label: "Singapore", dialCode: "+65", flag: "🇸🇬" },
];

export default function AdminSignup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState(COUNTRY_OPTIONS[0]);
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Photo upload states
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  
  const navigate = useNavigate();
  const countryDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    if (!fullName.trim() || !email.trim() || !mobile.trim() || !password || !confirmPassword) {
      return "Please fill in all fields.";
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return "Please enter a valid email address.";
    }
    const normalized = normalizePhone(mobile);
    if (!/^\+?\d{7,15}$/.test(normalized.replace(/\s+/g, ""))) {
      return "Please enter a valid phone number.";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters.";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }
    return "";
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("[AdminSignup] Photo selected:", file.name);
      setPhotoFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    console.log("[AdminSignup] Photo removed");
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRegister = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const registrationData = {
        fullName: fullName.trim(),
        email: email.trim(),
        mobile: normalizePhone(mobile),
        password,
        role: "ADMIN",
      };

      const response = await registerAdmin(registrationData);
      const userId = response?.user?.id;
      
      console.log("[AdminSignup] Registration response:", response);
      console.log("[AdminSignup] Extracted userId:", userId);
      console.log("[AdminSignup] photoFile exists:", !!photoFile);

      // Upload photo if one was selected
      if (photoFile && userId) {
        console.log("[AdminSignup] Starting photo upload for user:", userId);
        setUploadingPhoto(true);
        
        try {
          const formDataPhoto = new FormData();
          formDataPhoto.append("file", photoFile);
          
          const photoResponse = await api.post(
            `/api/users/${userId}/upload-profile-photo`,
            formDataPhoto
          );
          console.log("[AdminSignup] Photo uploaded successfully:", photoResponse.data);
          setSuccess(`Admin account created successfully with photo! Redirecting to login...`);
        } catch (photoErr) {
          console.error("[AdminSignup] Photo upload error:", photoErr);
          // Photo upload failure is not critical, still show registration success
          setSuccess(`Admin account created successfully! (Photo upload failed). Redirecting to login...`);
        } finally {
          setUploadingPhoto(false);
        }
      } else {
        setSuccess("Admin account created successfully. Redirecting to login...");
      }

      // Clear form
      setFullName("");
      setEmail("");
      setMobile("");
      setPassword("");
      setConfirmPassword("");
      setPhotoFile(null);
      setPhotoPreview("");

      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="signup-card__header">
          <div className="signup-card__badge">CRM</div>
          <h1 className="signup-card__title">Create Your Account</h1>
          <p className="signup-card__subtitle">Sign up to get started!</p>
        </div>

        <div className="signup-card__form">
          <div className="signup-card__group">
            <label className="signup-card__label">Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name"
              className="signup-card__input"
            />
          </div>

          <div className="signup-card__group">
            <label className="signup-card__label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="signup-card__input"
            />
          </div>

          <div className="signup-card__group" ref={countryDropdownRef}>
            <label className="signup-card__label">Phone Number</label>
            <div className="signup-card__phone-field">
              <button
                type="button"
                className="signup-card__country-button"
                onClick={() => setShowCountryDropdown((prev) => !prev)}
              >
                <span className="signup-card__country-flag">{country.flag}</span>
                <span className="signup-card__country-code">{country.dialCode}</span>
                <span className="signup-card__country-arrow">▾</span>
              </button>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter your phone number"
                className="signup-card__input signup-card__input--phone"
              />
            </div>
            {showCountryDropdown && (
              <div className="signup-card__country-dropdown">
                <div className="signup-card__country-search">
                  <span className="signup-card__country-search-icon">🔎</span>
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search country"
                    className="signup-card__country-search-input"
                  />
                </div>
                <div className="signup-card__country-list">
                  {countryOptions.map((option) => (
                    <button
                      type="button"
                      key={`${option.label}-${option.dialCode}`}
                      className="signup-card__country-item"
                      onClick={() => {
                        setCountry(option);
                        setShowCountryDropdown(false);
                        setCountrySearch("");
                      }}
                    >
                      <span className="signup-card__country-flag">{option.flag}</span>
                      <span className="signup-card__country-name">{option.label}</span>
                      <span className="signup-card__country-dial">{option.dialCode}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="signup-card__group">
            <label className="signup-card__label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="signup-card__input"
            />
          </div>

          <div className="signup-card__group">
            <label className="signup-card__label">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="signup-card__input"
            />
          </div>

          {/* Photo Upload Section for Admin */}
          <div className="signup-card__group">
            <label className="signup-card__label">Profile Photo (Optional)</label>
            <div className="signup-card__photo-upload">
              <input
                type="file"
                id="photo"
                ref={fileInputRef}
                name="photo"
                accept="image/*"
                onChange={handlePhotoChange}
                className="signup-card__file-input"
              />
              <label className="signup-card__file-label" htmlFor="photo">
                <span className="signup-card__upload-icon">📷</span>
                <span className="signup-card__upload-text">
                  {photoFile ? "📸 Change Photo" : "📸 Upload Photo"}
                </span>
              </label>
            </div>
            
            {photoPreview && (
              <div className="signup-card__photo-preview">
                <img
                  src={photoPreview}
                  alt="Photo preview"
                  className="signup-card__preview-image"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="signup-card__remove-photo"
                  disabled={uploadingPhoto}
                >
                  ❌ Remove
                </button>
              </div>
            )}
          </div>

          <div className="signup-card__feedback">
            {error && <span className="signup-card__error">{error}</span>}
            {success && <span className="signup-card__success">{success}</span>}
          </div>

          <button
            type="button"
            onClick={handleRegister}
            disabled={loading}
            className="signup-card__button"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          <div className="signup-card__footer">
            Already have an account?{' '}
            <button type="button" onClick={() => navigate("/admin-login")}>Log in</button>
          </div>
        </div>
      </div>
    </div>
  );
}
