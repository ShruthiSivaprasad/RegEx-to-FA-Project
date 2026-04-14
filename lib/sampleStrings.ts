import { DFA, DEAD_STATE_ID } from './types';

export interface SampleString {
  value: string;
  accepted: boolean;
}

interface Edge {
  symbol: string;
  to: string;
  isDeadTransition: boolean;
}

function buildAdjacency(dfa: DFA): Map<string, Edge[]> {
  const map = new Map<string, Edge[]>();
  for (const state of dfa.states) {
    map.set(state.id, []);
  }
  for (const t of dfa.transitions) {
    if (!map.has(t.from)) map.set(t.from, []);
    map.get(t.from)!.push({
      symbol: t.symbol,
      to: t.to,
      isDeadTransition: Boolean(t.isDeadTransition || t.to === DEAD_STATE_ID || t.from === DEAD_STATE_ID),
    });
  }
  for (const edges of map.values()) {
    edges.sort((a, b) => a.symbol.localeCompare(b.symbol) || a.to.localeCompare(b.to));
  }
  return map;
}

function runDFA(dfa: DFA, input: string): string {
  let current = dfa.startState;
  for (const ch of input) {
    const transition = dfa.transitions.find(t => t.from === current && t.symbol === ch);
    if (!transition) return DEAD_STATE_ID;
    current = transition.to;
  }
  return current;
}

function isAccepted(dfa: DFA, input: string): boolean {
  const end = runDFA(dfa, input);
  return end !== DEAD_STATE_ID && dfa.acceptStates.includes(end);
}

function shortestFromStart(dfa: DFA, adj: Map<string, Edge[]>, maxLen: number): Map<string, string> {
  const best = new Map<string, string>();
  const queue: Array<{ state: string; str: string }> = [{ state: dfa.startState, str: '' }];
  best.set(dfa.startState, '');

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.str.length >= maxLen) continue;

    for (const e of adj.get(cur.state) ?? []) {
      if (e.to === DEAD_STATE_ID) continue;
      const nextStr = cur.str + e.symbol;
      const existing = best.get(e.to);
      if (existing === undefined || nextStr.length < existing.length || (nextStr.length === existing.length && nextStr < existing)) {
        best.set(e.to, nextStr);
        queue.push({ state: e.to, str: nextStr });
      }
    }
  }

  return best;
}

function shortestToAccept(dfa: DFA, adj: Map<string, Edge[]>, from: string, maxLen: number): string | null {
  const queue: Array<{ state: string; str: string }> = [{ state: from, str: '' }];
  const visited = new Set<string>([`${from}|`]);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.str.length > maxLen) continue;
    if (dfa.acceptStates.includes(cur.state) && cur.state !== DEAD_STATE_ID) return cur.str;

    for (const e of adj.get(cur.state) ?? []) {
      if (e.to === DEAD_STATE_ID) continue;
      const nextStr = cur.str + e.symbol;
      const key = `${e.to}|${nextStr}`;
      if (!visited.has(key) && nextStr.length <= maxLen) {
        visited.add(key);
        queue.push({ state: e.to, str: nextStr });
      }
    }
  }

  return null;
}

function enumerateAccepted(dfa: DFA, adj: Map<string, Edge[]>, maxLen: number, targetCount: number): string[] {
  const queue: Array<{ state: string; str: string }> = [{ state: dfa.startState, str: '' }];
  const visited = new Set<string>([`${dfa.startState}|`]);
  const accepted: string[] = [];

  while (queue.length > 0 && accepted.length < targetCount) {
    const cur = queue.shift()!;

    if (dfa.acceptStates.includes(cur.state) && cur.state !== DEAD_STATE_ID) {
      if (!accepted.includes(cur.str)) accepted.push(cur.str);
    }

    if (cur.str.length >= maxLen) continue;

    for (const e of adj.get(cur.state) ?? []) {
      if (e.to === DEAD_STATE_ID) continue;
      const nextStr = cur.str + e.symbol;
      const key = `${e.to}|${nextStr}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ state: e.to, str: nextStr });
      }
    }
  }

  return accepted;
}

function generateRejected(
  dfa: DFA,
  adj: Map<string, Edge[]>,
  acceptedStrings: string[],
  reachablePrefix: Map<string, string>
): string[] {
  const rejected: string[] = [];

  for (const s of acceptedStrings) {
    if (s.length === 0) continue;
    const oneShort = s.slice(0, -1);
    if (!isAccepted(dfa, oneShort) && !rejected.includes(oneShort)) {
      rejected.push(oneShort);
      break;
    }
  }

  for (const [state, prefix] of reachablePrefix.entries()) {
    if (state === DEAD_STATE_ID) continue;
    const toDead = (adj.get(state) ?? []).find(e => e.to === DEAD_STATE_ID);
    if (!toDead) continue;
    const deadString = prefix + toDead.symbol;
    if (!isAccepted(dfa, deadString) && !rejected.includes(deadString)) {
      rejected.push(deadString);
      break;
    }
  }

  if (rejected.length < 2) {
    const alphabet = [...dfa.alphabet].sort();
    const symbols = alphabet.length > 0 ? alphabet : ['a'];
    const queue = [''];
    while (queue.length > 0 && rejected.length < 2) {
      const cur = queue.shift()!;
      if (cur.length > 5) continue;
      if (!isAccepted(dfa, cur) && !rejected.includes(cur)) {
        rejected.push(cur);
      }
      if (cur.length < 5) {
        for (const sym of symbols) queue.push(cur + sym);
      }
    }
  }

  return rejected.slice(0, 2);
}

export function generateSampleStrings(dfa: DFA): SampleString[] {
  const adj = buildAdjacency(dfa);
  const acceptedSet = new Set<string>();

  const acceptedCandidates = enumerateAccepted(dfa, adj, 10, 12);
  if (acceptedCandidates.length > 0) acceptedSet.add(acceptedCandidates[0]);

  const first = acceptedCandidates[0] ?? '';
  const medium = acceptedCandidates.find(s => s.length >= Math.max(1, first.length + 1));
  if (medium !== undefined) acceptedSet.add(medium);

  const reach = shortestFromStart(dfa, adj, 8);
  let loopBased: string | null = null;

  for (const [state, prefix] of reach.entries()) {
    if (state === DEAD_STATE_ID) continue;
    const selfLoop = (adj.get(state) ?? []).find(e => e.to === state && e.symbol.length > 0);
    if (!selfLoop) continue;
    const suffix = shortestToAccept(dfa, adj, state, 8);
    if (suffix === null) continue;

    const candidate = prefix + selfLoop.symbol + suffix;
    if (isAccepted(dfa, candidate)) {
      loopBased = candidate;
      break;
    }
  }

  if (loopBased) acceptedSet.add(loopBased);

  for (const s of acceptedCandidates) {
    if (acceptedSet.size >= 3) break;
    acceptedSet.add(s);
  }

  const accepted = Array.from(acceptedSet).slice(0, 3);
  const rejected = generateRejected(dfa, adj, accepted, reach);

  return [
    ...accepted.map(value => ({ value, accepted: true })),
    ...rejected.map(value => ({ value, accepted: false })),
  ];
}
