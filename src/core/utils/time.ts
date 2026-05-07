export function clampOfflineSeconds(lastActiveTime: number, now: number, maxOfflineHours: number): number {
  if (now <= lastActiveTime) return 0;
  const rawSeconds = Math.floor((now - lastActiveTime) / 1000);
  return Math.min(rawSeconds, maxOfflineHours * 3600);
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const restSeconds = seconds % 60;

  if (hours > 0) return `${hours} 小时 ${minutes} 分钟`;
  if (minutes > 0) return `${minutes} 分钟 ${restSeconds} 秒`;
  return `${restSeconds} 秒`;
}
