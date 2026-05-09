export function clampOfflineSeconds(lastActiveTime: number, now: number, maxOfflineHours: number): number {
  if (now <= lastActiveTime) return 0;
  const rawSeconds = Math.floor((now - lastActiveTime) / 1000);
  return Math.min(rawSeconds, maxOfflineHours * 3600);
}
