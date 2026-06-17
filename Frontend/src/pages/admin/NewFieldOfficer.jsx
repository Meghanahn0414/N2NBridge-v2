import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../shared/services/api';
import { ROUTES } from '../../app/routes/RouteConstants';
import { normalizePhone } from '../../utils/phoneUtils';
import "./NewMLA.css";

export default function NewFieldOfficer() {
  const navigate = useNavigate();
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
        mobile: normalizePhone(mobile),
        role: 'FIELD_OFFICER',
        password: 'ChangeMe123',
      });
      setMessage('Field officer created. Default password: ChangeMe123');
      setName(''); setEmail(''); setMobile('');
      // Navigate to Field Officer List immediately
      navigate(ROUTES.fieldOfficerList);
    } catch (err) {
      setMessage('Failed to create field officer');
      setLoading(false);
    }
  };

  return (
    <div className="new-mla-container">
      <div className="new-mla-card">
        <div className="new-mla-header">
          <h1 className="new-mla-title">Create Field Officer</h1>
          <p className="new-mla-subtitle">Quick-create a field officer account</p>
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
          <button className="new-mla-submit" disabled={loading}>{loading? 'Creating...':'Create Field Officer'}</button>
        </form>
      </div>
    </div>
  );
}
