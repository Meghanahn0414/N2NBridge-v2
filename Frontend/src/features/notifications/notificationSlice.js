import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { notificationService } from "../../shared/services/notification";

// ── Async thunks ────────────────────────────────────────────────────────────

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async ({ page = 1, perPage = 20 } = {}, { rejectWithValue }) => {
    try {
      return await notificationService.getAll(page, perPage);
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchUnread = createAsyncThunk(
  "notifications/fetchUnread",
  async (_, { rejectWithValue }) => {
    try {
      return await notificationService.getUnread();
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchStats = createAsyncThunk(
  "notifications/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      return await notificationService.getStats();
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const markRead = createAsyncThunk(
  "notifications/markRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationService.markRead(notificationId);
      return notificationId;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const markAllRead = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      return await notificationService.markAllRead();
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const removeNotification = createAsyncThunk(
  "notifications/remove",
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationService.remove(notificationId);
      return notificationId;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

// ── Admin thunks ─────────────────────────────────────────────────────────────

export const notifyWard = createAsyncThunk(
  "notifications/notifyWard",
  async ({ wardId, title, body, type = "INFO" }, { rejectWithValue }) => {
    try {
      return await notificationService.notifyWard(wardId, { title, body, type });
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const broadcastAll = createAsyncThunk(
  "notifications/broadcastAll",
  async ({ title, body, type = "INFO" }, { rejectWithValue }) => {
    try {
      return await notificationService.broadcastAll({ title, body, type });
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    unreadCount: 0,
    totalCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items = payload;
        state.unreadCount = payload.filter((n) => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      // fetchUnread
      .addCase(fetchUnread.fulfilled, (state, { payload }) => {
        state.unreadCount = payload.length;
      })

      // fetchStats
      .addCase(fetchStats.fulfilled, (state, { payload }) => {
        state.unreadCount = payload.unread ?? state.unreadCount;
        state.totalCount = payload.total ?? state.totalCount;
      })

      // markRead — flip single item
      .addCase(markRead.fulfilled, (state, { payload: id }) => {
        const item = state.items.find((n) => n._id === id || n.id === id);
        if (item) item.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      })

      // markAllRead — flip all items
      .addCase(markAllRead.fulfilled, (state) => {
        state.items.forEach((n) => { n.isRead = true; });
        state.unreadCount = 0;
      })

      // removeNotification
      .addCase(removeNotification.fulfilled, (state, { payload: id }) => {
        const idx = state.items.findIndex((n) => n._id === id || n.id === id);
        if (idx !== -1) {
          if (!state.items[idx].isRead) state.unreadCount = Math.max(0, state.unreadCount - 1);
          state.items.splice(idx, 1);
        }
      });
  },
});

export const { clearError } = notificationSlice.actions;
export default notificationSlice.reducer;
