import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../shared/services/api";
import { getUserRoles } from "../../shared/services/lookupService";
import { ROUTES } from "../../app/routes/RouteConstants";
import "./NewMLA.css";

const initialFormState = {
  fullName: "",
  mobile: "",
  email: "",
  address: "",
  password: "",
  confirmPassword: "",
  constituencyId: "",
  partyName: "",
  district: "",
  department: "",
  officeLocation: "",
  managerCode: "",
  assignedArea: "",
  managerId: "",
  fieldOfficerId: "",
};

export default function RegistrationPage() {
  const [role, setRole] = useState("");
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Photo upload states
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchManagers();
    fetchRoles();
  }, []);

  const normalizePhone = (value) => {
    const raw = value.trim().replace(/\s+/g, "");
    if (!raw) return "";
    if (raw.startsWith("+")) return raw;
    return raw.startsWith("0") ? `+${raw.replace(/^0+/, "")}` : `+91${raw}`;
  };

  const fetchRoles = async () => {
    try {
      const response = await getUserRoles();
      setRoles(response || []);
    } catch (err) {
      console.warn("Unable to load role options", err);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await api.get("/api/users/", {
        params: { per_page: 100, role: "CONSTITUENCY_MANAGER" },
      });
      if (response.data) {
        setManagers(response.data);
      }
    } catch (err) {
      console.warn("Unable to load managers", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!role) return "Please select a role.";
    if (!formData.fullName.trim()) return "Name is required.";
    if (!formData.email.trim()) return "Email is required.";
    if (!formData.mobile.trim()) return "Mobile number is required.";
    if (!formData.password) return "Password is required.";
    if (!formData.confirmPassword) return "Confirm password is required.";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match.";
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) return "Please enter a valid email address.";
    const normalized = normalizePhone(formData.mobile);
    if (!/^\+?\d{7,15}$/.test(normalized.replace(/\s+/g, ""))) {
      return "Please enter a valid phone number.";
    }

    if (role === "CONSTITUENCY_MANAGER") {
      // Department, Office Location, and Manager Code are now optional
    }
    if (role === "FIELD_OFFICER") {
      // Assigned Area, Manager, and Field Officer ID are now optional
    }

    return "";
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("[RegistrationPage] Photo selected:", file.name);
      setPhotoFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    console.log("[RegistrationPage] Photo removed");
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        mobile: normalizePhone(formData.mobile),
        address: formData.address.trim() || null,
        password: formData.password,
        role,
      };

      if (role === "REPRESENTATIVE") {
        if (formData.constituencyId.trim()) payload.constituencyId = formData.constituencyId.trim();
        if (formData.partyName.trim()) payload.partyName = formData.partyName.trim();
        if (formData.district.trim()) payload.district = formData.district.trim();
      }
      if (role === "CONSTITUENCY_MANAGER") {
        payload.department = formData.department.trim();
        payload.officeLocation = formData.officeLocation.trim();
        payload.managerCode = formData.managerCode.trim();
      }
      if (role === "FIELD_OFFICER") {
        payload.assignedArea = formData.assignedArea.trim();
        payload.managerId = formData.managerId;
        payload.fieldOfficerId = formData.fieldOfficerId.trim();
      }

      // Register the user and get the userId
      const registrationResponse = await api.post("/api/auth/register", payload);
      const userId = registrationResponse.data?.user?.id;
      
      console.log("[RegistrationPage] Full registration response:", registrationResponse);
      console.log("[RegistrationPage] Extracted userId:", userId);
      console.log("[RegistrationPage] photoFile exists:", !!photoFile);

      // Upload photo if one was selected
      if (photoFile && userId) {
        console.log("[RegistrationPage] Starting photo upload for user:", userId);
        setUploadingPhoto(true);
        
        try {
          const formDataPhoto = new FormData();
          formDataPhoto.append("file", photoFile);
          
          const photoResponse = await api.post(`/api/users/${userId}/upload-profile-photo`, formDataPhoto);
          console.log("[RegistrationPage] Photo uploaded successfully:", photoResponse.data);
          setSuccess(`${roles.find((option) => option.value === role)?.label || "User"} registered with photo!`);
        } catch (photoErr) {
          console.error("[RegistrationPage] Photo upload error:", photoErr);
          // Photo upload failure is not critical, still show registration success
          setSuccess(`${roles.find((option) => option.value === role)?.label || "User"} registered successfully! (Photo upload failed)`);
        } finally {
          setUploadingPhoto(false);
        }
      } else {
        setSuccess(`${roles.find((option) => option.value === role)?.label || "User"} registered successfully!`);
      }

      setError("");
      setFormData(initialFormState);
      setPhotoFile(null);
      setPhotoPreview("");
      setRole("");

      navigate(ROUTES.rolePermissions, { state: { selectedRole: role } });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || err.message || "Failed to register user.";
      setError(errorMessage);
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-mla-container">
      <div className="new-mla-card">
        <div className="new-mla-header">
          <h1 className="new-mla-title">Registration</h1>
          <p className="new-mla-subtitle">Register a new MLA, Manager, or Field Officer from one unified form.</p>
        </div>

        <form onSubmit={handleSubmit} className="new-mla-form">
          {error && <div className="new-mla-alert new-mla-alert--error">{error}</div>}
          {success && <div className="new-mla-alert new-mla-alert--success">{success}</div>}

          <div className="new-mla-group">
            <label className="new-mla-label" htmlFor="role">Role *</label>
            <select
              id="role"
              name="role"
              className="new-mla-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Select Role</option>
              {roles.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="new-mla-group">
            <label className="new-mla-label">Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Enter full name"
              className="new-mla-input"
            />
          </div>

          <div className="new-mla-group">
            <label className="new-mla-label">Mobile Number *</label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              placeholder="Enter mobile number"
              className="new-mla-input"
            />
          </div>

          <div className="new-mla-group">
            <label className="new-mla-label">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email address"
              className="new-mla-input"
            />
          </div>

          <div className="new-mla-group">
            <label className="new-mla-label">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter address"
              className="new-mla-input new-mla-textarea"
              rows="3"
            />
          </div>

          <div className="new-mla-group">
            <label className="new-mla-label">Password *</label>
            <div className="new-mla-password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                className="new-mla-input"
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

          <div className="new-mla-group">
            <label className="new-mla-label">Confirm Password *</label>
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm password"
              className="new-mla-input"
            />
          </div>

          {role === "REPRESENTATIVE" && (
            <>
              <div style={{ margin: "24px 0 16px", fontWeight: 700, color: "#1f2937" }}>MLA Details</div>
              <div className="new-mla-group">
                <label className="new-mla-label">Constituency </label>
                <input
                  type="text"
                  name="constituencyId"
                  value={formData.constituencyId}
                  onChange={handleInputChange}
                  placeholder="Enter constituency"
                  className="new-mla-input"
                />
              </div>
              <div className="new-mla-group">
                <label className="new-mla-label">District</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="Enter district"
                  className="new-mla-input"
                />
              </div>
              <div className="new-mla-group">
                <label className="new-mla-label">Upload Photo</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  name="photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="new-mla-input"
                />
                {photoPreview && (
                  <div style={{ marginTop: "16px" }}>
                    <img
                      src={photoPreview}
                      alt="Photo preview"
                      style={{ maxWidth: "150px", maxHeight: "150px", borderRadius: "8px" }}
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      style={{
                        marginTop: "8px",
                        padding: "8px 16px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {role === "CONSTITUENCY_MANAGER" && (
            <>
              <div style={{ margin: "24px 0 16px", fontWeight: 700, color: "#1f2937" }}>Manager Details</div>
              <div className="new-mla-group">
                <label className="new-mla-label">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="Enter department"
                  className="new-mla-input"
                />
              </div>
              <div className="new-mla-group">
                <label className="new-mla-label">Office Location</label>
                <input
                  type="text"
                  name="officeLocation"
                  value={formData.officeLocation}
                  onChange={handleInputChange}
                  placeholder="Enter office location"
                  className="new-mla-input"
                />
              </div>
              <div className="new-mla-group">
                <label className="new-mla-label">Manager Code</label>
                <input
                  type="text"
                  name="managerCode"
                  value={formData.managerCode}
                  onChange={handleInputChange}
                  placeholder="Enter manager code"
                  className="new-mla-input"
                />
              </div>
              <div className="new-mla-group">
                <label className="new-mla-label">Upload Photo</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  name="photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="new-mla-input"
                />
                {photoPreview && (
                  <div style={{ marginTop: "16px" }}>
                    <img
                      src={photoPreview}
                      alt="Photo preview"
                      style={{ maxWidth: "150px", maxHeight: "150px", borderRadius: "8px" }}
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      style={{
                        marginTop: "8px",
                        padding: "8px 16px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {role === "FIELD_OFFICER" && (
            <>
              <div style={{ margin: "24px 0 16px", fontWeight: 700, color: "#1f2937" }}>Field Officer Details</div>
              <div className="new-mla-group">
                <label className="new-mla-label">Assigned Area</label>
                <input
                  type="text"
                  name="assignedArea"
                  value={formData.assignedArea}
                  onChange={handleInputChange}
                  placeholder="Enter assigned area"
                  className="new-mla-input"
                />
              </div>
              <div className="new-mla-group">
                <label className="new-mla-label">Manager</label>
                <select
                  name="managerId"
                  value={formData.managerId}
                  onChange={handleInputChange}
                  className="new-mla-input"
                >
                  <option value="">Select manager</option>
                  {managers.map((manager) => (
                    <option key={manager._id || manager.id} value={manager._id || manager.id}>
                      {manager.fullName || manager.name} - {manager.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="new-mla-group">
                <label className="new-mla-label">Field Officer ID</label>
                <input
                  type="text"
                  name="fieldOfficerId"
                  value={formData.fieldOfficerId}
                  onChange={handleInputChange}
                  placeholder="Enter field officer ID"
                  className="new-mla-input"
                />
              </div>
              <div className="new-mla-group">
                <label className="new-mla-label">Upload Photo</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  name="photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="new-mla-input"
                />
                {photoPreview && (
                  <div style={{ marginTop: "16px" }}>
                    <img
                      src={photoPreview}
                      alt="Photo preview"
                      style={{ maxWidth: "150px", maxHeight: "150px", borderRadius: "8px" }}
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      style={{
                        marginTop: "8px",
                        padding: "8px 16px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="new-mla-submit">
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="new-mla-footer">
          <p className="new-mla-footer-text">* Required fields</p>
        </div>
      </div>
    </div>
  );
}
