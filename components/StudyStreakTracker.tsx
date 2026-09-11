'use client';
import React from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { REGISTERED_COURSES } from '../types/assessment';
import { CalendarCheck, Flame, BookOpen, Clock } from 'lucide-react';

export const StudyStreakTracker: React.FC = () => {
  const { studyLogs, assessments } = useAssessmentStore();

  const uniqueDatesStudied = Array.from(
    new Set(studyLogs.map((log) => log.timestamp.split('T')[0]))
  );

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6 text-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-3 bg-cf-bg border border-cf-border p-4 rounded-lg">
          <Flame className="w-8 h-8 text-orange-400" />
          <div>
            <div className="text-2xl font-mono font-bold text-white">{uniqueDatesStudied.length} Days</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Active Study Streak</div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-cf-bg border border-cf-border p-4 rounded-lg">
          <Clock className="w-8 h-8 text-cf-accent" />
          <div>
            <div className="text-2xl font-mono font-bold text-white">
              {studyLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0)}m
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Total Focus Time</div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-cf-bg border border-cf-border p-4 rounded-lg">
          <BookOpen className="w-8 h-8 text-emerald-400" />
          <div>
            <div className="text-2xl font-mono font-bold text-white">{assessments.length} Active</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Target Assessments</div>
          </div>
        </div>
      </div>

      <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
        <CalendarCheck className="w-4 h-4 text-cf-accent" /> Verified Daily Study Sessions
      </h4>
      <div className="space-y-2">
        {studyLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">No study sessions recorded yet. Launch active recall to log prep time.</p>
        ) : (
          studyLogs.slice(0, 5).map((log) => {
            const course = REGISTERED_COURSES.find((c) => c.id === log.courseId);
            return (
              <div key={log.id} className="flex items-center justify-between p-3 bg-cf-bg border border-cf-border rounded-md">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: course?.color || '#38BDF8' }} />
                  <div>
                    <div className="text-sm font-medium text-white">{log.summarySnippet}</div>
                    <div className="text-xs text-slate-400">{log.methodUsed} • {log.durationMinutes} mins</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-cf-accent">{log.performanceScore}% Retention</div>
                  <div className="text-xs text-slate-400">{log.timestamp.split('T')[0]}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
