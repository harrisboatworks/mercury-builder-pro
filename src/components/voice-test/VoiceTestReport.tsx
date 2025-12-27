import React, { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StepStatus } from './VoiceTestStep';

interface TestResult {
  step: number;
  title: string;
  status: StepStatus;
  details?: string;
}

interface VoiceTestReportProps {
  results: TestResult[];
  recommendation?: string;
}

export const VoiceTestReport: React.FC<VoiceTestReportProps> = ({
  results,
  recommendation,
}) => {
  const [copied, setCopied] = useState(false);

  const generateReport = (): string => {
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').split('.')[0];
    
    const browser = navigator.userAgent;
    const platform = navigator.platform;
    
    const statusEmoji = (status: StepStatus) => {
      switch (status) {
        case 'passed': return '✅';
        case 'failed': return '❌';
        case 'skipped': return '⏭️';
        case 'running': return '⏳';
        default: return '○';
      }
    };

    const lines = [
      '========== HARRIS VOICE DIAGNOSTICS ==========',
      `Date: ${dateStr}`,
      `Browser: ${browser}`,
      `Platform: ${platform}`,
      '',
      ...results.map(r => [
        `${statusEmoji(r.status)} STEP ${r.step}: ${r.title}`,
        r.details ? `   ${r.details}` : null,
      ].filter(Boolean).join('\n')),
      '',
      recommendation ? `RECOMMENDATION: ${recommendation}` : null,
      '==========================================',
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleCopy = async () => {
    const report = generateReport();
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const report = generateReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-diagnostics-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const passedCount = results.filter(r => r.status === 'passed').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground">Diagnostic Report</h3>
          <p className="text-sm text-muted-foreground">
            {passedCount} passed, {failedCount} failed
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copy Report
              </>
            )}
          </Button>
        </div>
      </div>
      
      {recommendation && (
        <div className="mt-3 p-3 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            💡 {recommendation}
          </p>
        </div>
      )}
    </div>
  );
};
