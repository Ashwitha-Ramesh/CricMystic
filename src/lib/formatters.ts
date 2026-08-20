/**
 * CricMystic Centralized Number & Statistics Formatting System
 * Eliminates floating-point smudges, NaN/undefined artifacts, and card text overflows.
 */

/**
 * Format integer numbers with localized commas (e.g., 7028 -> "7,028")
 */
export function formatNumber(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '0';
  return Math.round(num).toLocaleString('en-IN');
}

/**
 * Format runs as standard integer with commas
 */
export function formatRuns(val: number | string | null | undefined): string {
  return formatNumber(val);
}

/**
 * Format percentage with consistent precision (e.g. 50.438912 -> "50.4%")
 */
export function formatPercentage(val: number | string | null | undefined, decimals: number = 1): string {
  if (val === null || val === undefined || val === '') return '0.0%';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '0.0%';
  return `${num.toFixed(decimals)}%`;
}

/**
 * Format decimal value with controlled precision (e.g. 28.494979 -> "28.5")
 */
export function formatDecimal(val: number | string | null | undefined, decimals: number = 1): string {
  if (val === null || val === undefined || val === '') return '0.0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '0.0';
  return num.toFixed(decimals);
}

/**
 * Format batting average (e.g. 31.4398 -> "31.4", or "-" if zero dismissals/matches)
 */
export function formatAverage(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num <= 0) return '-';
  return num.toFixed(1);
}

/**
 * Format batting strike rate (e.g. 133.080855 -> "133.1")
 */
export function formatStrikeRate(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '0.0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '0.0';
  return num.toFixed(1);
}

/**
 * Format bowling economy rate (e.g. 7.8543 -> "7.85")
 */
export function formatEconomy(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '0.00';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
}

/**
 * Format legal balls or float overs into standard cricket overs notation (e.g. 120 -> "20.0" or 95 -> "15.5")
 */
export function formatOvers(ballsOrOvers: number | string | null | undefined): string {
  if (ballsOrOvers === null || ballsOrOvers === undefined || ballsOrOvers === '') return '0.0';
  if (typeof ballsOrOvers === 'string' && ballsOrOvers.includes('.')) {
    return ballsOrOvers;
  }
  const balls = typeof ballsOrOvers === 'string' ? parseInt(ballsOrOvers, 10) : ballsOrOvers;
  if (isNaN(balls) || balls <= 0) return '0.0';
  const fullOvers = Math.floor(balls / 6);
  const remBalls = balls % 6;
  return `${fullOvers}.${remBalls}`;
}

/**
 * Format Win Rate as percentage (e.g. 0.5432 -> "54.3%")
 */
export function formatWinRate(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '0.0%';
  let num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '0.0%';
  if (num <= 1 && num > 0) num = num * 100;
  return `${num.toFixed(1)}%`;
}
