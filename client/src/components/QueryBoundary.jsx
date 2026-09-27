import { ErrorState, PageLoader } from "./Loader";

export default function QueryBoundary({
  state,
  children,
  loading,
  error,
  isEmpty,
  empty,
  className,
}) {
  if (!state) return children ?? null;

  if (state.error && state.data === undefined) {
    return error ?? <ErrorState error={state.error} onRetry={state.refetch} />;
  }

  if (state.loading) {
    return loading ?? <PageLoader className={className} />;
  }

  if (isEmpty && state.data !== undefined && !isEmpty(state.data)) {
    return empty ?? null;
  }

  return children;
}
