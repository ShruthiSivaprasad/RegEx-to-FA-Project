# RegExp → Automaton Visualizer

An interactive Theory of Computation tool that converts a regular expression into an ε-NFA and a DFA, with step-by-step visual construction, graph rendering, transition tables, and string simulation.

🔗 **Live demo:** https://regex-to-fa-project.vercel.app/

---

## Overview

This project implements two foundational algorithms from formal language theory:

1. **Thompson's Construction** — converts a regular expression into an ε-NFA by recursively applying construction rules for each operator (literal, union, concatenation, Kleene star, one-or-more, optional).
2. **Subset Construction** — converts the ε-NFA into a DFA by computing ε-closures and move sets for every reachable state subset.

The tool is designed for both learning and verification — every intermediate step is visible, every transition is traceable, and string acceptance can be simulated character by character.

![RegExp to Automaton Visualizer UI](public/project-screenshot.png)

---

## Features

### Regex Input & Parsing
- Supports literals (`a–z`, `0–9`), union (`|`), Kleene star (`*`), one-or-more (`+`), optional (`?`), and grouping (`( )`)
- Implicit concatenation is resolved during parsing
- Regex is converted to postfix notation (Reverse Polish) before construction begins

### Thompson's Construction (ε-NFA)
- Token-by-token stepper showing each NFA fragment as it is composed
- Thompson rule reference panel explaining each operator's NFA template
- Final ε-NFA rendered as an interactive graph

### Subset Construction (DFA)
- Full NFA-to-DFA conversion via ε-closure and move computation
- DFA completed with an explicit dead state (∅) to satisfy formal DFA requirements — every state has a transition for every input symbol
- DFA rendered as an interactive graph alongside the ε-NFA

### DFA Transition Table
- Full transition table for all DFA states and input symbols
- Dead-state transitions (∅) clearly shown
- Active state and active symbol highlighted during simulation

### String Simulator
- Simulate any string against the DFA or ε-NFA
- Step-by-step controls (forward, back, autoplay, reset)
- Active state highlighted in both the graph and the transition table in sync
- Dead-state trapping shown with visual feedback and an explanatory note
- Suggested accepted and rejected strings generated directly from the DFA structure

---

## How to Use

1. Enter a regex in the input field (e.g. `(a|b)*abb`) and click **Convert**.
2. Open the **Construction** tab to step through the ε-NFA build process token by token.
3. Open **Automaton Graphs** to inspect the ε-NFA and DFA side by side.
4. Open the **DFA Transition Table** to verify that every state–symbol pair has a defined transition.
5. Use the **String Simulator** to test accepted and rejected strings. Watch the active state move through the graph and table with each character.
6. For rejected strings, verify that the automaton enters and stays in the dead state (∅).

---

## Local Development

**Prerequisites:** Node.js 18+, npm

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
# Production build
npm run build
npm run start
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| UI | React + TypeScript |
| Styling | Tailwind CSS |
| Graph rendering | Cytoscape.js |

---

## Repository Structure

```
app/          → Page layout and top-level UI composition
components/   → Input, stepper, simulator, graph views, transition table
lib/          → Parser, Thompson construction, subset construction, simulation engine, shared types
public/       → Static assets
```

---

## Implementation Notes

- The **ε-NFA is intentionally incomplete** — it does not define transitions for every symbol from every state, which is correct per Thompson's Construction. Missing transitions represent implicit rejection.
- The **DFA is explicitly completed** — a dead state (∅) and all transitions into it are added after subset construction to produce a proper total DFA. This is required for formal correctness and is shown transparently in the transition table and simulator.
- Postfix conversion uses the **shunting-yard algorithm** with operator precedence: `*`, `+`, `?` (highest) → concatenation → `|` (lowest).
