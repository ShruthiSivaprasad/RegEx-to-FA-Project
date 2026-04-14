'use client';

import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
// @ts-ignore
import dagre from 'cytoscape-dagre';
import { DFA, ActiveEdge, DEAD_STATE_ID } from '@/lib/types';

if (typeof window !== 'undefined') {
  try {
    cytoscape.use(dagre);
  } catch {
    // already registered
  }
}

interface DFAGraphProps {
  dfa: DFA | null;
  activeState?: string;
  activeEdge?: ActiveEdge | null;
}

export default function DFAGraph({ dfa, activeState, activeEdge = null }: DFAGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!containerRef.current || !dfa) return;

    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    const elements: cytoscape.ElementDefinition[] = [];

    // Dummy start node
    elements.push({
      data: { id: '__dstart__', label: '' },
      classes: 'dummy-start',
    });

    // DFA states
    for (const state of dfa.states) {
      let classes = 'state';
      if (state.id === DEAD_STATE_ID) classes += ' dead-state';
      if (state.isStart) classes += ' start-state';
      if (state.isAccept) classes += ' accept-state';
      const nfaLabel = `{${state.nfaStates.join(',')}}`;
      elements.push({
        data: { id: state.id, label: state.id, nfaStates: nfaLabel },
        classes,
      });
    }

    // Start arrow
    elements.push({
      data: { id: '__dstart_edge__', source: '__dstart__', target: dfa.startState, label: '' },
      classes: 'start-edge',
    });

    // Merge parallel edges (shouldn't happen in DFA, but just in case)
    const edgeGroups = new Map<string, string[]>();
    for (const t of dfa.transitions) {
      const key = `${t.from}→${t.to}`;
      if (!edgeGroups.has(key)) edgeGroups.set(key, []);
      edgeGroups.get(key)!.push(t.symbol);
    }

    let edgeIdx = 0;
    for (const [key, symbols] of edgeGroups.entries()) {
      const [from, to] = key.split('→');
      const isSelf = from === to;
      elements.push({
        data: {
          id: `de${edgeIdx++}`,
          source: from,
          target: to,
          label: symbols.join(', '),
          toDead: to === DEAD_STATE_ID || from === DEAD_STATE_ID,
        },
        classes: isSelf
          ? (from === DEAD_STATE_ID ? 'dead-self-loop' : 'self-loop')
          : (to === DEAD_STATE_ID || from === DEAD_STATE_ID ? 'dead-transition-edge' : 'edge'),
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
            width: 52,
            height: 52,
            'font-family': 'JetBrains Mono, monospace',
          },
        },
        {
          selector: 'node.dead-state',
          style: {
            'background-color': '#111827',
            'border-color': '#6b7280',
            'border-style': 'dashed',
            'border-width': 2,
            color: '#9ca3af',
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': 12,
            width: 42,
            height: 42,
            'font-family': 'JetBrains Mono, monospace',
          },
        },
        {
          selector: 'node.start-state',
          style: {
            'background-color': '#064e3b',
            'border-color': '#34d399',
            'border-width': 3,
          },
        },
        {
          selector: 'node.accept-state',
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
          selector: 'node.active',
          style: {
            'background-color': '#0d9d8f',
            'border-color': '#0FFFC1',
            'border-width': 3,
          },
        },
        {
          selector: 'node.dummy-start',
          style: {
            width: 1,
            height: 1,
            opacity: 0,
            label: '',
          },
        },
        {
          selector: 'edge.start-edge',
          style: {
            'line-color': '#34d399',
            'target-arrow-color': '#34d399',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            width: 2,
            label: '',
          },
        },
        {
          selector: 'edge.edge',
          style: {
            'line-color': '#475569',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': 12,
            color: '#94a3b8',
            'text-background-color': '#0a0c18',
            'text-background-opacity': 0.85,
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
            'text-background-opacity': 0.85,
            'text-background-padding': '3px',
            width: 2,
            'font-family': 'JetBrains Mono, monospace',
          },
        },
        {
          selector: 'edge.dead-transition-edge',
          style: {
            'line-color': '#64748b',
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            'line-style': 'dashed',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': 12,
            color: '#94a3b8',
            'text-background-color': '#0a0c18',
            'text-background-opacity': 0.8,
            'text-background-padding': '3px',
            width: 1.5,
            'font-family': 'JetBrains Mono, monospace',
          },
        },
        {
          selector: 'edge.dead-self-loop',
          style: {
            'curve-style': 'bezier',
            'loop-direction': '-35deg',
            'loop-sweep': '-35deg',
            'line-color': '#64748b',
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            'line-style': 'dashed',
            label: 'data(label)',
            'font-size': 11,
            color: '#94a3b8',
            'text-background-color': '#0a0c18',
            'text-background-opacity': 0.8,
            'text-background-padding': '2px',
            width: 1.5,
            'font-family': 'JetBrains Mono, monospace',
          },
        },
        {
          selector: 'edge.active-edge',
          style: {
            'line-color': '#0FFFC1',
            'target-arrow-color': '#0FFFC1',
            width: 3,
          },
        },
        {
          selector: 'edge.dead-active-edge',
          style: {
            'line-color': '#0FFFC1',
            'target-arrow-color': '#0FFFC1',
            'target-arrow-shape': 'triangle',
            'line-style': 'dashed',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': 12,
            color: '#cbd5e1',
            'text-background-color': '#0a0c18',
            'text-background-opacity': 0.9,
            'text-background-padding': '3px',
            width: 3,
            'font-family': 'JetBrains Mono, monospace',
          },
        },
      ],
      layout: {
        name: 'dagre',
        rankDir: 'LR',
        nodeSep: 60,
        rankSep: 90,
        padding: 30,
      } as any,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cyRef.current = cy;

    const positionDeadNode = () => {
      const deadNode = cy.getElementById(DEAD_STATE_ID);
      if (deadNode.empty()) return;
      const nonDeadNodes = cy.nodes().filter(node => node.id() !== DEAD_STATE_ID);
      if (nonDeadNodes.nonempty()) {
        cy.fit(nonDeadNodes, 30);
      }
      const extent = cy.extent();
      deadNode.unlock();
      deadNode.position({ x: extent.x2 - 32, y: extent.y2 - 32 });
      deadNode.lock();
    };

    positionDeadNode();

    // Re-fit on container resize
    if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
    resizeObserverRef.current = new ResizeObserver(() => {
      cy.resize();
      positionDeadNode();
    });
    resizeObserverRef.current.observe(containerRef.current);

    return () => {
      resizeObserverRef.current?.disconnect();
      cy.destroy();
      cyRef.current = null;
    };
  }, [dfa]);

  // Highlight active DFA state
  useEffect(() => {
    if (!cyRef.current || !dfa) return;
    const cy = cyRef.current;
    cy.nodes('.state').removeClass('active');
    cy.nodes('.dead-state').removeClass('active');
    if (activeState) {
      cy.getElementById(activeState).addClass('active');
    }

    cy.remove('#__dead_active_edge__');
    if (activeEdge && activeEdge.to === DEAD_STATE_ID) {
      cy.add({
        data: {
          id: '__dead_active_edge__',
          source: activeEdge.from,
          target: activeEdge.to,
          label: activeEdge.symbol,
        },
        classes: 'dead-active-edge',
      });
    }
  }, [activeState, activeEdge, dfa]);

  if (!dfa) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm italic">
        No DFA built yet
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}
