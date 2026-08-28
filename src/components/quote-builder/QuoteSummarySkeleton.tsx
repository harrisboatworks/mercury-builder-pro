import React from 'react';

export function QuoteSummarySkeleton() {
  return (
    <div className="min-h-screen bg-repower-paper animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white border-b border-repower-navy-900/10 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="h-8 w-8 bg-repower-cream rounded" />
          <div className="h-6 w-48 bg-repower-cream rounded" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Motor header skeleton */}
            <div className="bg-white rounded-2xl p-6 space-y-4">
              <div className="flex gap-6">
                <div className="w-48 h-48 bg-repower-cream rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-8 w-3/4 bg-repower-cream rounded" />
                  <div className="h-4 w-1/2 bg-repower-cream rounded" />
                  <div className="flex gap-2 mt-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-6 w-20 bg-repower-paper rounded-full" />
                    ))}
                  </div>
                  <div className="h-10 w-32 bg-repower-cream rounded mt-4" />
                </div>
              </div>
            </div>

            {/* Package cards skeleton */}
            <div className="space-y-4">
              <div className="h-6 w-48 bg-repower-cream rounded" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-repower-navy-900/10 space-y-4">
                    <div className="h-5 w-24 bg-repower-cream rounded" />
                    <div className="h-8 w-28 bg-repower-cream rounded" />
                    <div className="h-4 w-20 bg-repower-paper rounded" />
                    <div className="space-y-2 mt-4">
                      {[1, 2, 3, 4].map(j => (
                        <div key={j} className="flex items-center gap-2">
                          <div className="h-4 w-4 bg-repower-paper rounded-full" />
                          <div className="h-4 flex-1 bg-repower-paper rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing table skeleton */}
            <div className="bg-white rounded-2xl p-6 space-y-4">
              <div className="h-6 w-40 bg-repower-cream rounded" />
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex justify-between py-3 border-b border-repower-navy-900/10">
                  <div className="h-4 w-1/3 bg-repower-paper rounded" />
                  <div className="h-4 w-20 bg-repower-paper rounded" />
                </div>
              ))}
              <div className="flex justify-between pt-4">
                <div className="h-6 w-24 bg-repower-cream rounded" />
                <div className="h-6 w-28 bg-repower-cream rounded" />
              </div>
            </div>

            {/* Accessory breakdown skeleton */}
            <div className="bg-white rounded-2xl p-6 space-y-4">
              <div className="h-6 w-48 bg-repower-cream rounded" />
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between py-3 border-b border-repower-navy-900/10">
                  <div className="space-y-1">
                    <div className="h-4 w-40 bg-repower-paper rounded" />
                    <div className="h-3 w-56 bg-repower-paper rounded" />
                  </div>
                  <div className="h-4 w-16 bg-repower-paper rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Sticky summary column skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 space-y-4 sticky top-24">
              <div className="h-6 w-32 bg-repower-cream rounded" />
              <div className="h-10 w-full bg-repower-cream rounded" />
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-24 bg-repower-paper rounded" />
                    <div className="h-4 w-16 bg-repower-paper rounded" />
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-repower-navy-900/10">
                <div className="flex justify-between">
                  <div className="h-5 w-20 bg-repower-cream rounded" />
                  <div className="h-5 w-24 bg-repower-cream rounded" />
                </div>
              </div>
              <div className="h-12 w-full bg-repower-navy-900 rounded-lg mt-4" />
              <div className="h-10 w-full bg-repower-paper rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuoteSummarySkeleton;
