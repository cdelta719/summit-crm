import type { Lead, FilterPreset, AppSettings, Activity, Note } from '../types';
import { DEFAULT_SETTINGS } from '../types';

// --- localStorage only for UI preferences ---
const PRESETS_KEY = 'summit_crm_filter_presets';
const SETTINGS_KEY = 'summit_crm_settings';

export function loadFilterPresets(): FilterPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveFilterPresets(presets: FilterPreset[]) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// --- localStorage <-> Frontend mapping ---

export function fromDbLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    companyName: (row.company_name as string) || '',
    pointOfContact: (row.point_of_contact as string) || '',
    industry: (row.industry as string) || '',
    needs: (row.needs as string) || '',
    employeeCount: (row.employee_count as string) || '',
    annualRevenue: (row.annual_revenue as string) || '',
    location: (row.location as string) || '',
    phone: (row.phone as string) || '',
    email: (row.email as string) || '',
    pipelineStage: (row.pipeline_stage as Lead['pipelineStage']) || 'new_lead',
    dealValue: (row.deal_value as number) || 0,
    leadSource: (row.lead_source as string) || '',
    assignedTo: (row.assigned_to as string) || '',
    scheduledCallDate: (row.scheduled_call_date as string) || '',
    callCompleted: false,
    stageEnteredDate: (row.stage_entered_date as string) || '',
    createdDate: (row.created_at as string) || '',
    lastEditedBy: (row.last_edited_by as string) || undefined,
    lastEditedAt: (row.last_edited_at as string) || undefined,
    notes: ((row.notes as Record<string, unknown>[]) || []).map(fromDbNote),
    activities: ((row.activities as Record<string, unknown>[]) || []).map(fromDbActivity),
  };
}

export function toDbLead(lead: Partial<Lead>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (lead.id !== undefined) db.id = lead.id;
  if (lead.companyName !== undefined) db.company_name = lead.companyName;
  if (lead.pointOfContact !== undefined) db.point_of_contact = lead.pointOfContact;
  if (lead.industry !== undefined) db.industry = lead.industry;
  if (lead.needs !== undefined) db.needs = lead.needs;
  if (lead.employeeCount !== undefined) db.employee_count = lead.employeeCount;
  if (lead.annualRevenue !== undefined) db.annual_revenue = lead.annualRevenue;
  if (lead.location !== undefined) db.location = lead.location;
  if (lead.phone !== undefined) db.phone = lead.phone;
  if (lead.email !== undefined) db.email = lead.email;
  if (lead.pipelineStage !== undefined) db.pipeline_stage = lead.pipelineStage;
  if (lead.dealValue !== undefined) db.deal_value = lead.dealValue;
  if (lead.leadSource !== undefined) db.lead_source = lead.leadSource;
  if (lead.assignedTo !== undefined) db.assigned_to = lead.assignedTo;
  if (lead.scheduledCallDate !== undefined) db.scheduled_call_date = lead.scheduledCallDate || null;
  if (lead.stageEnteredDate !== undefined) db.stage_entered_date = lead.stageEnteredDate;
  if (lead.lastEditedBy !== undefined) db.last_edited_by = lead.lastEditedBy;
  if (lead.lastEditedAt !== undefined) db.last_edited_at = lead.lastEditedAt;
  return db;
}

export function fromDbNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    content: (row.content as string) || '',
    createdAt: (row.created_at as string) || '',
    userId: (row.user_id as string) || undefined,
    userName: (row.user_name as string) || undefined,
  };
}

export function fromDbActivity(row: Record<string, unknown>): Activity {
  return {
    id: row.id as string,
    leadId: (row.lead_id as string) || '',
    type: (row.type as Activity['type']) || 'Note',
    description: (row.description as string) || '',
    timestamp: (row.created_at as string) || '',
    userId: (row.user_id as string) || undefined,
    userName: (row.user_name as string) || undefined,
  };
}
