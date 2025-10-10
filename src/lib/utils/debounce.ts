export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;
  
  const debounced = (...args: Parameters<T>) => {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
      timeout = undefined;
    }, wait);
  };
  
  // Add cleanup method to prevent memory leaks
  (debounced as unknown as { cancel: () => void }).cancel = () => {
    if (timeout !== undefined) {
      clearTimeout(timeout);
      timeout = undefined;
    }
  };
  
  return debounced;
}
