// Bangladesh-correct "today" and "now" helpers.
// Why this file exists: `new Date().toISOString().slice(0,10)` gives the UTC date.
// Between 00:00 and 05:59 Bangladesh time, UTC is still on the PREVIOUS day, so
// anything computing "today" that way shows yesterday's date for a few hours
// every night. Always use these helpers instead of building the date by hand.

const DHAKA_TZ = "Asia/Dhaka";

// "2026-09-25"
function dhakaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DHAKA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// "14:05" (24h)
function dhakaTime() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: DHAKA_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

module.exports = { dhakaToday, dhakaTime, DHAKA_TZ };