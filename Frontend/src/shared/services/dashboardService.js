import api from "./api";

const ROLE_ENDPOINT = {
<<<<<<< HEAD
  CITIZEN: "/api/analytics/grievances",
  FIELD_OFFICER: "/api/analytics/dashboard",
  ADMIN: "/api/analytics/dashboard",
  REPRESENTATIVE: "/api/analytics/dashboard",
  CONSTITUENCY_MANAGER: "/api/analytics/dashboard",
=======
  CITIZEN: "/api/dashboard/citizen",
  FIELD_OFFICER: "/api/dashboard/officer",
  ADMIN: "/api/dashboard/admin",
  REPRESENTATIVE: "/api/dashboard/mla",
  CONSTITUENCY_MANAGER: "/api/dashboard/mla",
  MLA: "/api/dashboard/mla",
>>>>>>> 271478c11829ebfafc1133b2388027ad233ec912
};

/**
 * Transforms analytics response to dashboard format expected by CommandCenter
 */
function transformAnalyticsData(analyticsData, role) {
  if (!analyticsData) return null;

  // Extract the data from response
  const data = analyticsData.data || analyticsData;
  
  if (role === "CITIZEN") {
    // For citizens, transform grievance analytics into grievanceSummary
    return {
      grievanceSummary: {
        total: data.total || 0,
        pending: (data.byStatus?.NEW || 0) + (data.byStatus?.ASSIGNED || 0),
        completed: data.byStatus?.RESOLVED || 0,
      },
      registeredEvents: [], // Will be populated separately if needed
      recentNotifications: [], // Will be populated separately if needed
      metrics: data, // Keep original analytics data for reference
    };
  }

  if (role === "FIELD_OFFICER") {
    // For field officers, provide task and grievance summaries
    return {
      pendingTasks: data.pendingTasks || 0,
      pendingGrievances: data.pendingGrievances || 0,
      pendingAlerts: data.pendingAlerts || 0,
      tasks: data.tasks || [],
      grievances: data.grievances || [],
      metrics: data,
    };
  }

  // For admins and others, return the full metrics structure
  return {
    metrics: {
      grievances: {
        total: data.total || 0,
        byStatus: data.byStatus || {},
        byPriority: data.byPriority || {},
        byCategory: data.byCategory || {},
      },
      alerts: data.alerts || { total: 0, byPriority: {} },
      events: data.events || { totalEvents: 0 },
      users: data.users || { total: 0 },
    },
  };
}

export async function getDashboardForRole(role = "ADMIN") {
  const endpoint = ROLE_ENDPOINT[role] || ROLE_ENDPOINT.ADMIN;
  try {
    const response = await api.get(endpoint);
    // Get the actual data from the response
    const analyticsData = response.data?.data ?? response.data;
    
    // Transform it into the format CommandCenter expects
    const transformedData = transformAnalyticsData(analyticsData, role);
    
    return transformedData;
  } catch (error) {
    console.error(`Error fetching dashboard data from ${endpoint}:`, error);
    throw error;
  }
}

export async function getMlaDashboard() {
  const response = await api.get(ROLE_ENDPOINT.MLA);
  return response.data?.data ?? response.data;
}
