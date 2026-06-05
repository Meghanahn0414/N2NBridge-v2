import React, { useState } from 'react';
import api from '../../shared/services/api';
import "./NewMLA.css";

export default function NewManager() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        fullName: name,
        email,
        mobile,
        role: 'CONSTITUENCY_MANAGER',
        password: 'ChangeMe123',
      });
      setMessage('Manager created. Default password: ChangeMe123');
      setName(''); setEmail(''); setMobile('');
    } catch (err) {
      setMessage('Failed to create manager');
    } finally { setLoading(false); }
  };

  return (
    <div className="new-mla-container">
      <div className="new-mla-card">
        <div className="new-mla-header">
          <h1 className="new-mla-title">Create Constituency Manager</h1>
          <p className="new-mla-subtitle">Fast-create a manager account (change password after creation)</p>
        </div>
        <form className="new-mla-form" onSubmit={handleSubmit}>
          {message && <div className="new-mla-alert">{message}</div>}
          <div className="new-mla-group">
            <label className="new-mla-label">Full name</label>
            <input className="new-mla-input" value={name} onChange={(e)=>setName(e.target.value)} />
          </div>
          <div className="new-mla-group">
            <label className="new-mla-label">Email</label>
            <input className="new-mla-input" value={email} onChange={(e)=>setEmail(e.target.value)} />
          </div>
          <div className="new-mla-group">
            <label className="new-mla-label">Mobile</label>
            <input className="new-mla-input" value={mobile} onChange={(e)=>setMobile(e.target.value)} />
          </div>
          <button className="new-mla-submit" disabled={loading}>{loading? 'Creating...':'Create Manager'}</button>
        </form>
      </div>
    </div>
  );
}
