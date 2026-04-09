export default function SkeletonLoader() {
  return (
    <div className="space-y-6 mt-8 animate-pulse">
      {/* Dashboard skeleton */}
      <div className="glass rounded-2xl p-8">
        <div className="skeleton h-6 w-48 mb-6" />
        <div className="skeleton h-10 w-64 mb-6" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="text-center">
              <div className="skeleton h-4 w-16 mx-auto mb-2" />
              <div className="skeleton h-8 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <div className="skeleton h-5 w-40 mb-4" />
          <div className="skeleton h-64 w-full rounded-xl" />
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="skeleton h-5 w-40 mb-4" />
          <div className="skeleton h-64 w-full rounded-xl" />
        </div>
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass p-5 rounded-xl">
            <div className="skeleton h-3 w-20 mx-auto mb-3" />
            <div className="skeleton h-8 w-16 mx-auto" />
          </div>
        ))}
      </div>

      {/* Prediction cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass rounded-2xl p-6">
            <div className="flex justify-between mb-3">
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-5 w-14 rounded-full" />
            </div>
            <div className="skeleton h-16 w-16 rounded-lg mb-3" />
            <div className="skeleton h-5 w-full mb-2" />
            <div className="skeleton h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
