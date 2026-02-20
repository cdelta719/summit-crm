export type PipelineStage =
  | 'new_lead'
  | 'opportunity_identified'
  | 'following_up'
  | 'awaiting_install'
  | 'closed_won';

export const PIPELINE_STAGES: { key: PipelineStage; label: string; icon: string; color: string }[] = [
  { key: 'new_lead', label: 'New Lead', icon: '🆕', color: '#2A4F7F' },
  { key: 'opportunity_identified', label: 'Opportunity Identified', icon: '🎯', color: '#1E3A5F' },
  { key: 'following_up', label: 'Following Up', icon: '⏳', color: '#D4A844' },
  { key: 'awaiting_install', label: 'Awaiting Install', icon: '🔧', color: '#B8922E' },
  { key: 'closed_won', label: 'Closed Won', icon: '🏆', color: '#152C47' },
];

export const INDUSTRIES = [
  'Real Estate', 'Law Firm', 'Dental/Medical', 'Financial Advisory',
  'Marketing Agency', 'B2B Sales', 'Construction', 'E-Commerce',
  'Insurance', 'Recruiting', 'IT/MSP', 'Accounting',
  'Home Services', 'Auto', 'Veterinary', 'Other'
] as const;

export const LEAD_SOURCES = [
  'Cold Call', 'Cold Email', 'Website Inbound', 'Referral', 'LinkedIn', 'Event', 'Other'
] as const;

export const TEAM_MEMBERS = ['CD'] as const;

export type ActivityType = 'Call' | 'Email' | 'Meeting' | 'Note' | 'Stage Change' | 'Call Scheduled' | 'Call Completed';

export type UserRole = 'Admin' | 'Manager' | 'Sales Rep';

export const AVATAR_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#14b8a6',
  '#a855f7', '#e11d48', '#0ea5e9', '#d946ef', '#65a30d',
];

export interface ProfileConfig {
  id: string;
  name: string;
  role: UserRole;
  color: string;
  initials: string;
}

export const PROFILES: ProfileConfig[] = [
  { id: 'cd', name: 'CD', role: 'Admin', color: '#1E3A5F', initials: 'CD' },
];

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatarColor: string;
  active: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface Activity {
  id: string;
  leadId: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, string>;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  userId?: string;
  userName?: string;
}

export interface Lead {
  id: string;
  companyName: string;
  pointOfContact: string;
  industry: string;
  needs: string;
  employeeCount: string;
  annualRevenue: string;
  location: string;
  notes: Note[];
  pipelineStage: PipelineStage;
  dealValue: number;
  leadSource: string;
  assignedTo: string;
  phone: string;
  email: string;
  scheduledCallDate: string;
  callCompleted: boolean;
  stageEnteredDate: string;
  createdDate: string;
  activities: Activity[];
  lastEditedBy?: string;
  lastEditedAt?: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: Filters;
}

export interface Filters {
  search: string;
  stage: PipelineStage | '';
  industry: string;
  leadSource: string;
  assignedTo: string;
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_FILTERS: Filters = {
  search: '',
  stage: '',
  industry: '',
  leadSource: '',
  assignedTo: '',
  dateFrom: '',
  dateTo: '',
};

export interface AppSettings {
  staleThresholdDays: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  staleThresholdDays: 7,
};
