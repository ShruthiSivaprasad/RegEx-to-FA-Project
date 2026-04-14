'use client';

import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
// @ts-ignore
import dagre from 'cytoscape-dagre';
import { NFA, ActiveEdge, DEAD_STATE_ID } from '@/lib/types';

if (typeof window !== 'undefined') {
  try {
    cytoscape.use(dagre);
  } catch {
    // already registered
  }
}

interface NFAGraphProps {
  nfa: NFA | null;
  activeStates?: string[];
  activeEdge?: ActiveEdge | null;
}

export default function NFAGraph({ nfa, activeStates = [], activeEdge = null }: NFAGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const initialViewRef = useRef<{ zoom: number; pan: { x: number; y: number } } | null>(null);

  useEffect(() => {
    if (!containerRef.current || !nfa) return;

    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    const elements: cytoscape.ElementDefinition[] = [];

    // Add a hidden dummy start node and arrow to mark the start state
    elements.push({
      data: { id: '__start__', label: '' },
      classes: 'dummy-start',
    });

    // Add states
    for (const state of nfa.states) {
      let classes = 'state';
      if (state.isStart) classes += ' start-state';
      if (state.isAccept) classes += ' accept-state';
      elements.push({
        data: { id: state.id, label: state.id },
        classes,
      });
    }

    // Arrow from dummy to start state
    elements.push({
      data: { id: '__start_edge__', source: '__start__', target: nfa.startState, label: '' },
      classes: 'start-edge',
    });

    // Permanent dead/trap state (always visible, positioned after layout)
    elements.push({
      data: { id: DEAD_STATE_ID, label: DEAD_STATE_ID },
      classes: 'dead-state',
    });

    // Add transitions — group parallel edges by from+to pair
    const edgeGroups = new Map<string, string[]>();
    for (const t of nfa.transitions) {
      const key = `${t.from}→${t.to}`;
      if (!edgeGroups.has(key)) edgeGroups.set(key, []);
      edgeGroups.get(key)!.push(t.symbol);
    }

    let edgeIdx = 0;
    for (const [key, symbols] of edgeGroups.entries()) {
      const [from, to] = key.split('→');
      const label = symbols.join(', ');
      const isSelf = from === to;

      elements.push({
        data: {
          id: `e${edgeIdx++}`,
          source: from,
          target: to,
          label,
        },
        classes: isSelf ? 'self-loop' : 'edge',
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
            width: 40,
            height: 40,
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
            'text-border-opacity': 0,
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
        rankSep: 80,
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
      deadNode.position({ x: extent.x2 - 28, y: extent.y2 - 28 });
      deadNode.lock();
      initialViewRef.current = {
        zoom: cy.zoom(),
        pan: { ...cy.pan() },
      };
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
  }, [nfa]);

  // Highlight active states
  useEffect(() => {
    if (!cyRef.current || !nfa) return;
    const cy = cyRef.current;

    cy.nodes('.state').removeClass('active');
    cy.nodes('.dead-state').removeClass('active');
    cy.edges('.edge, .self-loop').removeClass('active-edge');
    cy.remove('#__dead_active_edge__');

    for (const stateId of activeStates) {
      cy.getElementById(stateId).addClass('active');
    }

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
  }, [activeStates, activeEdge, nfa]);

  if (!nfa) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm italic">
        No NFA built yet
      </div>
    );
  }

  function handleRecenter() {
    const cy = cyRef.current;
    const initialView = initialViewRef.current;
    if (!cy || !initialView) return;
    cy.animate(
      {
        zoom: initialView.zoom,
        pan: initialView.pan,
      } as any,
      {
        duration: 320,
        easing: 'ease-in-out',
      }
    );
  }

  function handleFitToScreen() {
    const cy = cyRef.current;
    if (!cy) return;
    cy.animate(
      {
        fit: {
          eles: cy.elements(),
          padding: 30,
        },
      } as any,
      {
        duration: 320,
        easing: 'ease-in-out',
      }
    );
  }

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleRecenter}
          className="px-2 py-1 rounded-[2px] border border-[var(--border-subtle)] bg-slate-900/70 text-slate-300 text-[11px] hover:text-[var(--accent-teal)] hover:border-[var(--accent-teal)]/40 transition-colors"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          ⌖ Recenter
        </button>
        <button
          type="button"
          onClick={handleFitToScreen}
          className="px-2 py-1 rounded-[2px] border border-[var(--border-subtle)] bg-slate-900/70 text-slate-300 text-[11px] hover:text-[var(--accent-teal)] hover:border-[var(--accent-teal)]/40 transition-colors"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Fit
        </button>
      </div>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
