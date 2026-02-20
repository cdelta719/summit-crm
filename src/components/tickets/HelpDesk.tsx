import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../store/AuthContext';

interface Ticket {
  id: string;
  ticket_number: number;
  problem: string;
  solution: string;
  resolved: boolean;
  created_by: string;
  created_by_name: string;
  created_at: string;
  resolved_at: string | null;
}

export default function HelpDesk() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProblem, setNewProblem] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [solutionText, setSolutionText] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const fetchTickets = useCallback(async () => {
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTickets(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTickets();
    const channel = supabase.channel('tickets-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchTickets();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTickets]);

  const handleAddTicket = async () => {
    if (!newProblem.trim() || !currentUser) return;
    await supabase.from('tickets').insert({
      problem: newProblem.trim(),
      solution: '',
      resolved: false,
      created_by: currentUser.id,
      created_by_name: currentUser.name,
    });
    setNewProblem('');
    setShowAddModal(false);
    fetchTickets();
  };

  const handleToggleResolved = async (ticket: Ticket) => {
    const newResolved = !ticket.resolved;
    await supabase.from('tickets').update({
      resolved: newResolved,
      resolved_at: newResolved ? new Date().toISOString() : null,
    }).eq('id', ticket.id);
    fetchTickets();
  };

  const handleSaveSolution = async () => {
    if (!selectedTicket) return;
    await supabase.from('tickets').update({
      solution: solutionText,
    }).eq('id', selectedTicket.id);
    setSelectedTicket(null);
    setSolutionText('');
    fetchTickets();
  };

  const filteredTickets = tickets.filter(t => {
    if (filter === 'open') return !t.resolved;
    if (filter === 'resolved') return t.resolved;
    return true;
  });

  const openCount = tickets.filter(t => !t.resolved).length;
  const resolvedCount = tickets.filter(t => t.resolved).length;

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
          <h1 className="text-2xl font-bold text-gray-900">🎫 HelpDesk Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">{openCount} open · {resolvedCount} resolved</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-[#1E3A5F] hover:bg-[#B91C1C] text-white font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-red-500/20"
        >
          + Add New Ticket
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'open', 'resolved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? 'bg-[#1E3A5F] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {f === 'all' ? `All (${tickets.length})` : f === 'open' ? `Open (${openCount})` : `Resolved (${resolvedCount})`}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">🎫</span>
            <p className="text-gray-500">No tickets yet</p>
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <div
              key={ticket.id}
              className={`bg-white border rounded-xl p-5 transition-all hover:shadow-md ${
                ticket.resolved ? 'border-green-200' : 'border-red-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Ticket Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono font-bold text-gray-400">#{ticket.ticket_number}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      ticket.resolved
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {ticket.resolved ? '✅ Resolved' : '🔴 Not Resolved'}
                    </span>
                    <span className="text-xs text-gray-400">
                      by {ticket.created_by_name} · {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Problem */}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Problem</p>
                    <p className="text-sm text-gray-900">{ticket.problem}</p>
                  </div>

                  {/* Solution */}
                  {ticket.solution && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Solution</p>
                      <p className="text-sm text-gray-700">{ticket.solution}</p>
                    </div>
                  )}

                  {ticket.resolved && ticket.resolved_at && (
                    <p className="text-xs text-green-600">Resolved on {new Date(ticket.resolved_at).toLocaleDateString()}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleResolved(ticket)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      ticket.resolved
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {ticket.resolved ? 'Reopen' : 'Mark Resolved'}
                  </button>
                  <button
                    onClick={() => { setSelectedTicket(ticket); setSolutionText(ticket.solution || ''); }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all"
                  >
                    {ticket.solution ? 'Edit Solution' : 'Add Solution'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Ticket Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-1">🎫 New Ticket</h2>
            <p className="text-xs text-gray-400 mb-5">Describe the problem and we'll track it</p>
            
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Problem</label>
              <textarea
                value={newProblem}
                onChange={e => setNewProblem(e.target.value)}
                placeholder="Describe the issue..."
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/25 resize-none"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTicket}
                disabled={!newProblem.trim()}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-[#1E3A5F] hover:bg-[#B91C1C] text-white transition-all disabled:opacity-50"
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Solution Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-1">💡 Solution for #{selectedTicket.ticket_number}</h2>
            <p className="text-xs text-gray-400 mb-2">{selectedTicket.problem}</p>
            
            <div className="mb-4 mt-4">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Solution</label>
              <textarea
                value={solutionText}
                onChange={e => setSolutionText(e.target.value)}
                placeholder="How was this resolved?"
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/25 resize-none"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedTicket(null)}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSolution}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-[#1E3A5F] hover:bg-[#B91C1C] text-white transition-all"
              >
                Save Solution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
