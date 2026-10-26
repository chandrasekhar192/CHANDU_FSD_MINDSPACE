/**
 * Date helper utilities for UTC midnight date handling.
 * All date-based queries use UTC midnight dates.
 */

// Get today's date at midnight UTC
function getUTCToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// Parse a date string to midnight UTC
function toUTCMidnight(dateStr) {
  const d = new Date(dateStr);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Get start of N days ago at midnight UTC
function daysAgoUTC(n) {
  const today = getUTCToday();
  today.setUTCDate(today.getUTCDate() - n);
  return today;
}

module.exports = { getUTCToday, toUTCMidnight, daysAgoUTC };
