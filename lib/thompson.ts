/**
 * Thompson's Construction
 * Converts postfix regex to an ε-NFA.
 */

import { NFA, State, Transition, ThompsonStep } from './types';

let stateCounter = 0;

function newState(isStart = false, isAccept = false): State {
  return { id: `q${stateCounter++}`, isStart, isAccept };
}

function resetCounter() {
  stateCounter = 0;
}

interface NFAFragment {
  start: string;
  accept: string;
  states: State[];
  transitions: Transition[];
}

function makeFragment(start: State, accept: State, transitions: Transition[] = []): NFAFragment {
  return { start: start.id, accept: accept.id, states: [start, accept], transitions };
}

function epsilonTransition(from: string, to: string): Transition {
  return { from, to, symbol: 'ε' };
}

/**
 * Build NFA from postfix notation using Thompson's Construction.
 */
export function buildNFA(postfix: string): NFA {
  resetCounter();

  const stack: NFAFragment[] = [];
  const alphabet = new Set<string>();

  for (const token of postfix) {
    switch (token) {
      case '·': {
        // Concatenation: pop two fragments, connect first accept → second start via ε
        const right = stack.pop();
        const left = stack.pop();
        if (!left || !right) throw new Error('Invalid postfix: not enough operands for ·');

        const states = [...left.states, ...right.states];
        const transitions: Transition[] = [
          ...left.transitions,
          ...right.transitions,
          epsilonTransition(left.accept, right.start),
        ];

        // The accept state of left is no longer an accept state in the combined NFA
        const startState = left.start;
        const acceptState = right.accept;

        stack.push({ start: startState, accept: acceptState, states, transitions });
        break;
      }

      case '|': {
        // Union: new start/accept with ε transitions to/from sub-NFAs
        const right = stack.pop();
        const left = stack.pop();
        if (!left || !right) throw new Error('Invalid postfix: not enough operands for |');

        const newStart = newState();
        const newAccept = newState();

        const states = [newStart, newAccept, ...left.states, ...right.states];
        const transitions: Transition[] = [
          ...left.transitions,
          ...right.transitions,
          epsilonTransition(newStart.id, left.start),
          epsilonTransition(newStart.id, right.start),
          epsilonTransition(left.accept, newAccept.id),
          epsilonTransition(right.accept, newAccept.id),
        ];

        stack.push({ start: newStart.id, accept: newAccept.id, states, transitions });
        break;
      }

      case '*': {
        // Kleene star: new start/accept, ε-loop, ε-skip
        const frag = stack.pop();
        if (!frag) throw new Error('Invalid postfix: not enough operands for *');

        const newStart = newState();
        const newAccept = newState();

        const states = [newStart, newAccept, ...frag.states];
        const transitions: Transition[] = [
          ...frag.transitions,
          epsilonTransition(newStart.id, frag.start),       // start → frag
          epsilonTransition(newStart.id, newAccept.id),     // skip (zero times)
          epsilonTransition(frag.accept, frag.start),       // loop back
          epsilonTransition(frag.accept, newAccept.id),     // exit loop
        ];

        stack.push({ start: newStart.id, accept: newAccept.id, states, transitions });
        break;
      }

      case '+': {
        // Plus: like star but must match at least once (no initial skip)
        const frag = stack.pop();
        if (!frag) throw new Error('Invalid postfix: not enough operands for +');

        const newStart = newState();
        const newAccept = newState();

        const states = [newStart, newAccept, ...frag.states];
        const transitions: Transition[] = [
          ...frag.transitions,
          epsilonTransition(newStart.id, frag.start),    // must enter frag at least once
          epsilonTransition(frag.accept, frag.start),    // loop back
          epsilonTransition(frag.accept, newAccept.id),  // exit loop
        ];

        stack.push({ start: newStart.id, accept: newAccept.id, states, transitions });
        break;
      }

      case '?': {
        // Optional: new start/accept, ε-skip
        const frag = stack.pop();
        if (!frag) throw new Error('Invalid postfix: not enough operands for ?');

        const newStart = newState();
        const newAccept = newState();

        const states = [newStart, newAccept, ...frag.states];
        const transitions: Transition[] = [
          ...frag.transitions,
          epsilonTransition(newStart.id, frag.start),    // enter frag
          epsilonTransition(newStart.id, newAccept.id),  // skip
          epsilonTransition(frag.accept, newAccept.id),  // exit
        ];

        stack.push({ start: newStart.id, accept: newAccept.id, states, transitions });
        break;
      }

      default: {
        // Literal character
        alphabet.add(token);
        const s = newState();
        const a = newState();
        const transitions: Transition[] = [{ from: s.id, to: a.id, symbol: token }];
        stack.push(makeFragment(s, a, transitions));
        break;
      }
    }
  }

  if (stack.length !== 1) {
    throw new Error('Invalid postfix: too many operands');
  }

  const final = stack[0];

  // Mark start and accept states
  const states: State[] = final.states.map(st => ({
    ...st,
    isStart: st.id === final.start,
    isAccept: st.id === final.accept,
  }));

  return {
    states,
    transitions: final.transitions,
    startState: final.start,
    acceptStates: [final.accept],
    alphabet: Array.from(alphabet).sort(),
  };
}

// ─── buildNFAWithSteps ────────────────────────────────────────────────────────
// Same as buildNFA but emits a ThompsonStep for each postfix token processed.
// Because Thompson's construction only ever adds states, every intermediate state
// also appears in the final NFA — positions can be pre-computed once from the final.

function tKey(t: Transition): string {
  return `${t.from}→${t.symbol}→${t.to}`;
}

export function buildNFAWithSteps(postfix: string): { nfa: NFA; steps: ThompsonStep[] } {
  resetCounter();
  const stack: NFAFragment[] = [];
  const alphabet = new Set<string>();
  const steps: ThompsonStep[] = [];

  function captureStep(
    token: string,
    rule: string,
    description: string,
    newStates: State[],
    newTransitions: Transition[],
  ) {
    const stateMap = new Map<string, State>();
    const transMap = new Map<string, Transition>();
    const fragmentStarts: string[] = [];
    const fragmentAccepts: string[] = [];
    for (const frag of stack) {
      for (const s of frag.states) stateMap.set(s.id, s);
      for (const t of frag.transitions) transMap.set(tKey(t), t);
      fragmentStarts.push(frag.start);
      fragmentAccepts.push(frag.accept);
    }
    steps.push({
      stepIndex: steps.length,
      token,
      rule,
      description,
      snapshot: {
        states: Array.from(stateMap.values()),
        transitions: Array.from(transMap.values()),
        fragmentStarts,
        fragmentAccepts,
      },
      newStateIds: newStates.map(s => s.id),
      newTransitionKeys: newTransitions.map(tKey),
    });
  }

  for (const token of postfix) {
    switch (token) {
      case '·': {
        const right = stack.pop();
        const left = stack.pop();
        if (!left || !right) throw new Error('Invalid postfix: not enough operands for ·');
        const epsT = epsilonTransition(left.accept, right.start);
        stack.push({
          start: left.start,
          accept: right.accept,
          states: [...left.states, ...right.states],
          transitions: [...left.transitions, ...right.transitions, epsT],
        });
        captureStep(
          '·', 'Concatenation Rule',
          `Connect left accept (${left.accept}) → right start (${right.start}) via ε. Combined fragment: ${left.start} → ${right.accept}.`,
          [], [epsT],
        );
        break;
      }
      case '|': {
        const right = stack.pop();
        const left = stack.pop();
        if (!left || !right) throw new Error('Invalid postfix: not enough operands for |');
        const ns = newState(); const na = newState();
        const t1 = epsilonTransition(ns.id, left.start);
        const t2 = epsilonTransition(ns.id, right.start);
        const t3 = epsilonTransition(left.accept, na.id);
        const t4 = epsilonTransition(right.accept, na.id);
        stack.push({
          start: ns.id, accept: na.id,
          states: [ns, na, ...left.states, ...right.states],
          transitions: [...left.transitions, ...right.transitions, t1, t2, t3, t4],
        });
        captureStep(
          '|', 'Union Rule',
          `Add new start ${ns.id} and accept ${na.id}. Branch: ${ns.id}→${left.start} and ${ns.id}→${right.start} via ε. Merge: ${left.accept}→${na.id} and ${right.accept}→${na.id} via ε.`,
          [ns, na], [t1, t2, t3, t4],
        );
        break;
      }
      case '*': {
        const frag = stack.pop();
        if (!frag) throw new Error('Invalid postfix: not enough operands for *');
        const ns = newState(); const na = newState();
        const t1 = epsilonTransition(ns.id, frag.start);
        const t2 = epsilonTransition(ns.id, na.id);
        const t3 = epsilonTransition(frag.accept, frag.start);
        const t4 = epsilonTransition(frag.accept, na.id);
        stack.push({
          start: ns.id, accept: na.id,
          states: [ns, na, ...frag.states],
          transitions: [...frag.transitions, t1, t2, t3, t4],
        });
        captureStep(
          '*', 'Kleene Star Rule',
          `Add new start ${ns.id} and accept ${na.id}. Skip (zero): ${ns.id}→${na.id}. Enter: ${ns.id}→${frag.start}. Loop: ${frag.accept}→${frag.start}. Exit: ${frag.accept}→${na.id}.`,
          [ns, na], [t1, t2, t3, t4],
        );
        break;
      }
      case '+': {
        const frag = stack.pop();
        if (!frag) throw new Error('Invalid postfix: not enough operands for +');
        const ns = newState(); const na = newState();
        const t1 = epsilonTransition(ns.id, frag.start);
        const t2 = epsilonTransition(frag.accept, frag.start);
        const t3 = epsilonTransition(frag.accept, na.id);
        stack.push({
          start: ns.id, accept: na.id,
          states: [ns, na, ...frag.states],
          transitions: [...frag.transitions, t1, t2, t3],
        });
        captureStep(
          '+', 'Plus Rule',
          `Add new start ${ns.id} and accept ${na.id}. Must enter: ${ns.id}→${frag.start}. Loop: ${frag.accept}→${frag.start}. Exit: ${frag.accept}→${na.id}. No skip — must match ≥1 time.`,
          [ns, na], [t1, t2, t3],
        );
        break;
      }
      case '?': {
        const frag = stack.pop();
        if (!frag) throw new Error('Invalid postfix: not enough operands for ?');
        const ns = newState(); const na = newState();
        const t1 = epsilonTransition(ns.id, frag.start);
        const t2 = epsilonTransition(ns.id, na.id);
        const t3 = epsilonTransition(frag.accept, na.id);
        stack.push({
          start: ns.id, accept: na.id,
          states: [ns, na, ...frag.states],
          transitions: [...frag.transitions, t1, t2, t3],
        });
        captureStep(
          '?', 'Optional Rule',
          `Add new start ${ns.id} and accept ${na.id}. Enter: ${ns.id}→${frag.start}. Bypass (zero): ${ns.id}→${na.id}. Exit: ${frag.accept}→${na.id}.`,
          [ns, na], [t1, t2, t3],
        );
        break;
      }
      default: {
        alphabet.add(token);
        const s = newState(); const a = newState();
        const t: Transition = { from: s.id, to: a.id, symbol: token };
        stack.push(makeFragment(s, a, [t]));
        captureStep(
          token, 'Literal Rule',
          `Create a 2-state fragment: ${s.id} –[${token}]→ ${a.id}.`,
          [s, a], [t],
        );
        break;
      }
    }
  }

  if (stack.length !== 1) throw new Error('Invalid postfix: too many operands');
  const final = stack[0];
  const nfa: NFA = {
    states: final.states.map(st => ({
      ...st,
      isStart: st.id === final.start,
      isAccept: st.id === final.accept,
    })),
    transitions: final.transitions,
    startState: final.start,
    acceptStates: [final.accept],
    alphabet: Array.from(alphabet).sort(),
  };
  return { nfa, steps };
}
