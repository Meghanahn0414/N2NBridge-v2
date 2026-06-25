import { useEffect, useRef, useState } from "react";
import { fetchCampaigns, createCampaign, uploadCampaignImage } from "../../../features/campaigns/campaignService";
import MIcon from "../../../components/MIcon";

const MS = ({ children, style }) => <MIcon name={children} style={style} />;

const TYPES = [
  { key: "event", icon: "event", label: "Event" },
  { key: "achievement", icon: "emoji_events", label: "Achievement" },
  { key: "update", icon: "campaign", label: "Update" },
];

const AUDIENCE_OPTIONS = [
  "All constituents",
  "Neighbourhood 1",
  "Neighbourhood 2",
  "+ Following an issue",
];

const CHANNEL_OPTIONS = [
  { key: "Push", icon: "notifications_active", label: "Push", sub: "Instant" },
  { key: "In-app feed", icon: "dynamic_feed", label: "In-app feed", sub: "Pinned 48h" },
  { key: "Email", icon: "mail", label: "Email", sub: "Digest" },
];

const BROADCAST_TYPE_LABELS = {
  event: "Event",
  achievement: "Achievement",
  update: "Update",
};

export default function CommunicationCenter() {
  const [broadcastType, setBroadcastType] = useState("event");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedAudience, setSelectedAudience] = useState(["All constituents"]);
  const [selectedWardId, setSelectedWardId] = useState("");   // "" = all constituents
  const [wards, setWards] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState(["Push", "In-app feed"]);
  const [segmentInputVisible, setSegmentInputVisible] = useState(false);
  const [segmentInputValue, setSegmentInputValue] = useState("");
  const [selectedRecentTab, setSelectedRecentTab] = useState("All");
  const [statusMessage, setStatusMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [citizenCount, setCitizenCount] = useState(null);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAllScheduled, setShowAllScheduled] = useState(false);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toggleAudience = (option) => {
    setSelectedAudience((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
    );
  };

  const addAudienceSegment = () => {
    const trimmed = segmentInputValue.trim();
    if (!trimmed) return;
    if (!selectedAudience.includes(trimmed)) {
      setSelectedAudience((prev) => [...prev.filter((item) => item !== "All constituents"), trimmed]);
    }
    setSegmentInputValue("");
    setSegmentInputVisible(false);
  };

  const handleSegmentKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addAudienceSegment();
    }
  };

  const handleToggleDrafts = () => {
    const next = !showDrafts;
    setShowDrafts(next);
    setShowNotifications(false);
    if (next) {
      fetchCampaigns(1, 50, { status: "DRAFT" })
        .then((data) => setDrafts(Array.isArray(data) ? data : []))
        .catch(() => setDrafts([]));
    }
  };

  const handleToggleNotifications = () => {
    setShowNotifications((current) => !current);
    setShowDrafts(false);
  };

  const toggleChannel = (key) => {
    setSelectedChannels((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const clearForm = () => {
    setTitle("");
    setMessage("");
    setLocation("");
    setDateTime("");
    setCoverImageFile(null);
    setCoverImagePreview("");
    setCoverImageUrl("");
    setUploadError("");
    setSelectedAudience(["All constituents"]);
    setSelectedWardId("");
    setSelectedChannels(["Push", "In-app feed"]);
  };

  const handleCoverImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setCoverImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setCoverImagePreview(previewUrl);
    setUploadingImage(true);

    try {
      const response = await uploadCampaignImage(file);
      setCoverImageUrl(response?.fileUrl || response);
    } catch (err) {
      setUploadError(err?.response?.data?.detail || err?.message || "Image upload failed.");
      setCoverImageUrl("");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleCreateCampaign = async (status, isScheduled = false) => {
    if (!title.trim() || !message.trim()) {
      setStatusMessage("Title and message are required.");
      return;
    }

    if (isScheduled && !dateTime) {
      setStatusMessage("Please select a date and time to schedule.");
      return;
    }

    setSubmitting(true);
    setStatusMessage("");

    try {
      await createCampaign({
        name: title.trim(),
        type: BROADCAST_TYPE_LABELS[broadcastType] || "Awareness",
        message: message.trim(),
        coverImage: coverImageUrl || undefined,
        location: location.trim() || undefined,
        targetAudience: selectedAudience,
        wardId: selectedWardId || undefined,   // undefined = all citizens
        channels: selectedChannels,
        startDate: dateTime ? new Date(dateTime).toISOString() : status === "ACTIVE" ? new Date().toISOString() : null,
        status,
      });

      clearForm();
      await fetchCampaigns(1, 100).then((data) => setCampaigns(Array.isArray(data) ? data : []));
      setStatusMessage(
        status === "DRAFT"
          ? "Draft saved successfully."
          : isScheduled
          ? "Broadcast scheduled successfully."
          : "Broadcast published successfully."
      );
    } catch (err) {
      setStatusMessage(err?.response?.data?.message || err?.message || "Failed to submit broadcast.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishNow = () => handleCreateCampaign("ACTIVE", false);
  const handleSchedule = () => handleCreateCampaign("ACTIVE", true);
  const handleSaveDraft = () => handleCreateCampaign("DRAFT", false);

  useEffect(() => {
    const loadCampaigns = async () => {
      setLoading(true);
      setError(null);
      try {
        const [campaignData, countRes, wardsRes] = await Promise.allSettled([
          fetchCampaigns(1, 100),
          import("../../../shared/services/api").then(m => m.default.get("/api/campaigns/citizen-count")),
          import("../../../shared/services/api").then(m => m.default.get("/api/campaigns/audience-wards")),
        ]);
        if (campaignData.status === "fulfilled") setCampaigns(Array.isArray(campaignData.value) ? campaignData.value : []);
        if (countRes.status === "fulfilled") setCitizenCount(countRes.value?.data?.count ?? null);
        if (wardsRes.status === "fulfilled") {
          const wd = wardsRes.value?.data?.wards || wardsRes.value?.data?.data || [];
          setWards(Array.isArray(wd) ? wd : []);
        }
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Unable to load campaigns");
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  const publishedCampaigns = campaigns.filter((c) => c.status === "ACTIVE" || c.status === "COMPLETED");
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");
  const scheduledCampaigns = campaigns.filter((campaign) => {
    if (!campaign.startDate) return false;
    return new Date(campaign.startDate) > new Date();
  });

  const sumReach = activeCampaigns.reduce((sum, campaign) => sum + (campaign.reach || 0), 0);
  // If no campaign has recorded reach yet, show total registered citizens as potential reach
  const totalReach = sumReach > 0 ? sumReach : (activeCampaigns.length > 0 && citizenCount != null ? citizenCount : 0);

  const bestTimeToSend = (() => {
    const times = campaigns
      .map((campaign) => (campaign.startDate ? new Date(campaign.startDate) : null))
      .filter(Boolean);

    if (times.length === 0) return null;

    const counts = {};
    times.forEach((date) => {
      const hour = date.getHours();
      counts[hour] = (counts[hour] || 0) + 1;
    });

    const bestHour = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (bestHour === undefined) return null;

    const display = new Date();
    display.setHours(Number(bestHour), 0, 0, 0);
    return display.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  })();

  const recentCampaigns = publishedCampaigns
    .slice()
    .filter((campaign) => {
      if (selectedRecentTab === "All") return true;
      if (selectedRecentTab === "Events") return campaign.type?.toLowerCase() === "event";
      if (selectedRecentTab === "Achievements") return campaign.type?.toLowerCase() === "achievement";
      if (selectedRecentTab === "Updates") return campaign.type?.toLowerCase() === "update";
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.startDate || 0) -
        new Date(a.createdAt || a.startDate || 0)
    )
    .slice(0, 5);

  const channelCards = [
    {
      icon: "notifications_active",
      label: "Push notification",
      value: activeCampaigns.filter((campaign) =>
        campaign.channels?.some((channel) => /push/i.test(channel))
      ).length,
    },
    {
      icon: "dynamic_feed",
      label: "In-app feed",
      value: activeCampaigns.filter((campaign) =>
        campaign.channels?.some((channel) => /feed|in-app/i.test(channel))
      ).length,
    },
  ];

  const canPublish = title.trim().length > 0 && message.trim().length > 0;
  const canSchedule = canPublish && (broadcastType !== "event" || Boolean(dateTime));

  return (
    <div style={{ minHeight: "100vh", background: "#F3F5FA", fontFamily: "'Hanken Grotesk', sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 34px", background: "#F3F5FA", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #E5E9F1", gap: 16, flexWrap: "wrap", minHeight: 72 }}>
        <div style={{ flex: 1, minWidth: 0, maxWidth: "60%" }}>
          <div style={{ font: "500 12px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color: "#8590A6", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Reach your community directly</div>
          <h1 style={{ fontFamily: "'Newsreader','Noto Sans Kannada',serif", fontSize: "clamp(16px,2.2vw,26px)", fontWeight: 400, color: "#16233C", margin: 0, letterSpacing: "-.01em", lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Broadcasts</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={handleToggleDrafts}
            style={{
              height: 44,
              background: showDrafts ? "#EFF4FF" : "#fff",
              border: `1px solid ${showDrafts ? "#2B5BD7" : "#E1E6F0"}`,
              borderRadius: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 15px",
              cursor: "pointer",
            }}
          >
            <MS style={{ fontSize: 19, color: showDrafts ? "#2B5BD7" : "#5A6678" }}>history</MS>
            <span style={{ font: "600 14px 'Hanken Grotesk'", color: showDrafts ? "#16233C" : "#16233C" }}>Drafts</span>
            <span style={{ font: "700 11px 'Hanken Grotesk'", color: "#fff", background: "#9AA3B5", borderRadius: 20, padding: "1px 7px" }}>{showDrafts ? drafts.length : "—"}</span>
          </button>
          <button
            type="button"
            onClick={handleToggleNotifications}
            style={{
              width: 44,
              height: 44,
              background: showNotifications ? "#EFF4FF" : "#fff",
              border: `1px solid ${showNotifications ? "#2B5BD7" : "#E1E6F0"}`,
              borderRadius: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <MS style={{ fontSize: 21, color: showNotifications ? "#2B5BD7" : "#16233C" }}>notifications</MS>
          </button>
        </div>
      </header>

      {(showDrafts || showNotifications) && (
        <div style={{ padding: "0 34px 20px", display: "flex", gap: 20 }}>
          <div style={{ flex: 1, background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: 24, boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <div style={{ font: "700 17px 'Hanken Grotesk'", color: "#16233C" }}>{showDrafts ? "Drafts" : "Notifications"}</div>
                <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginTop: 3 }}>
                  {showDrafts ? "Your saved broadcasts waiting to be completed." : "Recent alerts and system notifications."}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDrafts(false);
                  setShowNotifications(false);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#6B7280",
                  font: "600 13px 'Hanken Grotesk'",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
            {showDrafts ? (
              <div style={{ display: "grid", gap: 16 }}>
                {drafts.length === 0 ? (
                  <div style={{ padding: "28px 0", textAlign: "center", color: "#9AA3B5", font: "500 13px 'Hanken Grotesk'" }}>
                    No saved drafts. Click "Save draft" to save your work.
                  </div>
                ) : drafts.map((d) => (
                  <div key={d._id || d.id} style={{ padding: 18, borderRadius: 18, background: "#F8FAFF", border: "1px solid #E6EDFF" }}>
                    <div style={{ font: "600 14px 'Hanken Grotesk'", color: "#16233C", marginBottom: 4 }}>{d.name || "Untitled draft"}</div>
                    <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 6 }}>{d.type || "Update"} · saved {new Date(d.updatedAt || d.createdAt).toLocaleDateString()}</div>
                    {d.message && <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B7280" }}>{d.message.slice(0, 80)}{d.message.length > 80 ? "…" : ""}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                <div style={{ padding: 18, borderRadius: 18, background: "#F8FAFF", border: "1px solid #E6EDFF" }}>
                  <div style={{ font: "600 14px 'Hanken Grotesk'", color: "#16233C", marginBottom: 6 }}>New notification</div>
                  <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B7280" }}>Notifications will appear here when alerts are sent from the system.</div>
                </div>
                <div style={{ padding: 18, borderRadius: 18, background: "#F8FAFF", border: "1px solid #E6EDFF" }}>
                  <div style={{ font: "600 14px 'Hanken Grotesk'", color: "#16233C", marginBottom: 6 }}>No unread notifications</div>
                  <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B7280" }}>Everything is up to date.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: "28px 34px 40px", display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "28px 30px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ font: "700 18px 'Hanken Grotesk'", color: "#16233C", marginBottom: 20 }}>Create a broadcast</div>
            <div style={{ display: "flex", gap: 8, background: "#F1F4F9", borderRadius: 14, padding: 5, marginBottom: 22 }}>
              {TYPES.map((type) => {
                const active = broadcastType === type.key;
                return (
                  <div key={type.key} onClick={() => setBroadcastType(type.key)} style={{ flex: 1, height: 44, borderRadius: 10, background: active ? "#fff" : "transparent", boxShadow: active ? "0 4px 10px -6px rgba(20,35,60,.3)" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
                    <MS style={{ fontSize: 20, color: active ? "#2B5BD7" : "#8590A6" }}>{type.icon}</MS>
                    <span style={{ font: `${active ? "700" : "600"} 14px 'Hanken Grotesk'`, color: active ? "#16233C" : "#7A839A" }}>{type.label}</span>
                  </div>
                );
              })}
            </div>
            <label style={{ font: "600 13px 'Hanken Grotesk'", color: "#16233C", display: "block", marginBottom: 8 }}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Broadcast title…" style={{ width: "100%", height: 52, border: "1.5px solid #E1E6F0", borderRadius: 13, padding: "0 16px", font: "600 15px 'Hanken Grotesk'", color: "#16233C", outline: "none", boxSizing: "border-box", marginBottom: 18, background: "#FAFBFD" }} />
            <label style={{ font: "600 13px 'Hanken Grotesk'", color: "#16233C", display: "block", marginBottom: 8 }}>Cover image</label>
            <div
              role="button"
              onClick={handleUploadAreaClick}
              style={{
                height: 150,
                border: "1.5px dashed #C9D2E0",
                borderRadius: 14,
                background: coverImagePreview ? "#F6FBFF" : "repeating-linear-gradient(45deg,#F1F4FA,#F1F4FA 12px,#F7F9FC 12px,#F7F9FC 24px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                marginBottom: 18,
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {coverImagePreview ? (
                <img
                  src={coverImagePreview}
                  alt="Cover preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }}
                />
              ) : null}
              <div style={{ position: coverImagePreview ? "relative" : "static", zIndex: 1, textAlign: "center" }}>
                <MS style={{ fontSize: 30, color: "#9AA7BD" }}>add_photo_alternate</MS>
                <span style={{ font: "600 13px 'Hanken Grotesk'", color: "#8590A6" }}>Drop an image or browse</span>
                <span style={{ font: "500 11px 'Hanken Grotesk'", color: "#A9B2C4" }}>Recommended 1200 × 630</span>
                {uploadingImage && <div style={{ marginTop: 8, color: "#2B5BD7", font: "600 12px 'Hanken Grotesk'" }}>Uploading image…</div>}
                {uploadError && <div style={{ marginTop: 8, color: "#c2410c", font: "600 12px 'Hanken Grotesk'" }}>{uploadError}</div>}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleCoverImageChange}
              />
            </div>
            {broadcastType === "event" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                <div>
                  <label style={{ font: "600 13px 'Hanken Grotesk'", color: "#16233C", display: "block", marginBottom: 8 }}>Date & time</label>
                  <div style={{ height: 52, border: "1.5px solid #E1E6F0", borderRadius: 13, display: "flex", alignItems: "center", gap: 10, padding: "0 14px", background: "#FAFBFD" }}>
                    <MS style={{ fontSize: 19, color: "#2B5BD7" }}>calendar_month</MS>
                    <input
                      type="datetime-local"
                      value={dateTime}
                      onChange={(e) => setDateTime(e.target.value)}
                      style={{ flex: 1, border: "none", background: "transparent", font: "600 14px 'Hanken Grotesk'", color: "#16233C", outline: "none" }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ font: "600 13px 'Hanken Grotesk'", color: "#16233C", display: "block", marginBottom: 8 }}>Location</label>
                  <div style={{ height: 52, border: "1.5px solid #E1E6F0", borderRadius: 13, display: "flex", alignItems: "center", gap: 10, padding: "0 14px", background: "#FAFBFD" }}>
                    <MS style={{ fontSize: 19, color: "#2B5BD7" }}>place</MS>
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Venue or address"
                      style={{ flex: 1, border: "none", background: "transparent", font: "600 14px 'Hanken Grotesk'", color: "#16233C", outline: "none" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <label style={{ font: "600 13px 'Hanken Grotesk'", color: "#16233C", display: "block", marginBottom: 8 }}>Message</label>
            <div style={{ border: "1.5px solid #E1E6F0", borderRadius: 13, background: "#FAFBFD", marginBottom: 22, overflow: "hidden" }}>
              <div style={{ display: "flex", gap: 2, padding: "8px 10px", borderBottom: "1px solid #EAEDF4" }}>
                {['format_bold', 'format_italic', 'format_list_bulleted', 'link'].map((icon) => (
                  <span key={icon} style={{ width: 30, height: 30, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <MS style={{ fontSize: 18, color: "#5A6678" }}>{icon}</MS>
                  </span>
                ))}
              </div>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Write your message here…" style={{ width: "100%", border: "none", padding: "14px 16px", font: "400 14px/1.6 'Hanken Grotesk'", color: "#3A4760", outline: "none", resize: "vertical", boxSizing: "border-box", background: "transparent" }} />
            </div>
            <label style={{ font: "600 13px 'Hanken Grotesk'", color: "#16233C", display: "block", marginBottom: 8 }}>Audience</label>
            <select
              value={selectedWardId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedWardId(val);
                if (val) {
                  const w = wards.find(w => (w._id || w.id) === val);
                  setSelectedAudience([w?.name || "Ward residents"]);
                } else {
                  setSelectedAudience(["All constituents"]);
                }
              }}
              style={{ width: "100%", height: 48, border: "1.5px solid #E1E6F0", borderRadius: 13, padding: "0 16px", font: "600 14px 'Hanken Grotesk'", color: "#16233C", background: "#FAFBFD", outline: "none", marginBottom: 10, cursor: "pointer" }}
            >
              <option value="">All constituents</option>
              {wards.map((w) => (
                <option key={w._id || w.id} value={w._id || w.id}>{w.name}</option>
              ))}
            </select>
            {selectedWardId && (
              <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#2B5BD7", marginBottom: 12 }}>
                <MS style={{ fontSize: 14, verticalAlign: "middle" }}>info</MS>
                {" "}Notifications will only be sent to citizens registered in this ward.
              </div>
            )}
            <label style={{ font: "600 13px 'Hanken Grotesk'", color: "#16233C", display: "block", marginBottom: 10 }}>Delivery channels</label>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {CHANNEL_OPTIONS.map((channel) => {
                const active = selectedChannels.includes(channel.key);
                return (
                  <div
                    key={channel.key}
                    onClick={() => toggleChannel(channel.key)}
                    style={{
                      flex: 1,
                      border: `1.5px solid ${active ? "#2B5BD7" : "#E1E6F0"}`,
                      background: active ? "#F5F8FF" : "#fff",
                      borderRadius: 13,
                      padding: "13px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                    }}
                  >
                    <MS style={{ fontSize: 20, color: active ? "#2B5BD7" : "#9AA3B5" }}>{channel.icon}</MS>
                    <div style={{ flex: 1 }}>
                      <div style={{ font: "700 13px 'Hanken Grotesk'", color: "#16233C" }}>{channel.label}</div>
                      <div style={{ font: "500 11px 'Hanken Grotesk'", color: "#8590A6" }}>{channel.sub}</div>
                    </div>
                    <MS style={{ fontSize: 19, color: active ? "#2B5BD7" : "#C2CADA" }}>
                      {active ? "check_circle" : "radio_button_unchecked"}
                    </MS>
                  </div>
                );
              })}
            </div>
            {statusMessage && (
              <div style={{ marginBottom: 14, color: submitting ? "#64748b" : "#16233C", font: "600 13px 'Hanken Grotesk'" }}>
                {statusMessage}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 20, borderTop: "1px solid #F0F2F7" }}>
              <button
                type="button"
                disabled={submitting || !canPublish}
                onClick={handlePublishNow}
                style={{
                  height: 52,
                  padding: "0 22px",
                  border: "none",
                  borderRadius: 14,
                  background: canPublish ? "#2B5BD7" : "#A8B8F2",
                  color: "#fff",
                  font: "700 15px 'Hanken Grotesk'",
                  cursor: submitting || !canPublish ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: canPublish ? "0 12px 24px -10px rgba(43,91,215,.7)" : "none",
                }}
              >
                <MS style={{ fontSize: 20, color: "#fff" }}>send</MS>Publish now
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSaveDraft}
                style={{
                  height: 52,
                  padding: "0 18px",
                  border: "none",
                  borderRadius: 14,
                  background: "transparent",
                  color: "#7A839A",
                  font: "600 15px 'Hanken Grotesk'",
                  cursor: submitting ? "not-allowed" : "pointer",
                  marginLeft: "auto",
                }}
              >
                Save draft
              </button>
            </div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "28px 30px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <div style={{ font: "700 18px 'Hanken Grotesk'", color: "#16233C" }}>Recently published</div>
                <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginTop: 3 }}>How your broadcasts performed</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["All", "Events", "Achievements", "Updates"].map((label) => {
                  const active = selectedRecentTab === label;
                  return (
                    <span
                      key={label}
                      onClick={() => setSelectedRecentTab(label)}
                      style={{
                        background: active ? "#16233C" : "#EEF1F7",
                        color: active ? "#fff" : "#5A6678",
                        font: "600 12px 'Hanken Grotesk'",
                        padding: "7px 13px",
                        borderRadius: 20,
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
            {loading ? (
              <div style={{ padding: "44px 0", textAlign: "center", color: "#64748b" }}>Loading broadcast data…</div>
            ) : error ? (
              <div style={{ padding: "44px 0", textAlign: "center", color: "#c2410c" }}>{error}</div>
            ) : recentCampaigns.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 10, marginTop: 8 }}>
                <MS style={{ fontSize: 40, color: "#D8DEEA" }}>campaign</MS>
                <div style={{ font: "600 14px 'Hanken Grotesk'", color: "#C0C7D4" }}>No broadcasts yet</div>
                <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#D8DEEA" }}>Published broadcasts will appear here</div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 18, marginTop: 10 }}>
                {recentCampaigns.map((campaign) => (
                  <div key={campaign.id || campaign._id} style={{ padding: "20px 22px", borderRadius: 20, background: "#fff", border: "1px solid #EAEDF4", boxShadow: "0 10px 20px -12px rgba(20,35,60,.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <div className="notranslate" translate="no" style={{ font: "600 15px 'Hanken Grotesk'", color: "#16233C" }}>{campaign.name || campaign.title || "Untitled broadcast"}</div>
                        <div style={{ font: "500 12px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color: "#8590A6" }}>{campaign.status || "ACTIVE"}</div>
                      </div>
                      <span style={{ font: "600 11px 'Hanken Grotesk'", color: "#2B5BD7", background: "#EEF4FF", padding: "8px 10px", borderRadius: 16 }}>{campaign.type || "Awareness"}</span>
                    </div>
                    <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#4B576F", marginBottom: 14, minHeight: 44 }}>{campaign.message || campaign.description || "No description available."}</div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", font: "500 12px 'Hanken Grotesk'", color: "#8590A6" }}>
                      <span>{(campaign.reach || 0).toLocaleString()} reached</span>
                      <span>Engagement {campaign.engagement ? `${Math.round(campaign.engagement)}%` : "—"}</span>
                      <span>ROI {campaign.roi ? `${campaign.roi.toFixed(1)}%` : "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 88, alignSelf: "start", maxHeight: "calc(100vh - 110px)", overflowY: "auto", paddingRight: 2 }}>
          <div style={{ background: "linear-gradient(165deg,#1B3C8F,#2B5BD7)", borderRadius: 22, padding: 24, color: "#fff", boxShadow: "0 18px 36px -22px rgba(43,91,215,.7)" }}>
            <div style={{ font: "600 13px 'Hanken Grotesk'", color: "rgba(255,255,255,.82)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>This will reach</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 4 }}>
              <span className="notranslate" translate="no" style={{ font: "400 46px 'Newsreader'", color: "#fff", lineHeight: .9 }}>{totalReach.toLocaleString()}</span>
              <span style={{ font: "500 14px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color: "rgba(255,255,255,.8)", marginBottom: 6 }}>residents</span>
            </div>
            <div style={{ font: "500 12px 'Hanken Grotesk'", color: "rgba(255,255,255,.78)", margin: "8px 0 18px" }}>{activeCampaigns.length} active broadcast campaign{activeCampaigns.length === 1 ? "" : "s"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {channelCards.map((card, index) => {
                const width = activeCampaigns.length ? Math.max(15, (card.value / activeCampaigns.length) * 100) : 15;
                return (
                  <div key={card.label} style={{ marginBottom: index === 0 ? 6 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <MS style={{ fontSize: 18, color: "#fff" }}>{card.icon}</MS>
                      <span style={{ flex: 1, font: "600 13px 'Hanken Grotesk'", color: "#fff" }}>{card.label}</span>
                      <span style={{ font: "700 13px 'Hanken Grotesk'", color: "#fff" }}>{card.value}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,.2)" }}>
                      <div style={{ width: `${width}%`, height: "100%", borderRadius: 3, background: "#fff" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "22px 24px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
              <MS style={{ fontSize: 20, color: "#C9871F" }}>bolt</MS>
              <span style={{ font: "700 15px 'Hanken Grotesk'", color: "#16233C" }}>Best time to send</span>
            </div>
            <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 14 }}>When your active broadcasts are scheduled</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FCF6EA", borderRadius: 12, padding: "13px 15px" }}>
              <div>
                <div style={{ font: "700 15px 'Hanken Grotesk'", color: "#16233C" }}>{bestTimeToSend || "No schedule yet"}</div>
                <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6" }}>{campaigns.filter((campaign) => campaign.startDate).length} campaigns with start times</div>
              </div>
              <span style={{ background: "#C9871F", color: "#fff", font: "700 12px 'Hanken Grotesk'", padding: "6px 11px", borderRadius: 20 }}>Suggested</span>
            </div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "22px 24px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ font: "700 15px 'Hanken Grotesk'", color: "#16233C" }}>Scheduled</span>
              {scheduledCampaigns.length > 0 && (
                <span
                  onClick={() => setShowAllScheduled(v => !v)}
                  style={{ font: "600 12px 'Hanken Grotesk'", color: "#2B5BD7", cursor: "pointer" }}
                >
                  {showAllScheduled ? "Show less" : "View all"}
                </span>
              )}
            </div>
            {scheduledCampaigns.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 0", gap: 8 }}>
                <MS style={{ fontSize: 32, color: "#D8DEEA" }}>schedule_send</MS>
                <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#C0C7D4" }}>No scheduled broadcasts</div>
              </div>
            ) : showAllScheduled ? (
              <div style={{ display: "grid", gap: 10 }}>
                {scheduledCampaigns.map((c) => (
                  <div key={c._id || c.id} style={{ padding: "12px 14px", borderRadius: 14, background: "#F8FAFF", border: "1px solid #E6EDFF" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span className="notranslate" translate="no" style={{ font: "600 13px 'Hanken Grotesk'", color: "#16233C" }}>{c.name || "Untitled"}</span>
                      <span style={{ font: "600 11px 'Hanken Grotesk'", color: "#2B5BD7", background: "#EEF4FF", padding: "3px 8px", borderRadius: 10 }}>{c.type || "Update"}</span>
                    </div>
                    <div style={{ font: "500 12px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color: "#8590A6", display: "flex", alignItems: "center", gap: 5 }}>
                      <MIcon name="calendar_month" style={{ fontSize: 13, color: "#8590A6" }} />
                      <span className="notranslate" translate="no">{new Date(c.startDate).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                    {c.targetAudience?.length > 0 && (
                      <div style={{ font: "500 11px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color: "#9AA3B5", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
                        <MIcon name="groups" style={{ fontSize: 13, color: "#9AA3B5" }} />
                        <span>{c.targetAudience.join(", ")}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ font: "700 24px 'Newsreader'", color: "#16233C" }}>{scheduledCampaigns.length}</div>
                <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#8590A6" }}>{scheduledCampaigns.length} upcoming broadcast{scheduledCampaigns.length === 1 ? "" : "s"}</div>
                <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#16233C" }}>Next: {new Date(scheduledCampaigns[0].startDate).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
