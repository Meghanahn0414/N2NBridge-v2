/**
 * Returns the target route for a notification based on its type and the viewer's role.
 * Returns null if there is no dedicated page for this combination.
 */
export function getNotificationRoute(notification, role) {
  const type = (notification?.type || '').toUpperCase();
  const r = (role || '').toUpperCase();

  switch (type) {
    case 'GRIEVANCE':
    case 'COMPLAINT':
      if (r === 'ADMIN' || r === 'MANAGER') return '/admin/module/complaint-management';
      if (r === 'REPRESENTATIVE') return '/rep/complaints-dashboard';
      if (r === 'FIELD_OFFICER') return '/field/grievances';
      return '/citizen/complaints';

    case 'EVENT':
      if (r === 'ADMIN' || r === 'MANAGER') return '/admin/module/event-management';
      if (r === 'REPRESENTATIVE') return '/rep/events';
      if (r === 'FIELD_OFFICER') return '/field/events';
      return '/citizen/events';

    case 'CAMPAIGN':
      if (r === 'ADMIN' || r === 'MANAGER') return '/admin/module/campaign-management';
      if (r === 'REPRESENTATIVE') return '/rep/communications';
      return '/citizen/campaigns';

    case 'TASK':
      if (r === 'ADMIN' || r === 'MANAGER') return '/admin/module/team-management';
      if (r === 'FIELD_OFFICER') return '/field/tasks';
      return null;

    case 'ALERT':
    case 'EMERGENCY':
      if (r === 'ADMIN' || r === 'MANAGER') return '/admin/module/alert-management';
      if (r === 'REPRESENTATIVE') return '/rep/emergency-center';
      if (r === 'FIELD_OFFICER') return '/field/alerts';
      return '/citizen/emergency';

    case 'SYSTEM':
    default:
      return null;
  }
}
