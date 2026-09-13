'use client';
import React, { useMemo } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { ACT_ROOT_CAUSES } from '../types/lifeOs';
import { Grid3x3 } from 'lucide-react';

/**
 * Error Heatmap: questionType (rows) x rootCause (columns), cell intensity
 * scaled to how many times that exact combination has been logged. Surfaces
 * which specific concept + failure-mode pair needs a targeted drill, rather
 * than just an aggregate section score.
 */
export const ACTErrorHeatmap: React.FC = () => {
  const actErrorLog = useLifeOSStore((s) => s.actErrorLog);

  const { rows, matrix, maxCount } = useMemo(() => {
    const rowSet = Array.from(new Set(actErrorLog.map((e) => e.questionType))).sort();
    const grid: Record<string, Record<string, number>> = {};
    let max = 0;
    rowSet.forEach((row) => {
      grid[row] = {};
      ACT_ROOT_CAUSES.forEach((cause) => {
        const count = actErrorLog.filter((e) => e.questionType === row && e.rootCause === cause).length;
        grid[row][cause] = count;
        if (count > max) max = count;
      });
    });
    return { rows: rowSet, matrix: grid, maxCount: max };
  }, [actErrorLog]);

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <Grid3x3 className="w-4 h-4 text-cf-accent" /> Error Heatmap
      </h3>
      <p className="text-xs text-slate-400 mb-4">Concept × failure-mode intensity, built from your logged errors — darkest cells need remediation first.</p>

      {rows.length === 0 ? (
        <p className="text-xs text-slate-500">Log a few errors to populate the heatmap.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="text-left text-slate-500 font-normal pb-1">Concept</th>
                {ACT_ROOT_CAUSES.map((cause) => (
                  <th key={cause} className="text-slate-500 font-normal pb-1 px-1 whitespace-nowrap">{cause}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row}>
                  <td className="text-slate-300 font-semibold pr-2 whitespace-nowrap">{row}</td>
                  {ACT_ROOT_CAUSES.map((cause) => {
                    const count = matrix[row][cause];
                    const intensity = maxCount === 0 ? 0 : count / maxCount;
                    return (
                      <td key={cause} className="text-center">
                        <div
                          className="w-12 h-8 flex items-center justify-center rounded font-mono font-bold text-white mx-auto"
                          style={{ backgroundColor: count === 0 ? 'rgb(var(--cf-bg))' : `rgba(251, 191, 36, ${0.15 + intensity * 0.65})` }}
                        >
                          {count || ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
