'use client';

import { DFA } from '@/lib/types';

interface TransitionTableProps {
  dfa: DFA | null;
  activeState?: string;
}

export default function TransitionTable({ dfa, activeState }: TransitionTableProps) {
  if (!dfa || dfa.states.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-slate-500 text-sm italic">
        No DFA to display
      </div>
    );
  }

  // Build a lookup: from × symbol → to
  const lookup = new Map<string, string>();
  for (const t of dfa.transitions) {
    lookup.set(`${t.from}_${t.symbol}`, t.to);
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">
              State
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-40">
              NFA States
            </th>
            {dfa.alphabet.map(sym => (
              <th
                key={sym}
                className="px-4 py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider"
                style={{fontFamily: 'var(--font-mono)'}}
              >
                {sym}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dfa.states.map(state => {
            const isActive = state.id === activeState;
            const isAccept = state.isAccept;
            const isStart = state.isStart;

            return (
              <tr
                key={state.id}
                className={`border-b border-[var(--border-subtle)] transition-colors ${
                  isActive
                    ? 'bg-[var(--accent-teal)]/10'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {isStart && (
                      <span className="text-emerald-400 text-xs font-bold">→</span>
                    )}
                    <span
                      className={`font-bold ${
                        isActive
                          ? 'text-[var(--accent-teal)]'
                          : isAccept
                          ? 'text-amber-400'
                          : 'text-slate-200'
                      }`}
                      style={{fontFamily: 'var(--font-mono)'}}
                    >
                      {isAccept ? `(${state.id})` : state.id}
                    </span>
                    {isAccept && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-amber-500/20 text-amber-400 font-semibold">
                        ACCEPT
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-slate-400 text-xs" style={{fontFamily: 'var(--font-mono)'}}>
                  {'{' + state.nfaStates.join(', ') + '}'}
                </td>
                {dfa.alphabet.map(sym => {
                  const dest = lookup.get(`${state.id}_${sym}`);
                  return (
                    <td key={sym} className="px-4 py-2 text-center">
                      {dest ? (
                        <span
                          className={`text-sm font-bold ${
                            isActive ? 'text-[var(--accent-teal)]' : 'text-blue-400'
                          }`}
                          style={{fontFamily: 'var(--font-mono)'}}
                        >
                          {dest}
                        </span>
                      ) : (
                        <span className="text-slate-600">∅</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
