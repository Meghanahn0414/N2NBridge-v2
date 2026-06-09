import api from "./api";

const ROLE_ENDPOINT = {
  CITIZEN: "/api/dashboard/citizen",
  FIELD_OFFICER: "/api/dashboard/officer",
  ADMIN: "/api/dashboard/admin",
  REPRESENTATIVE: "/api/dashboard/mla",
  CONSTITUENCY_MANAGER: "/api/dashboard/mla",
  MLA: "/api/dashboard/mla",
};

/**
 * Transforms analytics response to dashboard format expected by CommandCenter
 */
function transformAnalyticsData(analyticsData, role) {
  if (!analyticsData) return null;

  // The backend returns either a flat structure or a nested one with metrics
  // Check if this is a dashboard response (with metrics) or raw analytics data
  const data = analyticsData.data || analyticsData;
  const metrics = data.metrics || data;
  
  if (role === "CITIZEN") {
    // For citizens, transform grievance analytics into grievanceSummary
    const grievanceMetrics = metrics.grievances || {};
    return {
      grievanceSummary: {
        total: grievanceMetrics.total || 0,
        pending: (grievanceMetrics.byStatus?.NEW || 0) + (grievanceMetrics.byStatus?.ASSIGNED || 0),
        completed: grievanceMetrics.byStatus?.RESOLVED || 0,
      },
      registeredEvents: [], // Will be populated separately if needed
      recentNotifications: [], // Will be populated separately if needed
      metrics: metrics, // Keep original analytics data for reference
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
      metrics: metrics,
    };
  }

  // For admins and others, return the full metrics structure
  return {
    metrics: {
      grievances: metrics.grievances || { total: 0, byStatus: {}, byPriority: {}, byCategory: {} },
      alerts: metrics.alerts || { total: 0, byPriority: {} },
      events: metrics.events || { totalEvents: 0 },
      users: metrics.users || { total: 0, byRole: {} },
      resolutionTime: metrics.resolutionTime || {},
      activeUsers: metrics.activeUsers || { active: 0, trend: 0 },
      sentimentDistribution: metrics.sentimentDistribution || {},
    },
    overview: data.overview,
    recentActivity: data.recentActivity,
    teamPerformance: data.teamPerformance,
    grievanceTrends: data.grievanceTrends,
    systemHealth: data.systemHealth,
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
