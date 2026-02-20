import { useState, useEffect, useCallback } from 'react';
import { localDB } from '../../utils/local-storage';
import { useAuth } from '../../store/AuthContext';

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

const CATEGORIES = ['Cold Outreach', 'Follow-Up', 'Proposal', 'Post-Demo', 'Re-Engagement', 'Client Onboarding'];

const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id' | 'created_by' | 'created_by_name' | 'created_at'>[] = [
  { category: 'Cold Outreach', name: 'Real Estate Cold Email', subject: 'Quick question about [BROKERAGE_NAME]',
    body: `Hi [CONTACT_NAME],\n\nI help real estate brokerages in [CITY] automate lead follow-up, scheduling, and client communication — the stuff that eats up 15-20 hours a week.\n\nMost brokerages I talk to are losing leads because response time is too slow. Studies show responding within 5 minutes makes you 21x more likely to convert.\n\nWorth a 15-minute conversation to see if we can fix that?\n\n[YOUR_NAME]\nSummit Digital Co | [PHONE]` },
  { category: 'Cold Outreach', name: 'Law Firm Cold Email', subject: 'Freeing up billable hours at [FIRM_NAME]',
    body: `Hi [CONTACT_NAME],\n\nI work with mid-size law firms to automate intake, scheduling, and client updates — freeing attorneys to focus on billable work.\n\nMost firms I talk to lose 40%+ of after-hours calls. That's potential clients going to competitors.\n\nWould it be worth 15 minutes to see how we solve this for firms like yours?\n\n[YOUR_NAME]\nSummit Digital Co | [PHONE]` },
  { category: 'Cold Outreach', name: 'Dental Practice Cold Email', subject: 'Cutting no-shows at [PRACTICE_NAME]',
    body: `Hi [CONTACT_NAME],\n\nI help dental practices automate appointment reminders, insurance follow-up, and patient communication. Most practices we work with cut their no-show rate in half within 30 days.\n\nWith 200 patients/month, that could mean 20+ recovered appointments.\n\nWorth a quick chat?\n\n[YOUR_NAME]\nSummit Digital Co | [PHONE]` },
  { category: 'Cold Outreach', name: 'Financial Advisor Cold Email', subject: 'Automating client onboarding at [COMPANY_NAME]',
    body: `Hi [CONTACT_NAME],\n\nI help financial advisors automate meeting prep, client onboarding, and follow-up communication — so you can spend more time with clients and less time on admin.\n\nEach client relationship is worth thousands in annual AUM fees. Better follow-up = better retention = more referrals.\n\n15 minutes to see if this fits your practice?\n\n[YOUR_NAME]\nSummit Digital Co | [PHONE]` },
  { category: 'Cold Outreach', name: 'Marketing Agency Cold Email', subject: 'Scaling [AGENCY_NAME] without more headcount',
    body: `Hi [CONTACT_NAME],\n\nI help agencies automate client communication, project updates, and lead nurture — the stuff that falls through the cracks when your team is buried in delivery.\n\nMost agencies I work with save 15-20 hours/week and close 1+ extra client/month from better follow-up.\n\nWorth a quick conversation?\n\n[YOUR_NAME]\nSummit Digital Co | [PHONE]` },
  { category: 'Follow-Up', name: 'Day 3 Follow-Up', subject: 'Following up — [COMPANY_NAME]',
    body: `Hi [CONTACT_NAME],\n\nJust circling back on my note from earlier this week. I know things get busy.\n\nThe quick version: we help [INDUSTRY] businesses automate operations and typically save 15-20 hours/week.\n\nWould [DAY] or [DAY] work for a quick 15-minute call?\n\n[YOUR_NAME]` },
  { category: 'Follow-Up', name: 'Day 7 Follow-Up', subject: 'One more thought for [COMPANY_NAME]',
    body: `Hi [CONTACT_NAME],\n\nI wanted to share a quick win we delivered for a [INDUSTRY] business similar to yours — they saved 18 hours/week on admin and increased lead response time by 90%.\n\nI think we could do something similar for [COMPANY_NAME]. Worth exploring?\n\n[YOUR_NAME]` },
  { category: 'Follow-Up', name: 'Day 14 Breakup Email', subject: 'Should I close your file?',
    body: `Hi [CONTACT_NAME],\n\nI've reached out a few times and haven't heard back — totally understand if the timing isn't right.\n\nI'll assume this isn't a priority right now and won't keep bugging you. But if automating operations ever moves up the list, I'm here.\n\nWishing you a great [QUARTER/SEASON].\n\n[YOUR_NAME]` },
  { category: 'Post-Demo', name: 'Post-Discovery Follow-Up', subject: 'Great chatting — next steps for [COMPANY_NAME]',
    body: `Hi [CONTACT_NAME],\n\nReally enjoyed our conversation today. Here's a quick recap:\n\n• Your biggest challenge: [PAIN_POINT]\n• What we'd solve: [SOLUTION]\n• Expected impact: [ROI_METRIC]\n\nI'd love to show you a live demo of how this works for [INDUSTRY] businesses. Does [DAY] at [TIME] work?\n\n[YOUR_NAME]` },
  { category: 'Proposal', name: 'Proposal Email', subject: 'Summit Digital Co Proposal for [COMPANY_NAME]',
    body: `Hi [CONTACT_NAME],\n\nAs discussed, here's the Summit Digital Co proposal for [COMPANY_NAME].\n\n**What's included:**\n• [WORKFLOW_1]\n• [WORKFLOW_2]\n• [WORKFLOW_3]\n• Full setup and configuration\n• Ongoing managed care and optimization\n\n**Investment:** [PLAN] — $[SETUP] setup + $[MONTHLY]/month\n**Timeline:** Live within 2 weeks of signing\n\nI'm confident this will [KEY_BENEFIT]. Happy to answer any questions.\n\n[YOUR_NAME]` },
  { category: 'Re-Engagement', name: 'Re-Engagement Email', subject: 'Still thinking about automation, [CONTACT_NAME]?',
    body: `Hi [CONTACT_NAME],\n\nWe chatted [TIMEFRAME] ago about automating operations at [COMPANY_NAME]. Wanted to check in — has anything changed?\n\nSince we last spoke, we've helped [NUMBER] businesses in [INDUSTRY] save an average of [HOURS] hours/week.\n\nWould it be worth reconnecting for 15 minutes to see if now's a better time?\n\n[YOUR_NAME]` },
  { category: 'Client Onboarding', name: 'Welcome Email', subject: 'Welcome to Summit Digital Co, [COMPANY_NAME]! 🎉',
    body: `Hi [CONTACT_NAME],\n\nWelcome to Summit Digital Co! We're excited to get [COMPANY_NAME] up and running.\n\n**Here's what happens next:**\n1. Our team will schedule your onboarding call within 24 hours\n2. We'll map out your custom workflows together\n3. Your AI assistant will be live within 2 weeks\n\n**Your dedicated contact:** [ACCOUNT_MANAGER] — [EMAIL/PHONE]\n\nIf you need anything before then, don't hesitate to reach out.\n\nLet's go! 🚀\n\n[YOUR_NAME]` },
];

export default function EmailTemplates() {
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', category: 'Cold Outreach', subject: '', body: '' });
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const fetchTemplates = useCallback(async () => {
    const { data } = await localDB.from('email_templates').select('*').order('category', { ascending: true });
    if (data) {
      setTemplates(data);
      // Seed defaults if empty
      if (data.length === 0 && currentUser) {
        const inserts = DEFAULT_TEMPLATES.map(t => ({
          ...t, created_by: currentUser.id, created_by_name: currentUser.name,
        }));
        await localDB.from('email_templates').insert(inserts);
        const { data: seeded } = await localDB.from('email_templates').select('*').order('category', { ascending: true });
        if (seeded) setTemplates(seeded);
      }
    }
    setLoading(false);
  }, [currentUser]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.subject.trim() || !currentUser) return;
    await localDB.from('email_templates').insert({
      name: form.name, category: form.category, subject: form.subject, body: form.body,
      created_by: currentUser.id, created_by_name: currentUser.name,
    });
    setForm({ name: '', category: 'Cold Outreach', subject: '', body: '' });
    setShowModal(false);
    fetchTemplates();
  };

  const copyToClipboard = (t: EmailTemplate) => {
    navigator.clipboard.writeText(`Subject: ${t.subject}\n\n${t.body}`);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = templates.filter(t => !filterCategory || t.category === filterCategory);
  const grouped = CATEGORIES.map(c => ({ category: c, items: filtered.filter(t => t.category === c) })).filter(g => g.items.length > 0);

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]';
  const labelClass = 'block text-xs font-medium text-gray-700 mb-1';

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">📧 Email Templates</h1>
        <div className="flex items-center gap-3">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-[#1E3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C] transition-all">+ Add Template</button>
        </div>
      </div>

      {grouped.map(g => {
        const categoryIcons: Record<string, string> = {
          'Cold Outreach': '🎯', 'Follow-Up': '🔄', 'Proposal': '📑',
          'Post-Demo': '🤝', 'Re-Engagement': '🔥', 'Client Onboarding': '🚀',
        };
        const isOpen = openCategories.has(g.category);
        return (
          <div key={g.category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button onClick={() => toggleCategory(g.category)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
              <span className="text-xl">{categoryIcons[g.category] || '📧'}</span>
              <h2 className="text-lg font-bold text-gray-900">{g.category}</h2>
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{g.items.length} template{g.items.length !== 1 ? 's' : ''}</span>
              <span className={`ml-auto text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 grid grid-cols-1 lg:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                {g.items.map(t => (
                  <div key={t.id} className="bg-gray-50 rounded-xl border border-gray-200 hover:border-[#1E3A5F]/30 hover:shadow-sm transition-all p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base font-bold text-gray-900 leading-tight">{t.name}</h3>
                      <button onClick={(e) => { e.stopPropagation(); copyToClipboard(t); }}
                        className={`shrink-0 ml-3 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${copiedId === t.id ? 'bg-green-100 text-green-700' : 'bg-[#1E3A5F]/10 text-[#1E3A5F] hover:bg-[#1E3A5F]/20'}`}>
                        {copiedId === t.id ? '✓ Copied!' : '📋 Copy'}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                      <span className="font-medium text-gray-400">SUBJECT:</span>
                      <span className="text-gray-700 font-semibold">{t.subject}</span>
                    </div>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-white rounded-lg p-3 max-h-40 overflow-y-auto leading-relaxed">{t.body}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No templates found</div>}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">Add Email Template</h2>
            <div><label className={labelClass}>Template Name *</label><input className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className={labelClass}>Category</label>
              <select className={inputClass} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Subject Line *</label><input className={inputClass} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
            <div><label className={labelClass}>Body</label><textarea className={inputClass} rows={8} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Use [PLACEHOLDER] tags for personalization..." /></div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-[#1E3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C]">Add Template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
