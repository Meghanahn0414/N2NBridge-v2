import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CitizenPageLayout from "./CitizenPageLayout";
import {
  getCitizenComplaints,
  fetchComplaintCategories,
  mapCategoryName,
  getCurrentUserId,
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
        const userId = getCurrentUserId();
        
        if (!userId) {
          setError("No user ID found. Please login again.");
          setLoading(false);
          return;
        }

        const [complaintData, categoryData] = await Promise.all([
          getCitizenComplaints(),
          fetchComplaintCategories(),
        ]);

        const complaintsArray = Array.isArray(complaintData)
          ? complaintData
          : Array.isArray(complaintData?.data)
          ? complaintData.data
          : [];

        const categoriesArray = Array.isArray(categoryData)
          ? categoryData
          : Array.isArray(categoryData?.data)
          ? categoryData.data
          : [];

        setComplaints(complaintsArray);
        setCategories(categoriesArray);
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
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
              No complaints found. Create one to get started.
            </div>

          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Complaint ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Ward
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {complaints.map((complaint, index) => {
                    const complaintId = complaint.id || complaint._id || complaint.complaintNumber || String(index);
                    const complaintKey = complaint.id || complaint._id || complaint.complaintNumber || `row-${index}`;
                    const complaintLinkId = complaint.id || complaint._id || complaintId;
                    const complaintStatus = complaint.status ? complaint.status.replace(/_/g, " ") : "Unknown";

                    return (
                      <tr
                        key={complaintKey}
                        onClick={() => navigate(`/citizen/complaints/${complaintLinkId}`)}
                        className="cursor-pointer hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 text-sm text-slate-900">{complaint.complaintNumber || complaintId}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                          {complaintStatus}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {mapCategoryName(complaint.categoryId, categories)}
                        </td>
                        <td className="px-6 py-4 max-w-xl truncate text-sm text-slate-700">
                          {complaint.description || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">{complaint.wardId || "N/A"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </CitizenPageLayout>
  );
}
