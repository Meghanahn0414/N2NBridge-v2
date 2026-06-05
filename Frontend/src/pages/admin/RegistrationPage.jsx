import React, { useState, useEffect } from "react";
import api from "../../shared/services/api";
import "./NewMLA.css";

const roleOptions = [
  { value: "REPRESENTATIVE", label: "MLA" },
  { value: "MANAGER", label: "Manager" },
  { value: "FIELD_OFFICER", label: "Field Officer" },
];

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
  const [formData, setFormData] = useState(initialFormState);
  const [constituencies, setConstituencies] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchConstituencies();
    fetchManagers();
  }, []);

  const normalizePhone = (value) => {
    const raw = value.trim().replace(/\s+/g, "");
    if (!raw) return "";
    if (raw.startsWith("+")) return raw;
    return raw.startsWith("0") ? `+${raw.replace(/^0+/, "")}` : `+91${raw}`;
  };

  const fetchConstituencies = async () => {
    try {
      const response = await api.get("/api/users/constituencies");
      if (response.data) {
        setConstituencies(response.data);
      }
    } catch (err) {
      console.warn("Unable to load constituencies", err);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await api.get("/api/users", {
        params: { per_page: 200, role: "MANAGER" },
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

    if (role === "REPRESENTATIVE") {
      if (!formData.constituencyId) return "Constituency is required for MLA.";
      if (!formData.partyName.trim()) return "Party Name is required for MLA.";
      if (!formData.district.trim()) return "District is required for MLA.";
    }
    if (role === "MANAGER") {
      if (!formData.department.trim()) return "Department is required for Manager.";
      if (!formData.officeLocation.trim()) return "Office Location is required for Manager.";
      if (!formData.managerCode.trim()) return "Manager Code is required.";
    }
    if (role === "FIELD_OFFICER") {
      if (!formData.assignedArea.trim()) return "Assigned Area is required for Field Officer.";
      if (!formData.managerId) return "Manager is required for Field Officer.";
      if (!formData.fieldOfficerId.trim()) return "Field Officer ID is required.";
    }

    return "";
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
        payload.constituencyId = formData.constituencyId;
        payload.partyName = formData.partyName.trim();
        payload.district = formData.district.trim();
      }
      if (role === "MANAGER") {
        payload.department = formData.department.trim();
        payload.officeLocation = formData.officeLocation.trim();
        payload.managerCode = formData.managerCode.trim();
      }
      if (role === "FIELD_OFFICER") {
        payload.assignedArea = formData.assignedArea.trim();
        payload.managerId = formData.managerId;
        payload.fieldOfficerId = formData.fieldOfficerId.trim();
      }

      await api.post("/api/auth/register", payload);
      setSuccess(`${roleOptions.find((option) => option.value === role)?.label || "User"} registered successfully!`);
      setError("");
      setFormData(initialFormState);
      setRole("");
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
              {roleOptions.map((option) => (
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
                <label className="new-mla-label">Constituency *</label>
                <select
                  name="constituencyId"
                  value={formData.constituencyId}
                  onChange={handleInputChange}
                  className="new-mla-input"
                >
                  <option value="">Select constituency</option>
                  {constituencies.map((item) => (
                    <option key={item._id || item.id} value={item._id || item.id}>
                      {item.name} {item.district ? `(${item.district})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="new-mla-group">
                <label className="new-mla-label">Party Name *</label>
                <input
                  type="text"
                  name="partyName"
                  value={formData.partyName}
                  onChange={handleInputChange}
                  placeholder="Enter party name"
                  className="new-mla-input"
                />
              </div>
              <div className="new-mla-group">
                <label className="new-mla-label">District *</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="Enter district"
                  className="new-mla-input"
                />
              </div>
            </>
          )}

          {role === "MANAGER" && (
            <>
              <div style={{ margin: "24px 0 16px", fontWeight: 700, color: "#1f2937" }}>Manager Details</div>
              <div className="new-mla-group">
                <label className="new-mla-label">Department *</label>
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
                <label className="new-mla-label">Office Location *</label>
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
                <label className="new-mla-label">Manager Code *</label>
                <input
                  type="text"
                  name="managerCode"
                  value={formData.managerCode}
                  onChange={handleInputChange}
                  placeholder="Enter manager code"
                  className="new-mla-input"
                />
              </div>
            </>
          )}

          {role === "FIELD_OFFICER" && (
            <>
              <div style={{ margin: "24px 0 16px", fontWeight: 700, color: "#1f2937" }}>Field Officer Details</div>
              <div className="new-mla-group">
                <label className="new-mla-label">Assigned Area *</label>
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
                <label className="new-mla-label">Manager *</label>
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
                <label className="new-mla-label">Field Officer ID *</label>
                <input
                  type="text"
                  name="fieldOfficerId"
                  value={formData.fieldOfficerId}
                  onChange={handleInputChange}
                  placeholder="Enter field officer ID"
                  className="new-mla-input"
                />
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
