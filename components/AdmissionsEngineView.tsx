'use client';
import React, { useMemo, useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { StudentProfile, IBCourseEntry, ExtracurricularEntry, UniversityProfile } from '../types/lifeOs';
import { UNIVERSITY_DATASET } from '../lib/universityData';
import { evaluateAdmissions } from '../lib/admissionsEvaluator';
import { Skull, Star, Save, AlertTriangle, Info } from 'lucide-react';

const EMPTY_IB_COURSES: IBCourseEntry[] = Array.from({ length: 7 }, () => ({ name: '', level: 'SL' }));
const EMPTY_ECS: ExtracurricularEntry[] = Array.from({ length: 5 }, () => ({ description: '', impactLevel: 3 }));

const EMPTY_PROFILE: StudentProfile = {
  unweightedGPA: 3.8,
  weightedGPA: 4.1,
  ibCourses: EMPTY_IB_COURSES,
  actComposite: 30,
  topExtracurriculars: EMPTY_ECS,
};

const TIER_COLORS: Record<string, string> = {
  'Extreme Reach': '#F87171',
  Reach: '#FB923C',
  Target: '#FBBF24',
  Safety: '#34D399',
};

export const AdmissionsEngineView: React.FC = () => {
  const studentProfile = useLifeOSStore((s) => s.studentProfile);
  const setStudentProfile = useLifeOSStore((s) => s.setStudentProfile);
  const actSectionScores = useLifeOSStore((s) => s.actSectionScores);

  const [draft, setDraft] = useState<StudentProfile>(studentProfile ?? EMPTY_PROFILE);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [evaluated, setEvaluated] = useState(false);
  const [saved, setSaved] = useState(false);

  const mathScore = actSectionScores.find((s) => s.section === 'Math')?.current;

  const toggleSchool = (id: string) => {
    setSelectedSchoolIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
    setEvaluated(false);
  };

  const updateIbCourse = (idx: number, field: keyof IBCourseEntry, value: string) => {
    setDraft((prev) => {
      const next = [...prev.ibCourses];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, ibCourses: next };
    });
  };

  const updateEc = (idx: number, field: keyof ExtracurricularEntry, value: string | number) => {
    setDraft((prev) => {
      const next = [...prev.topExtracurriculars];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, topExtracurriculars: next };
    });
  };

  const handleSave = () => {
    setStudentProfile(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const results = useMemo(() => {
    if (!evaluated) return [];
    const schools = UNIVERSITY_DATASET.filter((u) => selectedSchoolIds.includes(u.id));
    return schools.map((u) => ({ university: u, evaluation: evaluateAdmissions(draft, u, mathScore) }));
  }, [evaluated, selectedSchoolIds, draft, mathScore]);

  const groupedByTier = useMemo(() => {
    const groups: Record<string, typeof results> = { 'Extreme Reach': [], Reach: [], Target: [], Safety: [] };
    results.forEach((r) => groups[r.evaluation.tier].push(r));
    return groups;
  }, [results]);

  return (
    <div className="space-y-6">
      <div className="bg-cf-card border border-cf-border rounded-xl p-6">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <Skull className="w-4 h-4 text-cf-accent" /> Brutal Admissions Evaluator
        </h3>
        <p className="text-xs text-slate-400 mb-4 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-cf-accent shrink-0 mt-0.5" />
          Rule-based, unsugarcoated estimates against illustrative tier anchors — not a guarantee, and not a substitute for a real
          counselor conversation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Unweighted GPA</label>
            <input
              type="number"
              step={0.01}
              value={draft.unweightedGPA}
              onChange={(e) => setDraft((p) => ({ ...p, unweightedGPA: Number(e.target.value) }))}
              className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Weighted GPA</label>
            <input
              type="number"
              step={0.01}
              value={draft.weightedGPA}
              onChange={(e) => setDraft((p) => ({ ...p, weightedGPA: Number(e.target.value) }))}
              className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">ACT Composite</label>
            <input
              type="number"
              value={draft.actComposite}
              onChange={(e) => setDraft((p) => ({ ...p, actComposite: Number(e.target.value) }))}
              className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent"
            />
          </div>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">IB Diploma Courses (7)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-4">
          {draft.ibCourses.map((course, i) => (
            <div key={i} className="flex gap-1.5">
              <input
                value={course.name}
                onChange={(e) => updateIbCourse(i, 'name', e.target.value)}
                placeholder={`IB course ${i + 1}`}
                className="flex-1 bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent"
              />
              <select
                value={course.level}
                onChange={(e) => updateIbCourse(i, 'level', e.target.value)}
                className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent"
              >
                <option value="HL">HL</option>
                <option value="SL">SL</option>
              </select>
            </div>
          ))}
        </div>

        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Top 5 Extracurriculars</p>
        <div className="space-y-1.5 mb-4">
          {draft.topExtracurriculars.map((ec, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={ec.description}
                onChange={(e) => updateEc(i, 'description', e.target.value)}
                placeholder={`Extracurricular ${i + 1}`}
                className="flex-1 bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent"
              />
              <div className="flex gap-0.5 shrink-0">
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <button key={n} type="button" onClick={() => updateEc(i, 'impactLevel', n)} className={n <= ec.impactLevel ? 'text-amber-400' : 'text-slate-600'}>
                    <Star className="w-3.5 h-3.5" fill={n <= ec.impactLevel ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded transition"
        >
          <Save className="w-3.5 h-3.5" /> {saved ? 'Saved!' : 'Save Profile'}
        </button>
      </div>

      <div className="bg-cf-card border border-cf-border rounded-xl p-6">
        <h3 className="text-sm font-bold text-white mb-3">Select Target Schools</h3>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {UNIVERSITY_DATASET.map((u: UniversityProfile) => (
            <button
              key={u.id}
              onClick={() => toggleSchool(u.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                selectedSchoolIds.includes(u.id) ? 'bg-cf-accent text-black border-cf-accent' : 'bg-cf-bg border-cf-border text-slate-300'
              }`}
            >
              {u.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => setEvaluated(true)}
          disabled={selectedSchoolIds.length === 0}
          className="px-5 py-2.5 bg-cf-accent hover:opacity-90 disabled:opacity-40 text-black font-semibold rounded transition text-sm"
        >
          Run Brutal Admissions Evaluation
        </button>
      </div>

      {evaluated && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['Extreme Reach', 'Reach', 'Target', 'Safety'] as const).map((tier) =>
            groupedByTier[tier].length === 0 ? null : (
              <div key={tier} className="bg-cf-card border border-cf-border rounded-xl p-5">
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: TIER_COLORS[tier] }}>
                  {tier}
                </p>
                <div className="space-y-3">
                  {groupedByTier[tier].map(({ university, evaluation }) => (
                    <div key={university.id} className="bg-cf-bg border border-cf-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-white">{university.name}</span>
                        <span className="font-mono font-bold text-lg" style={{ color: TIER_COLORS[tier] }}>{evaluation.chancePct}%</span>
                      </div>
                      {evaluation.redFlags.length > 0 && (
                        <ul className="space-y-1 mt-2">
                          {evaluation.redFlags.map((flag, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[11px] text-amber-300">
                              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" /> {flag}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
