import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';

export default function CitizenFeedback() {
  const [feedback, setFeedback] = useState({
    complaintId: '',
    rating: 0,
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Feedback submitted:', feedback);
    setSubmitted(true);
    setTimeout(() => {
      setFeedback({ complaintId: '', rating: 0, message: '' });
      setSubmitted(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-slate-900">Feedback</h1>

        {submitted && (
          <div className="mb-6 rounded-lg bg-green-100 p-4 text-green-800">
            ✓ Thank you for your feedback!
          </div>
        )}

        {/* Feedback Form */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Complaint Selection */}
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
                <option value="GR001">GR001 - Pothole Repair</option>
                <option value="GR002">GR002 - Water Supply Issue</option>
                <option value="GR003">GR003 - Street Light</option>
              </select>
            </div>

            {/* Rating */}
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
                        star <= feedback.rating
                          ? 'text-yellow-400'
                          : 'text-slate-300'
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

            {/* Comments */}
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

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
            >
              Submit Feedback
            </button>
          </form>
        </div>

        {/* Previous Feedback */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Your Feedback History
          </h2>
          <div className="space-y-3">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900">GR002 - Water Supply</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`h-4 w-4 ${
                        i < 4 ? 'text-yellow-400' : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                "Great response time and effective solution"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
