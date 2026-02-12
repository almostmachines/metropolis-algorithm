import type { DataPoint, Params } from '../types';

interface ResultsDisplayProps {
  estimates: {
    mean: Params;
    ci95: {
      tau: [number, number];
      mu1: [number, number];
      mu2: [number, number];
      effectSize: [number, number];
    };
    effectSizeMean: number;
    probabilityAfternoon: number;
    probability2To4: number;
  };
  data: DataPoint[];
  trueParams: Params;
  knownSigma: number;
}

export function ResultsDisplay({
  estimates,
  data,
  trueParams,
  knownSigma,
}: ResultsDisplayProps) {
  const chartWidth = 320;
  const chartHeight = 180;
  const padLeft = 34;
  const padRight = 12;
  const padTop = 12;
  const padBottom = 26;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  const xMin = 0;
  const xMax = 24;

  const yCandidates = [
    ...data.map((point) => point.value),
    trueParams.mu1,
    trueParams.mu2,
    estimates.mean.mu1,
    estimates.mean.mu2,
  ];
  const minDataY = yCandidates.length > 0 ? Math.min(...yCandidates) : 0;
  const maxDataY = yCandidates.length > 0 ? Math.max(...yCandidates) : 1;
  const safeYSpan = Math.max(maxDataY - minDataY, 1);
  const yPadding = safeYSpan * 0.15;
  const yMin = minDataY - yPadding;
  const yMax = maxDataY + yPadding;

  const toChartX = (x: number) =>
    padLeft + ((x - xMin) / (xMax - xMin)) * plotWidth;
  const toChartY = (y: number) =>
    chartHeight -
    padBottom -
    ((y - yMin) / (yMax - yMin)) * plotHeight;

  const xTicks = [0, 6, 12, 18, 24];
  const yTicks = Array.from(
    { length: 5 },
    (_, i) => yMin + ((yMax - yMin) * i) / 4,
  );

  const reportItems = [
    {
      label: 'τ (h)',
      mean: estimates.mean.tau,
      ci: estimates.ci95.tau,
      trueValue: trueParams.tau,
    },
    {
      label: 'μ₁ (mg/L)',
      mean: estimates.mean.mu1,
      ci: estimates.ci95.mu1,
      trueValue: trueParams.mu1,
    },
    {
      label: 'μ₂ (mg/L)',
      mean: estimates.mean.mu2,
      ci: estimates.ci95.mu2,
      trueValue: trueParams.mu2,
    },
    {
      label: 'Effect (mg/L)',
      mean: estimates.effectSizeMean,
      ci: estimates.ci95.effectSize,
      trueValue: trueParams.mu2 - trueParams.mu1,
    },
  ];

  return (
    <div className="border-t border-slate-700 pt-3">
      <h2 className="text-sm font-semibold text-slate-300 mb-3">Results</h2>
      <div className="mb-3 rounded-lg border border-slate-800 bg-slate-950 p-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Observed Oxygen Levels Over Time
        </h3>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto block rounded bg-slate-950"
        >
          <rect x={0} y={0} width={chartWidth} height={chartHeight} fill="#020617" />

          {yTicks.map((tick) => {
            const y = toChartY(tick);
            return (
              <line
                key={`y-${tick}`}
                x1={padLeft}
                y1={y}
                x2={chartWidth - padRight}
                y2={y}
                stroke="#1e293b"
                strokeWidth={1}
              />
            );
          })}

          {xTicks.map((tick) => {
            const x = toChartX(tick);
            return (
              <line
                key={`x-${tick}`}
                x1={x}
                y1={padTop}
                x2={x}
                y2={chartHeight - padBottom}
                stroke="#1e293b"
                strokeWidth={1}
              />
            );
          })}

          <line
            x1={padLeft}
            y1={chartHeight - padBottom}
            x2={chartWidth - padRight}
            y2={chartHeight - padBottom}
            stroke="#475569"
            strokeWidth={1.5}
          />
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={chartHeight - padBottom}
            stroke="#475569"
            strokeWidth={1.5}
          />

          <line
            x1={toChartX(trueParams.tau)}
            y1={padTop}
            x2={toChartX(trueParams.tau)}
            y2={chartHeight - padBottom}
            stroke="#f59e0b"
            strokeWidth={1.8}
          />
          <line
            x1={toChartX(estimates.mean.tau)}
            y1={padTop}
            x2={toChartX(estimates.mean.tau)}
            y2={chartHeight - padBottom}
            stroke="#22d3ee"
            strokeWidth={1.8}
            strokeDasharray="5 4"
          />

          <line
            x1={toChartX(xMin)}
            y1={toChartY(trueParams.mu1)}
            x2={toChartX(trueParams.tau)}
            y2={toChartY(trueParams.mu1)}
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeOpacity={0.75}
          />
          <line
            x1={toChartX(trueParams.tau)}
            y1={toChartY(trueParams.mu2)}
            x2={toChartX(xMax)}
            y2={toChartY(trueParams.mu2)}
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeOpacity={0.75}
          />

          <line
            x1={toChartX(xMin)}
            y1={toChartY(estimates.mean.mu1)}
            x2={toChartX(estimates.mean.tau)}
            y2={toChartY(estimates.mean.mu1)}
            stroke="#22d3ee"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            strokeOpacity={0.9}
          />
          <line
            x1={toChartX(estimates.mean.tau)}
            y1={toChartY(estimates.mean.mu2)}
            x2={toChartX(xMax)}
            y2={toChartY(estimates.mean.mu2)}
            stroke="#22d3ee"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            strokeOpacity={0.9}
          />

          {data.map((point, index) => (
            <circle
              key={`${point.time}-${point.value}-${index}`}
              cx={toChartX(point.time)}
              cy={toChartY(point.value)}
              r={2}
              fill="#cbd5e1"
              fillOpacity={0.75}
            />
          ))}

          {xTicks.map((tick) => (
            <text
              key={`x-label-${tick}`}
              x={toChartX(tick)}
              y={chartHeight - 8}
              textAnchor="middle"
              fill="#64748b"
              fontSize={9}
            >
              {tick.toFixed(0)}
            </text>
          ))}

          {yTicks.map((tick) => (
            <text
              key={`y-label-${tick}`}
              x={padLeft - 5}
              y={toChartY(tick) + 3}
              textAnchor="end"
              fill="#64748b"
              fontSize={9}
            >
              {tick.toFixed(1)}
            </text>
          ))}
        </svg>

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-slate-300" />
            Observations
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-amber-400" />
            True τ/μ values
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-cyan-400" />
            Posterior means
          </div>
        </div>
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-900/55 p-2 mb-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Posterior Report
        </h3>
        <table className="w-full text-xs font-mono text-slate-300">
          <thead>
            <tr className="text-slate-500">
              <th className="text-left font-medium pr-2 pb-1"></th>
              {reportItems.map((item) => (
                <th key={item.label} className="text-right font-medium pb-1 pl-2">
                  {item.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-slate-400 pr-2 py-0.5">Estimated</td>
              {reportItems.map((item) => (
                <td
                  key={item.label}
                  className="text-right text-cyan-300 pl-2 py-0.5"
                >
                  {item.mean.toFixed(3)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="text-slate-400 pr-2 py-0.5">95% CI</td>
              {reportItems.map((item) => (
                <td
                  key={item.label}
                  className="text-right text-slate-400 pl-2 py-0.5 whitespace-nowrap text-[11px]"
                >
                  <span className="text-slate-500">[</span>
                  {item.ci[0].toFixed(2)}, {item.ci[1].toFixed(2)}
                  <span className="text-slate-500">]</span>
                </td>
              ))}
            </tr>
            <tr className="border-t border-slate-800">
              <td className="text-slate-400 pr-2 py-0.5 pt-1">True</td>
              {reportItems.map((item) => (
                <td
                  key={item.label}
                  className="text-right text-amber-400 pl-2 py-0.5 pt-1"
                >
                  {item.trueValue.toFixed(3)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-900/55 p-2 text-xs text-slate-300 space-y-1">
        <div>
          P(change in afternoon, τ {'>'} 12h):{' '}
          <span className="text-cyan-300">
            {(estimates.probabilityAfternoon * 100).toFixed(1)}%
          </span>
        </div>
        <div>
          P(14h {'<'} τ {'<'} 16h):{' '}
          <span className="text-cyan-300">
            {(estimates.probability2To4 * 100).toFixed(1)}%
          </span>
        </div>
        <div className="text-slate-500">
          Known sigma in likelihood: {knownSigma.toFixed(3)}
        </div>
      </div>
    </div>
  );
}
