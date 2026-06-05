import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getComplaintById } from "../../features/complaints/complaintService";

const statusLabels = {
  NEW: "Complaint Created",
  ASSIGNED: "Assigned to Officer",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REJECTED: "Rejected",
};

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadComplaint() {
      try {
        const data = await getComplaintById(id);
        setComplaint(data);
      } catch (err) {
        setError(err.message || "Unable to load complaint details.");
      } finally {
        setLoading(false);
      }
    }

    loadComplaint();
  }, [id]);

  const timeline = () => {
    const entries = [];

    if (complaint) {
      entries.push({
        title: statusLabels[complaint.status] || complaint.status,
        description: "Complaint was created.",
        date: new Date(complaint.createdAt).toLocaleString(),
      });

      if (Array.isArray(complaint.history) && complaint.history.length > 0) {
        complaint.history.forEach((entry) => {
          entries.push({
            title: statusLabels[entry.newStatus] || entry.newStatus,
            description: entry.remarks || "Status updated.",
            date: new Date(entry.createdAt).toLocaleString(),
          });
        });
      }
    }

    return entries;
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/40">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Complaint Details</h1>
            <p className="mt-2 text-sm text-slate-500">Review status, timeline, and attachments for your complaint.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/citizen/complaints")}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              Back to list
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500">Loading complaint details...</div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
        ) : complaint ? (
          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{complaint.complaintNumber}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{complaint.description}</h2>
                </div>
                <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
                  {complaint.status.replace(/_/g, " ")}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Category</p>
                  <p className="mt-1 text-slate-900">{complaint.categoryId}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Priority</p>
                  <p className="mt-1 text-slate-900">{complaint.priority}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Address</p>
                  <p className="mt-1 text-slate-900">{complaint.address}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Ward</p>
                  <p className="mt-1 text-slate-900">{complaint.wardId || "N/A"}</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-xl font-semibold text-slate-900">Timeline</h3>
              <div className="mt-5 space-y-4">
                {timeline().map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                    <p className="mt-3 text-xs text-slate-400">{item.date}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-xl font-semibold text-slate-900">Attachments</h3>
              {complaint.attachments && complaint.attachments.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {complaint.attachments.map((attachment) => (
                    <li key={attachment.fileUrl}>
                      <a
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        {attachment.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-600">No attachments uploaded.</p>
              )}
            </section>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">Complaint details were not found.</div>
        )}
      </div>
    </div>
  );
}
