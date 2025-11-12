import { Ruler, Power, Gauge, Settings } from 'lucide-react';
import { decodeModelName } from '@/lib/motor-helpers';

interface MotorSpecBadgesProps {
  title: string;
  hp?: number | string;
}

export function MotorSpecBadges({ title, hp }: MotorSpecBadgesProps) {
  const motorHP = typeof hp === 'string' ? parseInt(hp) : hp || 0;
  const decoded = decodeModelName(title, motorHP);
  
  // Extract key specifications
  const shaftInfo = decoded.find(item => 
    ['L', 'XL', 'S', 'XXL', 'MLH', 'MXL', 'XXS'].some(code => item.code === code)
  );
  
  const startInfo = decoded.find(item => item.code === 'M' || item.code === 'E');
  const controlInfo = decoded.find(item => item.code === 'H');
  const hasPowerTrim = motorHP >= 40;
  
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {/* Shaft Length Badge */}
      {shaftInfo && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-light text-gray-600">
          <Ruler className="w-3 h-3 text-gray-500" />
          <span>{shaftInfo.meaning}</span>
        </div>
      )}
      
      {/* Starting Type Badge */}
      {startInfo && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-light text-gray-600">
          <Power className="w-3 h-3 text-gray-500" />
          <span>{startInfo.meaning}</span>
        </div>
      )}
      
      {/* Control Type Badge */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-light text-gray-600">
        <Gauge className="w-3 h-3 text-gray-500" />
        <span>{controlInfo ? 'Tiller Handle' : 'Remote Control'}</span>
      </div>
      
      {/* Power Trim Badge (40+ HP) */}
      {hasPowerTrim && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-light text-gray-600">
          <Settings className="w-3 h-3 text-gray-500" />
          <span>Power Trim & Tilt</span>
        </div>
      )}
    </div>
  );
}
