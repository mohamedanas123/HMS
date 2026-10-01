/**
 * Converts 24-hour / railway time string (e.g. "09:00", "09:00:00", "14:30")
 * to clean 12-hour AM/PM format (e.g. "9:00 AM", "2:30 PM").
 *
 * @param {string} timeStr - Time string in HH:mm or HH:mm:ss format
 * @returns {string} Formatted 12-hour time string with AM/PM
 */
export function formatTime(timeStr) {
  if (!timeStr) return '';
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return timeStr;

  let [_, hours, minutes] = match;
  let h = parseInt(hours, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12; // convert 0 to 12, 13 to 1, etc.
  return `${h}:${minutes} ${period}`;
}

/**
 * Formats a time range into 12-hour AM/PM format.
 * Example: formatTimeRange("09:00", "17:00") => "9:00 AM – 5:00 PM"
 *
 * @param {string} start - Start time
 * @param {string} end - End time
 * @returns {string}
 */
export function formatTimeRange(start, end) {
  if (!start && !end) return '';
  if (!start) return formatTime(end);
  if (!end) return formatTime(start);
  return `${formatTime(start)} – ${formatTime(end)}`;
}
