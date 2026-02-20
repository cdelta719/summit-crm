import { createContext, useContext, useReducer, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Lead, Filters, FilterPreset, AppSettings, PipelineStage, Activity } from '../types';
import { DEFAULT_FILTERS } from '../types';
import { loadFilterPresets, saveFilterPresets, loadSettings, saveSettings, fromDbLead, toDbLead, fromDbNote, fromDbActivity } from '../utils/storage';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';

type View = 'pipeline' | 'list' | 'dashboard' | 'detail' | 'team' | 'profile' | 'tickets' | 'clients' | 'contracts' | 'reports' | 'training' | 'tasks' | 'revenue' | 'emails' | 'leaderboard' | 'meetings';

interface State {
  leads: Lead[];
  filters: Filters;
  filterPresets: FilterPreset[];
  settings: AppSettings;
  currentView: View;
  selectedLeadId: string | null;
  showAddModal: boolean;
  showImportModal: boolean;
  loading: boolean;
}

type Action =
  | { type: 'SET_LEADS'; leads: Lead[] }
  | { type: 'ADD_LEAD'; lead: Lead }
  | { type: 'UPDATE_LEAD'; lead: Lead }
  | { type: 'DELETE_LEAD'; id: string }
  | { type: 'MOVE_LEAD'; id: string; stage: PipelineStage; userId?: string; userName?: string }
  | { type: 'ADD_ACTIVITY'; leadId: string; activity: Activity }
  | { type: 'UPDATE_LEAD_NOTES'; leadId: string; notes: Lead['notes'] }
  | { type: 'UPDATE_LEAD_ACTIVITIES'; leadId: string; activities: Activity[] }
  | { type: 'SET_FILTERS'; filters: Filters }
  | { type: 'SET_VIEW'; view: View }
  | { type: 'SELECT_LEAD'; id: string | null }
  | { type: 'TOGGLE_ADD_MODAL'; show?: boolean }
  | { type: 'TOGGLE_IMPORT_MODAL'; show?: boolean }
  | { type: 'IMPORT_LEADS'; leads: Lead[] }
  | { type: 'SAVE_PRESET'; preset: FilterPreset }
  | { type: 'DELETE_PRESET'; id: string }
  | { type: 'SET_SETTINGS'; settings: AppSettings }
  | { type: 'SET_LOADING'; loading: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LEADS':
      return { ...state, leads: action.leads, loading: false };
    case 'ADD_LEAD':
      return { ...state, leads: [...state.leads, action.lead] };
    case 'UPDATE_LEAD':
      return { ...state, leads: state.leads.map(l => l.id === action.lead.id ? action.lead : l) };
    case 'DELETE_LEAD':
      return { ...state, leads: state.leads.filter(l => l.id !== action.id), selectedLeadId: state.selectedLeadId === action.id ? null : state.selectedLeadId };
    case 'MOVE_LEAD': {
      const now = new Date().toISOString();
      return {
        ...state,
        leads: state.leads.map(l => {
          if (l.id !== action.id) return l;
          return { ...l, pipelineStage: action.stage, stageEnteredDate: now, lastEditedBy: action.userName, lastEditedAt: now };
        }),
      };
    }
    case 'ADD_ACTIVITY':
      return {
        ...state,
        leads: state.leads.map(l => l.id === action.leadId ? { ...l, activities: [action.activity, ...l.activities] } : l),
      };
    case 'UPDATE_LEAD_NOTES':
      return {
        ...state,
        leads: state.leads.map(l => l.id === action.leadId ? { ...l, notes: action.notes } : l),
      };
    case 'UPDATE_LEAD_ACTIVITIES':
      return {
        ...state,
        leads: state.leads.map(l => l.id === action.leadId ? { ...l, activities: action.activities } : l),
      };
    case 'SET_FILTERS':
      return { ...state, filters: action.filters };
    case 'SET_VIEW':
      return { ...state, currentView: action.view, selectedLeadId: action.view !== 'detail' ? null : state.selectedLeadId };
    case 'SELECT_LEAD':
      return { ...state, selectedLeadId: action.id, currentView: action.id ? 'detail' : state.currentView };
    case 'TOGGLE_ADD_MODAL':
      return { ...state, showAddModal: action.show ?? !state.showAddModal };
    case 'TOGGLE_IMPORT_MODAL':
      return { ...state, showImportModal: action.show ?? !state.showImportModal };
    case 'IMPORT_LEADS':
      return { ...state, leads: [...state.leads, ...action.leads], showImportModal: false };
    case 'SAVE_PRESET':
      return { ...state, filterPresets: [...state.filterPresets.filter(p => p.id !== action.preset.id), action.preset] };
    case 'DELETE_PRESET':
      return { ...state, filterPresets: state.filterPresets.filter(p => p.id !== action.id) };
    case 'SET_SETTINGS':
      return { ...state, settings: action.settings };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

interface AppContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  addLead: (data: Partial<Lead>) => void;
  updateLead: (lead: Lead) => void;
  deleteLead: (id: string) => void;
  moveLead: (id: string, stage: PipelineStage) => void;
  addActivity: (leadId: string, type: Activity['type'], description: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [state, dispatch] = useReducer(reducer, {
    leads: [],
    filters: DEFAULT_FILTERS,
    filterPresets: loadFilterPresets(),
    settings: loadSettings(),
    currentView: 'dashboard' as View,
    selectedLeadId: null,
    showAddModal: false,
    showImportModal: false,
    loading: true,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Save UI prefs to localStorage
  useEffect(() => { saveFilterPresets(state.filterPresets); }, [state.filterPresets]);
  useEffect(() => { saveSettings(state.settings); }, [state.settings]);

  // Load leads from Supabase
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: leadsData, error } = await supabase
          .from('leads')
          .select('*, notes(*), activities(*)');
        if (error) { console.error('Failed to load leads:', error); dispatch({ type: 'SET_LOADING', loading: false }); return; }
        if (cancelled) return;
        const leads = (leadsData || []).map((row: Record<string, unknown>) => {
          const lead = fromDbLead(row);
          // Sort notes and activities by date descending
          lead.notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          lead.activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          return lead;
        });
        dispatch({ type: 'SET_LEADS', leads });
      } catch (err) {
        console.error('Load error:', err);
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase.channel('summit-crm')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, async (payload) => {
        if (payload.eventType === 'DELETE') {
          dispatch({ type: 'DELETE_LEAD', id: (payload.old as Record<string, unknown>).id as string });
        } else if (payload.eventType === 'INSERT') {
          const row = payload.new as Record<string, unknown>;
          // Fetch with notes/activities
          const { data } = await supabase.from('leads').select('*, notes(*), activities(*)').eq('id', row.id).single();
          if (data) {
            const lead = fromDbLead(data as Record<string, unknown>);
            // Only add if not already in state
            if (!stateRef.current.leads.find(l => l.id === lead.id)) {
              dispatch({ type: 'ADD_LEAD', lead });
            }
          }
        } else if (payload.eventType === 'UPDATE') {
          const row = payload.new as Record<string, unknown>;
          const { data } = await supabase.from('leads').select('*, notes(*), activities(*)').eq('id', row.id).single();
          if (data) {
            const lead = fromDbLead(data as Record<string, unknown>);
            lead.notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            lead.activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            dispatch({ type: 'UPDATE_LEAD', lead });
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, async (payload) => {
        const row = (payload.eventType === 'DELETE' ? payload.old : payload.new) as Record<string, unknown>;
        const leadId = row.lead_id as string;
        if (!leadId) return;
        const { data } = await supabase.from('notes').select('*').eq('lead_id', leadId).order('created_at', { ascending: false });
        if (data) {
          dispatch({ type: 'UPDATE_LEAD_NOTES', leadId, notes: data.map(r => fromDbNote(r as Record<string, unknown>)) });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, async (payload) => {
        const row = (payload.eventType === 'DELETE' ? payload.old : payload.new) as Record<string, unknown>;
        const leadId = row.lead_id as string;
        if (!leadId) return;
        const { data } = await supabase.from('activities').select('*').eq('lead_id', leadId).order('created_at', { ascending: false });
        if (data) {
          dispatch({ type: 'UPDATE_LEAD_ACTIVITIES', leadId, activities: data.map(r => fromDbActivity(r as Record<string, unknown>)) });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const addLead = useCallback(async (data: Partial<Lead>) => {
    const now = new Date().toISOString();
    const id = uuidv4();
    const lead: Lead = {
      id,
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
      activities: [],
      lastEditedBy: currentUser?.name,
      lastEditedAt: now,
      ...data,
    };
    lead.id = id; // ensure id is ours

    // Insert lead into Supabase
    const dbLead = toDbLead(lead);
    dbLead.created_at = now;
    const { error } = await supabase.from('leads').insert(dbLead);
    if (error) { console.error('Failed to create lead:', error); alert('Failed to create lead: ' + error.message); return; }

    // Insert creation activity
    const actId = uuidv4();
    await supabase.from('activities').insert({
      id: actId, lead_id: id, type: 'Note', description: 'Lead created',
      user_id: currentUser?.id, user_name: currentUser?.name, created_at: now,
    });

    lead.activities = [{ id: actId, leadId: id, type: 'Note', description: 'Lead created', timestamp: now, userId: currentUser?.id, userName: currentUser?.name }];
    dispatch({ type: 'ADD_LEAD', lead });
  }, [currentUser]);

  const updateLead = useCallback(async (lead: Lead) => {
    const now = new Date().toISOString();
    lead.lastEditedBy = currentUser?.name;
    lead.lastEditedAt = now;

    const dbLead = toDbLead(lead);
    const { error } = await supabase.from('leads').update(dbLead).eq('id', lead.id);
    if (error) { console.error('Failed to update lead:', error); alert('Failed to update lead: ' + error.message); return; }

    // Handle notes - check if any new notes need inserting
    const existingLead = stateRef.current.leads.find(l => l.id === lead.id);
    const existingNoteIds = new Set(existingLead?.notes.map(n => n.id) || []);
    const newNotes = lead.notes.filter(n => !existingNoteIds.has(n.id));
    for (const note of newNotes) {
      await supabase.from('notes').insert({
        id: note.id, lead_id: lead.id, content: note.content,
        user_id: note.userId, user_name: note.userName, created_at: note.createdAt,
      });
    }

    dispatch({ type: 'UPDATE_LEAD', lead });
  }, [currentUser]);

  const deleteLead = useCallback(async (id: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) { console.error('Failed to delete lead:', error); alert('Failed to delete lead: ' + error.message); return; }
    dispatch({ type: 'DELETE_LEAD', id });
  }, []);

  const moveLead = useCallback(async (id: string, stage: PipelineStage) => {
    const now = new Date().toISOString();
    const lead = stateRef.current.leads.find(l => l.id === id);
    if (!lead || lead.pipelineStage === stage) return;

    // Update in Supabase
    await supabase.from('leads').update({
      pipeline_stage: stage,
      stage_entered_date: now,
      last_edited_by: currentUser?.name,
      last_edited_at: now,
    }).eq('id', id);

    dispatch({ type: 'MOVE_LEAD', id, stage, userId: currentUser?.id, userName: currentUser?.name });

    // Log activity
    const stageName = stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const desc = currentUser ? `${currentUser.name} moved to ${stageName}` : `Moved to ${stageName}`;
    const actId = uuidv4();
    await supabase.from('activities').insert({
      id: actId, lead_id: id, type: 'Stage Change', description: desc,
      user_id: currentUser?.id, user_name: currentUser?.name, created_at: now,
    });

    dispatch({
      type: 'ADD_ACTIVITY', leadId: id,
      activity: {
        id: actId, leadId: id, type: 'Stage Change', description: desc, timestamp: now,
        userId: currentUser?.id, userName: currentUser?.name,
        metadata: { from: lead.pipelineStage, to: stage },
      },
    });
  }, [currentUser]);

  const addActivity = useCallback(async (leadId: string, type: Activity['type'], description: string) => {
    const now = new Date().toISOString();
    const actId = uuidv4();
    await supabase.from('activities').insert({
      id: actId, lead_id: leadId, type, description,
      user_id: currentUser?.id, user_name: currentUser?.name, created_at: now,
    });
    const activity: Activity = {
      id: actId, leadId, type, description, timestamp: now,
      userId: currentUser?.id, userName: currentUser?.name,
    };
    dispatch({ type: 'ADD_ACTIVITY', leadId, activity });
  }, [currentUser]);

  return (
    <AppContext.Provider value={{ state, dispatch, addLead, updateLead, deleteLead, moveLead, addActivity }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
