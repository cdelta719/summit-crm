import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import type { Lead } from '../types';

const FIELD_MAP: Record<string, string> = {
  company_name: 'companyName',
  companyname: 'companyName',
  company: 'companyName',
  contact_name: 'pointOfContact',
  contactname: 'pointOfContact',
  contact: 'pointOfContact',
  point_of_contact: 'pointOfContact',
  name: 'pointOfContact',
  email: 'email',
  phone: 'phone',
  telephone: 'phone',
  industry: 'industry',
  city: 'location',
  location: 'location',
  needs: 'needs',
  employee_count: 'employeeCount',
  employeecount: 'employeeCount',
  employees: 'employeeCount',
  annual_revenue: 'annualRevenue',
  annualrevenue: 'annualRevenue',
  revenue: 'annualRevenue',
  notes: '_notes',
  deal_value: '_dealValue',
  dealvalue: '_dealValue',
  deal_tier: '_dealValue',
  dealtier: '_dealValue',
  lead_source: 'leadSource',
  leadsource: 'leadSource',
  source: 'leadSource',
  assigned_to: 'assignedTo',
  assignedto: 'assignedTo',
};

export function parseCSV(file: File): Promise<Lead[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const leads: Lead[] = (results.data as Record<string, string>[]).map(row => {
          const now = new Date().toISOString();
          const lead: Lead = {
            id: uuidv4(),
            companyName: '',
            pointOfContact: '',
            industry: '',
            needs: '',
            employeeCount: '',
            annualRevenue: '',
            location: '',
            notes: [],
            pipelineStage: 'new_lead',
            dealValue: 0,
            leadSource: '',
            assignedTo: '',
            phone: '',
            email: '',
            scheduledCallDate: '',
            callCompleted: false,
            stageEnteredDate: now,
            createdDate: now,
            activities: [{ id: uuidv4(), leadId: '', type: 'Note', description: 'Imported from CSV', timestamp: now }],
          };
          lead.activities[0].leadId = lead.id;

          for (const [csvCol, value] of Object.entries(row)) {
            const key = FIELD_MAP[csvCol.toLowerCase().trim().replace(/\s+/g, '_')];
            if (!key) continue;
            if (key === '_notes') {
              if (value) lead.notes = [{ id: uuidv4(), content: value, createdAt: now }];
            } else if (key === '_dealValue') {
              lead.dealValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
            } else {
              (lead as unknown as Record<string, unknown>)[key] = value || '';
            }
          }
          return lead;
        });
        resolve(leads.filter(l => l.companyName || l.pointOfContact));
      },
      error: reject,
    });
  });
}

export function exportCSV(leads: Lead[]): string {
  const rows = leads.map(l => ({
    company_name: l.companyName,
    point_of_contact: l.pointOfContact,
    email: l.email,
    phone: l.phone,
    industry: l.industry,
    needs: l.needs,
    employee_count: l.employeeCount,
    annual_revenue: l.annualRevenue,
    location: l.location,
    lead_source: l.leadSource,
    pipeline_stage: l.pipelineStage,
    deal_value: l.dealValue,
    assigned_to: l.assignedTo,
    scheduled_call_date: l.scheduledCallDate,
    notes: l.notes.map(n => n.content).join(' | '),
    created_date: l.createdDate,
  }));
  return Papa.unparse(rows);
}
