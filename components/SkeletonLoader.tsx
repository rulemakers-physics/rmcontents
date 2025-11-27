// components/SkeletonLoader.tsx
export function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-12 bg-slate-200 rounded-md w-full"></div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-slate-100 rounded-md w-full border border-slate-200"></div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white p-6 rounded-2xl border border-slate-200 h-64">
      <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-slate-100 rounded w-full mb-2"></div>
      <div className="h-4 bg-slate-100 rounded w-2/3"></div>
    </div>
  );
}