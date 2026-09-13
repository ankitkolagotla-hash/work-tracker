'use client';
import React, { useState } from 'react';
import { BookMarked, X, ChevronDown } from 'lucide-react';

interface RefSection {
  id: string;
  heading: string;
  items: { term: string; detail: string }[];
}

const MATH_SECTIONS: RefSection[] = [
  {
    id: 'coord-geo',
    heading: 'Coordinate Geometry',
    items: [
      { term: 'Slope', detail: 'm = (y₂ − y₁) / (x₂ − x₁)' },
      { term: 'Midpoint', detail: '((x₁+x₂)/2, (y₁+y₂)/2)' },
      { term: 'Distance', detail: 'd = √[(x₂−x₁)² + (y₂−y₁)²]' },
      { term: 'Point-slope form', detail: 'y − y₁ = m(x − x₁)' },
      { term: 'Circle equation', detail: '(x−h)² + (y−k)² = r², center (h,k)' },
    ],
  },
  {
    id: 'trig',
    heading: 'Trig Identities',
    items: [
      { term: 'SOH-CAH-TOA', detail: 'sin = opp/hyp, cos = adj/hyp, tan = opp/adj' },
      { term: 'Pythagorean identity', detail: 'sin²θ + cos²θ = 1' },
      { term: 'tan θ', detail: 'sin θ / cos θ' },
      { term: 'Law of Sines', detail: 'a/sin A = b/sin B = c/sin C' },
      { term: 'Law of Cosines', detail: 'c² = a² + b² − 2ab·cos C' },
    ],
  },
  {
    id: 'prob',
    heading: 'Probability & Statistics',
    items: [
      { term: 'Basic probability', detail: 'P(event) = favorable outcomes / total outcomes' },
      { term: 'Independent events', detail: 'P(A and B) = P(A) × P(B)' },
      { term: 'Mean', detail: 'sum of values / count of values' },
      { term: 'Combinations', detail: 'nCr = n! / (r!(n−r)!)' },
    ],
  },
  {
    id: 'algebra',
    heading: 'Algebra & Functions',
    items: [
      { term: 'Quadratic formula', detail: 'x = (−b ± √(b²−4ac)) / 2a' },
      { term: 'Difference of squares', detail: 'a² − b² = (a+b)(a−b)' },
      { term: 'Exponent rules', detail: 'aᵐ·aⁿ = aᵐ⁺ⁿ, (aᵐ)ⁿ = aᵐⁿ' },
    ],
  },
];

const ENGLISH_SECTIONS: RefSection[] = [
  {
    id: 'punctuation',
    heading: 'Semicolons vs. Colons',
    items: [
      { term: 'Semicolon', detail: 'Joins two independent clauses without a conjunction: "I studied all night; the exam still felt hard."' },
      { term: 'Colon', detail: 'Introduces a list, explanation, or elaboration after a complete sentence: "She had one goal: to finish early."' },
      { term: 'Comma splice (avoid)', detail: 'Never join two independent clauses with just a comma.' },
    ],
  },
  {
    id: 'dashes',
    heading: 'Dash Usage',
    items: [
      { term: 'Em dash (single)', detail: 'Sets off an abrupt break or emphatic restatement: "He had one plan — leave."' },
      { term: 'Em dash (pair)', detail: 'Sets off a parenthetical, like extra-strong commas: "The results — all three of them — were unexpected."' },
    ],
  },
  {
    id: 'modifiers',
    heading: 'Modifier Placement',
    items: [
      { term: 'Dangling modifier', detail: 'The modifying phrase has no logical subject to attach to: "Running late, the bus was missed." (wrong — the bus can\'t run)' },
      { term: 'Misplaced modifier', detail: 'Keep a modifier next to the word it describes to avoid ambiguity.' },
    ],
  },
  {
    id: 'rhetorical',
    heading: 'Rhetorical Skills',
    items: [
      { term: 'Relevance', detail: 'If a sentence doesn\'t support the paragraph\'s point, it should be cut, even if factually true.' },
      { term: 'Transitions', detail: 'Match the logical relationship: "however" = contrast, "therefore" = consequence, "for example" = illustration.' },
    ],
  },
];

export const FormulaCheatSheet: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-cf-bg border border-cf-border hover:border-slate-600 text-xs font-semibold text-slate-300 rounded transition"
      >
        <BookMarked className="w-3.5 h-3.5 text-cf-accent" /> Formula &amp; Grammar Quick-Ref
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-cf-card border border-cf-border rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-cf-accent" /> Formula &amp; Grammar Quick-Ref Sheet
              </h3>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-wider text-cf-accent mb-2">Math</p>
            <div className="space-y-2 mb-5">
              {MATH_SECTIONS.map((sec) => (
                <RefAccordion key={sec.id} section={sec} isOpen={openSections.has(sec.id)} onToggle={() => toggleSection(sec.id)} />
              ))}
            </div>

            <p className="text-[10px] font-bold uppercase tracking-wider text-cf-accent mb-2">English Mechanics</p>
            <div className="space-y-2">
              {ENGLISH_SECTIONS.map((sec) => (
                <RefAccordion key={sec.id} section={sec} isOpen={openSections.has(sec.id)} onToggle={() => toggleSection(sec.id)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function RefAccordion({ section, isOpen, onToggle }: { section: RefSection; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="bg-cf-bg border border-cf-border rounded-lg overflow-hidden">
      <button onClick={onToggle} className="w-full flex justify-between items-center px-4 py-2.5 text-left">
        <span className="text-xs font-bold text-white">{section.heading}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <ul className="px-4 pb-3 space-y-1.5">
          {section.items.map((item) => (
            <li key={item.term} className="text-[11px] text-slate-300">
              <strong className="text-slate-200">{item.term}:</strong> <span className="font-mono">{item.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
