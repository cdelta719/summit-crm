import { useState, useEffect, useCallback } from 'react';
import { localDB } from '../../utils/local-storage';
import { useAuth } from '../../store/AuthContext';
import MeetingNotesSection, { DEFAULT_LEAD_TYPES, CLIENT_EXTRA_TYPES } from '../meetings/MeetingNotesSection';

interface ClientNote {
  id: string;
  client_id: string;
  content: string;
  note_type: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

interface Client {
  id: string;
  lead_id: string | null;
  company_name: string;
  point_of_contact: string;
  phone: string;
  email: string;
  industry: string;
  location: string;
  plan_tier: string;
  setup_fee: number;
  monthly_fee: number;
  contract_start: string | null;
  next_billing_date: string | null;
  payment_status: string;
  server_provider: string;
  server_ip: string;
  channels_connected: string;
  skills_installed: string;
  deployment_date: string | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  status: string;
  satisfaction_rating: number | null;
  health_score: string;
  account_manager: string;
  onboarding_complete: boolean;
  hypercare_end_date: string | null;
  created_at: string;
  created_by: string;
  created_by_name: string;
  client_notes?: ClientNote[];
}

type ModalView = 'none' | 'add' | 'detail';

const PLAN_TIERS = ['Growth', 'Enterprise'] as const;
const PAYMENT_STATUSES = ['Current', 'Overdue', 'Paused', 'Cancelled'] as const;
const CLIENT_STATUSES = ['Active', 'Onboarding', 'Hypercare', 'Paused', 'Churned'] as const;
const HEALTH_SCORES = ['Excellent', 'Good', 'At Risk', 'Critical'] as const;
const NOTE_TYPES = ['General', 'Support', 'Billing', 'Maintenance', 'Feature Request', 'Escalation'] as const;

const HEALTH_COLORS: Record<string, string> = {
  'Excellent': 'bg-green-100 text-green-700',
  'Good': 'bg-blue-100 text-blue-700',
  'At Risk': 'bg-amber-100 text-amber-700',
  'Critical': 'bg-red-100 text-red-700',
};

const STATUS_COLORS: Record<string, string> = {
  'Active': 'bg-green-100 text-green-700',
  'Onboarding': 'bg-blue-100 text-blue-700',
  'Hypercare': 'bg-purple-100 text-purple-700',
  'Paused': 'bg-amber-100 text-amber-700',
  'Churned': 'bg-red-100 text-red-700',
};

const PAYMENT_COLORS: Record<string, string> = {
  'Current': 'bg-green-100 text-green-700',
  'Overdue': 'bg-red-100 text-red-700',
  'Paused': 'bg-amber-100 text-amber-700',
  'Cancelled': 'bg-gray-100 text-gray-700',
};

const emptyClient: Partial<Client> = {
  company_name: '', point_of_contact: '', phone: '', email: '', industry: '', location: '',
  plan_tier: 'Growth', setup_fee: 5000, monthly_fee: 250, contract_start: null,
  next_billing_date: null, payment_status: 'Current', server_provider: '', server_ip: '',
  channels_connected: '', skills_installed: '', deployment_date: null, last_maintenance_date: null,
  next_maintenance_date: null, status: 'Onboarding', satisfaction_rating: null, health_score: 'Good',
  account_manager: '', onboarding_complete: false, hypercare_end_date: null,
};

export default function ActiveClients() {
  const { currentUser } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalView, setModalView] = useState<ModalView>('none');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>(emptyClient);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<string>('General');
  const [filter, setFilter] = useState<string>('all');
  const [editMode, setEditMode] = useState(false);

  const fetchClients = useCallback(async () => {
    const { data } = await localDB
      .from('clients')
      .select('*, client_notes(*)')
      .order('created_at', { ascending: false });
    if (data) {
      const sorted = data.map((c: Client & { client_notes: ClientNote[] }) => ({
        ...c,
        client_notes: (c.client_notes || []).sort((a: ClientNote, b: ClientNote) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      }));
      setClients(sorted);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
    const channel = localDB.channel('clients-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchClients())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_notes' }, () => fetchClients())
      .subscribe();
    return () => { localDB.removeChannel(channel); };
  }, [fetchClients]);

  const handleAdd = async () => {
    if (!formData.company_name?.trim() || !currentUser) return;
    await localDB.from('clients').insert({
      ...formData,
      created_by: currentUser.id,
      created_by_name: currentUser.name,
    });
    setFormData(emptyClient);
    setModalView('none');
    fetchClients();
  };

  const handleUpdate = async () => {
    if (!selectedClient) return;
    const { client_notes, ...updateData } = { ...formData } as Record<string, unknown>;
    void client_notes;
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.created_by;
    delete updateData.created_by_name;
    await localDB.from('clients').update(updateData).eq('id', selectedClient.id);
    setEditMode(false);
    fetchClients();
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedClient || !currentUser) return;
    await localDB.from('client_notes').insert({
      client_id: selectedClient.id,
      content: newNote.trim(),
      note_type: noteType,
      user_id: currentUser.id,
      user_name: currentUser.name,
    });
    setNewNote('');
    setNoteType('General');
    fetchClients();
  };

  const openDetail = (client: Client) => {
    setSelectedClient(client);
    setFormData(client);
    setEditMode(false);
    setModalView('detail');
  };

  const filteredClients = clients.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const activeCount = clients.filter(c => c.status === 'Active').length;
  const onboardingCount = clients.filter(c => c.status === 'Onboarding' || c.status === 'Hypercare').length;
  const totalMRR = clients.filter(c => c.status === 'Active' || c.status === 'Hypercare').reduce((sum, c) => sum + (c.monthly_fee || 0), 0);
  const overduePayments = clients.filter(c => c.payment_status === 'Overdue').length;

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/25";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#1E3A5F] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👥 Active Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{activeCount} active · {onboardingCount} onboarding · ${totalMRR.toLocaleString()}/mo MRR</p>
        </div>
        <button
          onClick={() => { setFormData(emptyClient); setModalView('add'); }}
          className="px-5 py-2.5 bg-[#1E3A5F] hover:bg-[#B91C1C] text-white font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-red-500/20"
        >
          + Add Client
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Active Clients</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Monthly Revenue</p>
          <p className="text-2xl font-bold text-green-600 mt-1">${totalMRR.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Onboarding</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{onboardingCount}</p>
        </div>
        <div className={`bg-white border rounded-xl p-4 ${overduePayments > 0 ? 'border-red-300' : 'border-gray-200'}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Overdue Payments</p>
          <p className={`text-2xl font-bold mt-1 ${overduePayments > 0 ? 'text-red-600' : 'text-gray-900'}`}>{overduePayments}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', ...CLIENT_STATUSES].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? 'bg-[#1E3A5F] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {f === 'all' ? `All (${clients.length})` : `${f} (${clients.filter(c => c.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Client Cards */}
      <div className="space-y-3">
        {filteredClients.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">👥</span>
            <p className="text-gray-500">No clients yet — close those deals!</p>
          </div>
        ) : (
          filteredClients.map(client => (
            <div
              key={client.id}
              onClick={() => openDetail(client)}
              className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer transition-all hover:shadow-md hover:border-gray-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-bold text-gray-900">{client.company_name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[client.status] || 'bg-gray-100 text-gray-700'}`}>
                      {client.status}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${HEALTH_COLORS[client.health_score] || 'bg-gray-100 text-gray-700'}`}>
                      {client.health_score}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PAYMENT_COLORS[client.payment_status] || 'bg-gray-100 text-gray-700'}`}>
                      💳 {client.payment_status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>👤 {client.point_of_contact || 'No contact'}</span>
                    <span>📍 {client.location || 'No location'}</span>
                    <span>🏢 {client.industry || 'No industry'}</span>
                    <span>📋 {client.plan_tier}</span>
                    <span>💰 ${client.monthly_fee}/mo</span>
                    {client.account_manager && <span>🎯 {client.account_manager}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-lg font-bold text-gray-900">${client.monthly_fee}<span className="text-xs text-gray-400">/mo</span></p>
                  {client.next_maintenance_date && (
                    <p className={`text-xs mt-1 ${new Date(client.next_maintenance_date) < new Date() ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                      🔧 Maint: {new Date(client.next_maintenance_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Client Modal */}
      {modalView === 'add' && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 overflow-auto" onClick={() => setModalView('none')}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-8 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-5">👥 New Client</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Company Name *</label>
                <input className={inputClass} value={formData.company_name || ''} onChange={e => setFormData(p => ({ ...p, company_name: e.target.value }))} placeholder="Company name" autoFocus />
              </div>
              <div>
                <label className={labelClass}>Point of Contact</label>
                <input className={inputClass} value={formData.point_of_contact || ''} onChange={e => setFormData(p => ({ ...p, point_of_contact: e.target.value }))} placeholder="Contact name" />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input className={inputClass} value={formData.phone || ''} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input className={inputClass} value={formData.email || ''} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="Email" />
              </div>
              <div>
                <label className={labelClass}>Industry</label>
                <input className={inputClass} value={formData.industry || ''} onChange={e => setFormData(p => ({ ...p, industry: e.target.value }))} placeholder="Industry" />
              </div>
              <div>
                <label className={labelClass}>Location</label>
                <input className={inputClass} value={formData.location || ''} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} placeholder="City, State" />
              </div>
              <div>
                <label className={labelClass}>Plan Tier</label>
                <select className={inputClass} value={formData.plan_tier || 'Growth'} onChange={e => setFormData(p => ({ ...p, plan_tier: e.target.value }))}>
                  {PLAN_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Setup Fee</label>
                <input className={inputClass} type="number" value={formData.setup_fee || ''} onChange={e => setFormData(p => ({ ...p, setup_fee: Number(e.target.value) }))} />
              </div>
              <div>
                <label className={labelClass}>Monthly Fee</label>
                <input className={inputClass} type="number" value={formData.monthly_fee || ''} onChange={e => setFormData(p => ({ ...p, monthly_fee: Number(e.target.value) }))} />
              </div>
              <div>
                <label className={labelClass}>Account Manager</label>
                <select className={inputClass} value={formData.account_manager || ''} onChange={e => setFormData(p => ({ ...p, account_manager: e.target.value }))}>
                  <option value="">Unassigned</option>
                  <option value="CD">CD</option>
                  <option value="Pablo">Pablo</option>
                  <option value="Chito">Chito</option>
                  <option value="Arturo">Arturo</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Contract Start</label>
                <input className={inputClass} type="date" value={formData.contract_start || ''} onChange={e => setFormData(p => ({ ...p, contract_start: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalView('none')} className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleAdd} disabled={!formData.company_name?.trim()} className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-[#1E3A5F] hover:bg-[#B91C1C] text-white transition-all disabled:opacity-50">Add Client</button>
            </div>
          </div>
        </div>
      )}

      {/* Client Detail Modal */}
      {modalView === 'detail' && selectedClient && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 overflow-auto" onClick={() => { setModalView('none'); setEditMode(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl my-8 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">{selectedClient.company_name}</h2>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[editMode ? (formData.status || '') : selectedClient.status] || 'bg-gray-100 text-gray-700'}`}>
                      {editMode ? formData.status : selectedClient.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Client since {selectedClient.contract_start ? new Date(selectedClient.contract_start).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="flex gap-2">
                  {editMode ? (
                    <>
                      <button onClick={() => { setEditMode(false); setFormData(selectedClient); }} className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
                      <button onClick={handleUpdate} className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1E3A5F] text-white hover:bg-[#B91C1C]">Save Changes</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditMode(true)} className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">✏️ Edit</button>
                      <button onClick={() => { setModalView('none'); setEditMode(false); }} className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">✕ Close</button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-3 gap-6">
              {/* Left Column — Contact & Contract */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Info</h3>
                  <div className="space-y-2">
                    {editMode ? (
                      <>
                        <div><label className={labelClass}>Point of Contact</label><input className={inputClass} value={formData.point_of_contact || ''} onChange={e => setFormData(p => ({ ...p, point_of_contact: e.target.value }))} /></div>
                        <div><label className={labelClass}>Phone</label><input className={inputClass} value={formData.phone || ''} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} /></div>
                        <div><label className={labelClass}>Email</label><input className={inputClass} value={formData.email || ''} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
                        <div><label className={labelClass}>Industry</label><input className={inputClass} value={formData.industry || ''} onChange={e => setFormData(p => ({ ...p, industry: e.target.value }))} /></div>
                        <div><label className={labelClass}>Location</label><input className={inputClass} value={formData.location || ''} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} /></div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm"><span className="text-gray-400">👤</span> {selectedClient.point_of_contact || '—'}</p>
                        <p className="text-sm"><span className="text-gray-400">📞</span> {selectedClient.phone || '—'}</p>
                        <p className="text-sm"><span className="text-gray-400">✉️</span> {selectedClient.email || '—'}</p>
                        <p className="text-sm"><span className="text-gray-400">🏢</span> {selectedClient.industry || '—'}</p>
                        <p className="text-sm"><span className="text-gray-400">📍</span> {selectedClient.location || '—'}</p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contract</h3>
                  {editMode ? (
                    <div className="space-y-2">
                      <div><label className={labelClass}>Plan</label><select className={inputClass} value={formData.plan_tier || ''} onChange={e => setFormData(p => ({ ...p, plan_tier: e.target.value }))}>{PLAN_TIERS.map(t => <option key={t}>{t}</option>)}</select></div>
                      <div><label className={labelClass}>Setup Fee</label><input className={inputClass} type="number" value={formData.setup_fee || ''} onChange={e => setFormData(p => ({ ...p, setup_fee: Number(e.target.value) }))} /></div>
                      <div><label className={labelClass}>Monthly Fee</label><input className={inputClass} type="number" value={formData.monthly_fee || ''} onChange={e => setFormData(p => ({ ...p, monthly_fee: Number(e.target.value) }))} /></div>
                      <div><label className={labelClass}>Contract Start</label><input className={inputClass} type="date" value={formData.contract_start || ''} onChange={e => setFormData(p => ({ ...p, contract_start: e.target.value }))} /></div>
                      <div><label className={labelClass}>Next Billing</label><input className={inputClass} type="date" value={formData.next_billing_date || ''} onChange={e => setFormData(p => ({ ...p, next_billing_date: e.target.value }))} /></div>
                      <div><label className={labelClass}>Payment Status</label><select className={inputClass} value={formData.payment_status || ''} onChange={e => setFormData(p => ({ ...p, payment_status: e.target.value }))}>{PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
                      <div><label className={labelClass}>Account Manager</label>
                        <select className={inputClass} value={formData.account_manager || ''} onChange={e => setFormData(p => ({ ...p, account_manager: e.target.value }))}>
                          <option value="">Unassigned</option><option>CD</option><option>Pablo</option><option>Chito</option><option>Arturo</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-400">📋</span> {selectedClient.plan_tier} Plan</p>
                      <p><span className="text-gray-400">💵</span> ${selectedClient.setup_fee?.toLocaleString()} setup</p>
                      <p><span className="text-gray-400">💰</span> ${selectedClient.monthly_fee}/mo</p>
                      <p><span className="text-gray-400">📅</span> Started {selectedClient.contract_start ? new Date(selectedClient.contract_start).toLocaleDateString() : '—'}</p>
                      <p><span className="text-gray-400">💳</span> Next billing: {selectedClient.next_billing_date ? new Date(selectedClient.next_billing_date).toLocaleDateString() : '—'}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">💳</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PAYMENT_COLORS[selectedClient.payment_status] || ''}`}>{selectedClient.payment_status}</span>
                      </div>
                      <p><span className="text-gray-400">🎯</span> {selectedClient.account_manager || 'Unassigned'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle Column — Deployment & Health */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Deployment</h3>
                  {editMode ? (
                    <div className="space-y-2">
                      <div><label className={labelClass}>Server Provider</label><input className={inputClass} value={formData.server_provider || ''} onChange={e => setFormData(p => ({ ...p, server_provider: e.target.value }))} placeholder="e.g. Hetzner, DigitalOcean" /></div>
                      <div><label className={labelClass}>Server IP</label><input className={inputClass} value={formData.server_ip || ''} onChange={e => setFormData(p => ({ ...p, server_ip: e.target.value }))} placeholder="IP address" /></div>
                      <div><label className={labelClass}>Channels Connected</label><input className={inputClass} value={formData.channels_connected || ''} onChange={e => setFormData(p => ({ ...p, channels_connected: e.target.value }))} placeholder="Telegram, Slack, Discord..." /></div>
                      <div><label className={labelClass}>Skills Installed</label><input className={inputClass} value={formData.skills_installed || ''} onChange={e => setFormData(p => ({ ...p, skills_installed: e.target.value }))} placeholder="Gmail, Calendar, CRM..." /></div>
                      <div><label className={labelClass}>Deployment Date</label><input className={inputClass} type="date" value={formData.deployment_date || ''} onChange={e => setFormData(p => ({ ...p, deployment_date: e.target.value }))} /></div>
                      <div><label className={labelClass}>Last Maintenance</label><input className={inputClass} type="date" value={formData.last_maintenance_date || ''} onChange={e => setFormData(p => ({ ...p, last_maintenance_date: e.target.value }))} /></div>
                      <div><label className={labelClass}>Next Maintenance</label><input className={inputClass} type="date" value={formData.next_maintenance_date || ''} onChange={e => setFormData(p => ({ ...p, next_maintenance_date: e.target.value }))} /></div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-400">🖥️</span> {selectedClient.server_provider || '—'}</p>
                      <p><span className="text-gray-400">🌐</span> {selectedClient.server_ip || '—'}</p>
                      <p><span className="text-gray-400">💬</span> {selectedClient.channels_connected || '—'}</p>
                      <p><span className="text-gray-400">🧠</span> {selectedClient.skills_installed || '—'}</p>
                      <p><span className="text-gray-400">🚀</span> Deployed {selectedClient.deployment_date ? new Date(selectedClient.deployment_date).toLocaleDateString() : '—'}</p>
                      <p><span className="text-gray-400">🔧</span> Last maint: {selectedClient.last_maintenance_date ? new Date(selectedClient.last_maintenance_date).toLocaleDateString() : '—'}</p>
                      <p className={selectedClient.next_maintenance_date && new Date(selectedClient.next_maintenance_date) < new Date() ? 'text-red-600 font-medium' : ''}>
                        <span className="text-gray-400">📅</span> Next maint: {selectedClient.next_maintenance_date ? new Date(selectedClient.next_maintenance_date).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Health & Status</h3>
                  {editMode ? (
                    <div className="space-y-2">
                      <div><label className={labelClass}>Status</label><select className={inputClass} value={formData.status || ''} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}>{CLIENT_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
                      <div><label className={labelClass}>Health Score</label><select className={inputClass} value={formData.health_score || ''} onChange={e => setFormData(p => ({ ...p, health_score: e.target.value }))}>{HEALTH_SCORES.map(s => <option key={s}>{s}</option>)}</select></div>
                      <div><label className={labelClass}>Satisfaction (1-10)</label><input className={inputClass} type="number" min="1" max="10" value={formData.satisfaction_rating || ''} onChange={e => setFormData(p => ({ ...p, satisfaction_rating: Number(e.target.value) }))} /></div>
                      <div className="flex items-center gap-2 mt-2">
                        <input type="checkbox" checked={formData.onboarding_complete || false} onChange={e => setFormData(p => ({ ...p, onboarding_complete: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-red-600" />
                        <span className="text-sm text-gray-700">Onboarding Complete</span>
                      </div>
                      <div><label className={labelClass}>Hypercare End Date</label><input className={inputClass} type="date" value={formData.hypercare_end_date || ''} onChange={e => setFormData(p => ({ ...p, hypercare_end_date: e.target.value }))} /></div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">❤️</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${HEALTH_COLORS[selectedClient.health_score] || ''}`}>{selectedClient.health_score}</span>
                      </div>
                      <p><span className="text-gray-400">⭐</span> Satisfaction: {selectedClient.satisfaction_rating ? `${selectedClient.satisfaction_rating}/10` : '—'}</p>
                      <p><span className="text-gray-400">✅</span> Onboarding: {selectedClient.onboarding_complete ? 'Complete' : 'In Progress'}</p>
                      <p><span className="text-gray-400">🛡️</span> Hypercare ends: {selectedClient.hypercare_end_date ? new Date(selectedClient.hypercare_end_date).toLocaleDateString() : '—'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column — Notes */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Client Notes</h3>
                
                {/* Add Note */}
                <div className="mb-4 space-y-2">
                  <select className={inputClass} value={noteType} onChange={e => setNoteType(e.target.value)}>
                    {NOTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="w-full py-2 text-xs font-medium rounded-lg bg-[#1E3A5F] hover:bg-[#B91C1C] text-white transition-all disabled:opacity-50"
                  >
                    Add Note
                  </button>
                </div>

                {/* Notes List */}
                <div className="space-y-2 max-h-72 overflow-auto">
                  {(selectedClient.client_notes || []).length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No notes yet</p>
                  ) : (
                    (selectedClient.client_notes || []).map((note: ClientNote) => (
                      <div key={note.id} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">{note.note_type}</span>
                          <span className="text-[10px] text-gray-400">{note.user_name} · {new Date(note.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-700">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Meeting Notes Section */}
            <div className="px-6 pb-6">
              <MeetingNotesSection
                entityId={selectedClient.id}
                companyName={selectedClient.company_name}
                contactName={selectedClient.point_of_contact || ''}
                meetingTypes={[...DEFAULT_LEAD_TYPES, ...CLIENT_EXTRA_TYPES]}
                inputClass={inputClass}
                labelClass={labelClass}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
