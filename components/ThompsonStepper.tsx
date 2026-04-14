'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
// @ts-ignore
import dagre from 'cytoscape-dagre';
import { ThompsonStep, NFA } from '@/lib/types';

if (typeof window !== 'undefined') {
  try { cytoscape.use(dagre); } catch { /* already registered */ }
}

// ─── Rule colour palette ──────────────────────────────────────────────────────
const RULE_STYLE: Record<string, { badge: string; text: string; dot: string }> = {
  'Literal Rule':       { badge: 'bg-cyan-900/50 border-cyan-700',   text: 'text-cyan-300',    dot: 'bg-cyan-400' },
  'Concatenation Rule': { badge: 'bg-emerald-900/50 border-emerald-700', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  'Union Rule':         { badge: 'bg-orange-900/50 border-orange-700',  text: 'text-orange-300',  dot: 'bg-orange-400' },
  'Kleene Star Rule':   { badge: 'bg-teal-900/50 border-teal-700',  text: 'text-teal-300',  dot: 'bg-teal-400' },
  'Plus Rule':          { badge: 'bg-rose-900/50 border-rose-700',      text: 'text-rose-300',     dot: 'bg-rose-400' },
  'Optional Rule':      { badge: 'bg-amber-900/50 border-amber-700',    text: 'text-amber-300',    dot: 'bg-amber-400' },
};

function getRuleStyle(rule: string) {
  return RULE_STYLE[rule] ?? { badge: 'bg-slate-800 border-slate-700', text: 'text-slate-300', dot: 'bg-slate-400' };
}

interface ThompsonStepperProps {
  steps: ThompsonStep[];
  finalNfa: NFA;
  autoPlaySignal?: number;
}

export default function ThompsonStepper({ steps, finalNfa, autoPlaySignal }: ThompsonStepperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAutoPlaySignalRef = useRef(autoPlaySignal);
  // Map each element id → the step index that introduced it
  const introMap = useRef<Map<string, number>>(new Map());

  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pendingAutoPlay, setPendingAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(1500); // ms

  // ─── Build intro-step map ─────────────────────────────────────────────────
  // (stable — only depends on steps identity which changes only on new convert)
  useEffect(() => {
    const map = new Map<string, number>();
    steps.forEach((step, idx) => {
      step.newStateIds.forEach(id => { if (!map.has(id)) map.set(id, idx); });
      // Edge elements use the transition key as their cytoscape id
      step.newTransitionKeys.forEach(key => { if (!map.has(key)) map.set(key, idx); });
    });
    introMap.current = map;
  }, [steps]);

  // ─── Initialise Cytoscape with ALL final-NFA elements ─────────────────────
  useEffect(() => {
    if (!containerRef.current || steps.length === 0 || !finalNfa) return;

    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    const elements: cytoscape.ElementDefinition[] = [];

    // Nodes — all states from the final NFA, start opacity at 0
    for (const state of finalNfa.states) {
      elements.push({
        data: { id: state.id, label: state.id },
        classes: 'state',
        style: { opacity: 0 },
      });
    }

    // Edges — one per unique (from, symbol, to) in final NFA, start opacity 0
    // Use tKey as the cytoscape element id so it matches introMap
    const seenEdges = new Set<string>();
    for (const t of finalNfa.transitions) {
      const key = `${t.from}→${t.symbol}→${t.to}`;
      if (seenEdges.has(key)) continue;
      seenEdges.add(key);
      const isSelf = t.from === t.to;
      elements.push({
        data: { id: key, source: t.from, target: t.to, label: t.symbol },
        classes: isSelf ? 'self-loop' : 'transition-edge',
        style: { opacity: 0 },
      });
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node.state',
          style: {
            'background-color': '#1a2f2d',
            'border-color': '#0FFFC1',
            'border-width': 2,
            color: '#e2e8f0',
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': 13,
            'font-weight': 'bold',
            width: 48,
            height: 48,
            'font-family': 'JetBrains Mono, monospace',
          },
        },
        {
          selector: 'node.fragment-start',
          style: {
            'background-color': '#064e3b',
            'border-color': '#34d399',
            'border-width': 3,
          },
        },
        {
          selector: 'node.fragment-accept',
          style: {
            'background-color': '#1e1b4b',
            'border-color': '#fbbf24',
            'border-width': 4,
            'outline-color': '#fbbf24',
            'outline-width': 2,
            'outline-offset': 3,
          },
        },
        {
          selector: 'node.newly-added',
          style: {
            'border-color': '#0FFFC1',
            'border-width': 4,
            'background-color': '#0a3f3c',
          },
        },
        {
          selector: 'edge.transition-edge',
          style: {
            'line-color': '#475569',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': 12,
            color: '#94a3b8',
            'text-background-color': '#0a0c18',
            'text-background-opacity': 0.9,
            'text-background-padding': '3px',
            width: 2,
            'font-family': 'JetBrains Mono, monospace',
          },
        },
        {
          selector: 'edge.self-loop',
          style: {
            'curve-style': 'bezier',
            'loop-direction': '-45deg',
            'loop-sweep': '-45deg',
            'line-color': '#475569',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            label: 'data(label)',
            'font-size': 12,
            color: '#94a3b8',
            'text-background-color': '#0a0c18',
            'text-background-opacity': 0.9,
            'text-background-padding': '3px',
            width: 2,
          },
        },
        {
          selector: 'edge.newly-added',
          style: {
            'line-color': '#0FFFC1',
            'target-arrow-color': '#0FFFC1',
            width: 3,
          },
        },
      ],
      layout: {
        name: 'dagre',
        rankDir: 'LR',
        nodeSep: 60,
        rankSep: 90,
        padding: 40,
      } as any,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cyRef.current = cy;

    // After layout, reset to step 0
    setStepIdx(0);

    // Cleanup
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [steps, finalNfa]);

  useEffect(() => {
    if (autoPlaySignal === undefined || autoPlaySignal === lastAutoPlaySignalRef.current) return;
    lastAutoPlaySignalRef.current = autoPlaySignal;
    if (steps.length === 0) return;
    stopPlay();
    setStepIdx(0);
    setPendingAutoPlay(true);
  }, [autoPlaySignal]);

  // ─── Apply visibility + highlighting on step change ────────────────────────
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || steps.length === 0) return;

    const step = steps[stepIdx];
    const map = introMap.current;

    // Show/hide nodes
    for (const state of finalNfa.states) {
      const intro = map.get(state.id) ?? 0;
      const node = cy.getElementById(state.id);
      if (intro <= stepIdx) {
        if (intro === stepIdx) {
          // Animate pop-in: opacity 0 → 1, then cyan glow fades
          node.animate({ style: { opacity: 1 } } as any, { duration: 350 });
          node.addClass('newly-added');
          setTimeout(() => node.removeClass('newly-added'), 1100);
        } else {
          node.style('opacity', 1);
          node.removeClass('newly-added');
        }
      } else {
        node.style('opacity', 0);
        node.removeClass('newly-added fragment-start fragment-accept');
      }
    }

    // Show/hide edges
    const seenEdges = new Set<string>();
    for (const t of finalNfa.transitions) {
      const key = `${t.from}→${t.symbol}→${t.to}`;
      if (seenEdges.has(key)) continue;
      seenEdges.add(key);
      const intro = map.get(key) ?? 0;
      const edge = cy.getElementById(key);
      if (intro <= stepIdx) {
        if (intro === stepIdx) {
          edge.animate({ style: { opacity: 1 } } as any, { duration: 350 });
          edge.addClass('newly-added');
          setTimeout(() => edge.removeClass('newly-added'), 1100);
        } else {
          edge.style('opacity', 1);
          edge.removeClass('newly-added');
        }
      } else {
        edge.style('opacity', 0);
        edge.removeClass('newly-added');
      }
    }

    // Update fragment boundary markers
    cy.nodes('.state').removeClass('fragment-start fragment-accept');
    step.snapshot.fragmentStarts.forEach(id => cy.getElementById(id).addClass('fragment-start'));
    step.snapshot.fragmentAccepts.forEach(id => cy.getElementById(id).addClass('fragment-accept'));

    // Fit view to currently visible elements
    cy.fit(cy.elements('[opacity > 0.5]'), 40);

    // Scroll log to current item
    const logItem = document.getElementById(`thompson-step-${stepIdx}`);
    logItem?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [stepIdx, steps, finalNfa]);

  // ─── Playback controls ────────────────────────────────────────────────────
  const stopPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsPlaying(false);
  }, []);

  const startPlay = useCallback(() => {
    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      setStepIdx(prev => {
        if (prev >= steps.length - 1) {
          stopPlay();
          return prev;
        }
        return prev + 1;
      });
    }, speed);
  }, [speed, steps.length, stopPlay]);

  // Re-create interval when speed changes mid-play
  useEffect(() => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setStepIdx(prev => {
          if (prev >= steps.length - 1) { stopPlay(); return prev; }
          return prev + 1;
        });
      }, speed);
    }
  }, [speed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup interval on unmount
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  useEffect(() => {
    if (!pendingAutoPlay || stepIdx !== 0 || steps.length === 0) return;
    setPendingAutoPlay(false);
    startPlay();
  }, [pendingAutoPlay, stepIdx, steps.length, startPlay]);

  function togglePlay() {
    if (isPlaying) {
      stopPlay();
    } else {
      if (stepIdx >= steps.length - 1) setStepIdx(0);
      startPlay();
    }
  }

  if (steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm italic">
        Convert a regex to see the step-by-step construction
      </div>
    );
  }

  const currentStep = steps[stepIdx];
  const rs = getRuleStyle(currentStep.rule);
  const postfixTokens = steps.map(s => s.token);

  return (
    <div className="flex flex-col gap-4">

      {/* ── Postfix token strip ── */}
      <div className="flex items-center gap-2 flex-wrap px-1">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mr-1">Postfix:</span>
        {postfixTokens.map((tok, i) => {
          const rs2 = getRuleStyle(steps[i].rule);
          const isActive = i === stepIdx;
          const isPast = i < stepIdx;
          return (
            <button
              key={i}
              id={`postfix-tok-${i}`}
              onClick={() => { stopPlay(); setStepIdx(i); }}
              className={`w-8 h-8 rounded-lg font-mono font-bold text-sm transition-all border ${
                isActive
                  ? `${rs2.badge} ${rs2.text} scale-110 shadow-lg`
                  : isPast
                  ? 'bg-slate-800/40 border-slate-700 text-slate-500'
                  : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-600'
              }`}
            >
              {tok === '·' ? '·' : tok}
            </button>
          );
        })}
      </div>

      {/* ── Main panel: log + graph ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">

        {/* Step Log */}
        <div className="flex flex-col gap-2">
          <div
            ref={logRef}
            className="h-72 lg:h-80 overflow-y-auto rounded-[6px] bg-slate-900/60 border border-[var(--border-subtle)] p-2 space-y-1 scroll-smooth"
          >
            {steps.map((step, i) => {
              const rs3 = getRuleStyle(step.rule);
              const isActive = i === stepIdx;
              const isPast = i < stepIdx;
              return (
                <button
                  key={i}
                  id={`thompson-step-${i}`}
                  onClick={() => { stopPlay(); setStepIdx(i); }}
                  className={`w-full text-left rounded-lg px-3 py-2 transition-all border ${
                    isActive
                      ? `${rs3.badge} border-opacity-100`
                      : isPast
                      ? 'bg-slate-800/30 border-slate-800 opacity-60'
                      : 'bg-slate-900/30 border-slate-900 opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isActive ? rs3.text + ' ' + rs3.badge : 'bg-slate-800 text-slate-500'
                    }`}>
                      {i}
                    </span>
                    <code className={`font-mono font-bold text-sm ${isActive ? rs3.text : 'text-slate-400'}`}>
                      {step.token === '·' ? '·' : step.token}
                    </code>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${isActive ? rs3.badge + ' ' + rs3.text : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                      {step.rule}
                    </span>
                  </div>
                  {isActive && (
                    <p className={`text-xs mt-1.5 leading-relaxed ${rs3.text} opacity-90`}>
                      {step.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Current step detail card */}
          <div className={`rounded-[6px] border p-3 ${rs.badge}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${rs.text}`}>Step {stepIdx}</span>
              <span className={`text-xs font-bold ${rs.text}`}>
                Token: <code className="font-mono" style={{fontFamily: 'var(--font-mono)'}}>{currentStep.token === '·' ? '·' : currentStep.token}</code>
              </span>
              <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-[2px] border ${rs.badge} ${rs.text}`}>
                {currentStep.rule}
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${rs.text} opacity-90`}>{currentStep.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
              {currentStep.newStateIds.length > 0 && (
                <span className="text-slate-400">New states: {currentStep.newStateIds.map(id => (
                  <code key={id} className={`ml-1 px-1 rounded-[2px] bg-slate-800 ${rs.text}`} style={{fontFamily: 'var(--font-mono)'}}>{id}</code>
                ))}</span>
              )}
              {currentStep.newTransitionKeys.length > 0 && (
                <span className="text-slate-400 mt-0.5 w-full">
                  New transitions: {currentStep.newTransitionKeys.map(k => (
                    <code key={k} className={`ml-1 px-1 rounded-[2px] bg-slate-800 ${rs.text} text-[9px]`} style={{fontFamily: 'var(--font-mono)'}}>{k}</code>
                  ))}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cytoscape graph */}
        <div className="rounded-[6px] bg-slate-900/40 border border-[var(--border-subtle)] overflow-hidden">
          <div className="px-4 py-2 border-b border-[var(--border-subtle)] flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-teal)]">ε-NFA (building…)</span>
            <span className="text-[11px] text-slate-500">
              {currentStep.snapshot.states.length} states · {currentStep.snapshot.transitions.length} transitions visible
            </span>
            {/* Legend */}
            <div className="ml-auto flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/>Start</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"/>Accept</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"/>New</span>
            </div>
          </div>
          <div ref={containerRef} className="h-72 lg:h-80 w-full" />
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => { stopPlay(); setStepIdx(s => Math.max(0, s - 1)); }}
          disabled={stepIdx === 0 || isPlaying}
          className="px-4 py-2 rounded-[2px] bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Prev
        </button>
        <button
          onClick={togglePlay}
          className={`px-4 py-2 rounded-[2px] text-sm font-semibold transition-colors ${
            isPlaying ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-[var(--accent-teal)] hover:bg-[var(--accent-teal-dark)] text-[var(--bg-primary)]'
          }`}
        >
          {isPlaying ? '⏸ Pause' : '▶ Auto-Play'}
        </button>
        <button
          onClick={() => { stopPlay(); setStepIdx(s => Math.min(steps.length - 1, s + 1)); }}
          disabled={stepIdx === steps.length - 1 || isPlaying}
          className="px-4 py-2 rounded-[2px] bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>

        {/* Speed slider */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Speed</span>
          <span className="text-xs text-slate-400 w-10 text-right" style={{fontFamily: 'var(--font-mono)'}}>{(speed / 1000).toFixed(1)}s</span>
          <input
            type="range"
            min={300}
            max={3000}
            step={100}
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className="w-28 cursor-pointer"
            style={{accentColor: 'var(--accent-teal)' as any}}
          />
          <div className="flex gap-1 text-[10px] text-slate-500">
            <span>fast</span>
            <span className="mx-1">·</span>
            <span>slow</span>
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={() => { stopPlay(); setStepIdx(0); }}
          className="px-3 py-2 rounded-[2px] bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm transition-colors"
        >
          ↺ Reset
        </button>
      </div>

      {/* Rule legend */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-[var(--border-subtle)]">
        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider self-center mr-1">Rules:</span>
        {Object.entries(RULE_STYLE).map(([rule, s]) => (
          <span key={rule} className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border ${s.badge} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {rule}
          </span>
        ))}
      </div>
    </div>
  );
}
