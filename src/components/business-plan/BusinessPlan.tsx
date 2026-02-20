import { useState } from 'react';

interface Section {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

function SectionBlock({ section, defaultOpen }: { section: Section; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border border-[#1E3A5F]/20 rounded-xl overflow-hidden mb-3 bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[#1E3A5F]/5 transition-colors"
      >
        <span className="text-xl">{section.icon}</span>
        <span className="flex-1 font-semibold text-[#1E3A5F] text-[15px]">{section.title}</span>
        <span className={`text-[#D4A844] transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-gray-700 leading-relaxed border-t border-[#1E3A5F]/10">
          {section.content}
        </div>
      )}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-[#1E3A5F] text-white">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 border-b border-gray-100">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-[#1E3A5F] mt-4 mb-2 text-sm">{children}</h3>;
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#1E3A5F]/5 rounded-lg p-3 text-center">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-bold text-[#1E3A5F]">{value}</div>
      {sub && <div className="text-[10px] text-[#D4A844] mt-0.5">{sub}</div>}
    </div>
  );
}

const SECTIONS: Section[] = [
  {
    id: 'exec',
    title: '1. Executive Summary',
    icon: '🎯',
    content: (
      <div>
        <p className="mt-3"><strong>CD Web Solutions</strong> is a lean, AI-powered web design agency based in Colorado Springs, CO. We build professional websites for local businesses that have a Google Business Profile but no website.</p>
        <p className="mt-2">We have identified <span className="font-bold text-[#D4A844]">202 such businesses</span> across 19 service categories in Colorado Springs alone.</p>

        <H3>Why Now</H3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>46% of small businesses</strong> still don't have a website (2025)</li>
          <li>Google penalizes businesses without websites in local search</li>
          <li>AI tools collapse build times from weeks to hours</li>
          <li>Post-pandemic consumers expect online presence before visiting</li>
        </ul>

        <H3>Why Colorado Springs</H3>
        <ul className="list-disc pl-5 space-y-1">
          <li>2nd largest city in Colorado (~500K city, ~750K metro)</li>
          <li>15%+ population growth over last decade</li>
          <li>5 military bases creating constant customer turnover</li>
          <li>20,000+ registered businesses</li>
        </ul>

        <H3>Financial Snapshot</H3>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <Stat label="Conservative Y1" value="$78K" sub="Break-even: Month 2" />
          <Stat label="Moderate Y1" value="$127K" sub="Break-even: Month 1" />
          <Stat label="Aggressive Y1" value="$198K" sub="Break-even: Month 1" />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-2">
          <Stat label="MRR by Month 12" value="$2.4K" sub="Conservative" />
          <Stat label="MRR by Month 12" value="$4.7K" sub="Moderate" />
          <Stat label="MRR by Month 12" value="$7.9K" sub="Aggressive" />
        </div>
        <div className="mt-3 text-center">
          <Stat label="Startup Costs" value="~$2,000" sub="All scenarios" />
        </div>
      </div>
    ),
  },
  {
    id: 'company',
    title: '2. Company Overview',
    icon: '🏢',
    content: (
      <div>
        <H3>Legal Structure</H3>
        <p>Single-Member LLC (Colorado) — $50 filing, $10/yr annual report, pass-through taxation, liability protection.</p>

        <H3>Operations Model</H3>
        <p>Home-based / remote-first. Client meetings via coffee shops, their location, or video. All tools cloud-based. Service area: Colorado Springs metro including Fountain, Manitou Springs, Monument, Woodland Park, Security-Widefield.</p>

        <H3>Core Team</H3>
        <Table
          headers={['Role', 'Person', 'Notes']}
          rows={[
            ['Founder / Sales / Strategy', 'CD (Chris)', 'Full-time — all client-facing work'],
            ['AI Production Stack', 'AI Tools', 'Builds, copy, images, chatbots'],
            ['Bookkeeping', 'Contractor/Software', 'QuickBooks or Wave at launch'],
            ['Overflow Design', 'Freelancer', 'Upwork/Fiverr as needed'],
          ]}
        />
        <p className="mt-2 text-xs text-gray-500">Hiring trigger: 8+ deals/month → commission-based sales rep</p>
      </div>
    ),
  },
  {
    id: 'market',
    title: '3. Market Analysis',
    icon: '📊',
    content: (
      <div>
        <H3>The Opportunity: 202 Businesses Without Websites</H3>
        <p>Through direct Google Business Profile research, we identified 202 businesses across 19 categories with no website.</p>
        <Table
          headers={['Category', 'Count Range', 'Ticket Potential']}
          rows={[
            ['Dentists / Dental Clinics', '8-12', 'Premium ($1,997)'],
            ['Plumbers', '12-18', 'Professional ($997)'],
            ['Electricians', '10-15', 'Professional ($997)'],
            ['Roofers', '15-20', 'Professional ($997)'],
            ['Painters', '12-16', '$497-$997'],
            ['Hair/Beauty Salons', '20-30', 'Professional ($997)'],
            ['Auto / Car Washes', '10-20', 'Professional ($997)'],
            ['Restaurants / Bars', '15-20', 'Professional ($997)'],
            ['Other Services', '50+', 'Mixed'],
          ]}
        />
        <p className="mt-2">True number of website-less businesses likely <strong>500-1,000+</strong> across all categories.</p>

        <H3>Competitive Advantage</H3>
        <Table
          headers={['Factor', 'Traditional Agency', 'DIY Platform', 'CD Web Solutions']}
          rows={[
            ['Price', '$3,000-$15,000', '$200-$800/yr', '$497-$1,997'],
            ['Turnaround', '4-12 weeks', 'Days (if they learn)', '24-72 hours'],
            ['Local presence', 'Sometimes', 'Never', 'Always'],
            ['AI features', 'Rarely', 'No', 'Yes — chatbots, lead gen'],
            ['Profit margin', '40-60%', 'N/A', '80-90%'],
          ]}
        />
      </div>
    ),
  },
  {
    id: 'services',
    title: '4. Services & Pricing',
    icon: '💰',
    content: (
      <div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Starter</div>
            <div className="text-xl font-bold text-[#1E3A5F]">$497</div>
            <div className="text-[10px] text-[#D4A844] mb-2">24-48 hour delivery</div>
            <ul className="text-xs space-y-1 text-gray-600">
              <li>• 3-page website</li>
              <li>• Mobile responsive</li>
              <li>• Contact form</li>
              <li>• Google Maps + SEO</li>
              <li>• ~92-96% margin</li>
            </ul>
          </div>
          <div className="border-2 border-[#D4A844] rounded-lg p-3 relative">
            <div className="absolute -top-2 right-2 bg-[#D4A844] text-white text-[9px] px-2 py-0.5 rounded-full font-bold">POPULAR</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Professional</div>
            <div className="text-xl font-bold text-[#1E3A5F]">$997</div>
            <div className="text-[10px] text-[#D4A844] mb-2">48-72 hour delivery</div>
            <ul className="text-xs space-y-1 text-gray-600">
              <li>• 5-7 page website</li>
              <li>• Professional copywriting</li>
              <li>• GBP optimization</li>
              <li>• Click-to-call + SEO</li>
              <li>• ~94-97% margin</li>
            </ul>
          </div>
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Premium</div>
            <div className="text-xl font-bold text-[#1E3A5F]">$1,997+</div>
            <div className="text-[10px] text-[#D4A844] mb-2">3-5 day delivery</div>
            <ul className="text-xs space-y-1 text-gray-600">
              <li>• 8-12+ pages + blog</li>
              <li>• AI chatbot</li>
              <li>• Booking / scheduling</li>
              <li>• Lead capture + CRM</li>
              <li>• ~95-97% margin</li>
            </ul>
          </div>
        </div>

        <H3>Monthly Recurring Plans</H3>
        <Table
          headers={['Plan', 'Price/mo', 'Includes']}
          rows={[
            ['Basic Care', '$79/mo', 'Hosting, SSL, security, 1 update/mo'],
            ['Growth', '$119/mo', 'Basic + SEO report, 3 updates, GBP posts'],
            ['Premium Care', '$149/mo', 'Growth + chatbot, strategy call, priority support'],
          ]}
        />

        <H3>Add-On Upsells</H3>
        <Table
          headers={['Service', 'Price']}
          rows={[
            ['AI Chatbot', '$297 + $49/mo'],
            ['Google Ads Mgmt', '$299/mo'],
            ['Social Media Setup', '$197'],
            ['Logo Design', '$197-$497'],
            ['Email Marketing', '$297'],
            ['Additional Pages', '$97/page'],
          ]}
        />
        <p className="mt-2 text-xs text-gray-500">Target mix by Month 12: 40% one-time, 45% recurring, 15% add-ons</p>
      </div>
    ),
  },
  {
    id: 'sales',
    title: '5. Marketing & Sales Strategy',
    icon: '📣',
    content: (
      <div>
        <H3>Channel 1: Direct Outreach (70% of early sales)</H3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Walk-in visits:</strong> 5-10 businesses/day with pre-built mockup of THEIR website on tablet</li>
          <li><strong>Cold calling:</strong> Lead with value — free website audit / GBP review</li>
          <li><strong>Direct mail:</strong> One-pagers with QR code to sample sites (~$0.50-1.00/piece)</li>
          <li><strong>Email outreach:</strong> Personalized with screenshot mockups</li>
        </ul>
        <p className="mt-2 font-medium text-[#D4A844]">Target warm outreach conversion: 15-25%</p>

        <H3>Channel 2: Referral Program (20% by Month 6)</H3>
        <p>$100 cash or credit per referred close. Physical referral cards.</p>

        <H3>Channel 3: Digital Marketing (10% → 30%)</H3>
        <p>Google Ads ($300-500/mo, $30-75 per lead), local SEO, social media before/after reveals.</p>

        <H3>Channel 4: Partnerships</H3>
        <Table
          headers={['Partner', 'Value']}
          rows={[
            ['Chamber of Commerce', 'Member directory + events + credibility'],
            ['BNI Chapter', 'Weekly referral group — be "the web guy"'],
            ['Print shops', 'They do cards/flyers — we do websites'],
            ['Accountants / Insurance', 'Same SMB market — cross-refer'],
          ]}
        />

        <H3>10-Step Sales Process</H3>
        <div className="bg-[#1E3A5F]/5 rounded-lg p-3 mt-2 text-xs font-mono">
          IDENTIFY → RESEARCH → MOCK UP → APPROACH → PRESENT → CLOSE → ONBOARD → DELIVER → UPSELL → REFERRAL
        </div>
        <p className="mt-2 text-xs text-[#D4A844] font-medium">Launch Special: First 20 clients get 20% off any package</p>
      </div>
    ),
  },
  {
    id: 'financials',
    title: '6. Financial Projections',
    icon: '📈',
    content: (
      <div>
        <H3>Startup Costs (~$1,900)</H3>
        <Table
          headers={['Item', 'Cost']}
          rows={[
            ['Colorado LLC filing', '$50'],
            ['Domain + Hosting (annual)', '$212'],
            ['Business cards (500)', '$30'],
            ['AI tools (monthly avg)', '$100/mo'],
            ['Google Workspace', '$7/mo'],
            ['Canva Pro', '$13/mo'],
            ['Initial Google Ads', '$300'],
            ['Chamber of Commerce', '$400'],
            ['Miscellaneous', '$200'],
          ]}
        />

        <H3>Moderate Scenario (Most Likely)</H3>
        <Table
          headers={['Month', 'New Clients', 'Avg Ticket', 'Cumulative MRR', 'Total Monthly']}
          rows={[
            ['1', '4', '$747', '$305', '$3,293'],
            ['3', '5', '$847', '$1,069', '$5,304'],
            ['6', '6', '$947', '$2,443', '$8,125'],
            ['9', '7', '$997', '$4,045', '$11,024'],
            ['12', '7', '$1,047', '$5,647', '$12,976'],
          ]}
        />
        <div className="grid grid-cols-3 gap-3 mt-3">
          <Stat label="Year 1 Total" value="$127K" sub="74 clients" />
          <Stat label="Monthly (Month 12)" value="$13K" sub="$5.6K recurring" />
          <Stat label="Net Profit" value="~$112K" sub="~88% margin" />
        </div>

        <H3>Path to $100K+</H3>
        <p>Cross $100K cumulative revenue in <strong>Month 10</strong>. MRR compounds — by Year 2, recurring alone could reach $60K-$130K+ annually.</p>

        <H3>Year 2+ Projected</H3>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Stat label="Year 2 Revenue" value="$250-350K" sub="150+ clients" />
          <Stat label="Year 2 Net Profit" value="$210-310K" sub="80-85% margin" />
        </div>
      </div>
    ),
  },
  {
    id: 'operations',
    title: '7. Operations',
    icon: '⚙️',
    content: (
      <div>
        <H3>Client Onboarding (Day 0-7)</H3>
        <div className="bg-[#1E3A5F]/5 rounded-lg p-3 mt-2 text-xs space-y-1">
          <p><strong>Day 0:</strong> Sign agreement → 50% deposit → welcome email → schedule kickoff</p>
          <p><strong>Day 1:</strong> Kickoff call → review questionnaire → begin build</p>
          <p><strong>Day 1-3:</strong> AI generates → CD customizes → QA check</p>
          <p><strong>Day 3-5:</strong> Preview link → revisions → final payment → launch</p>
          <p><strong>Day 7:</strong> Check-in → present monthly plan → ask for Google review</p>
          <p><strong>Day 30:</strong> Follow-up → present add-ons → formal referral ask</p>
        </div>

        <H3>Build Timeline</H3>
        <Table
          headers={['Package', 'Build Time', 'Total w/ Review']}
          rows={[
            ['Starter ($497)', '2-4 hours', '1-2 days'],
            ['Professional ($997)', '4-8 hours', '2-4 days'],
            ['Premium ($1,997)', '8-16 hours', '3-7 days'],
          ]}
        />
        <p className="mt-2 text-xs text-gray-500">Capacity: 2-3 websites/week while also handling sales. At 8+ clients/month, batch production vs. sales days.</p>

        <H3>QA Checklist</H3>
        <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
          {['Mobile responsive', 'Page speed >80', 'All links working', 'Contact form tested',
            'Click-to-call', 'Google Maps loading', 'SSL active', 'SEO basics set',
            'Favicon', 'Analytics connected', 'Social links', 'No placeholder content'].map(item => (
            <div key={item} className="flex items-center gap-1.5 py-0.5">
              <span className="text-[#D4A844]">✓</span> {item}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'growth',
    title: '8. Growth Strategy',
    icon: '🚀',
    content: (
      <div>
        <div className="space-y-3 mt-3">
          <div className="bg-[#1E3A5F]/5 rounded-lg p-3">
            <div className="font-semibold text-[#1E3A5F] text-xs mb-1">Phase 1: Dominate Colorado Springs (Months 1-6)</div>
            <p className="text-xs text-gray-600">Close 30-50 clients from 202 list. Build portfolio + case studies. Achieve 4.9+ star Google rating. Join Chamber + BNI.</p>
          </div>
          <div className="bg-[#1E3A5F]/5 rounded-lg p-3">
            <div className="font-semibold text-[#1E3A5F] text-xs mb-1">Phase 2: Expand Springs + Nearby (Months 7-12)</div>
            <p className="text-xs text-gray-600">Exhaust 202-list, prospect new categories. Expand to Fountain, Monument, Woodland Park, Pueblo. Hire commission-based sales rep.</p>
          </div>
          <div className="bg-[#1E3A5F]/5 rounded-lg p-3">
            <div className="font-semibold text-[#1E3A5F] text-xs mb-1">Phase 3: Scale Across Colorado (Year 2)</div>
            <p className="text-xs text-gray-600">Denver metro, Fort Collins, Boulder, Pueblo, Grand Junction. Industry templates. Commission reps per city.</p>
          </div>
          <div className="bg-[#1E3A5F]/5 rounded-lg p-3">
            <div className="font-semibold text-[#1E3A5F] text-xs mb-1">Phase 4: Productize & White-Label (Year 2-3)</div>
            <p className="text-xs text-gray-600">White-label for agencies (40-50% wholesale). Template marketplace. Training course.</p>
          </div>
        </div>

        <H3>Revenue Potential at Scale</H3>
        <Table
          headers={['Phase', 'Timeline', 'Annual Revenue']}
          rows={[
            ['Solo (Springs)', 'Year 1', '$80K-$200K'],
            ['+ Sales reps', 'Year 2', '$200K-$400K'],
            ['Multi-city + white-label', 'Year 3', '$500K-$1M+'],
          ]}
        />
      </div>
    ),
  },
  {
    id: 'risks',
    title: '9. Risk Analysis',
    icon: '⚠️',
    content: (
      <div>
        <Table
          headers={['Risk', 'Likelihood', 'Mitigation']}
          rows={[
            ['Low conversion', 'Medium', 'Pre-build mockup sites. Refine pitch. Launch discounts.'],
            ['Monthly plan churn', 'Medium', 'Monthly value reports. Annual discount (2 months free).'],
            ['AI tool changes', 'Low', 'Diversify tools. Core skill is process, not one tool.'],
            ['Competitor copies', 'Medium', 'Local relationships are the moat. First-mover advantage.'],
            ['Scope creep', 'High', 'Clear contracts. Defined revisions. $97/hr change orders.'],
            ['Burnout', 'Medium', 'Batch days. Hire early. Max 8 clients/month solo.'],
            ['Economic downturn', 'Low', 'Pricing is recession-resistant ($497 vs $5,000+).'],
          ]}
        />
      </div>
    ),
  },
  {
    id: 'milestones',
    title: '10. Milestones & Timeline',
    icon: '🗓️',
    content: (
      <div>
        <div className="space-y-3 mt-3">
          {[
            { month: 'Month 1', target: '$2-3K rev, 3-4 clients', tasks: 'File LLC, build agency website, 5 demo sites, begin outreach (5 businesses/day)' },
            { month: 'Month 2', target: '$4-6K rev, 5-6 clients', tasks: 'Launch Google Ads ($300), join Chamber, first networking event, collect Google reviews' },
            { month: 'Month 3', target: '$5-8K rev, 15 total', tasks: 'Apply to BNI, launch referral program, start blog (1/week), build industry templates' },
            { month: 'Month 4', target: '$7-10K rev, 20+ total', tasks: 'Systematize onboarding, create SOPs, begin social content, establish referral partnerships' },
            { month: 'Month 5', target: '$8-12K rev, MRR ~$2K', tasks: 'Prospect nearby cities, build new lists, test part-time appointment setter' },
            { month: 'Month 6', target: '$10-15K rev, 40+ total', tasks: 'Evaluate hiring sales rep, 30+ portfolio sites, 4.8+ Google rating, cumulative $40-60K+' },
          ].map(m => (
            <div key={m.month} className="flex gap-3 items-start">
              <div className="bg-[#D4A844] text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap">{m.month}</div>
              <div>
                <div className="text-xs font-medium text-[#1E3A5F]">{m.target}</div>
                <div className="text-xs text-gray-500 mt-0.5">{m.tasks}</div>
              </div>
            </div>
          ))}
        </div>

        <H3>Key Metrics to Track</H3>
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
          {[
            ['Outreach/day', '5-10'],
            ['Outreach → Meeting', '20-30%'],
            ['Meeting → Close', '40-60%'],
            ['Avg deal size', '$800+'],
            ['Monthly plan attach', '70%+'],
            ['Client retention', '90%+'],
            ['Google rating', '4.8+'],
            ['Referral rate', '25%+'],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between bg-gray-50 rounded px-2 py-1.5">
              <span className="text-gray-600">{label}</span>
              <span className="font-medium text-[#1E3A5F]">{val}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function BusinessPlan() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#1E3A5F] text-white px-5 py-2 rounded-full text-sm font-medium mb-4">
            <span>📋</span> Business Plan
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">CD Web Solutions</h1>
          <p className="text-[#D4A844] font-medium mt-1">AI-Powered Web Design for Local Businesses</p>
          <p className="text-gray-500 text-sm mt-1">Colorado Springs, CO — February 2026</p>
          <div className="flex justify-center gap-6 mt-4 text-xs text-gray-500">
            <span>📍 Colorado Springs, CO</span>
            <span>🎯 202 Identified Leads</span>
            <span>💰 $127K Year 1 (Moderate)</span>
          </div>
        </div>

        {/* Sections */}
        {SECTIONS.map((s, i) => (
          <SectionBlock key={s.id} section={s} defaultOpen={i === 0} />
        ))}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-8 pb-6">
          <p>This plan is a living document. Review and update monthly based on actual performance.</p>
          <p className="mt-1">Prepared for CD Web Solutions LLC • Colorado Springs, CO • February 2026</p>
        </div>
      </div>
    </div>
  );
}
