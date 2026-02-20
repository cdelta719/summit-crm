import { useState, useRef } from 'react';
import Modal from '../common/Modal';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { parseCSV } from '../../utils/csv';
import { supabase } from '../../utils/supabase';
import { toDbLead } from '../../utils/storage';
import type { Lead } from '../../types';

export default function ImportModal() {
  const { state, dispatch } = useApp();
  const { currentUser } = useAuth();
  const [parsed, setParsed] = useState<Lead[] | null>(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const leads = await parseCSV(file);
      setParsed(leads);
    } catch (err) {
      setError('Failed to parse CSV: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleImport = async () => {
    if (!parsed) return;
    setImporting(true);
    try {
      const now = new Date().toISOString();
      const dbLeads = parsed.map(l => {
        const db = toDbLead(l);
        db.created_at = l.createdDate || now;
        db.last_edited_by = currentUser?.name;
        db.last_edited_at = now;
        return db;
      });
      const { error } = await supabase.from('leads').insert(dbLeads);
      if (error) { alert('Import failed: ' + error.message); setImporting(false); return; }

      // Insert activities for each lead
      const activities = parsed.map(l => ({
        id: crypto.randomUUID(),
        lead_id: l.id,
        type: 'Note',
        description: 'Imported from CSV',
        user_id: currentUser?.id,
        user_name: currentUser?.name,
        created_at: now,
      }));
      await supabase.from('activities').insert(activities);

      // Insert notes
      const notes = parsed.flatMap(l => l.notes.map(n => ({
        id: n.id,
        lead_id: l.id,
        content: n.content,
        user_id: currentUser?.id,
        user_name: currentUser?.name,
        created_at: n.createdAt || now,
      })));
      if (notes.length > 0) await supabase.from('notes').insert(notes);

      dispatch({ type: 'IMPORT_LEADS', leads: parsed });
      setParsed(null);
    } catch (err) {
      alert('Import failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setImporting(false);
    }
  };

  const close = () => {
    setParsed(null);
    setError('');
    dispatch({ type: 'TOGGLE_IMPORT_MODAL', show: false });
  };

  return (
    <Modal open={state.showImportModal} onClose={close} title="Import Leads from CSV" wide>
      {!parsed ? (
        <div className="space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-brand/30 transition-all"
          >
            <p className="text-3xl mb-3">📥</p>
            <p className="text-sm text-text-secondary">Click to upload a CSV file</p>
            <p className="text-xs text-text-tertiary mt-1">Supports: company_name, contact_name, industry, city, phone, email, notes, deal_tier</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-primary font-medium">{parsed.length} leads found</p>
            <button onClick={() => setParsed(null)} className="text-xs text-text-tertiary hover:text-text-secondary">Choose different file</button>
          </div>
          <div className="max-h-64 overflow-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-surface-2 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-text-secondary">Company</th>
                  <th className="px-3 py-2 text-left text-text-secondary">Contact</th>
                  <th className="px-3 py-2 text-left text-text-secondary">Email</th>
                  <th className="px-3 py-2 text-left text-text-secondary">Phone</th>
                  <th className="px-3 py-2 text-left text-text-secondary">Industry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parsed.slice(0, 20).map(l => (
                  <tr key={l.id}>
                    <td className="px-3 py-2 text-text-primary">{l.companyName}</td>
                    <td className="px-3 py-2 text-text-secondary">{l.pointOfContact}</td>
                    <td className="px-3 py-2 text-text-secondary">{l.email}</td>
                    <td className="px-3 py-2 text-text-secondary">{l.phone}</td>
                    <td className="px-3 py-2 text-text-secondary">{l.industry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.length > 20 && <p className="text-xs text-text-tertiary text-center py-2">... and {parsed.length - 20} more</p>}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button onClick={close} className="px-4 py-2 text-sm text-text-secondary hover:bg-surface-3 rounded-lg transition-all">Cancel</button>
            <button onClick={handleImport} disabled={importing}
              className="px-6 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50">
              Import {parsed.length} Leads
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
