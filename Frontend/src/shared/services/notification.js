import api from "./api";

export const notificationService = {
  /** Fetch paginated notifications for the logged-in user */
  getAll(page = 1, perPage = 20) {
    return api
      .get("/api/notifications", { params: { page, per_page: perPage } })
      .then((r) => (Array.isArray(r.data) ? r.data : r.data?.data ?? []));
  },

  /** Fetch only unread notifications */
  getUnread() {
    return api
      .get("/api/notifications/unread")
      .then((r) => r.data?.data ?? r.data ?? []);
  },

  /** Unread count + total count */
  getStats() {
    return api
      .get("/api/notifications/stats")
      .then((r) => r.data?.data ?? { unread: 0, total: 0 });
  },

  /** Mark a single notification as read */
  markRead(notificationId) {
    return api.patch(`/api/notifications/${notificationId}/read`).then((r) => r.data);
  },

  /** Mark all notifications as read */
  markAllRead() {
    return api.post("/api/notifications/mark-all-read").then((r) => r.data);
  },

  /** Delete a notification */
  remove(notificationId) {
    return api.delete(`/api/notifications/${notificationId}`).then((r) => r.data);
  },

  // ── Admin: broadcast endpoints ───────────────────────────────────────────

  /** Send notification to all citizens in a ward */
  notifyWard(wardId, { title, body, type = "INFO" }) {
    return api
      .post(`/api/notifications/notify-ward/${wardId}`, { title, body, type })
      .then((r) => r.data);
  },

  /** Send notification to ALL citizens */
  broadcastAll({ title, body, type = "INFO" }) {
    return api
      .post("/api/notifications/broadcast-all", { title, body, type })
      .then((r) => r.data);
  },
};
