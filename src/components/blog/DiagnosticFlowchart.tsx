import { HelpCircle, Wrench, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

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

// Heuristic: if escalation.body contains a phone number, render it as a tel: link.
function renderEscalationBody(body: string) {
  const match = body.match(/(\+?\d[\d\s().-]{8,}\d)/);
  if (!match) return <span>{body}</span>;
  const raw = match[1];
  const tel = raw.replace(/[^\d+]/g, '');
  const [before, after] = body.split(raw);
  return (
    <>
      {before}
      <a
        href={`tel:${tel}`}
        className="font-display font-semibold text-base underline decoration-white/40 underline-offset-2 hover:decoration-white"
      >
        {raw}
      </a>
      {after}
    </>
  );
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
    <motion.div
      initial={{ y: 8 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="flex gap-4 md:gap-6"
    >
      {/* Badge + connector column */}
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-mercury-red text-white font-display font-semibold text-base tabular-nums shadow-sm">
          {number}
        </div>
        {!isLast && (
          <div className="flex-1 border-l-2 border-l-repower-navy-900/30 mt-2 mb-0 min-h-[2rem]" />
        )}
      </div>
      {/* Content block */}
      <div className="flex-1 pb-6 md:pb-8">
        <div className="font-display font-bold text-base text-repower-navy-900 tracking-tight text-balance">
          {step.label}
        </div>
        <div className="mt-1.5 flex items-start gap-2 text-sm text-repower-navy-900">
          <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-repower-navy-900/60" aria-hidden="true" />
          <span className="leading-snug">{step.question}</span>
        </div>
        {step.tip ? (
          <div className="mt-2 flex items-start gap-2 bg-yellow-50 border-l-2 border-l-yellow-400 rounded-r-md px-3 py-2">
            <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-600" aria-hidden="true" />
            <p className="text-sm text-repower-navy-900/80 leading-relaxed m-0">
              {step.tip}
            </p>
          </div>
        ) : null}
      </div>
    </motion.div>
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
          <div className="text-[11px] uppercase tracking-[0.14em] font-medium text-muted-foreground mb-2">
            {eyebrow}
          </div>
        ) : null}
        <h3 className="font-display font-bold text-2xl text-repower-navy-900 m-0 text-balance tracking-tight">
          {heading}
        </h3>
        {subhead ? (
          <p className="font-sans text-sm text-muted-foreground leading-relaxed mt-2 mb-0">
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
        <div className="bg-repower-navy-900 text-white border-t border-repower-navy-900/15 px-6 py-5 md:px-8">
          <div className="flex items-start gap-3">
            <Wrench className="h-5 w-5 mt-0.5 flex-shrink-0 text-white" aria-hidden="true" />
            <div>
              {escalation.label ? (
                <div className="font-display font-semibold text-sm text-white">
                  {escalation.label}
                </div>
              ) : null}
              <p className="text-sm text-white/90 leading-relaxed mt-0.5">
                {renderEscalationBody(escalation.body)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DiagnosticFlowchart;
