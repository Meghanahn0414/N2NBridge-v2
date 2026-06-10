import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CitizenPageLayout from "./CitizenPageLayout";
import {
  fetchComplaintCategories,
  createComplaint,
  uploadComplaintAttachment,
  getCurrentUserId,
} from "../../features/complaints/complaintService";

export default function CreateComplaint() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    categoryId: "",
    description: "",
    address: "",
    wardId: "",
    priority: "LOW",
    attachment: null,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      try {
        const result = await fetchComplaintCategories();
        setCategories(result);
      } catch (err) {
        console.error(err);
      }
    }

    loadCategories();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.categoryId || !form.description.trim() || !form.address.trim() || !form.wardId.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const citizenId = getCurrentUserId();
      if (!citizenId) {
        throw new Error("Unable to identify current user.");
      }

      const payload = {
        categoryId: form.categoryId,
        description: form.description,
        address: form.address,
        wardId: form.wardId,
        priority: form.priority,
        citizenId,
      };

      const response = await createComplaint(payload);
      const complaintId = response.id || response._id;

      if (!complaintId) {
        throw new Error("Complaint created successfully, but the server did not return a valid complaint ID.");
      }

      if (form.attachment) {
        await uploadComplaintAttachment(complaintId, form.attachment);
      }

      setSuccess("Complaint submitted successfully.");
      setForm({ categoryId: "", description: "", address: "", wardId: "", priority: "LOW", attachment: null });
      navigate(`/citizen/complaints/${complaintId}`);
    } catch (err) {
      setError(err.message || "Unable to submit complaint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CitizenPageLayout
      title="Register Complaint"
      subtitle="Submit a new civic grievance and track it from your dashboard."
      action={
        <button
          type="button"
          onClick={() => navigate("/citizen/complaints")}
          className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
        >
          View My Complaints
        </button>
      }
      maxWidth="max-w-3xl"
    >
      <div className="grid gap-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Category *</span>
            <select
              value={form.categoryId}
              onChange={(e) => handleChange("categoryId", e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Description *</span>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={5}
              placeholder="Describe the issue in detail"
              className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Address *</span>
            <input
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Street, landmark, area"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Ward *</span>
            <input
              value={form.wardId}
              onChange={(e) => handleChange("wardId", e.target.value)}
              placeholder="Ward number or name"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Priority</span>
            <select
              value={form.priority}
              onChange={(e) => handleChange("priority", e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Upload Image</span>
            <input
              type="file"
              onChange={(e) => handleChange("attachment", e.target.files?.[0] || null)}
              className="mt-2 w-full text-sm text-slate-900"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>
        </div>
    </CitizenPageLayout>
  );
}
