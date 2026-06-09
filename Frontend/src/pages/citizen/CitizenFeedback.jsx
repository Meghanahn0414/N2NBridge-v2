import React, { useEffect, useState } from 'react';
import { FaStar } from 'react-icons/fa';
import {
  getCitizenComplaints,
  submitComplaintFeedback,
} from '../../shared/services/citizenService';

export default function CitizenFeedback() {
  const [feedback, setFeedback] = useState({
    complaintId: '',
    rating: 0,
    message: '',
  });
  const [complaints, setComplaints] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCitizenComplaints();
      setComplaints(result || []);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!feedback.complaintId) {
      setError('Please select a complaint to rate.');
      return;
    }

    if (!feedback.rating) {
      setError('Please choose a rating.');
      return;
    }

    try {
      await submitComplaintFeedback(feedback.complaintId, {
        rating: feedback.rating,
        comments: feedback.message,
      });
      setSubmitted(true);
      setFeedback({ complaintId: '', rating: 0, message: '' });
      await loadComplaints();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to submit feedback.');
    }
  };

  const feedbackHistory = complaints.filter((complaint) => complaint.feedback);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-slate-900">Feedback</h1>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-800">{error}</div>
        )}

        {submitted && (
          <div className="mb-6 rounded-lg bg-green-100 p-4 text-green-800">
            ✓ Thank you for your feedback!
          </div>
        )}

        <div className="rounded-lg bg-white p-6 shadow-sm">
          {loading ? (
            <div className="text-slate-600">Loading complaints...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900">
                  Which complaint would you like to rate?
                </label>
                <select
                  value={feedback.complaintId}
                  onChange={(e) =>
                    setFeedback({ ...feedback, complaintId: e.target.value })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-blue-600 focus:outline-none"
                >
                  <option value="">Select a complaint...</option>
                  {complaints.map((complaint) => (
                    <option key={complaint.id} value={complaint.id}>
                      {complaint.complaintNumber || complaint.id} - {complaint.description?.slice(0, 50)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900">
                  How satisfied are you with the resolution?
                </label>
                <div className="mt-3 flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedback({ ...feedback, rating: star })}
                      className="transition hover:scale-110"
                    >
                      <FaStar
                        className={`h-8 w-8 ${
                          star <= feedback.rating ? 'text-yellow-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {feedback.rating > 0 && (
                  <p className="mt-2 text-sm text-slate-600">
                    {feedback.rating === 1 && 'Very Dissatisfied'}
                    {feedback.rating === 2 && 'Dissatisfied'}
                    {feedback.rating === 3 && 'Neutral'}
                    {feedback.rating === 4 && 'Satisfied'}
                    {feedback.rating === 5 && 'Very Satisfied'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900">
                  Additional Comments
                </label>
                <textarea
                  value={feedback.message}
                  onChange={(e) =>
                    setFeedback({ ...feedback, message: e.target.value })
                  }
                  placeholder="Share your thoughts and suggestions..."
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-blue-600 focus:outline-none"
                  rows="5"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
              >
                Submit Feedback
              </button>
            </form>
          )}
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Your Feedback History</h2>
          {loading ? (
            <div className="rounded-lg bg-white p-8 text-slate-600 shadow-sm">Loading history...</div>
          ) : feedbackHistory.length === 0 ? (
            <div className="rounded-lg bg-white p-8 text-slate-600 shadow-sm">No feedback submitted yet.</div>
          ) : (
            <div className="space-y-3">
              {feedbackHistory.map((complaint) => (
                <div key={complaint.id} className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-slate-900">
                      {complaint.complaintNumber || complaint.id}
                    </span>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, index) => (
                        <FaStar
                          key={index}
                          className={`h-4 w-4 ${
                            complaint.feedback && index < complaint.feedback.rating
                              ? 'text-yellow-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {complaint.feedback?.comments || 'No additional comments.'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
