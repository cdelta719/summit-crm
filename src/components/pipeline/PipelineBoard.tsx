import { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, type DragEndEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useApp } from '../../store/AppContext';
import { PIPELINE_STAGES } from '../../types';
import type { PipelineStage } from '../../types';
import { filterLeads } from '../../utils/helpers';
import StageColumn from './StageColumn';
import PipelineCard from './PipelineCard';
import FilterBar from '../common/FilterBar';

export default function PipelineBoard() {
  const { state, moveLead } = useApp();
  const [activeId, setActiveId] = useState<string | null>(null);
  const filteredLeads = filterLeads(state.leads, state.filters);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const leadId = String(active.id);
    const newStage = String(over.id) as PipelineStage;
    if (PIPELINE_STAGES.some(s => s.key === newStage)) {
      const lead = state.leads.find(l => l.id === leadId);
      if (lead && lead.pipelineStage !== newStage) {
        moveLead(leadId, newStage);
      }
    }
  };

  const activeLead = activeId ? state.leads.find(l => l.id === activeId) : null;

  return (
    <div className="flex flex-col h-full">
      <FilterBar />
      <div className="flex-1 overflow-hidden p-4">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid gap-3 h-full" style={{ gridTemplateColumns: `repeat(${PIPELINE_STAGES.length}, 1fr)` }}>
            {PIPELINE_STAGES.map(stage => (
              <StageColumn
                key={stage.key}
                stage={stage}
                leads={filteredLeads.filter(l => l.pipelineStage === stage.key)}
                settings={state.settings}
              />
            ))}
          </div>
          <DragOverlay>
            {activeLead ? <PipelineCard lead={activeLead} isDragging settings={state.settings} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
