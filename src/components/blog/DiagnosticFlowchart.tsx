import { HelpCircle, Wrench } from 'lucide-react';

export interface DiagnosticStep {
  label: string;
  question: string;
  tip?: string;
}

export interface DiagnosticFlowchartProps {
  eyebrow?: string;
  heading: string;
  subhead?: string;
  steps: DiagnosticStep[];
  escalation?: {
    label?: string;
    body: string;
  };
}

function StepRow({
  step,
  index,
  isLast,
}: {
  step: DiagnosticStep;
  index: number;
  isLast: boolean;
}) {
  const number = index + 1;
  return (
    <div className="flex gap-4 md:gap-6">
      {/* Badge + connector column */}
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-repower-navy-900 text-white font-display font-semibold text-sm">
          {number}
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-repower-navy-900/20 mt-2 mb-0 min-h-[2rem]" />
        )}
      </div>
      {/* Content block */}
      <div className="flex-1 pb-6 md:pb-8">
        <div className="font-display font-bold text-base text-repower-navy-900">
          {step.label}
        </div>
        <div className="mt-1.5 flex items-start gap-2 text-sm text-repower-navy-900">
          <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-repower-navy-900/60" aria-hidden="true" />
          <span className="leading-snug">{step.question}</span>
        </div>
        {step.tip ? (
          <p className="mt-2 text-sm text-repower-navy-900/70 leading-relaxed">
            {step.tip}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function DiagnosticFlowchart({
  eyebrow,
  heading,
  subhead,
  steps,
  escalation,
}: DiagnosticFlowchartProps) {
  return (
    <div className="my-8 w-full rounded-xl border-2 border-repower-navy-900 bg-white shadow-sm overflow-hidden">
      <div className="px-6 pt-6 md:px-8 md:pt-8">
        {eyebrow ? (
          <div className="text-xs font-bold uppercase tracking-wide text-mercury-red mb-2">
            {eyebrow}
          </div>
        ) : null}
        <h3 className="font-display font-bold text-2xl text-repower-navy-900 m-0">
          {heading}
        </h3>
        {subhead ? (
          <p className="font-sans text-sm text-repower-navy-900/70 mt-2 mb-0">
            {subhead}
          </p>
        ) : null}
      </div>
      <div className="px-6 pt-4 pb-2 md:px-8 md:pt-6">
        {steps.map((step, i) => (
          <StepRow
            key={i}
            step={step}
            index={i}
            isLast={i === steps.length - 1}
          />
        ))}
      </div>
      {escalation ? (
        <div className="bg-repower-paper border-t border-repower-navy-900/15 px-6 py-5 md:px-8">
          <div className="flex items-start gap-3">
            <Wrench className="h-5 w-5 mt-0.5 flex-shrink-0 text-repower-navy-900" aria-hidden="true" />
            <div>
              {escalation.label ? (
                <div className="font-display font-semibold text-sm text-repower-navy-900">
                  {escalation.label}
                </div>
              ) : null}
              <p className="text-sm text-repower-navy-900/80 leading-relaxed mt-0.5">
                {escalation.body}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DiagnosticFlowchart;
