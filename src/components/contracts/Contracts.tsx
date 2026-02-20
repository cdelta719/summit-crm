export default function Contracts() {
  const contracts = [
    {
      name: 'Growth Package Service Agreement',
      description: 'Standard package — $5,000 setup + $250/mo. Up to 3 channels, 5 custom skills, 14-day hypercare, ongoing maintenance.',
      file: '/Summit-Growth-Agreement.pdf',
      tier: 'Growth',
      color: '#1E3A5F',
    },
    {
      name: 'Enterprise Package Service Agreement',
      description: 'Premium package — $15,000 setup + $750/mo. Unlimited channels & skills, dedicated account manager, priority support, quarterly reviews.',
      file: '/Summit-Enterprise-Agreement.pdf',
      tier: 'Enterprise',
      color: '#111827',
    },
  ];

  return (
    <div className="flex-1 overflow-auto p-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📄 Contracts</h1>
        <p className="text-sm text-gray-500 mt-1">Service agreements ready to send to clients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {contracts.map(contract => (
          <div
            key={contract.tier}
            className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all"
          >
            {/* Tier Badge */}
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: contract.color }}
              >
                {contract.tier}
              </span>
              <span className="text-3xl">📄</span>
            </div>

            {/* Info */}
            <h3 className="text-lg font-bold text-gray-900 mb-2">{contract.name}</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">{contract.description}</p>

            {/* Download Button */}
            <a
              href={contract.file}
              download
              className="inline-flex items-center gap-2 w-full justify-center px-5 py-3 bg-[#1E3A5F] hover:bg-[#B91C1C] text-white font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-red-500/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
