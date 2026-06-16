import * as React from 'react';

export function useSidebarExpanded(storageKey: string, defaultExpanded = true) {
  const [isExpanded, setIsExpanded] = React.useState(() => {
    if (typeof window === 'undefined') return defaultExpanded;
    const saved = localStorage.getItem(storageKey);
    return saved === null ? defaultExpanded : saved === 'true';
  });

  const toggle = React.useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      localStorage.setItem(storageKey, String(next));
      return next;
    });
  }, [storageKey]);

  return { isExpanded, toggle };
}
