import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CitizenPageLayout from "./CitizenPageLayout";
import {
  getCitizenComplaints,
  fetchComplaintCategories,
  mapCategoryName,
} from "../../features/complaints/complaintService";

export default function ComplaintList() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [complaintData, categoryData] = await Promise.all([
          getCitizenComplaints(),
          fetchComplaintCategories(),
        ]);
        setComplaints(complaintData);
        setCategories(categoryData);
      } catch (err) {
        setError(err.message || "Unable to load complaints.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <CitizenPageLayout
      title="My Complaints"
      subtitle="Track all complaints you have submitted."
      action={
        <button
          type="button"
          onClick={() => navigate("/citizen/create-complaint")}
          className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + New Complaint
        </button>
      }
      maxWidth="max-w-5xl"
    >
      {loading ? (
          <div className="py-20 text-center text-slate-500">Loading complaints...</div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
        ) : complaints.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
            No complaints found. Create one to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <button
                key={complaint.id}
                type="button"
                onClick={() => navigate(`/citizen/complaints/${complaint.id}`)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 p-6 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{complaint.complaintNumber}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">
                      {mapCategoryName(complaint.categoryId, categories)}
                    </h2>
                  </div>
                  <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                    {complaint.status.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="mt-3 text-sm text-slate-600">
                  <p>{complaint.description}</p>
                  <p className="mt-2 text-slate-500">Ward: {complaint.wardId || "N/A"}</p>
                </div>
              </button>
            ))}
          </div>
        )}
    </CitizenPageLayout>
  );
}
