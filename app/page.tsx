import Link from 'next/link';

export default function HomePage() {

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-slate-100 flex flex-col">
      {/* ─── Header ─────────────────────────────────────── */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-[var(--accent-teal)] flex items-center justify-center shadow-lg shadow-teal-900/20">
              <span className="text-[var(--bg-primary)] font-black text-base select-none" style={{fontFamily: 'var(--font-mono)'}}>R→A</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-[var(--accent-teal)] leading-none" style={{fontFamily: 'var(--font-heading)'}}
              >
                RegExp → Automaton
              </h1>
              <p className="text-[11px] text-slate-500 leading-none mt-0.5">
                Thompson's Construction · Subset Construction
              </p>
            </div>
          </div>

        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-screen-2xl mx-auto w-full px-6 py-6 gap-6">
        <section className="relative overflow-hidden pl-6 md:pl-8 pr-6 py-8 border-l-[3px] border-[var(--accent-teal)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-8 text-[7.5rem] md:text-[9rem] leading-none text-[var(--accent-teal)]/8 select-none"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            R→A
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(15, 255, 193, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 255, 193, 0.04) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div className="relative z-10">
          <h2
            className="text-xl md:text-2xl font-bold text-[var(--accent-teal)] mb-3"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Learn Regular Expressions Through Automata
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-4xl">
            This tool converts a regular expression into an NFA using Thompson&apos;s Construction, then builds a DFA using Subset Construction.
            Step through the process interactively or simulate strings against the automaton.
            Use this page as your quick reference, then launch the simulator to explore the full workflow.
          </p>
          </div>
        </section>

        {/* ─── Educational Reference Panel ───────────────── */}
        <section
          className="rounded-[2px] bg-[var(--bg-secondary)]/80 border border-[var(--border-subtle)] shadow-xl overflow-hidden"
          aria-label="Educational Reference"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-subtle)]">
            {/* Left: Thompson Rules */}
            <div className="relative p-4 lg:p-5 h-[460px]">
              <div className="h-full overflow-y-auto pr-1">
              <h2
                className="text-base md:text-lg font-bold text-[var(--accent-teal)] mb-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Thompson's Construction Rules
              </h2>

              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <div className="rounded-[6px] border border-[var(--border-subtle)] bg-slate-900/35 p-3">
                  <p className="mb-1.5">
                    <code className="px-1.5 py-0.5 rounded-[2px] border border-[var(--accent-teal)]/40 text-[var(--accent-teal)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      Literal
                    </code>
                  </p>
                  <p className="text-xs text-slate-400 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                    q0 --a--&gt; q1
                  </p>
                  <p>A single character <code style={{ fontFamily: 'var(--font-mono)' }}>a</code> becomes two states with one transition: q→a→q'. Simple as it gets.</p>
                </div>

                <div className="rounded-[6px] border border-[var(--border-subtle)] bg-slate-900/35 p-3">
                  <p className="mb-1.5">
                    <code className="px-1.5 py-0.5 rounded-[2px] border border-[var(--accent-teal)]/40 text-[var(--accent-teal)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      Union (a|b)
                    </code>
                  </p>
                  <p className="text-xs text-slate-400 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                    qs --e--&gt; a-branch --e--&gt; qf
                    <br />
                    qs --e--&gt; b-branch --e--&gt; qf
                  </p>
                  <p>Create a new start and accept state. Add ε-transitions to both sub-machines. The machine chooses a branch without reading any input.</p>
                </div>

                <div className="rounded-[6px] border border-[var(--border-subtle)] bg-slate-900/35 p-3">
                  <p className="mb-1.5">
                    <code className="px-1.5 py-0.5 rounded-[2px] border border-[var(--accent-teal)]/40 text-[var(--accent-teal)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      Concatenation (ab)
                    </code>
                  </p>
                  <p className="text-xs text-slate-400 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                    [a-machine] --e--&gt; [b-machine]
                  </p>
                  <p>Connect the accept state of the left machine to the start state of the right via ε. They run one after the other.</p>
                </div>

                <div className="rounded-[6px] border border-[var(--border-subtle)] bg-slate-900/35 p-3">
                  <p className="mb-1.5">
                    <code className="px-1.5 py-0.5 rounded-[2px] border border-[var(--accent-teal)]/40 text-[var(--accent-teal)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      Kleene Star (a*)
                    </code>
                  </p>
                  <p className="text-xs text-slate-400 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                    qs --e--&gt; qf (skip)
                    <br />
                    qs --e--&gt; a-machine --e--&gt; qf
                    <br />
                    a-accept --e--&gt; a-start (loop)
                  </p>
                  <p>Add a new start and accept state. Add ε-transitions to allow skipping entirely (zero times) or looping back (many times).</p>
                </div>

                <div className="rounded-[6px] border border-[var(--border-subtle)] bg-slate-900/35 p-3">
                  <p className="mb-1.5">
                    <code className="px-1.5 py-0.5 rounded-[2px] border border-[var(--accent-teal)]/40 text-[var(--accent-teal)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      One or More (a+)
                    </code>
                  </p>
                  <p className="text-xs text-slate-400 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                    qs --e--&gt; a-machine --e--&gt; qf
                    <br />
                    a-accept --e--&gt; a-start (loop)
                  </p>
                  <p>Like Kleene star but the skip-entirely path is removed. Must match at least once.</p>
                </div>
              </div>
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-0 right-0 bottom-0 h-16"
                style={{
                  background: 'linear-gradient(to top, rgba(11, 15, 19, 0.95) 20%, rgba(11, 15, 19, 0))',
                }}
              />
            </div>

            {/* Right: How to Use */}
            <div className="p-4 lg:p-5 h-[460px] overflow-hidden">
              <h2
                className="text-base md:text-lg font-bold text-[var(--accent-teal)] mb-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                How to Use
              </h2>

              <ol className="space-y-3 text-sm text-slate-300 leading-relaxed list-decimal pl-5">
                <li>Head to the Simulator page using the Launch Simulator button above.</li>
                <li>Click <code style={{ fontFamily: 'var(--font-mono)' }}>Convert</code> to build the E-NFA using Thompson's Construction.</li>
                <li>Watch the Construction tab to see each rule applied step by step: the left panel shows which rule, the right panel builds the NFA live.</li>
                <li>Switch to Automaton Graphs to see the complete E-NFA and the DFA side by side (built via Subset Construction).</li>
                <li>Open DFA Transition Table to see every state and transition in tabular form.</li>
                <li>Use the String Simulator: type any string, hit Simulate, then step through it to see exactly which states the machine visits.</li>
              </ol>

              <div className="mt-4 rounded-[6px] border border-[var(--accent-teal)]/30 bg-[var(--accent-teal)]/10 px-3 py-2 text-xs text-slate-200">
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  💡 Try the Examples dropdown to load a preset regex and see a full walkthrough.
                </span>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ─── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-slate-800 pt-6 pb-4 text-center text-xs text-slate-600">
        <div className="flex justify-center mb-4 -translate-y-4">
          <Link
            href="/simulator"
            className="inline-flex items-center px-7 py-3.5 text-base font-bold border border-[var(--accent-teal)] bg-[var(--accent-teal)] text-slate-950 hover:bg-teal-300 hover:border-teal-300 transition-colors"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Launch Simulator →
          </Link>
        </div>
        <div>made by shruthi sivaprasad</div>
      </footer>
    </div>
  );
}
