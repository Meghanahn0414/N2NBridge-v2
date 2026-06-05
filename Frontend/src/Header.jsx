import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaBell, FaUser, FaTimes } from "react-icons/fa";
import "./styles/Header.css";
import logoSrc from "./assets/images/Logo.png";
import api, { backendProbeHealthy } from "./shared/services/api";
import {
  getAuthUser,
  getAuthRole,
  clearAuth,
} from './services/authStorage';
import NotificationModal from "./common/NotificationModal";

export default function Header() {
  const [notificationCount, setNotificationCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [showNotificationsList, setShowNotificationsList] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [debugShowAdminNotifications, setDebugShowAdminNotifications] = useState(() => {
    try { return localStorage.getItem('debug_notifications') === '1'; } catch (e) { return false; }
  });
  const [showAssignAnalystModal, setShowAssignAnalystModal] = useState(false);
  const [selectedNotificationItem, setSelectedNotificationItem] = useState(null);
  const [analystsDropdown, setAnalystsDropdown] = useState([]);
  const [analystInputValue, setAnalystInputValue] = useState('');
  const [selectedAnalyst, setSelectedAnalyst] = useState(null);
  const [loadingAnalysts, setLoadingAnalysts] = useState(false);
  const [analystsFetchError, setAnalystsFetchError] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = getAuthUser();
  
  // Get specialization from user object
  const specialization = user && user.specialization ? user.specialization : localStorage.getItem('specialization') || '';

  // helper to tightly normalize patient IDs that sometimes come prefixed with
  // ":patientId=" or "?patientId=" (an earlier bug in Header navigation)
  const normalizePatientId = (raw) => {
    if (!raw && raw !== 0) return raw;
    let s = String(raw);
    // strip query-style or colon-style prefixes
    if (s.startsWith(':patientId=')) s = s.replace(/^:patientId=/, '');
    if (s.startsWith('?patientId=')) s = s.replace(/^[?]patientId=/, '');
    return s;
  };

  const fetchNotificationCount = async () => {
    if (!backendProbeHealthy) {
      // avoid initial spikes when backend probe is still in-flight or unavailable
      return;
    }

    try {
      // Extract role: prioritize user.role from sessionStorage-backed auth state
      let role = '';
      if (user && user.role) {
        role = user.role;
      } else {
        role = getAuthRole() || localStorage.getItem('userRole') || localStorage.getItem('role') || '';
      }
      
      if (!role) {
        console.log('[HEADER] No role found, skipping notification count fetch');
        return setNotificationCount(0);
      }
      // normalize to lower-case so casing mismatches (e.g. "Location_Admin")
      // won't cause backend queries to miss notifications.
      const normalizedRole = role.toString().toLowerCase();
      console.log('[HEADER] Fetching notification count for role:', normalizedRole);
      
      const params = { role: normalizedRole, unread_only: true };
      if (specialization !== undefined && specialization !== null && specialization !== '') {
        params.specialization = specialization;
      }
      if (user && user.email) {
        params.recipient_email = user.email;
      }
      // if we're a doctor/dentist include identifying info so backend can return
      if (role && role.toLowerCase().includes('doctor')) {
        if (user && user.name) params.doctor_name = user.name;
        if (user) {
          if (user.doctor_id) params.doctor_custom_id = user.doctor_id;
          if (user.id) params.doctor_id = user.id;
        }
      }
      const res = await api.get('/notifications/count', { params });
      if (res && res.data && typeof res.data.count === 'number') {
        console.log('[HEADER] ✅ Notification count:', res.data.count);
        setNotificationCount(res.data.count);
        return;
      }
    } catch (e) {
      console.error('[HEADER] Error fetching notification count:', e);
      // fallback to client-side stored notifications
      try {
        const raw = JSON.parse(localStorage.getItem('notifications') || '[]');
        setNotificationCount(Array.isArray(raw) ? raw.length : 0);
        return;
      } catch (er) {
        setNotificationCount(0);
      }
    }
  };

  useEffect(() => {
    // Listen for notification-sent events and always refresh the count
    const handleNotificationSent = async () => {
      console.log('[HEADER] 📬 notification-sent event received, refreshing count...');
      // Always refresh the count regardless of dropdown state
      await fetchNotificationCount();
      // If dropdown is open, also refresh the list
      if (showNotificationsList) {
        await fetchNotificationsList();
      }
    };
    const handleNotificationUpdated = async () => {
      console.log('[HEADER] 📬 app-notification-updated event received');
      await fetchNotificationCount();
    };
    window.addEventListener('notification-sent', handleNotificationSent);
    window.addEventListener('app-notification-updated', handleNotificationUpdated);
    return () => {
      window.removeEventListener('notification-sent', handleNotificationSent);
      window.removeEventListener('app-notification-updated', handleNotificationUpdated);
    };
  }, [showNotificationsList]);

  // Poll the backend count endpoint every 5s as a fallback for simple real-time updates
  useEffect(() => {
    fetchNotificationCount();
    let intervalId = null;
    try {
      intervalId = setInterval(() => {
        fetchNotificationCount();
      }, 5000);
    } catch (e) {
      // ignore
    }
    return () => { try { if (intervalId) clearInterval(intervalId); } catch (e) {} };
  }, []);

  const loadAvailableAnalysts = async () => {
    if (analystsDropdown.length > 0 || loadingAnalysts) return;
    setLoadingAnalysts(true);
    setAnalystsFetchError(null);
    try {
      const [doctorRoleResp, analystResp] = await Promise.allSettled([
        api.get('/doctor/role/analyst'),
        api.get('/analyst'),
      ]);
      const doctorRoleData = doctorRoleResp.status === 'fulfilled' && doctorRoleResp.value?.data?.data ? doctorRoleResp.value.data.data : [];
      const analystData = analystResp.status === 'fulfilled' && analystResp.value?.data?.data ? analystResp.value.data.data : [];

      const rawAnalysts = [...doctorRoleData, ...analystData];
      const normalizedAnalysts = rawAnalysts.map((item) => {
        const id = item.id || item._id || item.analystId || item.doctor_id || item.email || item.name;
        const name = item.name || item.full_name || item.doctor_name || item.analyst_name || item.email || 'Unknown Analyst';
        const email = item.email || '';
        const is_available = item.is_available ?? item.isAvailable;
        return { id, name, email, is_available };
      });

      const availableAnalysts = normalizedAnalysts.filter((analyst) => {
        if (analyst.is_available === undefined) return true;
        return Boolean(analyst.is_available);
      });

      const unique = [];
      const seen = new Set();
      availableAnalysts.forEach((analyst) => {
        const key = `${analyst.id || ''}:${analyst.email || ''}:${analyst.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(analyst);
        }
      });

      setAnalystsDropdown(unique);
    } catch (e) {
      setAnalystsFetchError('Unable to load available analysts.');
    } finally {
      setLoadingAnalysts(false);
    }
  };

  const openAssignAnalystModal = async (notification) => {
    setSelectedNotificationItem(notification);
    setAnalystInputValue('');
    setSelectedAnalyst(null);
    setShowNotificationsList(false);
    setShowAssignAnalystModal(true);
    await loadAvailableAnalysts();
  };

  const closeAssignAnalystModal = () => {
    setShowAssignAnalystModal(false);
    setSelectedNotificationItem(null);
    setAnalystInputValue('');
    setSelectedAnalyst(null);
  };

  const handleAnalystSelection = (value) => {
    setAnalystInputValue(value);
    const matched = analystsDropdown.find((analyst) => analyst.name === value || analyst.email === value);
    setSelectedAnalyst(matched || null);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const routePageTitle = (() => {
    const path = location.pathname;
    if (/^\/cardiology\/consent(\/|$)/.test(path)) return 'Consent Form';
    if (/^\/consent(\/|$)/.test(path)) return 'Consent Form';
    if (/^\/patient\/[^\/]+\/preview(\/|$)/.test(path)) return 'Clinical Report';
    if (/^\/patient\/[^\/]+\/checklist(?:-view|\/submit)?(\/|$)/.test(path)) return 'Procedure Checklist';
    return '';
  })();

  const handleLogout = () => {
    clearAuth();
    setOpen(false);
    navigate('/login');
  };

  const fetchNotificationsList = async () => {
    try {
      setLoadingNotifications(true);
      // Extract role: prioritize user.role from sessionStorage-backed auth state
      let role = '';
      if (user && user.role) {
        role = user.role;
      } else {
        role = getAuthRole() || localStorage.getItem('userRole') || localStorage.getItem('role') || '';
      }
      
      // normalize before sending to backend
      if (!role) {
        console.log('[HEADER] No role, returning empty list');
        return setNotificationsList([]);
      }
      const normalizedRole = role.toString().toLowerCase();
      console.log('[HEADER] 📬 Fetching notifications list for role:', normalizedRole);
      const params = { role: normalizedRole, specialization: specialization, unread_only: true, limit: 50 };
      if (user && user.email) {
        params.recipient_email = user.email;
      }
      if (role && role.toLowerCase().includes('doctor')) {
        if (user && user.name) params.doctor_name = user.name;
        if (user) {
          if (user.doctor_id) params.doctor_custom_id = user.doctor_id;
          if (user.id) params.doctor_id = user.id;
        }
      }
      console.log('[HEADER] API params:', params);
      const res = await api.get('/notifications', { params });
      if (res && res.data) {
        // ensure array
        let items = Array.isArray(res.data) ? res.data : (res.data.data || []);
        console.log('[HEADER] ✅ Received', items.length, 'notifications from API');
        // doctors should not see notifications targeted only at admins,
        // and they should only receive doctor-specific alerts that are meant
        // for them.
        if (role && role.toLowerCase().includes('doctor')) {
          items = items.filter(n => {
            if (!n) return false;
            const roles = n.rolesAllowed || n.roles || [];
            // if rolesAllowed exists and is non-empty, only include items
            // targeted at doctors/dentists
            if (Array.isArray(roles) && roles.length > 0) {
              return roles.includes('doctor') || roles.includes('dentist');
            }
            // if the notification has an explicit doctor recipient, make sure
            // it matches *this* user.  otherwise drop it.
            if (n.recipientsDoctorName) {
              if (user && user.name && n.recipientsDoctorName !== user.name) return false;
            }
            if (n.recipientsDoctorId) {
              const myIds = [];
              if (user) {
                if (user.doctor_id) myIds.push(user.doctor_id);
                if (user.id) myIds.push(user.id);
              }
              // also consider any custom id fields that may have been returned
              if (n.recipientsDoctorCustomId) myIds.push(n.recipientsDoctorCustomId);
              if (n.doctor_custom_id) myIds.push(n.doctor_custom_id);
              if (myIds.length > 0 && !myIds.includes(n.recipientsDoctorId)) {
                return false;
              }
            }
            // otherwise allow the notification through (generic doctor alert)
            return true;
          });
        }
        console.log('[HEADER] Setting', items.length, 'notifications in state');
        setNotificationsList(items);

        if (items.length === 0 && notificationCount > 0) {
          try {
            const fallbackRes = await api.get('/notifications', { params: { unread_only: true, limit: 100 } });
            let fallbackItems = Array.isArray(fallbackRes.data) ? fallbackRes.data : (fallbackRes.data.data || []);
            if (Array.isArray(fallbackItems) && fallbackItems.length > 0) {
              console.log('[HEADER] Fallback: found', fallbackItems.length, 'notifications');
              setNotificationsList(fallbackItems);
            }
          } catch (fallbackErr) {
            console.warn('[HEADER] fallback notifications fetch failed', fallbackErr);
          }
        }
      }
    } catch (e) {
      console.error('[HEADER] Error fetching notifications list:', e);
      setNotificationsList([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Utility: parse various date formats (ISO string, ms timestamp, seconds timestamp)
  const parseNotificationDate = (input) => {
    if (!input) return new Date();
    // numeric?
    const asNum = Number(input);
    if (!Number.isNaN(asNum)) {
      // Seconds (10 digits) -> convert to ms
      if (String(input).length === 10) return new Date(asNum * 1000);
      return new Date(asNum);
    }
    try {
      const s = String(input).trim();
      // If the string contains 'Z' or ±HH:MM timezone (like +00:00 for UTC), treat as ISO string with timezone
      if (s.includes('Z') || /[+-]\d{2}:\d{2}$/.test(s) || /[+-]\d{4}$/.test(s)) {
        // This is a timezone-aware ISO string (e.g., from Python's datetime.now(timezone.utc))
        // JavaScript's Date constructor will correctly parse it and convert to local time
        return new Date(s);
      }
      // Prefer interpreting naive timestamps (no timezone) as local time to avoid unintended UTC shifts.
      // matches YYYY-MM-DD[ T]HH:MM:SS optionally with fractional seconds, but without a timezone offset or Z
      const naiveIso = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
      if (naiveIso.test(s)) {
        // Parse components and construct a local Date object (year, monthIndex, day, hour, minute, second, ms)
        const main = s.split('.')[0];
        const frac = s.includes('.') ? s.split('.')[1] : null;
        const parts = main.replace('T', ' ').split(/[- :]/).map((p) => parseInt(p, 10));
        const year = parts[0] || 1970;
        const month = (parts[1] ? parts[1] - 1 : 0);
        const day = parts[2] || 1;
        const hour = parts[3] || 0;
        const minute = parts[4] || 0;
        const second = parts[5] || 0;
        const ms = frac ? Math.round(Number('0.' + frac) * 1000) : 0;
        return new Date(year, month, day, hour, minute, second, ms);
      }
      // Otherwise let Date parse the string (respects timezone offsets if present)
      return new Date(s);
    } catch (e) {
      return new Date();
    }
  };

  const formatNotificationTime = (input) => {
    const d = parseNotificationDate(input);
    const now = Date.now();
    const diff = Math.max(0, Math.floor((now - d.getTime()) / 1000));
    let ago;
    if (diff < 60) ago = `${diff}s ago`;
    else if (diff < 3600) ago = `${Math.floor(diff / 60)}m ago`;
    else if (diff < 86400) ago = `${Math.floor(diff / 3600)}h ago`;
    else ago = d.toLocaleDateString();
    // Format as: MM/DD/YYYY Time: HH:MM AM/PM (no seconds)
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const hh = String(hours).padStart(2, '0');
    const full = `${mm}/${dd}/${yyyy}\u00A0\u00A0${hh}:${mins} ${ampm}`;
    return { ago, full };
  };

  const markNotificationRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (e) {
      // ignore
    } finally {
      // refresh count and list
      fetchNotificationCount();
      fetchNotificationsList();
      window.dispatchEvent(new Event('app-notification-updated'));
    }
  };

  const confirmAppointmentNotification = async (notif) => {
    if (!notif) return;
    const appointmentId = notif.appointment_id || notif.appointmentId || notif.appointment || notif.meta?.appointment_id || notif.meta?.appointmentId || notif.meta?.appointment;
    if (!appointmentId) {
      console.warn('[HEADER] appointment_scheduled notification missing appointment id', notif);
      setShowNotificationsList(false);
      navigate('/doctor/details');
      return;
    }

    console.log('[HEADER] Processing appointment confirmation for ID:', appointmentId);

    try {
      setLoadingNotifications(true);
      
      // Get appointment type from notification (already sent during appointment creation)
      const appointmentType = notif.appointment_type || notif.meta?.appointment_type || '';
      console.log('[HEADER] Appointment type from notification:', appointmentType);

      // Check if this is a Consultant Visit appointment
      const isConsultantVisit = appointmentType && 
        (appointmentType.toLowerCase() === 'consultant' || 
         appointmentType.toLowerCase() === 'consultant visit');

      let confirmedTime = notif.appointment_time || notif.time || notif.meta?.appointment_time || '';

      // If Consultant Visit, automatically use current time when OK is clicked
      if (isConsultantVisit) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        confirmedTime = `${hours}:${minutes}`;
        
        console.log('[HEADER] Consultant Visit - Auto-saving current time:', confirmedTime);
      } else if (!confirmedTime) {
        setShowNotificationsList(false);
        navigate('/doctor/details', { state: { appointmentNotification: notif } });
        setLoadingNotifications(false);
        return;
      }

      const updatePayload = {
        time: confirmedTime,
        appointment_time: confirmedTime,
        status: 'Confirmed',
        doctor_confirmed: true,
        doctor_confirmed_at: new Date().toISOString(),
      };
      if (notif.appointment_date || notif.meta?.appointment_date) {
        updatePayload.date = notif.appointment_date || notif.meta?.appointment_date;
        updatePayload.appointment_date = notif.appointment_date || notif.meta?.appointment_date;
      }
      
      console.log('[HEADER] Sending PATCH request to update appointment:', appointmentId);
      console.log('[HEADER] Update payload:', updatePayload);
      await api.patch(`/appointments/${encodeURIComponent(appointmentId)}`, updatePayload);
      
      // Send confirmation notification to admin/location_admin that doctor has set the appointment time
      try {
        const doctorName = user?.name || localStorage.getItem('doctorName') || localStorage.getItem('name') || 'Doctor';
        const patientName = notif.patient_name || notif.meta?.patient_name || 'Patient';
        const appointmentDate = notif.appointment_date || notif.meta?.appointment_date || '';
        const appointmentTime = confirmedTime || '';
        
        const confirmationNotifPayload = {
          type: 'appointment_confirmed_by_doctor',
          title: 'Appointment Time Confirmed by Doctor',
          message: `Dr. ${doctorName} has set the appointment time of patient ${patientName} to ${appointmentTime}${appointmentDate ? ` on ${new Date(appointmentDate).toLocaleDateString()}` : ''}`,
          rolesAllowed: ['admin'],
          patient_id: notif.patient_id || notif.meta?.patient_id || '',
          patient_name: patientName,
          appointment_id: appointmentId,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          created_at: new Date().toISOString(),
          read: false
        };
        
        console.log('[HEADER] 📤 Sending appointment confirmation notification:', confirmationNotifPayload);
        const notifResponse = await api.post('/notifications', confirmationNotifPayload);
        console.log('[HEADER] ✅ Appointment confirmation notification sent:', notifResponse.data);
      } catch (notifErr) {
        console.error('[HEADER] ❌ Error sending confirmation notification:', notifErr);
        // Don't fail the whole operation if notification fails
      }
      
      if (notif._id) {
        await markNotificationRead(notif._id);
      }
      window.dispatchEvent(new Event('notification-sent'));
      setShowNotificationsList(false);
    } catch (e) {
      console.error('[HEADER] Failed to confirm appointment notification', e);
    } finally {
      setLoadingNotifications(false);
    }
  };

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Left: (no hamburger in header anymore) */}
        <div className="header-left" />

        {routePageTitle && (
          <div className="header-page-title">{routePageTitle}</div>
        )}

        {/* Right: Icons */}
        <div className="header-right">
          <div className="notification-icon">
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <FaBell style={{ cursor: 'pointer' }} onClick={async () => {
                  setShowNotificationsList((s) => !s);
                  // fetch list when opening
                  if (!showNotificationsList) await fetchNotificationsList();
                }} />
                {notificationCount > 0 && (
                  <span className="notification-badge">{notificationCount}</span>
                )}

                {showNotificationsList && (
                  <div className="notification-dropdown" style={{ position: 'absolute', right: 0, top: '36px', width: 340, maxHeight: 360, overflowY: 'auto', zIndex: 2000 }}>
                    <div className="notification-header">
                      <h3>Notifications</h3>
                      <button className="close-btn" onClick={() => { setShowNotificationsList(false); }} title="Close notifications" aria-label="Close notifications">
                        <FaTimes />
                      </button>
                    </div>
                    <div style={{ borderTop: '1px solid #eee', marginTop: 6 }} />
                    {loadingNotifications ? (
                      <div style={{ padding: 12 }}>Loading…</div>
                    ) : notificationsList.length === 0 ? (
                      <div style={{ padding: 12, color: '#666' }}>No new notifications</div>
                    ) : (
                      notificationsList.map((n) => (
                        <div key={n._id} style={{ padding: 10, borderBottom: '1px solid #f1f1f1', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          {/* For audio_report notifications, just click message to navigate */}
                          {n.type === 'audio_report' && n.meta && n.meta.filename ? (
                            <div style={{ display: 'block', cursor: 'pointer' }} onClick={async () => {
                              setShowNotificationsList(false);
                              try { await markNotificationRead(n._id); } catch (e) {}
                              // Navigate to the preview page
                              let patientId = n.meta?.patient_id || n.patient_id;
                              patientId = normalizePatientId(patientId);
                              const filename = n.meta?.filename;
                              
                              // console.log('[NOTIFICATION-PREVIEW] patient_id:', patientId, 'filename:', filename, 'full meta:', n.meta);
                              
                              if (patientId && filename) {
                                navigate(`/patient/${encodeURIComponent(patientId)}/preview/${filename}`);
                              } else if (patientId) {
                                const navState = (user && ((user.role||'').toLowerCase().includes('doctor') || user.doctor_id)) ? { fromDoctorPage: true } : {};
                                navigate(`/patient/${encodeURIComponent(patientId)}`, { state: navState });
                              }
                            }}>
                              <div style={{ fontWeight: 700 }}>{n.title}</div>
                              <div style={{ fontSize: 13, color: '#444' }}>{n.message}</div>
                              {(() => {
                                const ts = n.created_at || n.createdAt;
                                const t = formatNotificationTime(ts);
                                return <div title={t.full} style={{ fontSize: 11, color: '#999', marginTop: 6 }}>{t.full}</div>;
                              })()}
                            </div>
                          ) : (
                            <div onClick={async () => {
                              const isAudioAssignNotification = n.type === 'audio_saved_admin' || n.type === 'audio_saved';
                              if (isAudioAssignNotification) {
                                openAssignAnalystModal(n);
                                return;
                              }

                              // mark read and navigate based on available fields (patient_id or consent_id)
                              setShowNotificationsList(false);
                              try {
                                await markNotificationRead(n._id);
                              } catch (e) {
                                // ignore
                              }

                              const navigateToPatient = (id) => {
                                if (!id) return false;
                                const normalized = normalizePatientId(id);
                                if (!normalized) return false;
                                const navState = {};
                                if (user && ((user.role||'').toLowerCase().includes('doctor') || user.doctor_id)) {
                                  navState.fromDoctorPage = true;
                                }
                                navState.fromNotification = true;
                                navigate(`/patient/${encodeURIComponent(normalized)}`, { state: navState });
                                return true;
                              };

                              // Try multiple places for patient id (meta, top-level fields)
                              let patientId = null;
                              if (n.meta) {
                                if (n.meta.patient_id) { patientId = n.meta.patient_id; }
                                else if (n.meta.patient) {
                                  const mp = n.meta.patient;
                                  if (typeof mp === 'string') { patientId = mp; }
                                  else if (typeof mp === 'object') { patientId = mp.patientId || mp.patient_id || mp._id || null; }
                                } else if (n.meta.patientId) { patientId = n.meta.patientId; }
                              }
                              if (!patientId) { patientId = n.patient_id || n.patientId || (typeof n.patient === 'string' ? n.patient : null) || null; }

                              if (navigateToPatient(patientId)) return;

                              // If only consent_id present, fetch the consent to find linked patient id (and patient_record_id)
                              if (n.consent_id) {
                                try {
                                  const resp = await api.get(`/dental/consents/${encodeURIComponent(n.consent_id)}`);
                                  const consent = (resp && (resp.data?.data || resp.data)) || null;
                                  if (consent) {
                                    const p = consent.patient;
                                    if (p) {
                                      if (typeof p === 'string') { patientId = p; }
                                      else if (typeof p === 'object') { patientId = p.patientId || p.patient_id || p._id || null; }
                                    }
                                    if (!patientId) { patientId = consent.patient_id || consent.patientId || null; }

                                    // If consent references a patient_record_id, fetch that record to resolve patientId
                                    if (!patientId && consent.patient_record_id) {
                                      try {
                                        const recResp = await api.get(`/patient-medical-records/${encodeURIComponent(consent.patient_record_id)}`);
                                        const recData = (recResp && (recResp.data?.data || recResp.data)) || null;
                                        if (recData && recData.patient) {
                                          const rp = recData.patient;
                                          if (typeof rp === 'string') { patientId = rp; }
                                          else if (typeof rp === 'object') { patientId = rp.patientId || rp.patient_id || rp._id || null; }
                                        }
                                      } catch (er) {
                                        console.warn('Failed to fetch record:', er);
                                      }
                                    }
                                  }
                                } catch (e) {
                                  console.warn('Failed to resolve consent -> patient for notification navigation', e);
                                }
                              }

                              if (navigateToPatient(patientId)) return;

                              // Fallback: if consent_id exists, navigate to consent view page
                              if (n.consent_id) {
                                // Determine if this is a cardiology or dental consent based on notification metadata
                                const isCardiology = n.specialization === 'cardiology' || n.type?.includes('cardiology');
                                const consentPath = isCardiology 
                                  ? `/cardiology/consent/${encodeURIComponent(n.consent_id)}`
                                  : `/consent/${encodeURIComponent(n.consent_id)}`;
                                navigate(consentPath);
                                return;
                              }

                              console.warn('Notification missing patient_id and consent_id:', n);
                            }} style={{ cursor: 'pointer' }}>
                              <div style={{ fontWeight: 700 }}>{n.title}</div>
                              <div style={{ fontSize: 13, color: '#444', marginBottom: n.type === 'appointment_scheduled' ? 8 : 0 }}>{n.message}</div>
                              {n.type === 'appointment_scheduled' && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                  <div style={{ fontSize: 12, color: '#666' }}>
                                    {n.appointment_date && <div>📅 {new Date(n.appointment_date).toLocaleDateString()}</div>}
                                    <div>🕐 {n.appointment_time || n.time || '—'}</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await confirmAppointmentNotification(n);
                                    }}
                                    disabled={loadingNotifications}
                                    style={{
                                      padding: '0.45rem 0.85rem',
                                      borderRadius: 4,
                                      border: 'none',
                                      backgroundColor: '#1967d2',
                                      color: '#fff',
                                      cursor: loadingNotifications ? 'not-allowed' : 'pointer',
                                      fontSize: 12,
                                    }}
                                  >
                                    OK
                                  </button>
                                </div>
                              )}
                              {(() => {
                                const ts = n.created_at || n.createdAt || null;
                                const t = formatNotificationTime(ts);
                                return (
                                  <div title={t.full} style={{ fontSize: 11, color: '#999', marginTop: 6 }}>{t.full}</div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

              </div>
          </div>
        </div>
      </div>      <NotificationModal
        isVisible={showAssignAnalystModal}
        type="info"
        title={selectedNotificationItem?.title || 'Assign Analyst'}
        message={selectedNotificationItem?.message || 'Select an available analyst from the dropdown below.'}
        onClose={closeAssignAnalystModal}
        buttons={[
          {
            label: 'Assign',
            variant: 'primary',
            onClick: async () => {
              const analyst = selectedAnalyst;
              if (!analyst || !analyst.email) {
                setAnalystsFetchError('Please select a valid analyst from the list.');
                return;
              }

              const patientName = selectedNotificationItem?.meta?.patient_name || selectedNotificationItem?.patient_name || 'the patient';
              const notificationPayload = {
                title: `Audio recording assigned to ${analyst.name}`,
                message: `A new audio recording for ${patientName} has been assigned to ${analyst.name}.`,
                type: 'audio_assignment',
                recipientsEmails: [analyst.email],
                meta: {
                  ...selectedNotificationItem?.meta,
                  assignedAnalystId: analyst.id,
                  assignedAnalystName: analyst.name,
                  assignedAnalystEmail: analyst.email,
                  originalNotificationId: selectedNotificationItem?._id,
                },
              };

              try {
                await api.post('/notifications', notificationPayload);
                if (selectedNotificationItem?._id) {
                  try {
                    await markNotificationRead(selectedNotificationItem._id);
                  } catch (e) {
                    // ignore
                  }
                }
                closeAssignAnalystModal();
                window.dispatchEvent(new Event('notification-sent'));
              } catch (e) {
                setAnalystsFetchError('Failed to assign analyst. Please try again.');
              }
            },
          },
          {
            label: 'Cancel',
            variant: 'secondary',
          },
        ]}
      >
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>
            Choose an analyst
          </label>
          <input
            list="analysts-list"
            value={analystInputValue}
            onChange={(e) => handleAnalystSelection(e.target.value)}
            onFocus={loadAvailableAnalysts}
            placeholder={loadingAnalysts ? 'Loading analysts...' : 'Start typing or select an analyst'}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #ccc',
              fontSize: 14,
            }}
          />
          <datalist id="analysts-list">
            {analystsDropdown.map((analyst) => (
              <option key={`${analyst.id || analyst.email || analyst.name}`} value={analyst.name} />
            ))}
          </datalist>
          {loadingAnalysts && (
            <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
              Loading analysts…
            </div>
          )}
          {analystsFetchError && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'red' }}>
              {analystsFetchError}
            </div>
          )}
        </div>
      </NotificationModal>   
     </header>
  );
}