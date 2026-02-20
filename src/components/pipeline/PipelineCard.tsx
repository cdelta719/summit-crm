import { useDraggable } from '@dnd-kit/core';
import type { Lead, AppSettings } from '../../types';
import { useApp } from '../../store/AppContext';
import { daysInStage, formatCurrency, formatDateShort, isCallOverdue } from '../../utils/helpers';

interface Props {
  lead: Lead;
  isDragging?: boolean;
  settings: AppSettings;
}

export default function PipelineCard({ lead, isDragging, settings }: Props) {
  const { dispatch } = useApp();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: lead.id });
  const days = daysInStage(lead);
  const overdue = isCallOverdue(lead);
  const stale = days >= settings.staleThresholdDays;

  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => dispatch({ type: 'SELECT_LEAD', id: lead.id })}
      className={`p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all hover:border-red-300 hover:shadow-md hover:shadow-red-500/5 ${
        isDragging ? 'opacity-80 shadow-xl shadow-red-500/10 scale-105' : ''
      } ${overdue ? 'border-danger/40 bg-red-50 ring-1 ring-red-300' : stale ? 'border-warning/30 bg-amber-50' : 'border-border bg-white hover:bg-white'}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-medium text-text-primary truncate">{lead.companyName || 'Untitled'}</h4>
      </div>
      <p className="text-xs text-text-secondary truncate">{lead.pointOfContact}</p>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        <span className="text-xs font-medium text-brand">{lead.dealValue ? formatCurrency(lead.dealValue) : '—'}</span>
        <div className="flex items-center gap-2">
          {overdue && <span className="text-[10px] text-danger font-medium">📞 Overdue</span>}
          <span className={`text-[10px] ${stale ? 'text-warning' : 'text-text-tertiary'}`}>{days}d</span>
        </div>
      </div>
      {lead.scheduledCallDate && (
        <p className={`text-[10px] mt-1 ${overdue ? 'text-danger font-medium' : 'text-text-tertiary'}`}>
          📞 {formatDateShort(lead.scheduledCallDate)}
        </p>
      )}
    </div>
  );
}
