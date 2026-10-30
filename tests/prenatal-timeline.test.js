const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const due = require("../js/due-date.js");
const prenatal = require("../js/prenatal-timeline.js");

test("tuần trùng khoảng thì được tô, tuần ngoài khoảng thì làm mờ", function () {
  const scan = { weekStart: 11, weekEnd: 13, category: "ultrasound", recommendation: "recommended_screening" };
  assert.equal(prenatal.weekRelation(scan, ""), "all");
  assert.equal(prenatal.weekRelation(scan, "12"), "match");
  assert.equal(prenatal.weekRelation(scan, "16"), "dim");
});

test("mốc không gắn tuần và mốc suốt thai kỳ không bị làm mờ", function () {
  assert.equal(prenatal.weekRelation({ span: "context" }, "20"), "context");
  assert.equal(prenatal.weekRelation({ span: "ongoing" }, "30"), "context");
});

test("nhánh đường huyết nguy cơ cao khớp các khoảng đã khai", function () {
  const glucose = { weekStart: 1, weekEnd: 13, alsoRanges: [[24, 24], [28, 40]] };
  assert.equal(prenatal.weekRelation(glucose, "10"), "match");
  assert.equal(prenatal.weekRelation(glucose, "24"), "match");
  assert.equal(prenatal.weekRelation(glucose, "32"), "match");
  assert.equal(prenatal.weekRelation(glucose, "20"), "dim");
});

test("bộ lọc giữ đúng nhóm và không đổi thứ tự dữ liệu", function () {
  const items = [
    { category: "prenatal_visit", recommendation: "routine_care" },
    { category: "screening", recommendation: "optional_choice" },
    { category: "laboratory_test", recommendation: "recommended_screening" },
    { category: "vaccine", recommendation: "clinician_directed" },
    { category: "ultrasound", recommendation: "recommended_screening" }
  ];
  assert.deepEqual(
    items.filter(function (item) {
      return prenatal.matchesFilter(item, "screening");
    }).map(function (item) {
      return item.category;
    }),
    ["screening", "laboratory_test"]
  );
  assert.equal(prenatal.matchesFilter(items[1], "optional_choice"), true);
  assert.equal(prenatal.matchesFilter(items[3], "indicated"), true);
  assert.equal(prenatal.matchesFilter(items[0], "indicated"), false);
});

test("ngày dự sinh lùi 280 ngày rồi tính lại ra đúng ngày đó", function () {
  const dueDate = { year: 2027, month: 3, day: 10 };
  const lmp = due.addDays(dueDate, -280);
  const result = due.calculate({
    lmp: lmp,
    cycleLength: 28,
    today: { year: 2026, month: 10, day: 23 }
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.dueDate, dueDate);
  assert.equal(prenatal.stageForWeek(result.gestationalWeeks), "Ba tháng giữa");
});

test("trang lịch khám có nguồn, không tự nhận đã được bác sĩ thẩm định", function () {
  const html = fs.readFileSync(
    path.join(__dirname, "../lich-kham-thai/index.html"),
    "utf8"
  );
  const events = html.match(/<article\b[^>]*class="care-event(?:\s|")/g) || [];
  assert.ok(events.length >= 10);
  const reviews = html.match(/data-review="needs_review"/g) || [];
  assert.equal(reviews.length, events.length);
  assert.match(html, /4128\/QĐ-BYT/);
  assert.match(html, /benhvienhatrung\.vn/);
  assert.match(html, /nhs\.uk\/pregnancy/);
  assert.doesNotMatch(html, /bác sĩ đã thẩm định|đã được bác sĩ duyệt|ký thẩm định riêng|chưa có bác sĩ của MamaJourney/i);
  assert.doesNotMatch(html, /đảm bảo bé khỏe|không bỏ lỡ bất kỳ/i);
  assert.match(html, /<h4>Sàng lọc đái tháo đường thai kỳ<\/h4>/);
  assert.match(html, /Đánh giá đường huyết sớm khi có yếu tố nguy cơ/);
  assert.doesNotMatch(html, /Tầm soát đái tháo đường thai kỳ ở mẹ có nguy cơ cao/);
  assert.doesNotMatch(html, /Đường huyết khi có nguy cơ cao hơn/);
  assert.match(html, /Các phương pháp sàng lọc có gì khác nhau/);
  assert.equal((html.match(/id="nipt"/g) || []).length, 1);
  assert.match(html, /id="nipt"[\s\S]*?data-week-start="10"/);
  assert.match(html, /id="nipt"[\s\S]*?data-week-end="13"/);
  assert.doesNotMatch(html, /id="nipt"[\s\S]{0,500}data-span="context"/);
  assert.doesNotMatch(html, /id="nipt"[\s\S]{0,400}data-week-end="21"/);
  assert.doesNotMatch(html, /id="choc-oi"/);
  assert.doesNotMatch(html, /<h4>Chọc ối hoặc sinh thiết gai rau<\/h4>/);
  assert.doesNotMatch(html, /data-category="diagnostic"/);
  assert.match(html, /sinh thiết gai rau/);
  assert.doesNotMatch(html, /NIPT có phù hợp với mẹ không/);
  assert.doesNotMatch(html, /care-compare/);
  assert.match(html, /Quyết định 2818\/QĐ-BYT ngày 07\/09\/2026/);
  assert.match(html, /Quyết định 1470\/QĐ-BYT ngày 29\/05\/2024/);
  assert.match(html, /gồm AFP, hCG và estriol/);
  assert.doesNotMatch(html, /estradiol/);
  assert.match(html, /NIPT là xét nghiệm sàng lọc, không phải xét nghiệm chẩn đoán/);
  assert.match(html, /id="tien-san-giat"[\s\S]*?data-span="context"/);
  assert.doesNotMatch(html, /id="tien-san-giat"[\s\S]{0,400}data-week-start/);
});

test("tam cá nguyệt I giữ locked copy và không đăng lịch chưa xác minh", function () {
  const html = fs.readFileSync(
    path.join(__dirname, "../lich-kham-thai/index.html"),
    "utf8"
  );
  const start = html.indexOf("<h3>Tam cá nguyệt I</h3>");
  const end = html.indexOf("<h3>Tam cá nguyệt II</h3>");
  const t1 = html.slice(start, end);
  const titles = [
    "Khám thai lần đầu",
    "Sắt và acid folic trong thai kỳ",
    "Kiểm tra lịch tiêm uốn ván",
    "Siêu âm đầu thai kỳ",
    "Sàng lọc HIV, giang mai và viêm gan B",
    "Nhóm máu và xét nghiệm máu ban đầu",
    "Đánh giá đường huyết sớm khi có yếu tố nguy cơ",
    "NIPT — xét nghiệm sàng lọc trước sinh",
    "Sàng lọc lệch bội: độ mờ da gáy và Double test"
  ];
  titles.forEach(function (title) {
    assert.equal(t1.includes("<h5>" + title + "</h5>"), true, title);
  });
  assert.equal((t1.match(/<h5>/g) || []).length, 9);
  assert.equal((t1.match(/<details open>/g) || []).length, 1);
  assert.match(t1, /<details open>\s*<summary>Vì sao cần\?<\/summary>/);
  assert.equal((t1.match(/<summary>Vì sao cần\?<\/summary>/g) || []).length, 9);
  assert.match(t1, /Từ tuần 10, sau siêu âm và tư vấn phù hợp/);
  assert.doesNotMatch(t1, /Từ tuần 10 nếu phù hợp/);
  assert.match(t1, /id="nipt"/);
  const headingOrder = [...t1.matchAll(/<h5>([^<]+)<\/h5>/g)].map(function (match) {
    return match[1];
  });
  assert.deepEqual(headingOrder, titles);
  assert.ok(headingOrder.indexOf("NIPT — xét nghiệm sàng lọc trước sinh") < headingOrder.indexOf("Sàng lọc lệch bội: độ mờ da gáy và Double test"));
  assert.equal(t1.includes("Trang không kết luận"), false);
  assert.equal(t1.includes("Cần xác minh thêm"), false);
  assert.match(t1, /Buổi khám đầu tiên là dịp để mẹ chia sẻ về sức khỏe hiện tại/);
  assert.equal((t1.match(/care-sub/g) || []).length, 0);
  assert.equal(t1.includes('id="duong-huyet-nguy-co"'), true);
  assert.equal(t1.includes("data-also-ranges"), false);
  assert.equal(t1.includes("uống mỗi ngày đến hết sáu tuần"), false);
  assert.equal(t1.includes("lịch gồm năm mũi"), false);
  assert.equal(t1.includes("viêm gan B và C"), false);
  assert.equal(t1.includes("Cơ sở có đủ máy"), false);
  assert.equal(t1.includes("Đây là lần siêu âm nên làm"), false);
  assert.match(html, /Xem tuổi thai của mẹ/);
  assert.match(html, /data-care-mode="lmp"[^>]*aria-checked="true"/);
  assert.match(html, /data-care-mode="due"/);
  assert.equal((html.match(/id="tuoi-thai"[\s\S]*?name="care-date"/g) || []).length, 1);
  assert.doesNotMatch(html, /id="tuoi-thai"[\s\S]*?name="lmp"/);
  assert.doesNotMatch(html, /id="tuoi-thai"[\s\S]*?name="due"/);
  assert.match(html, /data-care-error[^>]*hidden/);
  assert.doesNotMatch(html, /Chu kỳ khác 28 ngày thì dùng/);
  assert.doesNotMatch(html, /không gửi đi và không lưu lại/);
  assert.match(html, /Khám thai định kỳ trong ba tháng giữa/);
  assert.match(html, /<h4>Xét nghiệm máu sàng lọc một số bất thường của thai \(Triple test\)<\/h4>/);
  assert.doesNotMatch(html, /<h4>NIPT khi chưa sàng lọc trong ba tháng đầu<\/h4>/);
  assert.match(html, /<h4>Siêu âm hình thái thai nhi<\/h4>/);
  assert.match(html, /<h4>Xét nghiệm máu hỗ trợ đánh giá nguy cơ tiền sản giật<\/h4>/);
  assert.doesNotMatch(html, /<h4>Xét nghiệm sFlt-1\/PlGF<\/h4>/);
  const t2start = html.indexOf("<h3>Tam cá nguyệt II</h3>");
  const t2end = html.indexOf("<h3>Tam cá nguyệt III</h3>");
  const t2 = html.slice(t2start, t2end);
  assert.equal(t2.includes('id="nipt"'), false);
  assert.match(t2, /Không phải mẹ nào cũng cần làm Triple test/);
  assert.match(t2, /<h4>Theo dõi cử động của bé<\/h4>/);
});

test("mỗi tag trên lịch có khóa tooltip và màu nhóm", function () {
  const html = fs.readFileSync(path.join(__dirname, "../lich-kham-thai/index.html"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "../js/prenatal-ui.js"), "utf8");
  const start = html.indexOf('id="hanh-trinh"');
  const end = html.indexOf('id="sang-loc-truoc-sinh"');
  const timeline = html.slice(start, end);
  const chips = timeline.match(/<span class="care-chip[^"]*" data-tooltip-key="[^"]+">/g) || [];
  const keys = chips.map(function (chip) {
    return chip.match(/data-tooltip-key="([^"]+)"/)[1];
  });
  assert.equal(chips.length, 42);
  assert.equal(new Set(keys).size, 23);
  assert.equal((timeline.match(/care-chip--tone-/g) || []).length, 42);
  assert.equal(timeline.includes("Bốn cách đọc một mốc trên lịch"), false);
  keys.forEach(function (key) {
    assert.ok(script.includes(key), key);
  });
});
