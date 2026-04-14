/**
 * Simulation logic for ε-NFA and DFA step-by-step string processing.
 */

import { NFA, DFA, SimulationResult, SimulationStep, DEAD_STATE_ID } from './types';
import { epsilonClosure, move } from './subset';

/**
 * Simulate an ε-NFA on a given input string step by step.
 * Returns one step per character consumed, plus an initial step (before any input).
 */
export function simulateNFA(nfa: NFA, input: string): SimulationResult {
  const steps: SimulationStep[] = [];

  // Initial state: ε-closure of start
  let currentStates = epsilonClosure([nfa.startState], nfa);

  steps.push({
    character: null,
    activeStates: [...currentStates],
    stepIndex: 0,
    activeEdge: null,
  });

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const prevStates = [...currentStates];

    if (currentStates.length === 1 && currentStates[0] === DEAD_STATE_ID) {
      steps.push({
        character: ch,
        activeStates: [DEAD_STATE_ID],
        stepIndex: i + 1,
        activeEdge: {
          from: DEAD_STATE_ID,
          to: DEAD_STATE_ID,
          symbol: ch,
          toDead: true,
        },
      });
      continue;
    }

    // Move on character, then take ε-closure.
    const moved = move(currentStates, ch, nfa);
    const closed = epsilonClosure(moved, nfa);

    if (closed.length === 0) {
      const from = prevStates[0] ?? nfa.startState;
      currentStates = [DEAD_STATE_ID];
      steps.push({
        character: ch,
        activeStates: [DEAD_STATE_ID],
        stepIndex: i + 1,
        activeEdge: {
          from,
          to: DEAD_STATE_ID,
          symbol: ch,
          toDead: true,
        },
        note: `No transition from ${from} on '${ch}' -> moved to dead state ${DEAD_STATE_ID}`,
      });
      continue;
    }

    currentStates = closed;

    steps.push({
      character: ch,
      activeStates: [...currentStates],
      stepIndex: i + 1,
      activeEdge: {
        from: prevStates[0] ?? currentStates[0],
        to: currentStates[0],
        symbol: ch,
      },
    });
  }

  const accepted = currentStates.some(s => nfa.acceptStates.includes(s));

  return { steps, accepted };
}

/**
 * Simulate a DFA on a given input string step by step.
 */
export function simulateDFA(dfa: DFA, input: string): SimulationResult {
  const steps: SimulationStep[] = [];

  let current = dfa.startState;

  steps.push({
    character: null,
    activeStates: [current],
    stepIndex: 0,
    activeEdge: null,
  });

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const prev = current;

    // Find DFA transition
    const transition = dfa.transitions.find(t => t.from === current && t.symbol === ch);

    if (transition) {
      current = transition.to;
    } else {
      current = DEAD_STATE_ID;
    }

    const movedToDead = prev !== DEAD_STATE_ID && current === DEAD_STATE_ID;

    steps.push({
      character: ch,
      activeStates: [current],
      stepIndex: i + 1,
      activeEdge: {
        from: prev,
        to: current,
        symbol: ch,
        toDead: current === DEAD_STATE_ID,
      },
      note: movedToDead
        ? `No transition from ${prev} on '${ch}' -> moved to dead state ${DEAD_STATE_ID}`
        : undefined,
    });
  }

  const accepted = current !== DEAD_STATE_ID && dfa.acceptStates.includes(current);

  return { steps, accepted };
}
