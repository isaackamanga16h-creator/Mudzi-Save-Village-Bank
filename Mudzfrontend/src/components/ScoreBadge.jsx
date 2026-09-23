import React from 'react';
import { getScoreBadgeColor } from '../utils/scorecalculator';

export default function ScoreBadge({ score = 50 }) {
  const badge = getScoreBadgeColor(score);

  return (
    <div className={`flex items-center space-x-3 border px-4 py-2 rounded-xl ${badge.bg} ${badge.border}`}>
      <div>
        <p className="text-[10px] uppercase font-bold text-slate-400">Financial Behaviour Indicator</p>
        <p className={`text-xl font-black ${badge.text}`}>{score} / 100 ({badge.label})</p>
      </div>
      <div className={`w-10 h-10 rounded-full border-2 ${badge.border} flex items-center justify-center font-bold text-xs ${badge.text}`}>
        {score}%
      </div>
    </div>
  );
}