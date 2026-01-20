/**
 * Converte string no formato brasileiro dd/MM/yyyy para Date
 * @param dateString Data no formato "dd/MM/yyyy"
 * @returns Date object ou null se inválido
 */
export function parseBrazilianDate(dateString: string): Date | null {
  if (!dateString) return null;

  const parts = dateString.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Mês começa em 0 no JavaScript
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  const date = new Date(year, month, day);

  // Valida se a data é válida
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Converte Date para string no formato brasileiro dd/MM/yyyy
 * @param date Date object
 * @returns String no formato "dd/MM/yyyy"
 */
export function formatToBrazilianDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}
