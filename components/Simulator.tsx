'use client';

import { useState, useRef, useEffect } from 'react';
import { NFA, DFA, SimulationResult, ActiveEdge } from '@/lib/types';
import { simulateNFA, simulateDFA } from '@/lib/simulate';

interface SimulatorProps {
  nfa: NFA | null;
  dfa: DFA | null;
  onNFAStep: (activeStates: string[]) => void;
  onDFAStep: (activeState: string) => void;
  onNFAEdge: (edge: ActiveEdge | null) => void;
  onDFAEdge: (edge: ActiveEdge | null) => void;
}

export default function Simulator({ nfa, dfa, onNFAStep, onDFAStep, onNFAEdge, onDFAEdge }: SimulatorProps) {
  const [inputStr, setInputStr] = useState('');
  const [mode, setMode] = useState<'nfa' | 'dfa'>('dfa');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const disabled = !nfa && !dfa;

  // Compute simulation whenever input / mode changes
  function runSim() {
    if (mode === 'nfa' && nfa) {
      const r = simulateNFA(nfa, inputStr);
      setResult(r);
      setStepIndex(0);
    } else if (mode === 'dfa' && dfa) {
      const r = simulateDFA(dfa, inputStr);
      setResult(r);
      setStepIndex(0);
    }
  }

  // Propagate active-state highlights when step changes
  useEffect(() => {
    if (!result) {
      onNFAStep([]);
      onDFAStep('');
      onNFAEdge(null);
      onDFAEdge(null);
      return;
    }
    const step = result.steps[stepIndex];
    if (!step) return;

    if (mode === 'nfa') {
      onNFAStep(step.activeStates);
      onDFAStep('');
      onNFAEdge(step.activeEdge ?? null);
      onDFAEdge(null);
    } else {
      onNFAStep([]);
      onDFAStep(step.activeStates[0] || '');
      onDFAEdge(step.activeEdge ?? null);
      onNFAEdge(null);
    }
  }, [stepIndex, result, mode, onNFAStep, onDFAStep, onNFAEdge, onDFAEdge]);

  // Stop auto-play on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, []);

  function stopPlay() {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    setIsPlaying(false);
  }

  function startPlay() {
    if (!result) return;
    setIsPlaying(true);
    playIntervalRef.current = setInterval(() => {
      setStepIndex(prev => {
        if (prev >= result.steps.length - 1) {
          stopPlay();
          return prev;
        }
        return prev + 1;
      });
    }, 800);
  }

  function togglePlay() {
    if (isPlaying) {
      stopPlay();
    } else {
      if (result && stepIndex >= result.steps.length - 1) {
        setStepIndex(0);
      }
      startPlay();
    }
  }

  const currentStep = result?.steps[stepIndex];
  const totalSteps = result?.steps.length ?? 0;
  const isAccepted = result?.accepted;

  const canGoBack = stepIndex > 0;
  const canGoForward = result !== null && stepIndex < totalSteps - 1;

  return (
    <div className="space-y-5">
      {/* Mode + Input Row */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Mode toggle */}
        <div className="flex rounded-[2px] overflow-hidden border border-[var(--border-subtle)]">
          <button
            onClick={() => { setMode('dfa'); setResult(null); stopPlay(); }}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              mode === 'dfa'
                ? 'bg-[var(--accent-teal)] text-[var(--bg-primary)]'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            DFA
          </button>
          <button
            onClick={() => { setMode('nfa'); setResult(null); stopPlay(); }}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              mode === 'nfa'
                ? 'bg-[var(--accent-teal)] text-[var(--bg-primary)]'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            ε-NFA
          </button>
        </div>

        {/* Input field */}
        <div className="flex-1 min-w-48">
          <label className="block text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wide">
            Input String
          </label>
          <input
            type="text"
            value={inputStr}
            onChange={e => { setInputStr(e.target.value); setResult(null); stopPlay(); }}
            placeholder="Type string to simulate…"
            disabled={disabled}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[2px] px-3 py-2 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-teal)] disabled:opacity-40"
            style={{fontFamily: 'var(--font-mono)'}}
          />
        </div>

        {/* Simulate button */}
        <button
          onClick={runSim}
          disabled={disabled}
          className="px-5 py-2 rounded-[2px] bg-[var(--accent-teal)] hover:bg-[var(--accent-teal-dark)] text-[var(--bg-primary)] font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg border border-[var(--accent-teal)]"
          style={{fontFamily: 'var(--font-mono)'}}
        >
          Simulate
        </button>
      </div>

      {/* Simulation controls */}
      {result && (
        <div className="space-y-4">
          {/* Character strip */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-slate-400 mr-2 font-semibold uppercase tracking-wider">
              Input:
            </span>
            <div
              className="px-3 py-1.5 rounded-[2px] bg-slate-800 border border-[var(--border-subtle)] text-sm text-emerald-300 tracking-widest"
              style={{fontFamily: 'var(--font-mono)'}}
            >
              {inputStr === '' ? (
                <span className="text-slate-500 italic text-xs">ε (empty string)</span>
              ) : (
                inputStr.split('').map((ch, i) => (
                  <span
                    key={i}
                    className={`inline-block transition-colors px-0.5 ${
                      stepIndex > 0 && i === stepIndex - 1
                        ? 'bg-[var(--accent-teal)] text-[var(--bg-primary)] rounded-[2px]'
                        : stepIndex > 0 && i < stepIndex - 1
                        ? 'text-slate-500'
                        : 'text-emerald-300'
                    }`}
                  >
                    {ch}
                  </span>
                ))
              )}
            </div>

            {/* Step counter */}
            <span className="ml-auto text-xs text-slate-400" style={{fontFamily: 'var(--font-mono)'}}>
              Step {stepIndex} / {totalSteps - 1}
            </span>
          </div>

          {/* Active state display */}
          <div className="rounded-[6px] bg-slate-800/60 border border-[var(--border-subtle)] p-3">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2" style={{fontFamily: 'var(--font-mono)'}}>
              {currentStep?.character === null
                ? 'Initial states (after ε-closure)'
                : `After reading "${currentStep?.character}"`}
            </div>
            <div className="flex flex-wrap gap-2">
              {currentStep?.activeStates.length === 0 ? (
                <span className="px-2 py-1 rounded bg-red-900/40 border border-red-700 text-red-400 text-xs font-mono font-semibold">
                  ∅ dead state
                </span>
              ) : (
                currentStep?.activeStates.map(s => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-[4px] bg-[var(--accent-teal)]/20 border border-[var(--accent-teal)]/50 text-[var(--accent-teal)] text-xs font-bold"
                    style={{fontFamily: 'var(--font-mono)'}}
                  >
                    {s}
                  </span>
                ))
              )}
            </div>
            {currentStep?.note && (
              <p
                className="mt-2 text-xs text-amber-300"
                style={{fontFamily: 'var(--font-mono)'}}
              >
                {currentStep.note}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStepIndex(s => Math.max(0, s - 1))}
              disabled={!canGoBack || isPlaying}
              className="px-4 py-2 rounded-[2px] bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={togglePlay}
              className={`px-4 py-2 rounded-[2px] text-sm font-semibold transition-colors ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-[var(--accent-teal)] hover:bg-[var(--accent-teal-dark)] text-[var(--bg-primary)]'
              }`}
            >
              {isPlaying ? '⏸ Pause' : '▶ Auto-Play'}
            </button>
            <button
              onClick={() => setStepIndex(s => Math.min(totalSteps - 1, s + 1))}
              disabled={!canGoForward || isPlaying}
              className="px-4 py-2 rounded-[2px] bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>

            {/* Reset */}
            <button
              onClick={() => { setStepIndex(0); stopPlay(); }}
              className="ml-auto px-3 py-2 rounded-[2px] bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm transition-colors"
            >
              ↺ Reset
            </button>
          </div>

          {/* Final result badge - shows only on last step */}
          {stepIndex === totalSteps - 1 && (
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-[6px] border ${
                isAccepted
                  ? 'bg-emerald-900/30 border-emerald-600 text-emerald-400'
                  : 'bg-red-900/30 border-red-700 text-red-400'
              }`}
            >
              <span className="text-2xl">{isAccepted ? '✅' : '❌'}</span>
              <div>
                <div className="font-bold text-sm">
                  {isAccepted ? 'String ACCEPTED' : 'String REJECTED'}
                </div>
                <div className="text-xs opacity-75">
                  {isAccepted
                    ? `"${inputStr}" is in the language of this automaton.`
                    : `"${inputStr}" is NOT in the language of this automaton.`}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
