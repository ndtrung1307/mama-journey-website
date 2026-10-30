(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.MamaDueDate = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var DUE_DAYS = 280;
  var MIN_CYCLE = 21;
  var MAX_CYCLE = 35;
  var MAX_GA_DAYS = 44 * 7;

  function parseISODate(value) {
    if (typeof value !== "string") {
      return null;
    }
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      return null;
    }
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    return fromParts(year, month, day);
  }

  function fromParts(year, month, day) {
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      return null;
    }
    var utc = Date.UTC(year, month - 1, day);
    var date = new Date(utc);
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }
    return { year: year, month: month, day: day };
  }

  function addDays(parts, days) {
    var utc = Date.UTC(parts.year, parts.month - 1, parts.day + days);
    var date = new Date(utc);
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate()
    };
  }

  function diffDays(from, to) {
    var start = Date.UTC(from.year, from.month - 1, from.day);
    var end = Date.UTC(to.year, to.month - 1, to.day);
    return Math.round((end - start) / 86400000);
  }

  function normalizeCycle(value) {
    if (value == null || value === "") {
      return 28;
    }
    var cycle = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(cycle) || cycle < MIN_CYCLE || cycle > MAX_CYCLE) {
      return null;
    }
    return cycle;
  }

  function calculate(input) {
    var source = input || {};
    if (source.lmp == null || source.lmp === "") {
      return { ok: false, error: "empty" };
    }
    var lmp = typeof source.lmp === "string" ? parseISODate(source.lmp) : fromParts(source.lmp.year, source.lmp.month, source.lmp.day);
    if (!lmp) {
      return { ok: false, error: "invalid" };
    }
    var cycle = normalizeCycle(source.cycleLength);
    if (cycle == null) {
      return { ok: false, error: "cycle" };
    }
    var today = source.today;
    if (!today || !fromParts(today.year, today.month, today.day)) {
      return { ok: false, error: "invalid" };
    }
    var elapsed = diffDays(lmp, today);
    if (elapsed < 0) {
      return { ok: false, error: "future" };
    }
    if (elapsed > MAX_GA_DAYS) {
      return { ok: false, error: "range" };
    }
    var adjustment = cycle - 28;
    var dueDate = addDays(lmp, DUE_DAYS + adjustment);
    var remaining = diffDays(today, dueDate);
    var status = remaining > 0 ? "upcoming" : remaining === 0 ? "today" : "past";
    return {
      ok: true,
      lmp: lmp,
      dueDate: dueDate,
      cycleLength: cycle,
      adjustmentDays: adjustment,
      gestationalWeeks: Math.floor(elapsed / 7),
      gestationalDays: elapsed % 7,
      daysRemaining: remaining,
      status: status
    };
  }

  function ageFromDueDate(input) {
    var source = input || {};
    if (source.due == null || source.due === "") {
      return { ok: false, error: "empty" };
    }
    var dueDate =
      typeof source.due === "string"
        ? parseISODate(source.due)
        : fromParts(source.due.year, source.due.month, source.due.day);
    if (!dueDate) {
      return { ok: false, error: "invalid" };
    }
    var today = source.today;
    if (!today || !fromParts(today.year, today.month, today.day)) {
      return { ok: false, error: "invalid" };
    }
    var daysUntilDue = diffDays(today, dueDate);
    var elapsed = DUE_DAYS - daysUntilDue;
    if (elapsed < 0) {
      return { ok: false, error: "future" };
    }
    if (elapsed > MAX_GA_DAYS) {
      return { ok: false, error: "range" };
    }
    return {
      ok: true,
      dueDate: dueDate,
      gestationalWeeks: Math.floor(elapsed / 7),
      gestationalDays: elapsed % 7,
      daysRemaining: daysUntilDue,
      source: "due"
    };
  }

  function estimateGestationalAge(input) {
    var source = input || {};
    var today = source.today;
    if (source.mode === "due") {
      return ageFromDueDate({ due: source.date, today: today });
    }
    if (source.mode === "lmp") {
      var fromLmp = calculate({
        lmp: source.date,
        cycleLength: 28,
        today: today
      });
      if (fromLmp.ok) {
        fromLmp.source = "lmp";
      }
      return fromLmp;
    }
    return { ok: false, error: "invalid" };
  }

  return {
    DUE_DAYS: DUE_DAYS,
    MIN_CYCLE: MIN_CYCLE,
    MAX_CYCLE: MAX_CYCLE,
    MAX_GA_DAYS: MAX_GA_DAYS,
    parseISODate: parseISODate,
    addDays: addDays,
    diffDays: diffDays,
    calculate: calculate,
    ageFromDueDate: ageFromDueDate,
    estimateGestationalAge: estimateGestationalAge
  };
});
