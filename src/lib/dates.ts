const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Formats "YYYY" or "YYYY-MM" as "2021" or "Feb 2021". */
export function formatPartialDate(value: string): string {
  const [year, month] = value.split('-');
  if (!year) return value;
  if (!month) return year;
  const name = MONTHS[Number(month) - 1];
  return name ? `${name} ${year}` : year;
}

/** Formats a start/end pair as "Feb 2021 – Oct 2022", a single date, or an empty string. */
export function formatDateRange(start?: string, end?: string): string {
  if (start && end) return `${formatPartialDate(start)} \u2013 ${formatPartialDate(end)}`;
  if (start) return formatPartialDate(start);
  if (end) return formatPartialDate(end);
  return '';
}
