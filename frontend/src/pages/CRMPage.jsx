import { useState } from 'react';
import { MOCK_LEADS } from '../utils/constants';

const STAGE_STYLE = {
  New:        { bg: '#EFF4FF', text: '#2563EB' },
  Contacted:  { bg: '#EFF4FF', text: '#1D4ED8' },
  Qualified:  { bg: '#ECFDF5', text: '#059669' },
};

function StageBadge({ stage }) {
  const s = STAGE_STYLE[stage] ?? { bg: 'var(--bg-panel)', text: 'var(--ink-3)' };
  return (
    <span
      className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {stage}
    </span>
  );
}

const AVATAR_COLORS = ['#2563EB', '#059669', '#9333EA', '#D97706', '#64748B'];

export default function CRMPage() {
  const [leads] = useState(MOCK_LEADS);
  const newestId = leads[leads.length - 1]?.id;

  return (
    <div
      className="flex-1 overflow-y-auto px-6 py-6"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--ink-1)' }}>
            CRM Leads
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ink-3)' }}>
            {leads.length} leads · created by the Sales Agent
          </p>
        </div>
        <div
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--ink-3)',
          }}
        >
          New leads appear automatically during chat
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-panel)' }}>
              {['Name', 'Email', 'Interest', 'Stage', 'Notes', 'Created'].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--ink-3)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, i) => {
              const isNew = lead.id === newestId;
              return (
                <tr
                  key={lead.id}
                  style={{
                    borderBottom: i < leads.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    backgroundColor: isNew ? '#EFF4FF' : 'transparent',
                  }}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                        aria-hidden="true"
                      >
                        {lead.name[0]}
                      </div>
                      <span className="font-medium" style={{ color: 'var(--ink-1)' }}>
                        {lead.name}
                        {isNew && (
                          <span
                            className="ml-2 text-[9px] font-bold uppercase tracking-widest"
                            style={{ color: 'var(--accent)' }}
                          >
                            New
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--ink-3)' }}>
                    {lead.email}
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--ink-2)' }}>
                    {lead.interest}
                  </td>
                  <td className="px-5 py-3.5">
                    <StageBadge stage={lead.stage} />
                  </td>
                  <td
                    className="px-5 py-3.5 text-xs max-w-[180px] truncate hidden md:table-cell"
                    style={{ color: 'var(--ink-3)' }}
                  >
                    {lead.notes}
                  </td>
                  <td
                    className="px-5 py-3.5 text-xs font-mono hidden sm:table-cell"
                    style={{ color: 'var(--ink-4)' }}
                  >
                    {lead.createdAt}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
