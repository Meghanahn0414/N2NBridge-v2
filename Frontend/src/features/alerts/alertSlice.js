import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchAlerts, fetchAlertById, createAlert, updateAlert, deleteAlert, broadcastAlert } from './alertService';

export const loadAlerts = createAsyncThunk(
  'alerts/loadAlerts',
  async ({ page = 1, perPage = 100, filters = {} } = {}, { rejectWithValue }) => {
    try {
      return await fetchAlerts(page, perPage, filters);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const loadAlertById = createAsyncThunk(
  'alerts/loadAlertById',
  async (alertId, { rejectWithValue }) => {
    try {
      return await fetchAlertById(alertId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addAlert = createAsyncThunk(
  'alerts/addAlert',
  async (alertData, { rejectWithValue }) => {
    try {
      return await createAlert(alertData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const editAlert = createAsyncThunk(
  'alerts/editAlert',
  async ({ alertId, alertData }, { rejectWithValue }) => {
    try {
      return await updateAlert(alertId, alertData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const removeAlert = createAsyncThunk(
  'alerts/removeAlert',
  async (alertId, { rejectWithValue }) => {
    try {
      await deleteAlert(alertId);
      return alertId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const sendBroadcast = createAsyncThunk(
  'alerts/sendBroadcast',
  async (alertData, { rejectWithValue }) => {
    try {
      return await broadcastAlert(alertData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const alertSlice = createSlice({
  name: 'alerts',
  initialState: {
    items: [],
    selectedAlert: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSelectedAlert(state) {
      state.selectedAlert = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAlerts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loadAlerts.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(loadAlerts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(loadAlertById.pending, (state) => { state.loading = true; })
      .addCase(loadAlertById.fulfilled, (state, action) => { state.loading = false; state.selectedAlert = action.payload; })
      .addCase(loadAlertById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(addAlert.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(addAlert.rejected, (state, action) => { state.error = action.payload; })

      .addCase(editAlert.fulfilled, (state, action) => {
        const idx = state.items.findIndex(a => a._id === action.payload._id || a.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(editAlert.rejected, (state, action) => { state.error = action.payload; })

      .addCase(removeAlert.fulfilled, (state, action) => {
        state.items = state.items.filter(a => (a._id || a.id) !== action.payload);
      })
      .addCase(removeAlert.rejected, (state, action) => { state.error = action.payload; })

      .addCase(sendBroadcast.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(sendBroadcast.rejected, (state, action) => { state.error = action.payload; });
  },
});

export const { clearError, clearSelectedAlert } = alertSlice.actions;
export default alertSlice.reducer;
