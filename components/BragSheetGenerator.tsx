'use client';
import React, { useMemo, useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { FileText, Copy } from 'lucide-react';

/**
 * Compiles the student's saved profile, extracurriculars, and free-text
 * notes into a single formatted packet a teacher or counselor can skim
 * before writing a recommendation letter.
 */
export const BragSheetGenerator: React.FC = () => {
  const studentProfile = useLifeOSStore((s) => s.studentProfile);
  const bragSheetNotes = useLifeOSStore((s) => s.bragSheetNotes);
  const setBragSheetNotes = useLifeOSStore((s) => s.setBragSheetNotes);
  const advocacyDrafts = useLifeOSStore((s) => s.advocacyDrafts);
  const [copied, setCopied] = useState(false);

  const packet = useMemo(() => {
    if (!studentProfile) return null;
    const lines: string[] = [];
    lines.push('BRAG SHEET — RECOMMENDATION PACKET');
    lines.push('');
    lines.push(`GPA: ${studentProfile.unweightedGPA} unweighted / ${studentProfile.weightedGPA} weighted`);
    lines.push(`ACT Composite: ${studentProfile.actComposite}`);
    lines.push('');
    const courses = studentProfile.ibCourses.filter((c) => c.name.trim());
    if (courses.length > 0) {
      lines.push('IB Diploma Courses:');
      courses.forEach((c) => lines.push(`  - ${c.name} (${c.level})`));
      lines.push('');
    }
    const ecs = studentProfile.topExtracurriculars.filter((e) => e.description.trim());
    if (ecs.length > 0) {
      lines.push('Top Extracurriculars (self-rated impact, 1-5):');
      ecs.forEach((e) => lines.push(`  - ${e.description} — impact ${e.impactLevel}/5`));
      lines.push('');
    }
    if (bragSheetNotes.trim()) {
      lines.push('Additional Context / Anecdotes:');
      lines.push(bragSheetNotes.trim());
      lines.push('');
    }
    if (advocacyDrafts.length > 0) {
      lines.push('Related Advocacy Drafts on File:');
      advocacyDrafts.forEach((d) => lines.push(`  - ${d.title} (${d.type})`));
    }
    return lines.join('\n');
  }, [studentProfile, bragSheetNotes, advocacyDrafts]);

  const handleCopy = async () => {
    if (!packet) return;
    try {
      await navigator.clipboard.writeText(packet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <FileText className="w-4 h-4 text-cf-accent" /> Brag Sheet Generator
      </h3>
      <p className="text-xs text-slate-400 mb-4">Compiles your saved profile into a packet a teacher or counselor can use for a recommendation letter.</p>

      <textarea
        rows={4}
        value={bragSheetNotes}
        onChange={(e) => setBragSheetNotes(e.target.value)}
        placeholder="Additional context, anecdotes, or special circumstances a recommender should know..."
        className="w-full bg-cf-bg border border-cf-border rounded p-2 text-xs text-white resize-none focus:outline-cf-accent mb-4"
      />

      {!packet ? (
        <p className="text-xs text-slate-500">Save your profile in the Brutal Admissions Evaluator above to generate a packet.</p>
      ) : (
        <>
          <pre className="text-[11px] text-slate-300 whitespace-pre-wrap font-sans leading-relaxed bg-cf-bg border border-cf-border rounded-lg p-4 mb-3 max-h-64 overflow-y-auto">
            {packet}
          </pre>
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded transition">
            <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy Packet'}
          </button>
        </>
      )}
    </div>
  );
};
