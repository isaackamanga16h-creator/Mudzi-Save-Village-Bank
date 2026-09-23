export const getScoreBadgeColor = (score) => {
  if (score >= 80) return { bg: 'bg-emerald-950', text: 'text-emerald-400', border: 'border-emerald-500', label: 'Excellent' };
  if (score >= 50) return { bg: 'bg-amber-950', text: 'text-amber-400', border: 'border-amber-500', label: 'Good' };
  return { bg: 'bg-rose-950', text: 'text-rose-400', border: 'border-rose-500', label: 'Needs Improvement' };
};