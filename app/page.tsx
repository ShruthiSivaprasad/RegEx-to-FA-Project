'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

import RegexInput from '@/components/RegexInput';
import TransitionTable from '@/components/TransitionTable';
import Simulator from '@/components/Simulator';

import { parseRegex } from '@/lib/parser';
import { buildNFAWithSteps } from '@/lib/thompson';
import { buildDFA } from '@/lib/subset';
import { NFA, DFA, ThompsonStep, ActiveEdge } from '@/lib/types';
import { generateSampleStrings, SampleString } from '@/lib/sampleStrings';

// Cytoscape components must be dynamically loaded (no SSR)
const NFAGraph = dynamic(() => import('@/components/NFAGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-slate-500 text-sm animate-pulse">
      Loading graph…
    </div>
  ),
});

const DFAGraph = dynamic(() => import('@/components/DFAGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-slate-500 text-sm animate-pulse">
      Loading graph…
    </div>
  ),
});

const ThompsonStepper = dynamic(() => import('@/components/ThompsonStepper'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-slate-500 text-sm animate-pulse">
      Loading stepper…
    </div>
  ),
});

export default function HomePage() {
  const [regex, setRegex] = useState('(a|b)*abb');
  const [error, setError] = useState<string | null>(null);
  const [nfa, setNfa] = useState<NFA | null>(null);
  const [dfa, setDfa] = useState<DFA | null>(null);
  const [thompsonSteps, setThompsonSteps] = useState<ThompsonStep[]>([]);
  const [nfaActiveStates, setNfaActiveStates] = useState<string[]>([]);
  const [dfaActiveState, setDfaActiveState] = useState<string>('');
  const [nfaActiveEdge, setNfaActiveEdge] = useState<ActiveEdge | null>(null);
  const [dfaActiveEdge, setDfaActiveEdge] = useState<ActiveEdge | null>(null);
  const [sampleStrings, setSampleStrings] = useState<SampleString[]>([]);
  const [postfix, setPostfix] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'construction' | 'graphs' | 'table'>('construction');

  const handleConvert = useCallback(() => {
    setError(null);
    setNfaActiveStates([]);
    setDfaActiveState('');
    setNfaActiveEdge(null);
    setDfaActiveEdge(null);
    try {
      const pf = parseRegex(regex);
      setPostfix(pf);
      const { nfa: builtNFA, steps } = buildNFAWithSteps(pf);
      setNfa(builtNFA);
      setThompsonSteps(steps);
      const builtDFA = buildDFA(builtNFA);
      setDfa(builtDFA);
      setSampleStrings(generateSampleStrings(builtDFA));
      setActiveTab('construction');
    } catch (e: any) {
      setError(e.message ?? 'Unknown error');
      setNfa(null);
      setDfa(null);
      setNfaActiveEdge(null);
      setDfaActiveEdge(null);
      setSampleStrings([]);
      setThompsonSteps([]);
      setPostfix(null);
    }
  }, [regex]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-slate-100 flex flex-col">
      {/* ─── Header ─────────────────────────────────────── */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-[var(--accent-teal)] flex items-center justify-center shadow-lg shadow-teal-900/20">
              <span className="text-[var(--bg-primary)] font-black text-base select-none" style={{fontFamily: 'var(--font-mono)'}}>R→A</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-[var(--accent-teal)] leading-none" style={{fontFamily: 'var(--font-heading)'}}
              >
                RegExp → Automaton
              </h1>
              <p className="text-[11px] text-slate-500 leading-none mt-0.5">
                Thompson's Construction · Subset Construction
              </p>
            </div>
          </div>

          {/* postfix badge */}
          {postfix && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-none bg-transparent border border-[var(--accent-teal)]/40">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                Postfix
              </span>
              <code className="text-xs text-[var(--accent-teal)] font-bold" style={{fontFamily: 'var(--font-mono)'}}>{postfix}</code>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-screen-2xl mx-auto w-full px-6 py-6 gap-6">
        {/* ─── Educational Reference Panel ───────────────── */}
        <section
          className="rounded-[2px] bg-[var(--bg-secondary)]/80 border border-[var(--border-subtle)] shadow-xl overflow-hidden"
          aria-label="Educational Reference"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-subtle)]">
            {/* Left: Thompson Rules */}
            <div className="p-4 lg:p-5 h-[430px] overflow-y-auto">
              <h2
                className="text-base md:text-lg font-bold text-[var(--accent-teal)] mb-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Thompson's Construction Rules
              </h2>

              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <div className="rounded-[6px] border border-[var(--border-subtle)] bg-slate-900/35 p-3">
                  <p className="mb-1.5">
                    <code className="px-1.5 py-0.5 rounded-[2px] border border-[var(--accent-teal)]/40 text-[var(--accent-teal)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      Literal
                    </code>
                  </p>
                  <p className="text-xs text-slate-400 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                    q0 --a--&gt; q1
                  </p>
                  <p>A single character <code style={{ fontFamily: 'var(--font-mono)' }}>a</code> becomes two states with one transition: q→a→q'. Simple as it gets.</p>
                </div>

                <div className="rounded-[6px] border border-[var(--border-subtle)] bg-slate-900/35 p-3">
                  <p className="mb-1.5">
                    <code className="px-1.5 py-0.5 rounded-[2px] border border-[var(--accent-teal)]/40 text-[var(--accent-teal)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      Union (a|b)
                    </code>
                  </p>
                  <p className="text-xs text-slate-400 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                    qs --e--&gt; a-branch --e--&gt; qf
                    <br />
                    qs --e--&gt; b-branch --e--&gt; qf
                  </p>
                  <p>Create a new start and accept state. Add ε-transitions to both sub-machines. The machine chooses a branch without reading any input.</p>
                </div>

                <div className="rounded-[6px] border border-[var(--border-subtle)] bg-slate-900/35 p-3">
                  <p className="mb-1.5">
                    <code className="px-1.5 py-0.5 rounded-[2px] border border-[var(--accent-teal)]/40 text-[var(--accent-teal)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      Concatenation (ab)
                    </code>
                  </p>
                  <p className="text-xs text-slate-400 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                    [a-machine] --e--&gt; [b-machine]
                  </p>
                  <p>Connect the accept state of the left machine to the start state of the right via ε. They run one after the other.</p>
                </div>

                <div className="rounded-[6px] border border-[var(--border-subtle)] bg-slate-900/35 p-3">
                  <p className="mb-1.5">
                    <code className="px-1.5 py-0.5 rounded-[2px] border border-[var(--accent-teal)]/40 text-[var(--accent-teal)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      Kleene Star (a*)
                    </code>
                  </p>
                  <p className="text-xs text-slate-400 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                    qs --e--&gt; qf (skip)
                    <br />
                    qs --e--&gt; a-machine --e--&gt; qf
                    <br />
                    a-accept --e--&gt; a-start (loop)
                  </p>
                  <p>Add a new start and accept state. Add ε-transitions to allow skipping entirely (zero times) or looping back (many times).</p>
                </div>

                <div className="rounded-[6px] border border-[var(--border-subtle)] bg-slate-900/35 p-3">
                  <p className="mb-1.5">
                    <code className="px-1.5 py-0.5 rounded-[2px] border border-[var(--accent-teal)]/40 text-[var(--accent-teal)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      One or More (a+)
                    </code>
                  </p>
                  <p className="text-xs text-slate-400 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                    qs --e--&gt; a-machine --e--&gt; qf
                    <br />
                    a-accept --e--&gt; a-start (loop)
                  </p>
                  <p>Like Kleene star but the skip-entirely path is removed. Must match at least once.</p>
                </div>
              </div>
            </div>

            {/* Right: How to Use */}
            <div className="p-4 lg:p-5 h-[430px] overflow-y-auto">
              <h2
                className="text-base md:text-lg font-bold text-[var(--accent-teal)] mb-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                How to Use
              </h2>

              <ol className="space-y-3 text-sm text-slate-300 leading-relaxed list-decimal pl-5">
                <li>Enter a regex in the input bar below using the supported syntax shown below it.</li>
                <li>Click <code style={{ fontFamily: 'var(--font-mono)' }}>Convert</code> to build the E-NFA using Thompson's Construction.</li>
                <li>Watch the Construction tab to see each rule applied step by step: the left panel shows which rule, the right panel builds the NFA live.</li>
                <li>Switch to Automaton Graphs to see the complete E-NFA and the DFA side by side (built via Subset Construction).</li>
                <li>Open DFA Transition Table to see every state and transition in tabular form.</li>
                <li>Use the String Simulator at the bottom: type any string, hit Simulate, then step through it to see exactly which states the machine visits.</li>
              </ol>

              <div className="mt-4 rounded-[6px] border border-[var(--accent-teal)]/30 bg-[var(--accent-teal)]/10 px-3 py-2 text-xs text-slate-200">
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  💡 Try the Examples dropdown to load a preset regex and see a full walkthrough.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Regex Input ─────────────────────────────── */}
        <section
          className="rounded-[2px] bg-[var(--bg-secondary)]/80 border border-[var(--border-subtle)] p-5 shadow-xl"
          aria-label="Regex Input"
        >
          <RegexInput
            value={regex}
            onChange={setRegex}
            onConvert={handleConvert}
            error={error}
          />
        </section>

        {/* ─── Stats bar ───────────────────────────────── */}
        {nfa && dfa && (
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'NFA States', value: nfa.states.length, color: 'teal' },
              { label: 'NFA Transitions', value: nfa.transitions.length, color: 'teal' },
              { label: 'DFA States', value: dfa.states.length, color: 'teal' },
              { label: 'DFA Transitions', value: dfa.transitions.length, color: 'teal' },
              { label: 'Alphabet', value: nfa.alphabet.join(', ') || 'ε', color: 'slate' },
            ].map(stat => (
              <div
                key={stat.label}
                className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-transparent border border-[var(--border-subtle)]"
              >
                <span className="text-xs text-slate-400 font-semibold">{stat.label}:</span>
                <span
                  className={`text-sm font-bold ${
                    stat.color === 'teal'
                      ? 'text-[var(--accent-teal)]'
                      : 'text-slate-300'
                  }`}
                  style={{fontFamily: 'var(--font-mono)'}}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ─── Graphs / Table Tabs ─────────────────────── */}
        <section className="rounded-[2px] bg-[var(--bg-secondary)]/80 border border-[var(--border-subtle)] shadow-xl overflow-hidden flex flex-col">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-[var(--border-subtle)] px-4 pt-3 pb-0">
            {([
              { id: 'construction', label: '⚙ Construction' },
              { id: 'graphs',       label: '⬡ Automaton Graphs' },
              { id: 'table',        label: '⊞ DFA Transition Table' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-[var(--accent-teal)] text-[var(--accent-teal)]'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'construction' && (
            <div className="p-4">
              <ThompsonStepper steps={thompsonSteps} finalNfa={nfa!} />
            </div>
          )}

          {activeTab === 'graphs' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
              {/* NFA Panel */}
              <div className="flex flex-col">
                <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-teal)]">
                      ε-NFA
                    </span>
                    <span className="text-xs text-slate-500">Thompson's Construction</span>
                  </div>
                  {nfa && (
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-[6px] bg-[var(--accent-teal)]/10 text-[var(--accent-teal)] font-semibold" style={{fontFamily: 'var(--font-mono)'}}>
                        {nfa.states.length} states
                      </span>
                      <span className="px-2 py-0.5 rounded-[6px] bg-slate-800 text-slate-400" style={{fontFamily: 'var(--font-mono)'}}>
                        {nfa.transitions.length} transitions
                      </span>
                    </div>
                  )}
                </div>
                <div className="h-80 lg:h-96 relative" style={{
                  backgroundImage: 'radial-gradient(circle, rgba(15, 255, 193, 0.04) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}>
                  <NFAGraph nfa={nfa} activeStates={nfaActiveStates} activeEdge={nfaActiveEdge} />
                </div>
                {/* Legend */}
                <div className="px-4 py-2 border-t border-[var(--border-subtle)] flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-900 border-2 border-emerald-500 inline-block" />
                    Start
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-indigo-950 border-2 border-amber-400 inline-block" />
                    Accept
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-violet-900 border-2 border-violet-400 inline-block" />
                    Active (simulation)
                  </span>
                </div>
              </div>

              {/* DFA Panel */}
              <div className="flex flex-col">
                <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-teal)]">
                      DFA
                    </span>
                    <span className="text-xs text-slate-500">Subset Construction</span>
                  </div>
                  {dfa && (
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-[6px] bg-[var(--accent-teal)]/10 text-[var(--accent-teal)] font-semibold" style={{fontFamily: 'var(--font-mono)'}}>
                        {dfa.states.length} states
                      </span>
                      <span className="px-2 py-0.5 rounded-[6px] bg-slate-800 text-slate-400" style={{fontFamily: 'var(--font-mono)'}}>
                        {dfa.transitions.length} transitions
                      </span>
                    </div>
                  )}
                </div>
                <div className="h-80 lg:h-96 relative" style={{
                  backgroundImage: 'radial-gradient(circle, rgba(15, 255, 193, 0.04) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}>
                  <DFAGraph dfa={dfa} activeState={dfaActiveState} activeEdge={dfaActiveEdge} />
                </div>
                <div className="px-4 py-2 border-t border-[var(--border-subtle)] flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-900 border-2 border-emerald-500 inline-block" />
                    Start
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-indigo-950 border-2 border-amber-400 inline-block" />
                    Accept
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-violet-900 border-2 border-violet-400 inline-block" />
                    Active (simulation)
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'table' && (
            <div className="p-4">
              {dfa ? (
                <TransitionTable dfa={dfa} activeState={dfaActiveState} />
              ) : (
                <div className="flex items-center justify-center py-16 text-slate-500 text-sm italic">
                  Convert a regex first to see the DFA transition table
                </div>
              )}
            </div>
          )}
        </section>

        {/* ─── Simulator ───────────────────────────────── */}
        <section
          className="rounded-[2px] bg-[var(--bg-secondary)]/80 border border-[var(--border-subtle)] p-5 shadow-xl"
          aria-label="Simulation Panel"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              🎮 String Simulator
            </span>
          </div>
          <Simulator
            nfa={nfa}
            dfa={dfa}
            sampleStrings={sampleStrings}
            onSimulationStart={() => setActiveTab('graphs')}
            onNFAStep={setNfaActiveStates}
            onDFAStep={setDfaActiveState}
            onNFAEdge={setNfaActiveEdge}
            onDFAEdge={setDfaActiveEdge}
          />
        </section>
      </main>

      {/* ─── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-600">
        made by shruthi sivaprasad
      </footer>
    </div>
  );
}
