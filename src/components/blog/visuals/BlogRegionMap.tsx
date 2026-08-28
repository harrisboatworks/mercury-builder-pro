import React from 'react';

export interface BlogRegionMapProps {
  origin: string;
  destination: string;
  driveTime: string;
  note?: string;
}

export function BlogRegionMap({ origin, destination, driveTime, note }: BlogRegionMapProps) {
  const titleId = React.useId();
  return (
    <figure
      role="group"
      aria-labelledby={titleId}
      className="not-prose my-8 rounded-2xl border border-repower-navy-900/10 bg-repower-paper p-5 md:p-6 shadow-sm print:shadow-none print:border-black/40"
    >
      <figcaption
        id={titleId}
        className="font-display text-lg md:text-xl font-semibold text-repower-navy-900 mb-4"
      >
        {origin} → {destination}
      </figcaption>

      <div className="rounded-xl bg-repower-cream/60 p-4 md:p-6">
        <svg
          viewBox="0 0 600 220"
          role="img"
          aria-label={`Schematic route from ${origin} to ${destination}, ${driveTime}`}
          className="w-full h-auto"
        >
          {/* Rice Lake schematic */}
          <ellipse cx="430" cy="155" rx="135" ry="22" fill="#cfe0ea" stroke="#7ea4bd" strokeWidth="1.5" />
          <text x="430" y="200" textAnchor="middle" fontSize="11" fill="#0b2a3d" fontStyle="italic">
            Rice Lake
          </text>

          {/* Route line */}
          <path
            d="M 90 80 C 220 70, 320 130, 430 140"
            stroke="#C8102E"
            strokeWidth="3"
            strokeDasharray="7 6"
            fill="none"
            strokeLinecap="round"
          />

          {/* Origin dot */}
          <circle cx="90" cy="80" r="9" fill="#050E1C" />
          <circle cx="90" cy="80" r="3" fill="#FAF8F4" />
          <text x="90" y="58" textAnchor="middle" fontSize="13" fontWeight="700" fill="#050E1C">
            {origin}
          </text>

          {/* Destination pin */}
          <g transform="translate(430 140)">
            <path
              d="M0 -22 C 11 -22, 18 -14, 18 -5 C 18 8, 0 22, 0 22 C 0 22, -18 8, -18 -5 C -18 -14, -11 -22, 0 -22 Z"
              fill="#C8102E"
              stroke="#7a0a1c"
              strokeWidth="1.5"
            />
            <circle cx="0" cy="-6" r="5" fill="#FAF8F4" />
          </g>
          <text x="430" y="115" textAnchor="middle" fontSize="12" fontWeight="700" fill="#050E1C">
            Harris Boat Works
          </text>

          {/* Drive time pill */}
          <g transform="translate(260 95)">
            <rect x="-70" y="-14" width="140" height="28" rx="14" fill="#050E1C" />
            <text x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#FAF8F4">
              {driveTime}
            </text>
          </g>
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-repower-navy-900/80">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-repower-navy-900" />
          {origin}
        </span>
        <span aria-hidden="true" className="text-repower-navy-900/40">→</span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-repower-mercury-red" />
          {destination}
        </span>
        <span className="font-semibold text-repower-navy-900">{driveTime}</span>
      </div>
      {note && (
        <p className="mt-2 text-xs md:text-sm text-repower-navy-900/65 italic">{note}</p>
      )}
    </figure>
  );
}

export default BlogRegionMap;
