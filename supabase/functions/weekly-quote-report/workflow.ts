import { parseReport, renderReport } from './report.ts';

export function reportingEnd(now: Date): string {
  // Matches the existing Monday 07:00 UTC cron, including delayed invocations.
  const end = new Date(now);
  end.setUTCHours(7, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() - (end.getUTCDay() + 6) % 7);
  if (end > now) end.setUTCDate(end.getUTCDate() - 7);
  return end.toISOString();
}
export interface Dependencies {
  aggregate: (end: string) => Promise<unknown>;
  email: (report: ReturnType<typeof renderReport>) => Promise<boolean>;
  sms: (report: ReturnType<typeof renderReport>) => Promise<boolean>;
  smsConfigured: boolean;
}
export async function runReport(end: string, dryRun: boolean, dependencies: Dependencies) {
  const report = parseReport(await dependencies.aggregate(end));
  const rendered = renderReport(report);
  if (dryRun) return { success: true, dry_run: true, report, ...rendered };
  let emailAccepted = false;
  let smsAccepted = false;
  // One provider exception must not prevent the other attempt or erase its result.
  try { emailAccepted = await dependencies.email(rendered); } catch { /* reported below */ }
  if (dependencies.smsConfigured) {
    try { smsAccepted = await dependencies.sms(rendered); } catch { /* reported below */ }
  }
  return {
    success: emailAccepted && (!dependencies.smsConfigured || smsAccepted), report,
    delivery: { emailAccepted, smsAccepted, smsConfigured: dependencies.smsConfigured, delivered: 'not_verified' },
  };
}
