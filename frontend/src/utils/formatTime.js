export function formatTime(timeStr) {
  if (!timeStr) return '';
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return timeStr;

  let [_, hours, minutes] = match;
  let h = parseInt(hours, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutes} ${period}`;
}

export function formatTimeRange(start, end) {
  if (!start && !end) return '';
  if (!start) return formatTime(end);
  if (!end) return formatTime(start);
  return `${formatTime(start)} – ${formatTime(end)}`;
}
