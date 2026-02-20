// Seed loader: populates localStorage with 202 leads on first load
import { SEED_LEADS } from './seed-leads';

const PREFIX = 'summit_crm_';
const SEED_KEY = 'summit_crm_seeded_v1';

export function seedIfNeeded() {
  if (localStorage.getItem(SEED_KEY)) return; // already seeded

  const existing = localStorage.getItem(PREFIX + 'leads');
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localStorage.setItem(SEED_KEY, 'true');
        return; // leads already exist
      }
    } catch { /* continue to seed */ }
  }

  const now = new Date().toISOString();
  const leads: Record<string, unknown>[] = [];
  const activities: Record<string, unknown>[] = [];

  for (let i = 0; i < SEED_LEADS.length; i++) {
    const s = SEED_LEADS[i];
    const id = crypto.randomUUID();
    const actId = crypto.randomUUID();

    leads.push({
      id,
      company_name: s.companyName,
      point_of_contact: '',
      industry: s.industry,
      needs: s.needs,
      employee_count: '',
      annual_revenue: '',
      location: s.location,
      phone: s.phone,
      email: '',
      pipeline_stage: 'new_lead',
      deal_value: 0,
      lead_source: 'Cold Call',
      assigned_to: 'CD',
      scheduled_call_date: null,
      stage_entered_date: now,
      created_at: now,
      last_edited_by: 'System',
      last_edited_at: now,
    });

    activities.push({
      id: actId,
      lead_id: id,
      type: 'Note',
      description: 'Lead imported from Google Maps scrape (Feb 2026) — no website detected',
      user_id: 'system',
      user_name: 'System',
      created_at: now,
    });

    // Notes batched below
  }

  // Build notes for leads with Google Maps links
  const notes: Record<string, unknown>[] = [];
  for (let i = 0; i < SEED_LEADS.length; i++) {
    const s = SEED_LEADS[i];
    if (s.noteText) {
      notes.push({
        id: crypto.randomUUID(),
        lead_id: leads[i].id,
        content: s.noteText,
        user_id: 'system',
        user_name: 'System',
        created_at: now,
      });
    }
  }

  localStorage.setItem(PREFIX + 'leads', JSON.stringify(leads));
  localStorage.setItem(PREFIX + 'activities', JSON.stringify(activities));
  localStorage.setItem(PREFIX + 'notes', JSON.stringify(notes));
  localStorage.setItem(SEED_KEY, 'true');

  console.log(`[Summit CRM] Seeded ${leads.length} leads, ${activities.length} activities, ${notes.length} notes`);
}
