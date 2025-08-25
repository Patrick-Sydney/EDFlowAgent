export function haptic() {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch (error) {
    // Silently fail if vibration not supported
  }
}

export function once<T extends (...args: any[]) => any>(fn: T, ms = 500) {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last < ms) return;
    last = now;
    return fn(...args);
  };
}