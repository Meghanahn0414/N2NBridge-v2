import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp } from "./authService";

export default function Login() {
  const [value, setValue] = useState("");
  const [type, setType] = useState("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!value.trim()) {
      setError("Please enter a phone number or email");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await sendOtp({ type, value });
      sessionStorage.setItem("authValue", JSON.stringify({ type, value }));
      navigate("/otp");
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/40">
        <h1 className="mb-6 text-center text-3xl font-semibold text-slate-900">Login</h1>

        <div className="mb-4 flex items-center justify-center gap-3 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="loginType"
              value="phone"
              checked={type === "phone"}
              onChange={(e) => setType(e.target.value)}
              className="h-4 w-4 accent-indigo-600"
            />
            Phone
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="loginType"
              value="email"
              checked={type === "email"}
              onChange={(e) => setType(e.target.value)}
              className="h-4 w-4 accent-indigo-600"
            />
            Email
          </label>
        </div>

        <label className="mb-3 block text-sm font-medium text-slate-700">{type === "phone" ? "Phone Number" : "Email Address"}</label>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={type === "phone" ? "+91 98765 43210" : "you@example.com"}
          className="mb-5 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleSendOtp}
          disabled={loading}
          className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>

        <div className="mt-5 text-center text-sm text-slate-600">
          New admin?{' '}
          <button
            type="button"
            onClick={() => navigate("/admin-signup")}
            className="font-semibold text-indigo-700 underline underline-offset-2"
          >
            Sign up here
          </button>
        </div>
      </div>
    </div>
  );
}
