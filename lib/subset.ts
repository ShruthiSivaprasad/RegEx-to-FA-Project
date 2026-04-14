/**
 * Subset Construction (Powerset Construction)
 * Converts ε-NFA to DFA.
 */

import { NFA, DFA, DFAState, DFATransition, DEAD_STATE_ID } from './types';

/**
 * Compute the ε-closure of a set of NFA states.
 * Returns all states reachable via ε-transitions from the given set.
 */
export function epsilonClosure(states: string[], nfa: NFA): string[] {
  const closure = new Set<string>(states);
  const stack = [...states];

  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const t of nfa.transitions) {
      if (t.from === current && t.symbol === 'ε' && !closure.has(t.to)) {
        closure.add(t.to);
        stack.push(t.to);
      }
    }
  }

  return Array.from(closure).sort();
}

/**
 * Compute the set of NFA states reachable from a given NFA-state set
 * by consuming a single symbol, then taking ε-closure.
 */
export function move(states: string[], symbol: string, nfa: NFA): string[] {
  const reachable = new Set<string>();
  for (const state of states) {
    for (const t of nfa.transitions) {
      if (t.from === state && t.symbol === symbol) {
        reachable.add(t.to);
      }
    }
  }
  return Array.from(reachable);
}

/**
 * Build a DFA from an ε-NFA using the Subset Construction algorithm.
 */
export function buildDFA(nfa: NFA): DFA {
  const alphabet = nfa.alphabet; // already excludes ε

  // Map from sorted NFA-state-set key → DFA state id
  const stateMap = new Map<string, string>();
  const dfaStates: DFAState[] = [];
  const dfaTransitions: DFATransition[] = [];

  let dfaCounter = 0;

  function getOrCreate(nfaStates: string[]): string {
    const key = nfaStates.slice().sort().join(',');
    if (stateMap.has(key)) return stateMap.get(key)!;

    const id = `D${dfaCounter++}`;
    stateMap.set(key, id);

    const isStart = nfaStates.includes(nfa.startState) && dfaCounter === 1;
    const isAccept = nfaStates.some(s => nfa.acceptStates.includes(s));

    dfaStates.push({
      id,
      nfaStates: nfaStates.slice().sort(),
      isStart: false, // will set below
      isAccept,
    });

    return id;
  }

  // Start: ε-closure of the NFA's start state
  const startClosure = epsilonClosure([nfa.startState], nfa);
  const startId = `D0`;
  stateMap.set(startClosure.sort().join(','), startId);
  dfaStates.push({
    id: startId,
    nfaStates: startClosure.sort(),
    isStart: true,
    isAccept: startClosure.some(s => nfa.acceptStates.includes(s)),
  });
  dfaCounter = 1;

  // BFS over DFA states
  const queue: string[][] = [startClosure];

  while (queue.length > 0) {
    const currentSet = queue.shift()!;
    const currentId = stateMap.get(currentSet.slice().sort().join(','))!;

    for (const symbol of alphabet) {
      const moved = move(currentSet, symbol, nfa);
      if (moved.length === 0) continue; // dead state; skip (no transition added)

      const closed = epsilonClosure(moved, nfa).sort();
      const key = closed.join(',');

      if (!stateMap.has(key)) {
        const newId = `D${dfaCounter++}`;
        stateMap.set(key, newId);
        const isAccept = closed.some(s => nfa.acceptStates.includes(s));
        dfaStates.push({
          id: newId,
          nfaStates: closed,
          isStart: false,
          isAccept,
        });
        queue.push(closed);
      }

      dfaTransitions.push({
        from: currentId,
        to: stateMap.get(key)!,
        symbol,
        isDeadTransition: false,
      });
    }
  }

  // Completion pass: every DFA state must have one transition per symbol.
  // Missing transitions are directed to a shared dead state.
  if (!dfaStates.some(s => s.id === DEAD_STATE_ID)) {
    dfaStates.push({
      id: DEAD_STATE_ID,
      nfaStates: [],
      isStart: false,
      isAccept: false,
    });
  }

  const pairToTransition = new Map<string, DFATransition>();
  for (const t of dfaTransitions) {
    pairToTransition.set(`${t.from}|${t.symbol}`, t);
  }

  for (const state of dfaStates) {
    for (const symbol of alphabet) {
      const key = `${state.id}|${symbol}`;
      if (!pairToTransition.has(key)) {
        const to = DEAD_STATE_ID;
        const added: DFATransition = {
          from: state.id,
          to,
          symbol,
          isDeadTransition: true,
        };
        dfaTransitions.push(added);
        pairToTransition.set(key, added);
      }
    }
  }

  const acceptStates = dfaStates.filter(s => s.isAccept).map(s => s.id);

  return {
    states: dfaStates,
    transitions: dfaTransitions,
    startState: startId,
    acceptStates,
    alphabet,
  };
}
