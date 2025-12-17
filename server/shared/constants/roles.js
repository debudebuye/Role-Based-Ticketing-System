export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  AGENT: 'agent',
  CUSTOMER: 'customer'
};

export const PERMISSIONS = {
  // User management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  
  // Ticket management
  CREATE_TICKET: 'create_ticket',
  VIEW_ALL_TICKETS: 'view_all_tickets',
  VIEW_ASSIGNED_TICKETS: 'view_assigned_tickets',
  VIEW_OWN_TICKETS: 'view_own_tickets',
  ASSIGN_TICKETS: 'assign_tickets',
  UPDATE_TICKET_STATUS: 'update_ticket_status',
  SET_TICKET_PRIORITY: 'set_ticket_priority',
  DELETE_TICKETS: 'delete_tickets',
  
  // Comments
  ADD_COMMENTS: 'add_comments',
  VIEW_COMMENTS: 'view_comments',
  
  // Reports
  VIEW_REPORTS: 'view_reports',
  VIEW_GLOBAL_REPORTS: 'view_global_reports'
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_TICKET,
    PERMISSIONS.VIEW_ALL_TICKETS,
    PERMISSIONS.ASSIGN_TICKETS,
    PERMISSIONS.UPDATE_TICKET_STATUS,
    PERMISSIONS.SET_TICKET_PRIORITY,
    PERMISSIONS.DELETE_TICKETS,
    PERMISSIONS.ADD_COMMENTS,
    PERMISSIONS.VIEW_COMMENTS,
    PERMISSIONS.VIEW_GLOBAL_REPORTS
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_TICKET,
    PERMISSIONS.VIEW_ALL_TICKETS,
    PERMISSIONS.ASSIGN_TICKETS,
    PERMISSIONS.UPDATE_TICKET_STATUS,
    PERMISSIONS.SET_TICKET_PRIORITY,
    PERMISSIONS.ADD_COMMENTS,
    PERMISSIONS.VIEW_COMMENTS,
    PERMISSIONS.VIEW_REPORTS
  ],
  [ROLES.AGENT]: [
    PERMISSIONS.VIEW_ASSIGNED_TICKETS,
    PERMISSIONS.UPDATE_TICKET_STATUS,
    PERMISSIONS.ADD_COMMENTS,
    PERMISSIONS.VIEW_COMMENTS
  ],
  [ROLES.CUSTOMER]: [
    PERMISSIONS.CREATE_TICKET,
    PERMISSIONS.VIEW_OWN_TICKETS,
    PERMISSIONS.ADD_COMMENTS,
    PERMISSIONS.VIEW_COMMENTS
  ]
};

export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const TICKET_CATEGORIES = [
  'technical',
  'billing',
  'general',
  'feature_request',
  'bug_report',
  'account',
  'other'
];