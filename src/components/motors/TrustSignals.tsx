import { Wrench, Shield } from 'lucide-react';

export function TrustSignals() {
  return (
    <div className="space-y-2 mb-3">
      <div className="flex items-center gap-2 text-sm font-light text-gray-600">
        <Wrench className="w-4 h-4 text-gray-400" />
        <span>Expert installation available</span>
      </div>
      <div className="flex items-center gap-2 text-sm font-light text-gray-600">
        <Shield className="w-4 h-4 text-gray-400" />
        <span>60 years as your Mercury dealer</span>
      </div>
    </div>
  );
}
