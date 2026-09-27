const SPINNER_CLASS =
  "animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full";

export function Spinner({ className = "w-5 h-5 border-2" }) {
  return <div className={`${SPINNER_CLASS} ${className}`} />;
}

export function PageLoader({ label, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      <Spinner />
      {label ? <p className="mt-3 text-sm text-gray-400">{label}</p> : null}
    </div>
  );
}

export function InlineLoader({ label, className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-6 ${className}`}>
      <Spinner className="w-5 h-5 border-2" />
      {label ? <span className="text-sm text-gray-400">{label}</span> : null}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

export function TableSkeleton({ rows = 6, cols = 4 }) {
  return (
    <div className="space-y-3 p-1">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: cols }).map((__, colIndex) => (
            <Skeleton
              key={colIndex}
              className={`h-9 ${colIndex === 0 ? "w-1/4" : "flex-1"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ cards = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title = "Nothing here yet", message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
      {icon ? <div className="mb-3 text-gray-300">{icon}</div> : null}
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {message ? <p className="mt-1 max-w-sm text-sm text-gray-400">{message}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

const describeError = (error) => {
  if (!error) return "Something went wrong while loading data.";
  return (
    error.response?.data?.message ||
    error.message ||
    "Something went wrong while loading data."
  );
};

export function ErrorState({ error, onRetry, title = "Couldn't load this" }) {
  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-center">
      <p className="text-sm font-semibold text-amber-800">{title}</p>
      <p className="mt-1 text-sm text-amber-700">{describeError(error)}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
