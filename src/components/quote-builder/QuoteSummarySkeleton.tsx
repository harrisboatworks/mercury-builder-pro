import React from 'react';

export function QuoteSummarySkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-100 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 rounded" />
          <div className="h-6 w-48 bg-gray-200 rounded" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Motor header skeleton */}
            <div className="bg-white rounded-2xl p-6 space-y-4">
              <div className="flex gap-6">
                <div className="w-48 h-48 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-8 w-3/4 bg-gray-200 rounded" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded" />
                  <div className="flex gap-2 mt-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-6 w-20 bg-gray-100 rounded-full" />
                    ))}
                  </div>
                  <div className="h-10 w-32 bg-gray-200 rounded mt-4" />
                </div>
              </div>
            </div>

            {/* Package cards skeleton */}
            <div className="space-y-4">
              <div className="h-6 w-48 bg-gray-200 rounded" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
                    <div className="h-5 w-24 bg-gray-200 rounded" />
                    <div className="h-8 w-28 bg-gray-200 rounded" />
                    <div className="h-4 w-20 bg-gray-100 rounded" />
                    <div className="space-y-2 mt-4">
                      {[1, 2, 3, 4].map(j => (
                        <div key={j} className="flex items-center gap-2">
                          <div className="h-4 w-4 bg-gray-100 rounded-full" />
                          <div className="h-4 flex-1 bg-gray-100 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing table skeleton */}
            <div className="bg-white rounded-2xl p-6 space-y-4">
              <div className="h-6 w-40 bg-gray-200 rounded" />
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex justify-between py-3 border-b border-gray-50">
                  <div className="h-4 w-1/3 bg-gray-100 rounded" />
                  <div className="h-4 w-20 bg-gray-100 rounded" />
                </div>
              ))}
              <div className="flex justify-between pt-4">
                <div className="h-6 w-24 bg-gray-200 rounded" />
                <div className="h-6 w-28 bg-gray-200 rounded" />
              </div>
            </div>

            {/* Accessory breakdown skeleton */}
            <div className="bg-white rounded-2xl p-6 space-y-4">
              <div className="h-6 w-48 bg-gray-200 rounded" />
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between py-3 border-b border-gray-50">
                  <div className="space-y-1">
                    <div className="h-4 w-40 bg-gray-100 rounded" />
                    <div className="h-3 w-56 bg-gray-50 rounded" />
                  </div>
                  <div className="h-4 w-16 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Sticky summary column skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 space-y-4 sticky top-24">
              <div className="h-6 w-32 bg-gray-200 rounded" />
              <div className="h-10 w-full bg-gray-200 rounded" />
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-24 bg-gray-100 rounded" />
                    <div className="h-4 w-16 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between">
                  <div className="h-5 w-20 bg-gray-200 rounded" />
                  <div className="h-5 w-24 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="h-12 w-full bg-gray-900 rounded-lg mt-4" />
              <div className="h-10 w-full bg-gray-100 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuoteSummarySkeleton;
