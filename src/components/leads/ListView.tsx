import { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { PIPELINE_STAGES } from '../../types';
import { filterLeads, formatCurrency, formatDate, isCallOverdue, daysInStage } from '../../utils/helpers';
import { exportCSV } from '../../utils/csv';
import FilterBar from '../common/FilterBar';
import type { Lead } from '../../types';

type SortKey = 'companyName' | 'industry' | 'pipelineStage' | 'dealValue' | 'daysInStage' | 'scheduledCallDate';

export default function ListView() {
  const { state, dispatch } = useApp();
  const [sortKey, setSortKey] = useState<SortKey>('companyName');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = filterLeads(state.leads, state.filters);
  const sorted = [...filtered].sort((a, b) => {
    let va: string | number, vb: string | number;
    if (sortKey === 'daysInStage') {
      va = daysInStage(a);
      vb = daysInStage(b);
    } else if (sortKey === 'dealValue') {
      va = a.dealValue;
      vb = b.dealValue;
    } else {
      va = String((a as unknown as Record<string, unknown>)[sortKey] || '').toLowerCase();
      vb = String((b as unknown as Record<string, unknown>)[sortKey] || '').toLowerCase();
    }
    if (typeof va === 'number' && typeof vb === 'number') return sortAsc ? va - vb : vb - va;
    return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const handleExport = () => {
    const csv = exportCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summit-crm-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stageName = (lead: Lead) => PIPELINE_STAGES.find(s => s.key === lead.pipelineStage)?.label || lead.pipelineStage;

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
      onClick={() => toggleSort(field)}
    >
      {label} {sortKey === field ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="flex flex-col h-full">
      <FilterBar />
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-1">
        <span className="text-xs text-text-secondary">{filtered.length} leads</span>
        <button onClick={handleExport} className="text-xs text-text-secondary hover:text-text-primary hover:bg-surface-3 px-3 py-1.5 rounded-lg transition-all">
          📤 Export CSV
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-surface-1 sticky top-0 z-10">
            <tr>
              <SortHeader label="Company" field="companyName" />
              <SortHeader label="Industry" field="industry" />
              <SortHeader label="Stage" field="pipelineStage" />
              <SortHeader label="Deal Value" field="dealValue" />
              <SortHeader label="Days in Stage" field="daysInStage" />
              <SortHeader label="Scheduled Call" field="scheduledCallDate" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map(lead => {
              const overdue = isCallOverdue(lead);
              const days = daysInStage(lead);
              return (
                <tr
                  key={lead.id}
                  onClick={() => dispatch({ type: 'SELECT_LEAD', id: lead.id })}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${overdue ? 'bg-red-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-text-primary">{lead.companyName || '—'}</div>
                    <div className="text-[10px] text-text-tertiary">{lead.pointOfContact}{lead.location ? ` · ${lead.location}` : ''}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{lead.industry || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-surface-3 text-text-secondary px-2 py-1 rounded-full">{stageName(lead)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-brand">{lead.dealValue ? formatCurrency(lead.dealValue) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${days > 14 ? 'text-warning' : 'text-text-secondary'}`}>{days}d</span>
                  </td>
                  <td className={`px-4 py-3 text-xs ${overdue ? 'text-danger font-medium' : 'text-text-secondary'}`}>
                    {lead.scheduledCallDate ? formatDate(lead.scheduledCallDate) : '—'}
                    {overdue && ' ⚠️'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center h-60 text-text-tertiary">
            <p className="text-lg mb-1">No leads found</p>
            <p className="text-xs">Try adjusting your filters or add a new lead</p>
          </div>
        )}
      </div>
    </div>
  );
}
