export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  AGENT: 'agent',
  CUSTOMER: 'customer'
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

export const STATUS_COLORS = {
  [TICKET_STATUS.OPEN]: 'badge-primary',
  [TICKET_STATUS.IN_PROGRESS]: 'badge-warning',
  [TICKET_STATUS.RESOLVED]: 'badge-success',
  [TICKET_STATUS.CLOSED]: 'badge-gray'
};

export const PRIORITY_COLORS = {
  [TICKET_PRIORITY.LOW]: 'badge-gray',
  [TICKET_PRIORITY.MEDIUM]: 'badge-primary',
  [TICKET_PRIORITY.HIGH]: 'badge-warning',
  [TICKET_PRIORITY.URGENT]: 'badge-danger'
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.AGENT]: 'Agent',
  [ROLES.CUSTOMER]: 'Customer'
};

export const STATUS_LABELS = {
  [TICKET_STATUS.OPEN]: 'Open',
  [TICKET_STATUS.IN_PROGRESS]: 'In Progress',
  [TICKET_STATUS.RESOLVED]: 'Resolved',
  [TICKET_STATUS.CLOSED]: 'Closed'
};

export const PRIORITY_LABELS = {
  [TICKET_PRIORITY.LOW]: 'Low',
  [TICKET_PRIORITY.MEDIUM]: 'Medium',
  [TICKET_PRIORITY.HIGH]: 'High',
  [TICKET_PRIORITY.URGENT]: 'Urgent'
};

export const CATEGORY_LABELS = {
  technical: 'Technical',
  billing: 'Billing',
  general: 'General',
  feature_request: 'Feature Request',
  bug_report: 'Bug Report',
  account: 'Account',
  other: 'Other'
};