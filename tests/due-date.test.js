const test = require("node:test");
const assert = require("node:assert/strict");
const due = require("../js/due-date.js");

test("ước tính ngày dự sinh bằng ngày kinh cuối cộng 280 ngày", function () {
  const result = due.calculate({
    lmp: "2024-01-01",
    today: { year: 2024, month: 3, day: 1 }
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.dueDate, { year: 2024, month: 10, day: 7 });
  assert.equal(result.cycleLength, 28);
  assert.equal(result.adjustmentDays, 0);
});

test("chu kỳ dài hơn 28 ngày cộng thêm đúng số ngày chênh", function () {
  const result = due.calculate({
    lmp: "2024-01-01",
    cycleLength: 30,
    today: { year: 2024, month: 3, day: 1 }
  });
  assert.deepEqual(result.dueDate, { year: 2024, month: 10, day: 9 });
  assert.equal(result.adjustmentDays, 2);
});

test("chu kỳ ngắn hơn 28 ngày trừ đúng số ngày chênh", function () {
  const result = due.calculate({
    lmp: "2024-01-01",
    cycleLength: "26",
    today: { year: 2024, month: 3, day: 1 }
  });
  assert.deepEqual(result.dueDate, { year: 2024, month: 10, day: 5 });
});

test("bước qua năm nhuận", function () {
  const result = due.calculate({
    lmp: "2024-02-27",
    today: { year: 2024, month: 3, day: 1 }
  });
  assert.deepEqual(result.dueDate, { year: 2024, month: 12, day: 3 });
});

test("bước qua cuối tháng và sang năm sau", function () {
  const added = due.addDays({ year: 2025, month: 12, day: 31 }, 1);
  assert.deepEqual(added, { year: 2026, month: 1, day: 1 });
});

test("tuổi thai tính từ ngày kinh cuối, không phụ thuộc múi giờ", function () {
  const result = due.calculate({
    lmp: "2026-01-01",
    today: { year: 2026, month: 1, day: 15 }
  });
  assert.equal(result.gestationalWeeks, 2);
  assert.equal(result.gestationalDays, 0);
  assert.equal(result.status, "upcoming");
  assert.equal(result.daysRemaining, due.diffDays({ year: 2026, month: 1, day: 15 }, result.dueDate));
});

test("ngày dự sinh đã qua thì không đếm ngược", function () {
  const result = due.calculate({
    lmp: "2026-01-01",
    today: { year: 2026, month: 10, day: 15 }
  });
  assert.equal(result.ok, true);
  assert.equal(result.status, "past");
  assert.ok(result.daysRemaining < 0);
});

test("trùng ngày dự sinh", function () {
  const result = due.calculate({
    lmp: "2026-01-01",
    today: { year: 2026, month: 10, day: 8 }
  });
  assert.equal(result.status, "today");
  assert.equal(result.daysRemaining, 0);
  assert.equal(result.gestationalWeeks, 40);
  assert.equal(result.gestationalDays, 0);
});

test("từ chối ngày trống, ngày không tồn tại và ngày tương lai", function () {
  const today = { year: 2026, month: 6, day: 1 };
  assert.equal(due.calculate({ lmp: "", today: today }).error, "empty");
  assert.equal(due.calculate({ lmp: "2023-02-29", today: today }).error, "invalid");
  assert.equal(due.calculate({ lmp: "2024-02-31", today: today }).error, "invalid");
  assert.equal(due.calculate({ lmp: "2026-06-02", today: today }).error, "future");
});

test("từ chối ngày quá xa và chu kỳ ngoài khoảng 21–35", function () {
  const today = { year: 2026, month: 6, day: 1 };
  assert.equal(due.calculate({ lmp: "2025-01-01", today: today }).error, "range");
  assert.equal(due.calculate({ lmp: "2026-05-01", cycleLength: 20, today: today }).error, "cycle");
  assert.equal(due.calculate({ lmp: "2026-05-01", cycleLength: 36, today: today }).error, "cycle");
});

test("hai chế độ cho cùng một thai kỳ ra cùng tuổi thai và không đổi ngày dự sinh đã nhập", function () {
  const today = { year: 2026, month: 6, day: 8 };
  const fromLmp = due.estimateGestationalAge({
    mode: "lmp",
    date: "2026-01-01",
    today: today
  });
  const dueIso =
    fromLmp.dueDate.year +
    "-" +
    String(fromLmp.dueDate.month).padStart(2, "0") +
    "-" +
    String(fromLmp.dueDate.day).padStart(2, "0");
  const fromDue = due.estimateGestationalAge({
    mode: "due",
    date: dueIso,
    today: today
  });
  assert.equal(fromLmp.ok, true);
  assert.equal(fromDue.ok, true);
  assert.equal(fromDue.gestationalWeeks, fromLmp.gestationalWeeks);
  assert.equal(fromDue.gestationalDays, fromLmp.gestationalDays);
  assert.deepEqual(fromDue.dueDate, fromLmp.dueDate);
  assert.equal(fromDue.source, "due");
  assert.equal(fromLmp.source, "lmp");
});

test("tuổi thai đổi tuần đúng ở ngày thứ 7", function () {
  const today = { year: 2026, month: 6, day: 8 };
  const almost = due.estimateGestationalAge({
    mode: "lmp",
    date: "2026-06-02",
    today: today
  });
  const exact = due.estimateGestationalAge({
    mode: "lmp",
    date: "2026-06-01",
    today: today
  });
  assert.equal(almost.gestationalWeeks, 0);
  assert.equal(almost.gestationalDays, 6);
  assert.equal(exact.gestationalWeeks, 1);
  assert.equal(exact.gestationalDays, 0);

  const dueAlmost = due.addDays(today, 280 - 6);
  const dueExact = due.addDays(today, 280 - 7);
  const fromAlmost = due.estimateGestationalAge({ mode: "due", date: dueAlmost, today: today });
  const fromExact = due.estimateGestationalAge({ mode: "due", date: dueExact, today: today });
  assert.equal(fromAlmost.gestationalWeeks, 0);
  assert.equal(fromAlmost.gestationalDays, 6);
  assert.equal(fromExact.gestationalWeeks, 1);
  assert.equal(fromExact.gestationalDays, 0);
});

test("ngày dự sinh quá xa, quá khứ quá lâu và ngày kinh tương lai bị từ chối", function () {
  const today = { year: 2026, month: 6, day: 8 };
  assert.equal(
    due.estimateGestationalAge({ mode: "lmp", date: "", today: today }).error,
    "empty"
  );
  assert.equal(
    due.estimateGestationalAge({ mode: "lmp", date: "2026-06-09", today: today }).error,
    "future"
  );
  assert.equal(
    due.estimateGestationalAge({ mode: "due", date: "", today: today }).error,
    "empty"
  );
  assert.equal(
    due.estimateGestationalAge({
      mode: "due",
      date: due.addDays(today, 281),
      today: today
    }).error,
    "future"
  );
  assert.equal(
    due.estimateGestationalAge({
      mode: "due",
      date: due.addDays(today, 280),
      today: today
    }).gestationalWeeks,
    0
  );
  const atLimit = due.estimateGestationalAge({
    mode: "due",
    date: due.addDays(today, 280 - 44 * 7),
    today: today
  });
  assert.equal(atLimit.ok, true);
  assert.equal(atLimit.gestationalWeeks, 44);
  assert.equal(atLimit.gestationalDays, 0);
  assert.equal(
    due.estimateGestationalAge({
      mode: "due",
      date: due.addDays(today, 280 - 44 * 7 - 1),
      today: today
    }).error,
    "range"
  );
  assert.equal(
    due.estimateGestationalAge({ mode: "due", date: "2026-02-31", today: today }).error,
    "invalid"
  );
});

test("ngày lịch không bị lệch khi cộng ngày qua mốc giờ mùa", function () {
  const parsed = due.parseISODate("2024-03-10");
  assert.deepEqual(parsed, { year: 2024, month: 3, day: 10 });
  assert.deepEqual(due.addDays(parsed, 1), { year: 2024, month: 3, day: 11 });
});
