'use client';

interface RegexInputProps {
  value: string;
  onChange: (v: string) => void;
  onConvert: () => void;
  error: string | null;
}

const EXAMPLES = [
  { label: '(a|b)*abb', value: '(a|b)*abb' },
  { label: 'a+b?c', value: 'a+b?c' },
  { label: '(ab|cd)*', value: '(ab|cd)*' },
  { label: 'a*b+', value: 'a*b+' },
  { label: '(a|b|c)+', value: '(a|b|c)+' },
  { label: 'ab*c', value: 'ab*c' },
  { label: 'a(bc)?d', value: 'a(bc)?d' },
];

export default function RegexInput({ value, onChange, onConvert, error }: RegexInputProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') onConvert();
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-wrap gap-3 items-start">
        {/* Regex input */}
        <div className="flex-1 min-w-64">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm select-none pointer-events-none" style={{ fontFamily: 'var(--font-mono)' }}>
              /
            </span>
            <input
              id="regex-input"
              type="text"
              value={value}
              onChange={e => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter regular expression…"
              spellCheck={false}
              className={`w-full bg-[var(--bg-secondary)]/80 border rounded-[2px] pl-7 pr-4 py-3 text-slate-100 text-base placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                error
                  ? 'border-red-600 focus:ring-red-500'
                  : 'border-[var(--border-subtle)] focus:ring-[var(--accent-teal)] hover:border-[var(--accent-teal)]/50'
              }`}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm select-none pointer-events-none" style={{ fontFamily: 'var(--font-mono)' }}>
              /
            </span>
          </div>
        </div>

        {/* Examples dropdown */}
        <div>
          <select
            id="example-select"
            onChange={e => { if (e.target.value) onChange(e.target.value); }}
            defaultValue=""
            className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[2px] px-4 py-3 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-teal)] hover:border-[var(--accent-teal)]/50 transition-all cursor-pointer h-full"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <option value="" disabled>Examples…</option>
            {EXAMPLES.map(ex => (
              <option key={ex.value} value={ex.value}>
                {ex.label}
              </option>
            ))}
          </select>
        </div>

        {/* Convert button */}
        <button
          id="convert-btn"
          onClick={onConvert}
          className="px-6 py-3 rounded-[2px] bg-[var(--accent-teal)] hover:bg-[var(--accent-teal-dark)] text-[var(--bg-primary)] font-black text-sm transition-all active:scale-95 whitespace-nowrap shadow-lg shadow-teal-900/20 border border-[var(--accent-teal)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Convert →
        </button>
      </div>

      {/* Supported syntax hint */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span><code style={{ fontFamily: 'var(--font-mono)' }} className="text-slate-400">a–z, 0–9</code> literals</span>
        <span><code style={{ fontFamily: 'var(--font-mono)' }} className="text-slate-400">|</code> union</span>
        <span><code style={{ fontFamily: 'var(--font-mono)' }} className="text-slate-400">*</code> Kleene star</span>
        <span><code style={{ fontFamily: 'var(--font-mono)' }} className="text-slate-400">+</code> one or more</span>
        <span><code style={{ fontFamily: 'var(--font-mono)' }} className="text-slate-400">?</code> optional</span>
        <span><code style={{ fontFamily: 'var(--font-mono)' }} className="text-slate-400">( )</code> grouping</span>
        <span className="text-slate-600">· concatenation is implicit</span>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-[2px] bg-red-900/30 border border-red-700 text-red-400 text-sm">
          <span className="text-base">⚠</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
