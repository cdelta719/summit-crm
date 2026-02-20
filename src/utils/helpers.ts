import type { Lead, Filters } from '../types';

export function daysBetween(dateStr1: string, dateStr2: string): number {
  if (!dateStr1 || !dateStr2) return 0;
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.floor(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export function daysInStage(lead: Lead): number {
  return daysBetween(lead.stageEnteredDate, new Date().toISOString());
}

export function isCallOverdue(lead: Lead): boolean {
  if (!lead.scheduledCallDate || lead.callCompleted) return false;
  const scheduled = new Date(lead.scheduledCallDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return scheduled < today;
}

export function isCallToday(lead: Lead): boolean {
  if (!lead.scheduledCallDate || lead.callCompleted) return false;
  const today = new Date().toISOString().split('T')[0];
  return lead.scheduledCallDate.split('T')[0] === today;
}

export function isCallOnDate(lead: Lead, dateStr: string): boolean {
  if (!lead.scheduledCallDate) return false;
  return lead.scheduledCallDate.split('T')[0] === dateStr;
}

export function filterLeads(leads: Lead[], filters: Filters): Lead[] {
  return leads.filter(lead => {
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const searchable = [
        lead.companyName, lead.pointOfContact, lead.email, lead.phone,
        lead.location, lead.industry, lead.needs,
        ...lead.notes.map(n => n.content)
      ].join(' ').toLowerCase();
      if (!searchable.includes(s)) return false;
    }
    if (filters.stage && lead.pipelineStage !== filters.stage) return false;
    if (filters.industry && lead.industry !== filters.industry) return false;
    if (filters.leadSource && lead.leadSource !== filters.leadSource) return false;
    if (filters.assignedTo && lead.assignedTo !== filters.assignedTo) return false;
    if (filters.dateFrom && lead.createdDate < filters.dateFrom) return false;
    if (filters.dateTo && lead.createdDate > filters.dateTo) return false;
    return true;
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
