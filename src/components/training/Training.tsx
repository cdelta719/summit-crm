import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { allDocs } from '../../data/trainingDocs';

/* ── Types ── */
interface ParsedSection {
  level: number;
  title: string;
  content: string;
  children: ParsedSection[];
}

/* ── Markdown Parser ── */
function parseMarkdown(md: string): ParsedSection[] {
  const lines = md.split('\n');
  const root: ParsedSection[] = [];
  const stack: { level: number; section: ParsedSection; children: ParsedSection[] }[] = [
    { level: 0, section: { level: 0, title: '', content: '', children: root }, children: root },
  ];

  let currentContent: string[] = [];

  const flushContent = () => {
    const text = currentContent.join('\n').trim();
    if (text && stack.length > 0) {
      const top = stack[stack.length - 1].section;
      top.content = top.content ? top.content + '\n\n' + text : text;
    }
    currentContent = [];
  };

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headerMatch) {
      flushContent();
      const level = headerMatch[1].length;
      const title = headerMatch[2].trim();
      const newSection: ParsedSection = { level, title, content: '', children: [] };

      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      stack[stack.length - 1].children.push(newSection);
      stack.push({ level, section: newSection, children: newSection.children });
    } else {
      currentContent.push(line);
    }
  }
  flushContent();

  return root;
}

/* ── Inline Markdown Renderer ── */
function renderInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-slate-100 text-[#1E3A5F] px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
}

/* ── Content Block Renderer ── */
function ContentBlock({ content }: { content: string }) {
  if (!content.trim()) return null;

  const blocks: React.ReactElement[] = [];
  const lines = content.split('\n');
  let i = 0;
  let blockIdx = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push(
        <pre key={blockIdx++} className="bg-[#0f1b2e] text-green-300 p-4 rounded-lg text-xs font-mono overflow-x-auto my-3 border border-slate-700">
          {codeLines.join('\n')}
        </pre>
      );
      continue;
    }

    // Table
    if (line.includes('|') && line.trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines
        .filter(l => !l.match(/^\|\s*[-:]+/)) // skip separator
        .map(l => l.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim()));

      if (rows.length > 0) {
        const header = rows[0];
        const body = rows.slice(1);
        blocks.push(
          <div key={blockIdx++} className="overflow-x-auto my-3">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#1E3A5F] text-white">
                  {header.map((h, hi) => (
                    <th key={hi} className="px-3 py-2 text-left font-semibold border border-slate-600"
                      dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(h) }} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 border border-slate-200 text-gray-700"
                        dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(cell) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Bullet / checkbox list
    if (line.match(/^\s*[-*•]\s/) || line.match(/^\s*\[[ x]\]\s/) || line.match(/^\s*\d+\.\s/)) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].match(/^\s*[-*•]\s/) || lines[i].match(/^\s*\[[ x]\]\s/) || lines[i].match(/^\s*\d+\.\s/))) {
        listItems.push(lines[i].replace(/^\s*[-*•]\s/, '').replace(/^\s*\[[ x]\]\s/, '').replace(/^\s*\d+\.\s/, ''));
        i++;
      }
      blocks.push(
        <ul key={blockIdx++} className="space-y-1.5 my-2">
          {listItems.map((item, li) => (
            <li key={li} className="flex items-start gap-2 text-xs text-gray-700">
              <span className="text-[#D4A844] mt-0.5 shrink-0">▸</span>
              <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      blocks.push(<hr key={blockIdx++} className="my-4 border-slate-200" />);
      i++;
      continue;
    }

    // Regular paragraph
    if (line.trim()) {
      const paraLines: string[] = [];
      while (i < lines.length && lines[i].trim() && !lines[i].match(/^#{1,4}\s/) && !lines[i].trim().startsWith('```') && !(lines[i].includes('|') && lines[i].trim().startsWith('|')) && !lines[i].match(/^\s*[-*•]\s/) && !lines[i].match(/^\s*\d+\.\s/) && !lines[i].match(/^---+$/)) {
        paraLines.push(lines[i]);
        i++;
      }
      blocks.push(
        <p key={blockIdx++} className="text-xs text-gray-700 leading-relaxed my-2"
          dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(paraLines.join(' ')) }} />
      );
      continue;
    }

    i++;
  }

  return <>{blocks}</>;
}

/* ── Collapsible Section Component ── */
function CollapsibleSection({
  section,
  depth = 0,
  searchTerm = '',
  defaultOpen = false,
}: {
  section: ParsedSection;
  depth?: number;
  searchTerm?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // Auto-open when searching
  useEffect(() => {
    if (searchTerm) setOpen(true);
  }, [searchTerm]);

  const headerStyles: Record<number, string> = {
    1: 'text-lg font-bold text-[#1E3A5F] py-3 px-4 bg-gradient-to-r from-slate-50 to-transparent border-l-4 border-[#D4A844]',
    2: 'text-sm font-bold text-[#1E3A5F] py-2.5 px-4 bg-slate-50/50 border-l-3 border-[#1E3A5F]/30',
    3: 'text-xs font-semibold text-gray-800 py-2 px-4',
    4: 'text-xs font-medium text-gray-600 py-1.5 px-4',
  };

  const style = headerStyles[section.level] || headerStyles[4];
  const hasContent = section.content.trim().length > 0 || section.children.length > 0;

  if (!hasContent) return null;

  // Highlight matching text
  const highlightTitle = (title: string) => {
    if (!searchTerm) return title;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return title.replace(regex, '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>');
  };

  return (
    <div className={`${depth === 0 ? 'mb-2' : ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors rounded-lg ${style}`}
      >
        <span dangerouslySetInnerHTML={{ __html: highlightTitle(section.title) }} />
        <span className={`text-gray-400 text-xs transition-transform shrink-0 ml-2 ${open ? 'rotate-90' : ''}`}>▶</span>
      </button>
      {open && (
        <div className={`${section.level <= 2 ? 'pl-4' : 'pl-3'} border-l border-slate-100 ml-2`}>
          {section.content && <ContentBlock content={section.content} />}
          {section.children.map((child, ci) => (
            <CollapsibleSection key={ci} section={child} depth={depth + 1} searchTerm={searchTerm} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Training Component ── */
export default function Training() {
  const [activeDoc, setActiveDoc] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [allExpanded, setAllExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const parsedDocs = useMemo(() => allDocs.map(doc => parseMarkdown(doc.content)), []);

  const filteredSections = useMemo(() => {
    const sections = parsedDocs[activeDoc];
    if (!searchTerm.trim()) return sections;

    const term = searchTerm.toLowerCase();

    const matchesSearch = (section: ParsedSection): boolean => {
      if (section.title.toLowerCase().includes(term)) return true;
      if (section.content.toLowerCase().includes(term)) return true;
      return section.children.some(matchesSearch);
    };

    const filterSections = (secs: ParsedSection[]): ParsedSection[] =>
      secs.filter(matchesSearch).map(s => ({
        ...s,
        children: filterSections(s.children),
      }));

    return filterSections(sections);
  }, [activeDoc, searchTerm, parsedDocs]);

  const handleDocChange = useCallback((idx: number) => {
    setActiveDoc(idx);
    setSearchTerm('');
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, []);

  const expandCollapseAll = () => {
    setAllExpanded(!allExpanded);
  };

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 shrink-0 bg-[#1E3A5F] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="text-[#D4A844]">📚</span> Training Center
          </h2>
          <p className="text-[10px] text-white/50 mt-1">Summit Digital Co Resources</p>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {allDocs.map((doc, idx) => (
            <button
              key={doc.id}
              onClick={() => handleDocChange(idx)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-xs ${
                activeDoc === idx
                  ? 'bg-white/15 text-white border border-[#D4A844]/40'
                  : 'text-white/70 hover:bg-white/8 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{doc.icon}</span>
                <div>
                  <div className="font-semibold">{doc.title}</div>
                  <div className="text-[10px] opacity-60 mt-0.5">{doc.description}</div>
                </div>
              </div>
            </button>
          ))}
        </nav>

        {/* Quick Stats */}
        <div className="p-3 border-t border-white/10">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Quick Reference</div>
            <div className="space-y-1.5 text-[11px] text-white/70">
              <div>💰 <span className="text-[#D4A844]">Starter:</span> $2,000</div>
              <div>🚀 <span className="text-[#D4A844]">Growth:</span> $3,500</div>
              <div>⭐ <span className="text-[#D4A844]">Premium:</span> $5,000</div>
              <div className="pt-1 border-t border-white/10">
                🔧 <span className="text-white/50">Maintenance:</span> $150-250/mo
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search in ${allDocs[activeDoc].title}...`}
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#D4A844] focus:ring-1 focus:ring-[#D4A844]/30 bg-gray-50"
            />
            <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={expandCollapseAll}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
          <div className="text-[10px] text-gray-400">
            {filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Doc Header */}
        <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2a4f7a] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{allDocs[activeDoc].icon}</span>
            <div>
              <h1 className="text-base font-bold text-white">{allDocs[activeDoc].title}</h1>
              <p className="text-xs text-white/60">{allDocs[activeDoc].description}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-5">
          {filteredSections.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-3">🔍</div>
              <p className="text-sm text-gray-500">No results found for &quot;{searchTerm}&quot;</p>
              <button onClick={() => setSearchTerm('')} className="text-xs text-[#D4A844] mt-2 hover:underline">Clear search</button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-1" key={`${activeDoc}-${allExpanded}`}>
              {filteredSections.map((section, si) => (
                <CollapsibleSection
                  key={`${activeDoc}-${si}-${allExpanded}`}
                  section={section}
                  searchTerm={searchTerm}
                  defaultOpen={allExpanded || !!searchTerm}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
