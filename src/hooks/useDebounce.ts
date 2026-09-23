import { useState, useEffect } from 'react';

/**
 * Delays updating the returned value until `delay` ms have passed without
 * the input changing. Useful for search inputs to avoid firing API calls on
 * every keystroke.
 */
export function useDebounce<T>(value: T, delay: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
