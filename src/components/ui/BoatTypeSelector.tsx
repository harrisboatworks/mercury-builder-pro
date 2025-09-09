"use client";

interface BoatType {
  id: string;
  label: string;
  image: string;
}

const boatTypes: BoatType[] = [
  { id: 'utility-vhull', label: 'Utility V-Hull', image: '/boat-types/utility-vhull.svg' },
  { id: 'v-hull-fishing', label: 'V-Hull Fishing', image: '/boat-types/v-hull-fishing.png' },
  { id: 'bass-boat', label: 'Bass Boat', image: '/boat-types/bass-boat.svg' },
  { id: 'pontoon', label: 'Pontoon', image: '/boat-types/pontoon.svg' },
  { id: 'center-console', label: 'Center Console', image: '/boat-types/center-console.svg' },
  { id: 'jon-boat', label: 'Jon Boat', image: '/boat-types/jon-boat.svg' },
  { id: 'aluminum-fishing', label: 'Aluminum Fishing', image: '/boat-types/aluminum-fishing.svg' },
  { id: 'bowrider', label: 'Bowrider', image: '/boat-types/bowrider.svg' }
];

interface BoatTypeSelectorProps {
  selectedType: string | null;
  onTypeSelect: (type: string) => void;
  onNotSure: () => void;
}

export default function BoatTypeSelector({ selectedType, onTypeSelect, onNotSure }: BoatTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {boatTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onTypeSelect(type.id)}
            className={`p-fade aspect-square rounded-xl border p-3 transition-all ${
              selectedType === type.id
                ? 'border-blue-600 ring-2 ring-blue-600/15 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="h-full flex flex-col items-center justify-center space-y-2">
              <img 
                src={type.image} 
                alt={type.label}
                className="w-8 h-8 object-contain"
              />
              <span className="text-xs font-medium text-center leading-tight">
                {type.label}
              </span>
            </div>
          </button>
        ))}
      </div>
      
      <button
        onClick={onNotSure}
        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        I'm not sure
      </button>
    </div>
  );
}