export function formatEntryDate(
  value: string,
  timezone: string | null = null,
): string {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(timezone ? { timeZone: timezone } : {}),
  }
  try {
    return new Intl.DateTimeFormat('es-MX', options).format(new Date(value))
  } catch {
    delete options.timeZone
    return new Intl.DateTimeFormat('es-MX', options).format(new Date(value))
  }
}
