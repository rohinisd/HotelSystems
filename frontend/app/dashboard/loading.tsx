export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="h-4 w-64 rounded bg-slate-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-white p-6">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="mt-3 h-8 w-32 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border bg-white p-6">
        <div className="h-5 w-40 rounded bg-slate-200 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
