const MONTHS = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

/**
 * Parses "Saturday, 28 February 2026 at 2:00 PM" into a Date object.
 */
export function parseAppointmentDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const [datePart, timePart] = dateStr.split(' at ');
  if (!datePart || !timePart) return null;

  // Strip weekday: "Saturday, 28 February 2026" → "28 February 2026"
  const withoutWeekday = datePart.includes(',') ? datePart.split(', ').slice(1).join(', ') : datePart;
  const tokens = withoutWeekday.trim().split(/\s+/);
  if (tokens.length < 3) return null;

  const day = parseInt(tokens[0], 10);
  const month = MONTHS[tokens[1].toLowerCase()];
  const year = parseInt(tokens[2], 10);
  if (isNaN(day) || month === undefined || isNaN(year)) return null;

  // Parse time: "2:00 PM"
  const timeMatch = timePart.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!timeMatch) return null;

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const period = timeMatch[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return new Date(year, month, day, hours, minutes, 0, 0);
}

/**
 * Returns true if date is in the future and within N hours from now.
 */
export function isWithinHours(date, hours) {
  if (!date) return false;
  const now = Date.now();
  const target = date.getTime();
  return target > now && target - now <= hours * 60 * 60 * 1000;
}

/**
 * Returns true if date is in the future.
 */
export function isUpcoming(date) {
  if (!date) return false;
  return date.getTime() > Date.now();
}

/**
 * Returns relative time string like "in 2h 30m", "in 45 minutes", "tomorrow".
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return 'now';

  const totalMinutes = Math.round(diffMs / 60000);
  if (totalMinutes < 60) return `in ${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours < 24) {
    return minutes > 0 ? `in ${hours}h ${minutes}m` : `in ${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}
