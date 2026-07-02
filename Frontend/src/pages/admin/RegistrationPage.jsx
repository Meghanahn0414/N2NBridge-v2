import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../shared/services/api";
import { getUserRoles } from "../../shared/services/lookupService";
import { getAuthUser, setAuthUser } from "../../services/authStorage";
import { ROUTES } from "../../app/routes/RouteConstants";
import "./NewMLA.css";
import PageHeader from "../../components/PageHeader";

// A logged-in Representative (including a scoped admin who has completed
// their one-time "register my representative" step and is now elevated to
// this role) should only be registering THEIR OWN team here — Field
// Officers and Managers for their one MLA/MP/Councillor — not creating
// unrelated Admins, Managers-at-large, or other representatives entirely.
const SCOPE_LABELS = {
  MLA:        "MLA",
  MP:         "MP",
  COUNCILLOR: "Councillor",
};

// role value that the existing MLA/MP/Councillor registration branch
// (handleSubmit's isRepType check) expects for each scope.
const SCOPE_ROLE_VALUE = {
  MLA:        "REPRESENTATIVE",
  MP:         "MP",
  COUNCILLOR: "COUNCILLOR",
};

// Option labels are prefixed with the admin's own scope (e.g. "MLA's Field
// Officer") so it's clear whose team these roles belong to, since this page
// otherwise gives no indication that "Field Officer"/"Manager" here means
// "my MLA's Field Officer/Manager" rather than a platform-wide role.
// `includeScopeOption` also adds the scope itself (e.g. "MLA") as a
// selectable option — only relevant before the admin has registered their
// one representative (managedDbName not set yet); once that's done,
// registering another would violate the one-admin-one-representative rule.
function repTeamRoles(scope, includeScopeOption, customLabel) {
  // customLabel comes from the Admin Signup form's "Other" text box — the
  // account still runs as one of the 3 real scope values underneath, this
  // just swaps in the name the admin actually typed wherever it's shown.
  const scopeLabel = customLabel || SCOPE_LABELS[scope] || scope || "";
  const prefix = scopeLabel ? `${scopeLabel}'s ` : "";
  const options = [
    { value: "FIELD_OFFICER",        label: `${prefix}Field Officer` },
    { value: "CONSTITUENCY_MANAGER", label: `${prefix}Manager` },
  ];
  if (includeScopeOption && scopeLabel && SCOPE_ROLE_VALUE[scope]) {
    options.unshift({ value: SCOPE_ROLE_VALUE[scope], label: scopeLabel });
  }
  return options;
}

const COUNTRIES = [
  { flag: "🇮🇳", code: "IN", dial: "+91" },
  { flag: "🇺🇸", code: "US", dial: "+1" },
  { flag: "🇬🇧", code: "GB", dial: "+44" },
  { flag: "🇦🇺", code: "AU", dial: "+61" },
  { flag: "🇨🇦", code: "CA", dial: "+1" },
  { flag: "🇦🇪", code: "AE", dial: "+971" },
  { flag: "🇸🇬", code: "SG", dial: "+65" },
  { flag: "🇲🇾", code: "MY", dial: "+60" },
  { flag: "🇵🇰", code: "PK", dial: "+92" },
  { flag: "🇧🇩", code: "BD", dial: "+880" },
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
  const currentUser = getAuthUser();
  // Anyone tied to a single MLA/MP/Councillor scope — an elevated
  // Representative, or a scoped Admin who hasn't run "Register My
  // Representative" yet — only ever manages their own Field Officer/Manager
  // team here. Only an unscoped/platform-wide Admin (if one ever exists)
  // would see the full role list.
  const isRepresentative =
    currentUser?.role === "REPRESENTATIVE" ||
    (currentUser?.role === "ADMIN" && !!currentUser?.scope);
  // Once elevated to REPRESENTATIVE, the account no longer carries a
  // `scope` field (that was an Admin-only field) — but `title` holds the
  // same MLA/MP/COUNCILLOR value for any representative account, so use
  // that as the fallback so the banner/labels keep working after elevation.
  const effectiveScope = currentUser?.role === "REPRESENTATIVE" ? currentUser?.title : currentUser?.scope;
  // The scope itself (e.g. "MLA") is only offered as a selectable option
  // while still a plain ADMIN who hasn't registered their representative
  // yet — never for an already-elevated Representative, who has nothing
  // left to self-register.
  const canRegisterScope = currentUser?.role === "ADMIN" && !currentUser?.managedDbName;
  const teamRoles = repTeamRoles(effectiveScope, canRegisterScope, currentUser?.scopeLabel);

  const [role, setRole] = useState("");
  const [roles, setRoles] = useState(isRepresentative ? teamRoles : []);
  const [formData, setFormData] = useState(initialFormState);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [countryOpen, setCountryOpen] = useState(false);
  const countryRef = useRef(null);

  // Close country dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (countryRef.current && !countryRef.current.contains(e.target)) {
        setCountryOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Photo upload states
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    // /api/users/ (manager lookup) and /api/lookups/user-roles are
    // admin-facing; a Representative registering their own team doesn't
    // need either — the role list is fixed to REP_TEAM_ROLES above.
    if (isRepresentative) return;
    fetchManagers();
    fetchRoles();
  }, []);


  const fetchRoles = async () => {
    try {
      const response = await getUserRoles();
      // Backend's role list only has one generic "Representative" bucket
      // (MLA/MP/Councillor are all rep_type values under that one role, not
      // separate UserRole enum entries) — MP and Councillor are added here
      // client-side so they're selectable as their own options. register()
      // already accepts role="MP"/"COUNCILLOR" directly (see handleSubmit).
      const base = response || [];
      const extra = [
        { value: "MP", label: "MP" },
        { value: "COUNCILLOR", label: "Councillor" },
      ].filter((e) => !base.some((b) => b.value === e.value));
      setRoles([...base, ...extra]);
    } catch (err) {
      console.warn("Unable to load role options", err);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await api.get("/api/users/", {
        params: { per_page: 100, role: "CONSTITUENCY_MANAGER" },
      });
      // Backend wraps results as { items, total, page, per_page } under .data.
      const list = response.data?.data?.items ?? [];
      setManagers(list);
    } catch (err) {
      console.warn("Unable to load managers", err);
    }
  };

  // Generate Manager ID (MGR-XXXX format)
  const generateManagerId = () => {
    const randomNum = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    return `MGR-${randomNum}`;
  };

  const generateFieldOfficerId = () => {
    const randomNum = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    return `FO-${randomNum}`;
  };

  // Handle role change and auto-generate IDs if needed
  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    setRole(selectedRole);
    
    if (selectedRole === "CONSTITUENCY_MANAGER") {
      // Auto-generate Manager ID when role is selected
      const generatedId = generateManagerId();
      setFormData((prev) => ({
        ...prev,
        managerId: generatedId,
        department: "",
        officeLocation: "",
        managerCode: "",
        fieldOfficerId: "",
        assignedArea: "",
      }));
    } else if (selectedRole === "FIELD_OFFICER") {
      // Auto-generate Field Officer ID when role is selected
      const generatedId = generateFieldOfficerId();
      setFormData((prev) => ({
        ...prev,
        fieldOfficerId: generatedId,
        assignedArea: "",
        managerId: "",
      }));
    } else {
      // Clear role-specific fields for other roles
      setFormData((prev) => ({
        ...prev,
        managerId: "",
        department: "",
        officeLocation: "",
        managerCode: "",
        fieldOfficerId: "",
        assignedArea: "",
      }));
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
    if (!/^\d{10}$/.test(formData.mobile.trim())) return "Mobile number must be exactly 10 digits.";
    if (!formData.password) return "Password is required.";
    if (!formData.confirmPassword) return "Confirm password is required.";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match.";
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) return "Please enter a valid email address.";

    if (role === "CONSTITUENCY_MANAGER") {
      // Department, Office Location, and Manager Code are now optional
    }
    if (role === "FIELD_OFFICER") {
      // Assigned Area, Manager, and Field Officer ID are now optional
    }
    if (["REPRESENTATIVE", "MP", "COUNCILLOR"].includes(role) && !formData.constituencyId.trim()) {
      return role === "MP"
        ? "Parliamentary Constituency is required."
        : role === "COUNCILLOR"
        ? "Ward ID is required."
        : "Assembly Constituency is required.";
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
      // Registering the admin's OWN scope (e.g. an MLA-scoped admin picking
      // "MLA") must go through the dedicated one-time endpoint, not the
      // generic representative-registration shim below. The generic shim
      // has no concept of "this admin already has a representative" and
      // would happily create a second, disconnected representative account
      // every time it's submitted — the dedicated endpoint enforces
      // one-admin-one-representative server-side (rejects if managedDbName
      // is already set, or if the caller's role isn't ADMIN anymore).
      //
      // This admin's own login stays exactly as-is — no session swap, no
      // redirect to the Representative dashboard. They keep working from
      // the normal Admin Portal; the only change is that their account is
      // now linked (managedDbName) to the representative they just
      // registered, so it starts showing up in Citizens/Representatives/
      // Field Officers/Managers here going forward.
      const isScopeRegistration = canRegisterScope && SCOPE_ROLE_VALUE[currentUser?.scope] === role;

      if (isScopeRegistration) {
        const location = formData.constituencyId.trim();
        const repPayload = {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          mobile: selectedCountry.dial + formData.mobile.trim(),
          rep_type: currentUser.scope,
          location,
          district: formData.district.trim() || null,
          password: formData.password,
        };
        if (currentUser.scope === "MLA") repPayload.assembly_name = location;
        if (currentUser.scope === "MP") repPayload.parliamentary_name = location;
        if (currentUser.scope === "COUNCILLOR") repPayload.ward_id = location;

        console.log("[RegistrationPage] Submitting one-time representative self-registration:", { ...repPayload, password: "***" });
        const res = await api.post("/api/auth/admin/register-my-representative", repPayload);
        const data = res.data?.data ?? res.data;

        // Still logged in as the same Admin — just record that they now
        // manage this representative, so canRegisterScope/effectiveScope
        // on this and other admin pages reflect it without a re-login.
        setAuthUser({ ...currentUser, managedDbName: data.managedDbName });
        setSuccess(`${currentUser.scopeLabel || SCOPE_LABELS[currentUser.scope] || currentUser.scope} registered — you can now manage them from your Admin Portal.`);
        setError("");
        setFormData(initialFormState);
        setPhotoFile(null);
        setPhotoPreview("");
        setRole("");
        setSelectedCountry(COUNTRIES[0]);
        setLoading(false);
        return;
      }

      const isRepType = ["REPRESENTATIVE", "MP", "COUNCILLOR"].includes(role);
      let registrationResponse;

      if (isRepType) {
        // MLA/MP/Councillor go through the dedicated representative
        // registration endpoint — it's the one that actually persists
        // assembly_name/parliamentary_name/ward_id/district/state (the
        // legacy /api/auth/register shim silently drops all of that, which
        // was making these accounts permanently unreachable by citizens).
        const repType = role === "REPRESENTATIVE" ? "MLA" : role;
        const location = formData.constituencyId.trim();
        const repPayload = {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          mobile: selectedCountry.dial + formData.mobile.trim(),
          rep_type: repType,
          location,
          district: formData.district.trim() || null,
          password: formData.password,
        };
        if (repType === "MLA") repPayload.assembly_name = location;
        if (repType === "MP") repPayload.parliamentary_name = location;
        if (repType === "COUNCILLOR") repPayload.ward_id = location;

        console.log("[RegistrationPage] Submitting representative registration:", { ...repPayload, password: "***" });
        registrationResponse = await api.post("/api/auth/representative/register", repPayload);
      } else if (isRepresentative && ["FIELD_OFFICER", "CONSTITUENCY_MANAGER"].includes(role)) {
        // A Representative's own Field Officer/Manager must live in THEIR
        // tenant database (the /api/staff/ collection), not the master DB
        // that /api/auth/register writes to below. That mismatch was
        // invisible at registration time (it "succeeded") but made the
        // person permanently unreachable from anywhere that queries the
        // rep's own tenant data — e.g. the Complaint Management "Reassign"
        // dropdown, which looks for tenant-scoped staff and would always
        // come up empty for anyone registered the old way.
        const staffPayload = {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          mobile: selectedCountry.dial + formData.mobile.trim(),
          password: formData.password,
          designation: role === "CONSTITUENCY_MANAGER" ? "Manager" : "Field Officer",
        };
        console.log("[RegistrationPage] Submitting team member to /api/staff/:", { ...staffPayload, password: "***" });
        registrationResponse = await api.post("/api/staff/", staffPayload);
      } else {
        const payload = {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          mobile: selectedCountry.dial + formData.mobile.trim(),
          address: formData.address.trim() || null,
          password: formData.password,
          role,
        };
        if (role === "CONSTITUENCY_MANAGER") {
          payload.managerId = formData.managerId.trim();
        }
        if (role === "FIELD_OFFICER") {
          payload.assignedArea = formData.assignedArea.trim();
          payload.managerId = formData.managerId.trim();
          payload.fieldOfficerId = formData.fieldOfficerId.trim();
        }

        console.log("[RegistrationPage] Submitting registration with payload:", { ...payload, password: "***" });
        registrationResponse = await api.post("/api/auth/register", payload);
      }

      console.log("[RegistrationPage] Registration response:", registrationResponse.data);
      const userId = registrationResponse.data?.user?.id ?? registrationResponse.data?.data?.user?.id;
      
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
      setSelectedCountry(COUNTRIES[0]);

      // Navigate back to the appropriate list page after successful registration
      if (role === "CONSTITUENCY_MANAGER") {
        navigate(ROUTES.managerList);
      } else {
        navigate(ROUTES.rolePermissions, { state: { selectedRole: role } });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || err.message || "Failed to register user.";
      setError(errorMessage);
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader subtitle="Register new staff and administrators" />
      <div className="new-mla-container">
      <div className="new-mla-card">
        <form onSubmit={handleSubmit} className="new-mla-form">
          {error && <div className="new-mla-alert new-mla-alert--error">{error}</div>}
          {success && <div className="new-mla-alert new-mla-alert--success">{success}</div>}

          {isRepresentative && effectiveScope && (
            <div
              style={{
                margin: "0 0 20px",
                padding: "10px 14px",
                borderRadius: 10,
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                fontSize: 13,
                color: "#1d4ed8",
                fontWeight: 600,
              }}
            >
              Registered as: {currentUser?.scopeLabel || SCOPE_LABELS[effectiveScope] || effectiveScope}
              {canRegisterScope
                ? ` — register your ${currentUser?.scopeLabel || SCOPE_LABELS[effectiveScope] || effectiveScope} first, then add Field Officers and Managers.`
                : " — you can only add Field Officers and Managers to this team."}
            </div>
          )}

          <div className="new-mla-group">
            <label className="new-mla-label" htmlFor="role">Role *</label>
            <select
              id="role"
              name="role"
              className="new-mla-input"
              value={role}
              onChange={handleRoleChange}
            >
              <option value="">Select Role</option>
              {(isRepresentative ? teamRoles : roles).filter((option) => !["VOLUNTEER", "CITIZEN"].includes(option.value)).map((option) => (
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
            <div className="new-mla-phone-field" style={{ position: "relative" }} ref={countryRef}>
              <button
                type="button"
                className="new-mla-country-button"
                onClick={() => setCountryOpen((o) => !o)}
                style={{ whiteSpace: "nowrap", flexShrink: 0 }}
              >
                <span className="new-mla-country-flag">{selectedCountry.flag}</span>
                <span>{selectedCountry.dial}</span>
                <span className="new-mla-country-arrow">▾</span>
              </button>

              {countryOpen && (
                <div className="new-mla-country-dropdown">
                  <ul className="new-mla-country-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {COUNTRIES.map((c) => (
                      <li
                        key={c.code + c.dial}
                        className="new-mla-country-item"
                        onClick={() => { setSelectedCountry(c); setCountryOpen(false); }}
                      >
                        <span>{c.flag} {c.code}</span>
                        <span className="new-mla-country-dial">{c.dial}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setFormData((prev) => ({ ...prev, mobile: digits }));
                }}
                placeholder="10-digit number"
                className="new-mla-input"
                maxLength={10}
                inputMode="numeric"
              />
            </div>
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

          {["REPRESENTATIVE", "MP", "COUNCILLOR"].includes(role) && (
            <>
              <div style={{ margin: "24px 0 16px", fontWeight: 700, color: "#1f2937" }}>
                {role === "MP" ? "MP Details" : role === "COUNCILLOR" ? "Councillor Details" : "MLA Details"}
              </div>
              <div className="new-mla-group">
                <label className="new-mla-label">
                  {role === "MP" ? "Parliamentary Constituency *" : role === "COUNCILLOR" ? "Ward ID *" : "Assembly Constituency *"}
                </label>
                <input
                  type="text"
                  name="constituencyId"
                  value={formData.constituencyId}
                  onChange={handleInputChange}
                  placeholder={role === "MP" ? "Enter parliamentary constituency" : role === "COUNCILLOR" ? "Enter ward ID" : "Enter assembly constituency"}
                  className="new-mla-input"
                  required
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
                <label className="new-mla-label">Manager ID</label>
                <input
                  type="text"
                  value={formData.managerId}
                  disabled
                  placeholder="Auto-generated when role selected"
                  className="new-mla-input"
                  style={{ backgroundColor: "#f3f4f6", cursor: "not-allowed", fontWeight: 600, color: "#1f2937" }}
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
                  value={formData.fieldOfficerId}
                  disabled
                  placeholder="Auto-generated when role selected"
                  className="new-mla-input"
                  style={{ backgroundColor: "#f3f4f6", cursor: "not-allowed", fontWeight: 600, color: "#1f2937" }}
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
    </div>
  );
}
