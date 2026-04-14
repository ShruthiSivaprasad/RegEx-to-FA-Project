// Shared types for the RegExp to Automaton Converter

export const DEAD_STATE_ID = '∅';

export interface State {
  id: string;       // e.g. "q0", "q1"
  isStart: boolean;
  isAccept: boolean;
}

export interface Transition {
  from: string;   // state id
  to: string;     // state id
  symbol: string; // character or 'ε'
}

export interface NFA {
  states: State[];
  transitions: Transition[];
  startState: string;
  acceptStates: string[];
  alphabet: string[]; // non-epsilon symbols
}

export interface ActiveEdge {
  from: string;
  to: string;
  symbol: string;
  toDead?: boolean;
}

export interface DFAState {
  id: string;        // e.g. "D0"
  nfaStates: string[]; // the NFA states this DFA state represents
  isStart: boolean;
  isAccept: boolean;
}

export interface DFATransition {
  from: string;
  to: string;
  symbol: string;
  isDeadTransition?: boolean;
}

export interface DFA {
  states: DFAState[];
  transitions: DFATransition[];
  startState: string;
  acceptStates: string[];
  alphabet: string[];
}

export interface SimulationStep {
  character: string | null; // null means initial step
  activeStates: string[];   // for NFA: set of states; for DFA: single state id
  stepIndex: number;
  activeEdge?: ActiveEdge | null;
  note?: string;
}

export interface ThompsonStep {
  stepIndex: number;
  token: string;           // postfix token processed (e.g. 'a', '|', '*')
  rule: string;            // human-readable rule name
  description: string;     // explanation of what this step does
  snapshot: {
    states: State[];
    transitions: Transition[];
    fragmentStarts: string[];  // start state id of each current stack fragment
    fragmentAccepts: string[]; // accept state id of each current stack fragment
  };
  newStateIds: string[];
  newTransitionKeys: string[]; // format: "from→symbol→to"
}

export interface SimulationResult {
  steps: SimulationStep[];
  accepted: boolean;
}
