import { useCallback, useEffect, useRef, useState } from "react";
import queryCache from "../services/queryClient";

export default function useMutation(mutationFn, options = {}) {
  const { onSuccess, onError, onSettled, invalidateKeys = [] } = options;

  const [pending, setPending] = useState(false);

  const mutationRef = useRef(mutationFn);
  const handlersRef = useRef({ onSuccess, onError, onSettled, invalidateKeys });

  useEffect(() => {
    mutationRef.current = mutationFn;
    handlersRef.current = { onSuccess, onError, onSettled, invalidateKeys };
  });

  const run = useCallback(async (...args) => {
    const { onSuccess: success, onError: failure, onSettled: settled, invalidateKeys: keys } =
      handlersRef.current;

    setPending(true);
    try {
      const result = await mutationRef.current(...args);
      if (keys.length) await queryCache.invalidate(...keys);
      success?.(result, ...args);
      return result;
    } catch (error) {
      failure?.(error, ...args);
      throw error;
    } finally {
      setPending(false);
      settled?.();
    }
  }, []);

  return { run, pending };
}
