import { useState } from 'react';

interface Item { title: string; content: string }
interface Section { icon: string; title: string; items: Item[] }

const SECTIONS: Section[] = [
  {
    icon: '🎯', title: 'Sales Scripts & Cold Calling',
    items: [
      { title: 'Universal Cold Call Opening', content: `**Pattern Interrupt:** "Hey [Name], this is [Your Name] with Summit Digital Co — I know I'm catching you out of the blue, so I'll be quick."
**Purpose Statement:** "I help [industry] businesses automate the stuff that eats up 15-20 hours a week — lead follow-up, scheduling, client communication."
**Engagement Question:** "Quick question — how are you currently handling after-hours leads and client inquiries?"
**Key Rules:** Stand up before every call. First 7 seconds determine everything. Never ask "Is this a good time?" Match their pace and tone within 10 seconds.` },
      { title: 'Real Estate Cold Call', content: `"Hey [Name], quick question — how many leads came into your brokerage last month that didn't get a response within 5 minutes? Studies show responding within 5 minutes makes you **21x more likely to convert**. What if every lead got an instant, personalized response — 24/7?"
**Pain Points:** Leads fall through cracks, 10-15 hrs/week on admin, calendar chaos, inconsistent follow-up.` },
      { title: 'Law Firm Cold Call', content: `"[Name], every hour your attorneys spend on intake forms and scheduling is an hour they're not billing at $300+. What if your intake, scheduling, and client updates ran themselves — 24/7, no extra staff?"
**Pain Points:** Non-billable admin time, missed intake calls (40%+ after hours), client communication gaps, compliance overhead.` },
      { title: 'Dental/Medical Cold Call', content: `"Quick question — what's your no-show rate running right now? Most practices I work with were at 15-20% before AI reminders. We typically cut that in half within 30 days."
**Pain Points:** No-shows, front desk overload, insurance follow-up, staff turnover ($5-8K per replacement).` },
      { title: 'Gatekeeper Scripts', content: `**Receptionist Block:** "Totally understand — [Name] is busy. This is actually about saving their team 15-20 hours a week on admin work. Could you let them know [Your Name] from Summit Digital Co called?"
**"Send info" Deflection:** "Happy to — but to send something relevant, I need 60 seconds with [Name] to understand their workflow. Otherwise I'm just sending a generic brochure."
**Voicemail:** "Hey [Name], [Your Name] with Summit Digital Co. I work with [industry] businesses in [area] to automate operations. Most save 15-20 hours a week. Worth a quick chat? My number is [number]."` },
    ],
  },
  {
    icon: '🔍', title: 'Discovery & Demo',
    items: [
      { title: 'Discovery Call Blueprint (30 min)', content: `1. **Rapport & Agenda** (3 min) — "I want to learn about your business, share what we do, and see if there's a fit."
2. **Situation Questions** (5 min) — Current tools, team size, daily workflow
3. **Problem Questions** (10 min) — "What's your biggest operational bottleneck?" "What happens when you miss a lead?"
4. **Implication Questions** (5 min) — "What does that cost you monthly?" "What happens if nothing changes in 6 months?"
5. **Need-Payoff** (5 min) — "If we could cut that admin time in half, what would that mean for your team?"
6. **Next Steps** (2 min) — Book the demo. Always.` },
      { title: 'SPIN Questions', content: `**Situation:** "Walk me through what happens when a new lead comes in." / "How many people handle client communication?"
**Problem:** "Where do things fall through the cracks?" / "What takes the most time that you wish was automated?"
**Implication:** "When leads don't get a response for hours, how many do you lose?" / "What's the cost of replacing a front desk person?"
**Need-Payoff:** "If every lead got a response in under 5 minutes, how would that impact your close rate?"` },
      { title: 'Demo Flow', content: `1. **Recap their pain** — "Last time you mentioned [specific problem]. Let me show you exactly how we solve that."
2. **Live walkthrough** — Show real workflows for THEIR use case
3. **ROI moment** — "That task your team spends 3 hours on daily? Watch this."
4. **Social proof** — "A [similar business] saw [specific result] in the first month."
5. **Collison Install** — "Want me to set up a basic version right now? Takes 15 minutes."
6. **Close or book close** — "Based on what you've seen, does this make sense for [Company]?"` },
    ],
  },
  {
    icon: '💪', title: 'Objection Handling',
    items: [
      { title: 'Price Objections', content: `**"It's too expensive"** → "Compared to what? A part-time admin is $2,000/month and can't work nights. This is $250/month and works 24/7. What's the ROI on just 2 more closed deals per year?"
**"We don't have the budget"** → "How much are you spending on the problem this solves? Most clients find Summit Digital Co pays for itself in month one."
**"Competitor X is cheaper"** → "They might be — but are they building custom workflows for YOUR business, or selling a template?"` },
      { title: 'Timing Objections', content: `**"Not the right time"** → "When IS the right time? Every month without this, you're leaving [specific $] on the table. What if we start small with a 7-day pilot?"
**"We need to think about it"** → "Of course. What specifically do you need to think through? Let me address those right now."
**"Call me next quarter"** → "What changes next quarter? Starting now means you're optimized before your busy season."` },
      { title: 'Trust & Tech Objections', content: `**"Does it actually work?"** → "Let me prove it. I'll set up a basic version right now — you'll see it working before we hang up."
**"What about data security?"** → "All data is encrypted, access-controlled, and we sign NDAs. Safer than human error and sticky notes."
**"We already use [other tool]"** → "Great — Summit Digital Co integrates with your existing tools. It's the employee who actually keeps your CRM updated."` },
    ],
  },
  {
    icon: '🏆', title: 'Closing Techniques',
    items: [
      { title: 'All Closes', content: `**Assumptive:** "So we'll get you started with the Growth plan — should I send the agreement to this email?"
**Alternative:** "Would you prefer the full deployment this month, or begin with the 7-day pilot?"
**Urgency:** "We have 2 onboarding slots left this month. Want me to lock one in?"
**Collison Install:** "Let me set this up right now — you'll see it working in 15 minutes."
**ROI:** "Missed leads cost you ~$8K/month. This is $250/month. Even 10% recovery = 3:1 return."
**Puppy Dog:** "Use it for a week. If you don't love it, walk away."
**Silence Rule:** After asking for the sale — SHUT UP. First person to talk loses.` },
    ],
  },
  {
    icon: '📊', title: 'Pipeline & Process',
    items: [
      { title: 'Pipeline Stages', content: `1. **Prospecting** — Research, list building (10 min max per prospect)
2. **First Contact** — Cold call + email + LinkedIn (7-touch cadence)
3. **Discovery** — Qualify with BANT, understand pain, book demo
4. **Demo/Proposal** — Live demo, Collison Install, send proposal within 24 hrs
5. **Negotiation** — Handle objections, offer pilot if needed
6. **Closed Won** — Signed agreement, begin onboarding
7. **Closed Lost** — Document reason, add to re-engagement nurture` },
      { title: 'Follow-Up Cadences', content: `**Cold Outreach (30 days):** Day 1: Call+VM+Email → Day 3: Email #2 → Day 5: Call #2 → Day 7: LinkedIn → Day 10: Email #3 (case study) → Day 14: Call #3 + breakup email → Day 21: Final re-engagement
**Post-Demo:** Same day: Recap+proposal → Day 2: "Any questions?" → Day 5: Case study → Day 7: Direct close → Day 14: Final follow-up or pilot` },
      { title: 'Weekly Rhythm & KPIs', content: `**Daily:** 50+ dials, 20+ conversations, 3+ demos booked
**Weekly:** 15+ demos, 5+ proposals, 2+ closes
**Monthly:** $40K+ revenue, 60%+ demo→proposal, 40%+ proposal→close
**Schedule:** Mon: Pipeline review & planning → Tue-Thu: Dials AM, demos PM → Fri AM: Follow-ups → Fri PM: Pipeline cleanup` },
    ],
  },
  {
    icon: '⚔️', title: 'Competitive Intelligence',
    items: [
      { title: 'Our Differentiators', content: `• **Done-for-you deployment** — We build it FOR them, not hand them a tool
• **Collison Install** — Set up live on the call, they see it working immediately
• **Industry-specific** — Custom workflows per vertical, not one-size-fits-all
• **Human + AI** — Managed service layer, not just software
• **Speed** — 2-week deployment vs. months with enterprise tools
• **Price** — $250-750/mo vs. $2K+/mo for comparable services` },
      { title: 'Positioning', content: `**We are NOT:** A chatbot company, a SaaS tool, an AI toy
**We ARE:** An AI operations partner that deploys and manages custom automation
**Elevator Pitch:** "Summit Digital Co deploys AI assistants that handle your email, scheduling, lead follow-up, and client communication — 24/7. We set it up in 2 weeks and it costs less than a part-time employee."
**When they mention competitors:** "That's a great tool. The difference is we don't give you software and say 'good luck.' We build custom workflows for YOUR business and manage them."` },
    ],
  },
  {
    icon: '🚀', title: 'Growth Strategies',
    items: [
      { title: 'Referral Program', content: `**Client Referral:** 10% commission on first-year revenue for every referral that closes.
**Partner Referral:** MSPs, accountants, business coaches → formalize with rev share.
**When to ask:** After positive ROI review, after a compliment, after solving a problem quickly.
**Script:** "You mentioned this has been working well — do you know any other [industry] owners who'd benefit?"` },
      { title: 'AI Audit Lead Magnet', content: `**Offer:** Free 30-min AI Operations Audit → 1-page report with specific automation opportunities → Natural transition to proposal.
**Conversion rate:** 40-60% of audits → proposals.` },
      { title: 'Local Domination', content: `• Target every business in your top 3 verticals within 50 miles
• Get 3-5 case studies per vertical per region
• Attend chamber of commerce, BNI, industry meetups
• LinkedIn content targeting local business owners` },
    ],
  },
  {
    icon: '📋', title: 'Industry Playbooks',
    items: [
      { title: 'Real Estate', content: `**Pitch:** Instant lead response 24/7, automated showings, transaction coordination
**Pain:** Leads die after 5 min, 10-15 hrs/week admin, calendar chaos
**ROI:** 2 extra closings/year = $16K vs $8K cost. Time savings = $19-32K/year.` },
      { title: 'Law Firms', content: `**Pitch:** Automated intake, scheduling, client updates — free attorneys to bill more
**Pain:** 40%+ calls after hours, attorneys doing admin at $300+/hr
**ROI:** 5 extra billable hrs/week × $300 = $78K/year.` },
      { title: 'Dental/Medical', content: `**Pitch:** Cut no-shows in half, automate reminders & insurance follow-up
**Pain:** 15-20% no-show rate, front desk overwhelmed, staff turnover
**ROI:** 20 recovered appointments/month × $200 = $4K/month.` },
      { title: 'Financial Advisory', content: `**Pitch:** Automated meeting prep, client communication, compliance docs
**Pain:** Each client worth $5-50K+/year, relationship-dependent
**ROI:** Retain 2-3 clients/year = $10-150K saved.` },
      { title: 'Marketing Agencies', content: `**Pitch:** Client comms, project tracking, lead nurture while you deliver
**Pain:** Dozens of clients, updates fall through cracks, new biz neglected
**ROI:** 1 new client/month from better follow-up = $2-10K MRR.` },
      { title: 'B2B Sales / SaaS', content: `**Pitch:** CRM hygiene, lead scoring, automated follow-up sequences
**Pain:** Reps hate CRM data entry, leads go cold
**ROI:** 10% more leads converted = significant revenue lift.` },
      { title: 'Construction', content: `**Pitch:** Bid follow-up, sub coordination, scheduling automation
**Pain:** 1-2 overwhelmed office staff, bid requests pile up
**ROI:** 2-3 more bids/month = potentially $10-50K in new projects.` },
      { title: 'E-Commerce', content: `**Pitch:** CS triage, vendor comms, order issue resolution
**Pain:** CS volume scales with orders, returns processing
**ROI:** Faster CS = better reviews = more sales. 15+ hrs/week saved.` },
    ],
  },
];

const DOWNLOADS = [
  { name: 'Sales Training Manual', file: '/sales-training-manual.md', icon: '📖' },
  { name: 'Sales Playbook', file: '/sales-playbook.md', icon: '🎯' },
  { name: 'Pipeline System', file: '/pipeline-system.md', icon: '📊' },
  { name: 'Competitive Edge', file: '/competitive-edge-playbook.md', icon: '⚔️' },
];

export default function Training() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleSection = (i: number) => {
    const next = new Set(expanded);
    next.has(i) ? next.delete(i) : next.add(i);
    setExpanded(next);
  };

  const toggleItem = (key: string) => {
    const next = new Set(expandedItems);
    next.has(key) ? next.delete(key) : next.add(key);
    setExpandedItems(next);
  };

  const expandAll = () => {
    setExpanded(new Set(SECTIONS.map((_, i) => i)));
    const allItems = new Set<string>();
    SECTIONS.forEach((s, i) => s.items.forEach((_, j) => allItems.add(`${i}-${j}`)));
    setExpandedItems(allItems);
  };

  const collapseAll = () => { setExpanded(new Set()); setExpandedItems(new Set()); };

  return (
    <div className="h-full overflow-y-auto p-4 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">📚 Training & Resources</h1>
        <div className="flex gap-2">
          <button onClick={expandAll} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">Expand All</button>
          <button onClick={collapseAll} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">Collapse All</button>
        </div>
      </div>

      {/* Downloads Row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {DOWNLOADS.map(d => (
          <a key={d.file} href={d.file} download className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-all">
            <span>{d.icon}</span> {d.name}
          </a>
        ))}
      </div>

      {/* Sections Grid — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {SECTIONS.map((section, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button onClick={() => toggleSection(i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-all">
              <h2 className="text-sm font-semibold text-gray-900">{section.icon} {section.title}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">{section.items.length} items</span>
                <span className="text-gray-400 text-xs">{expanded.has(i) ? '▼' : '▶'}</span>
              </div>
            </button>
            {expanded.has(i) && (
              <div className="px-3 pb-3 space-y-1.5">
                {section.items.map((item, j) => {
                  const key = `${i}-${j}`;
                  return (
                    <div key={key} className="border border-gray-100 rounded-lg overflow-hidden bg-gray-50/50">
                      <button onClick={() => toggleItem(key)}
                        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-100 transition-all">
                        <span className="text-xs font-medium text-gray-800">{item.title}</span>
                        <span className="text-gray-400 text-xs">{expandedItems.has(key) ? '−' : '+'}</span>
                      </button>
                      {expandedItems.has(key) && (
                        <div className="px-3 pb-3 text-xs text-gray-700 leading-relaxed whitespace-pre-line"
                          dangerouslySetInnerHTML={{
                            __html: item.content
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
                              .replace(/\n/g, '<br/>')
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
