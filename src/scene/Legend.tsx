export function Legend() {
  const items = [
    { color: 'bg-amber-400', label: 'True Values' },
    { color: 'bg-cyan-400', label: 'Current Hypothesis' },
    { color: 'bg-white', label: 'Proposal' },
    { color: 'bg-blue-500', label: 'Accepted (early)' },
    { color: 'bg-purple-500', label: 'Accepted (late)' },
    { color: 'bg-slate-500', label: 'Burn-in' },
  ];

  return (
    <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs">
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-2 py-0.5">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />
          <span className="text-slate-300">{label}</span>
        </div>
      ))}
    </div>
  );
}
