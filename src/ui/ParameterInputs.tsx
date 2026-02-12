import type { AlgorithmConfig } from '../types';
import { sanitizeAlgorithmConfig } from '../config/sanitize';

interface ParameterInputsProps {
  config: AlgorithmConfig;
  onChange: (config: AlgorithmConfig) => void;
  disabled: boolean;
}

function NumberInput({
  label,
  value,
  onChange,
  disabled,
  step = 0.1,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
      <label className="text-xs text-slate-400 truncate">{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw.trim() === '') {
            onChange(value);
            return;
          }
          const parsed = Number(raw);
          if (!Number.isFinite(parsed)) {
            onChange(value);
            return;
          }
          let clamped = parsed;
          if (min !== undefined) clamped = Math.max(min, clamped);
          if (max !== undefined) clamped = Math.min(max, clamped);
          onChange(clamped);
        }}
        disabled={disabled}
        className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200 text-right disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-cyan-500"
      />
    </div>
  );
}

export function ParameterInputs({
  config,
  onChange,
  disabled,
}: ParameterInputsProps) {
  const update = (partial: Partial<AlgorithmConfig>) =>
    onChange(sanitizeAlgorithmConfig({ ...config, ...partial }));

  return (
    <div className="space-y-3">
      <Section title="True Values">
        <NumberInput
          label="τ (hours)"
          value={config.trueParams.tau}
          onChange={(v) =>
            update({ trueParams: { ...config.trueParams, tau: v } })
          }
          disabled={disabled}
          min={0}
          max={24}
        />
        <NumberInput
          label="μ₁ (mg/L)"
          value={config.trueParams.mu1}
          onChange={(v) =>
            update({ trueParams: { ...config.trueParams, mu1: v } })
          }
          disabled={disabled}
        />
        <NumberInput
          label="μ₂ (mg/L)"
          value={config.trueParams.mu2}
          onChange={(v) =>
            update({ trueParams: { ...config.trueParams, mu2: v } })
          }
          disabled={disabled}
        />
      </Section>

      <Section title="Observed Data">
        <NumberInput
          label="Observations"
          value={config.observationCount}
          onChange={(v) =>
            update({ observationCount: Math.max(1, Math.round(v)) })
          }
          disabled={disabled}
          step={10}
          min={1}
        />
        <NumberInput
          label="Known sigma"
          value={config.knownSigma}
          onChange={(v) => update({ knownSigma: v })}
          disabled={disabled}
          min={0.01}
          step={0.05}
        />
      </Section>

      <Section title="Prior Belief">
        <NumberInput
          label="μ₁"
          value={config.priorMuMeans.mu1}
          onChange={(v) =>
            update({
              priorMuMeans: { ...config.priorMuMeans, mu1: v },
            })
          }
          disabled={disabled}
        />
        <NumberInput
          label="μ₂"
          value={config.priorMuMeans.mu2}
          onChange={(v) =>
            update({
              priorMuMeans: { ...config.priorMuMeans, mu2: v },
            })
          }
          disabled={disabled}
        />
        <NumberInput
          label="μ₁ sigma"
          value={config.priorMuStds.mu1}
          onChange={(v) =>
            update({
              priorMuStds: { ...config.priorMuStds, mu1: v },
            })
          }
          disabled={disabled}
          min={0.01}
        />
        <NumberInput
          label="μ₂ sigma"
          value={config.priorMuStds.mu2}
          onChange={(v) =>
            update({
              priorMuStds: { ...config.priorMuStds, mu2: v },
            })
          }
          disabled={disabled}
          min={0.01}
        />
      </Section>

      <Section title="Initial Hypothesis">
        <NumberInput
          label="τ (hours)"
          value={config.initialParams.tau}
          onChange={(v) =>
            update({ initialParams: { ...config.initialParams, tau: v } })
          }
          disabled={disabled}
          min={0}
          max={24}
        />
        <NumberInput
          label="μ₁"
          value={config.initialParams.mu1}
          onChange={(v) =>
            update({ initialParams: { ...config.initialParams, mu1: v } })
          }
          disabled={disabled}
        />
        <NumberInput
          label="μ₂"
          value={config.initialParams.mu2}
          onChange={(v) =>
            update({ initialParams: { ...config.initialParams, mu2: v } })
          }
          disabled={disabled}
        />
      </Section>

      <Section title="Proposal Widths">
        <NumberInput
          label="τ"
          value={config.proposalWidths.tau}
          onChange={(v) =>
            update({ proposalWidths: { ...config.proposalWidths, tau: v } })
          }
          disabled={disabled}
          min={0.01}
        />
        <NumberInput
          label="μ₁"
          value={config.proposalWidths.mu1}
          onChange={(v) =>
            update({
              proposalWidths: { ...config.proposalWidths, mu1: v },
            })
          }
          disabled={disabled}
          min={0.01}
        />
        <NumberInput
          label="μ₂"
          value={config.proposalWidths.mu2}
          onChange={(v) =>
            update({ proposalWidths: { ...config.proposalWidths, mu2: v } })
          }
          disabled={disabled}
          min={0.01}
        />
      </Section>

      <Section title="Posterior Sampling">
        <NumberInput
          label="Total samples"
          value={config.totalSamples}
          onChange={(v) => update({ totalSamples: Math.max(1, Math.round(v)) })}
          disabled={disabled}
          step={50}
          min={1}
        />
        <NumberInput
          label="Burn-in"
          value={config.burnInSamples}
          onChange={(v) => update({ burnInSamples: Math.max(0, Math.round(v)) })}
          disabled={disabled}
          step={10}
          min={0}
        />
      </Section>

    </div>
  );
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {title}
      </h3>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
