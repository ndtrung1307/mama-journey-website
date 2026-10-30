(function () {
  var form = document.querySelector("[data-care-form]");
  if (!form || !window.MamaDueDate || !window.MamaPrenatal) {
    return;
  }

  var dateInput = form.querySelector("[name='care-date']");
  var dateLabel = form.querySelector("[data-care-date-label]");
  var modeButtons = Array.prototype.slice.call(form.querySelectorAll("[data-care-mode]"));
  var hints = Array.prototype.slice.call(form.querySelectorAll("[data-care-hint]"));
  var errorEl = document.querySelector("[data-care-error]");
  var summaryEl = document.querySelector("[data-care-summary]");
  var resetButton = document.querySelector("[data-care-reset]");
  var focusWeekButton = document.querySelector("[data-care-focus-week]");
  var weekSelect = document.querySelector("[data-care-week]");
  var browseNote = document.querySelector("[data-care-browse]");
  var emptyEl = document.querySelector("[data-care-empty]");
  var events = Array.prototype.slice.call(
    document.querySelectorAll("#hanh-trinh .care-event")
  );
  var groups = Array.prototype.slice.call(document.querySelectorAll("[data-care-group]"));
  var stages = Array.prototype.slice.call(document.querySelectorAll("[data-care-stage]"));
  var filters = Array.prototype.slice.call(document.querySelectorAll("[data-care-filter]"));
  var activeFilter = "all";
  var weekSource = "";
  var estimatedWeek = null;
  var mode = "lmp";

  var messages = {
    lmp: {
      empty: "Hãy nhập ngày đầu kỳ kinh cuối, rồi bấm Xem tuổi thai ước tính.",
      invalid: "Ngày này không hợp lệ. Hãy chọn lại một ngày có thật trên lịch.",
      future: "Ngày đầu kỳ kinh cuối đang ở tương lai. Hãy chọn ngày đã qua hoặc hôm nay.",
      range: "Ngày này cách hôm nay hơn 44 tuần, ngoài khoảng công cụ hỗ trợ. Hãy kiểm tra lại ngày."
    },
    due: {
      empty: "Hãy nhập ngày dự sinh do bác sĩ xác định, rồi bấm Xem tuổi thai ước tính.",
      invalid: "Ngày này không hợp lệ. Hãy chọn lại một ngày có thật trên lịch.",
      future:
        "Ngày dự sinh này còn cách hơn 40 tuần, nên chưa có tuổi thai để ước tính. Hãy kiểm tra lại ngày.",
      range:
        "Ngày dự sinh này đã qua quá xa so với khoảng 44 tuần công cụ hỗ trợ. Hãy kiểm tra lại ngày."
    }
  };

  function todayParts() {
    var now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate()
    };
  }

  function hintId() {
    return mode === "due" ? "care-date-hint-due" : "";
  }

  function describeDate() {
    var ids = [];
    if (hintId()) {
      ids.push(hintId());
    }
    if (!errorEl.hidden) {
      ids.push("care-date-error");
    }
    if (ids.length) {
      dateInput.setAttribute("aria-describedby", ids.join(" "));
    } else {
      dateInput.removeAttribute("aria-describedby");
    }
  }

  function showError(code) {
    summaryEl.hidden = true;
    estimatedWeek = null;
    if (focusWeekButton) {
      focusWeekButton.hidden = true;
    }
    var group = messages[mode] || messages.lmp;
    errorEl.textContent = group[code] || group.invalid;
    errorEl.hidden = false;
    dateInput.setAttribute("aria-invalid", "true");
    describeDate();
  }

  function clearOutcome() {
    summaryEl.hidden = true;
    errorEl.hidden = true;
    errorEl.textContent = "";
    dateInput.removeAttribute("aria-invalid");
    estimatedWeek = null;
    if (focusWeekButton) {
      focusWeekButton.hidden = true;
    }
    if (weekSource === "estimate") {
      weekSelect.value = "";
      weekSource = "";
      applyView();
    }
    describeDate();
  }

  function setMode(next, options) {
    if (next !== "lmp" && next !== "due") {
      return;
    }
    var changed = next !== mode;
    mode = next;
    modeButtons.forEach(function (button) {
      var selected = button.getAttribute("data-care-mode") === mode;
      button.setAttribute("aria-checked", selected ? "true" : "false");
      button.tabIndex = selected ? 0 : -1;
    });
    dateLabel.textContent =
      mode === "due" ? "Ngày dự sinh do bác sĩ xác định" : "Ngày đầu kỳ kinh cuối";
    hints.forEach(function (hint) {
      hint.hidden = hint.getAttribute("data-care-hint") !== mode;
    });
    if (changed || (options && options.clear)) {
      dateInput.value = "";
      clearOutcome();
    }
  }

  function estimate() {
    return window.MamaDueDate.estimateGestationalAge({
      mode: mode,
      date: dateInput.value,
      today: todayParts()
    });
  }

  function fillSummary(result) {
    summaryEl.querySelector("[data-summary='age']").textContent =
      result.gestationalWeeks + " tuần " + result.gestationalDays + " ngày";
    summaryEl.querySelector("[data-summary='stage']").textContent =
      window.MamaPrenatal.stageForWeek(result.gestationalWeeks);
    summaryEl.querySelector("[data-summary='basis']").textContent =
      result.source === "due"
        ? "Ước tính từ ngày dự sinh mẹ nhập: ngày đó là mốc 40 tuần. Công cụ không thay ngày dự sinh bác sĩ đã xác định."
        : "Ước tính từ ngày đầu kỳ kinh cuối, chu kỳ 28 ngày, cộng 280 ngày như công cụ ngày dự sinh.";

    var week = result.gestationalWeeks;
    var matches = events.filter(function (event) {
      var relation = window.MamaPrenatal.weekRelation(
        window.MamaPrenatal.readItem(event),
        week
      );
      return relation === "match";
    });
    var list = summaryEl.querySelector("[data-summary='matches']");
    list.textContent = "";
    if (!matches.length) {
      var emptyItem = document.createElement("li");
      emptyItem.textContent =
        "Tuần ước tính này không trùng một mốc riêng. Mẹ vẫn xem toàn bộ lịch bên dưới.";
      list.appendChild(emptyItem);
    } else {
      matches.forEach(function (event) {
        var item = document.createElement("li");
        var link = document.createElement("a");
        link.href = "#" + event.id;
        var heading = event.querySelector("h4, h5");
        link.textContent = heading ? heading.textContent : "";
        item.appendChild(link);
        list.appendChild(item);
      });
    }
    summaryEl.hidden = false;
    estimatedWeek = week;
    if (focusWeekButton) {
      focusWeekButton.hidden = false;
      focusWeekButton.textContent = "Tô các mốc trùng tuần " + week;
    }
    errorEl.hidden = true;
    dateInput.removeAttribute("aria-invalid");
    describeDate();
  }

  function applyView() {
    var visible = 0;
    events.forEach(function (event) {
      var item = window.MamaPrenatal.readItem(event);
      var show = window.MamaPrenatal.matchesFilter(item, activeFilter);
      event.hidden = !show;
      var relation = window.MamaPrenatal.weekRelation(item, weekSelect.value);
      event.classList.toggle("is-match", show && relation === "match");
      event.classList.toggle("is-dim", show && relation === "dim");
      event.classList.toggle("is-context", show && relation === "context");
      if (show) {
        visible += 1;
      }
    });
    groups.forEach(function (group) {
      group.hidden = !group.querySelector(".care-event:not([hidden])");
    });
    stages.forEach(function (stage) {
      stage.hidden = !stage.querySelector(".care-event:not([hidden])");
    });
    emptyEl.hidden = visible !== 0;
    if (!weekSelect.value) {
      browseNote.hidden = true;
      browseNote.textContent = "";
      return;
    }
    browseNote.hidden = false;
    browseNote.textContent =
      weekSource === "estimate"
        ? "Đang tô các mốc trùng với tuổi thai ước tính. Đây là lịch để mẹ tham khảo, không phải phiếu hẹn."
        : "Đang xem tuần " +
          weekSelect.value +
          ". Đây chưa phải lịch khám đã được sắp cho riêng mẹ.";
  }

  filters.forEach(function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.getAttribute("data-care-filter");
      filters.forEach(function (other) {
        var selected = other === button;
        other.setAttribute("aria-pressed", selected ? "true" : "false");
      });
      applyView();
    });
  });

  weekSelect.addEventListener("change", function () {
    weekSource = weekSelect.value ? "browse" : "";
    applyView();
  });

  modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setMode(button.getAttribute("data-care-mode"));
      button.focus();
    });
    button.addEventListener("keydown", function (event) {
      var keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
      if (keys.indexOf(event.key) === -1) {
        return;
      }
      event.preventDefault();
      var index = modeButtons.indexOf(button);
      var direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      var next = modeButtons[(index + direction + modeButtons.length) % modeButtons.length];
      setMode(next.getAttribute("data-care-mode"));
      next.focus();
    });
  });

  dateInput.addEventListener("input", function () {
    if (!errorEl.hidden || !summaryEl.hidden) {
      clearOutcome();
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var result = estimate();
    if (!result.ok) {
      showError(result.error);
      dateInput.focus();
      return;
    }
    fillSummary(result);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      summaryEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });

  if (focusWeekButton) {
    focusWeekButton.addEventListener("click", function () {
      if (estimatedWeek == null) {
        return;
      }
      var week = String(Math.min(40, Math.max(4, estimatedWeek)));
      weekSelect.value = week;
      weekSource = "estimate";
      applyView();
      var timeline = document.getElementById("hanh-trinh");
      if (timeline && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        timeline.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", function () {
      weekSelect.value = "";
      weekSource = "";
      applyView();
      setMode("lmp", { clear: true });
      dateInput.focus();
    });
  }

  applyView();
})();

(function () {
  var entries = {
    "antenatal-visit": {
      label: "Khám thai",
      description: "Buổi thăm khám để bác sĩ theo dõi sức khỏe của mẹ và sự phát triển của bé.",
      group: "care"
    },
    "initial-care": {
      label: "Chăm sóc ban đầu",
      description: "Những bước chăm sóc và đánh giá sức khỏe cần thực hiện khi mẹ bắt đầu theo dõi thai kỳ.",
      group: "care"
    },
    "routine-care": {
      label: "Thường quy",
      description: "Hoạt động thường có trong lịch chăm sóc thai kỳ. Bác sĩ vẫn có thể điều chỉnh theo tình trạng của mẹ và bé.",
      group: "care"
    },
    "nutrition": {
      label: "Dinh dưỡng",
      description: "Nội dung liên quan đến nhu cầu dinh dưỡng và bổ sung vi chất trong thai kỳ.",
      group: "care"
    },
    "preventive-care": {
      label: "Chăm sóc dự phòng",
      description: "Những biện pháp giúp phòng ngừa thiếu hụt dinh dưỡng hoặc một số vấn đề sức khỏe trong thai kỳ.",
      group: "care"
    },
    "test": {
      label: "Xét nghiệm",
      description: "Kiểm tra mẫu máu hoặc mẫu bệnh phẩm để đánh giá một số chỉ số sức khỏe của mẹ hoặc bé.",
      group: "lab"
    },
    "screening": {
      label: "Sàng lọc",
      description: "Ước tính nguy cơ một số tình trạng. Kết quả sàng lọc không phải là chẩn đoán xác định.",
      group: "lab"
    },
    "infection-screening": {
      label: "Sàng lọc nhiễm trùng",
      description: "Kiểm tra một số bệnh nhiễm trùng có thể ảnh hưởng đến sức khỏe của mẹ hoặc bé.",
      group: "lab"
    },
    "maternal-health-assessment": {
      label: "Đánh giá sức khỏe mẹ",
      description: "Kiểm tra các thông tin sức khỏe của mẹ để hỗ trợ việc theo dõi và chăm sóc thai kỳ.",
      group: "lab"
    },
    "ultrasound": {
      label: "Siêu âm",
      description: "Sử dụng sóng âm để quan sát hình ảnh của bé và các cấu trúc liên quan trong thai kỳ.",
      group: "scan"
    },
    "fetal-monitoring": {
      label: "Theo dõi thai",
      description: "Hoạt động giúp mẹ hoặc bác sĩ theo dõi tình trạng và sự phát triển của bé trong thai kỳ.",
      group: "scan"
    },
    "gestational-age-based": {
      label: "Theo tuổi thai",
      description: "Thời điểm thực hiện phụ thuộc vào số tuần thai và mục tiêu kiểm tra.",
      group: "scan"
    },
    vaccination: {
      label: "Tiêm chủng",
      description: "Kiểm tra hoặc thực hiện tiêm vaccine phù hợp với tiền sử tiêm và giai đoạn mang thai.",
      group: "vaccine"
    },
    "disease-prevention": {
      label: "Phòng bệnh",
      description: "Biện pháp giúp giảm nguy cơ mắc một số bệnh có thể ảnh hưởng đến mẹ hoặc bé.",
      group: "vaccine"
    },
    "vaccination-history": {
      label: "Theo tiền sử tiêm",
      description: "Việc cần thực hiện phụ thuộc vào những mũi tiêm mẹ đã tiêm trước đó.",
      group: "vaccine"
    },
    "optional-choice": {
      label: "Lựa chọn thêm",
      description: "Không phải xét nghiệm bắt buộc cho tất cả mẹ bầu. Mẹ có thể trao đổi với bác sĩ trước khi quyết định.",
      group: "choice"
    },
    "post-counseling-choice": {
      label: "Lựa chọn sau tư vấn",
      description: "Mẹ cân nhắc thực hiện sau khi được giải thích về lợi ích, giới hạn và các lựa chọn phù hợp.",
      group: "choice"
    },
    "screening-choice": {
      label: "Lựa chọn sàng lọc",
      description: "Một phương pháp sàng lọc có thể được cân nhắc tùy tuổi thai, tiền sử và tư vấn của bác sĩ.",
      group: "choice"
    },
    "clinician-directed": {
      label: "Theo chỉ định",
      description: "Thực hiện khi bác sĩ nhận thấy cần thiết dựa trên tình trạng hoặc kết quả thăm khám của mẹ.",
      group: "alert"
    },
    "important-note": {
      label: "Lưu ý quan trọng",
      description: "Thông tin mẹ cần chú ý để theo dõi thai kỳ và biết khi nào nên liên hệ với cơ sở y tế.",
      group: "alert"
    },
    "warning-signs": {
      label: "Dấu hiệu cảnh báo",
      description: "Những dấu hiệu mẹ cần nhận biết và đi khám ngay, không nên chờ đến lịch hẹn tiếp theo.",
      group: "alert"
    },
    "birth-preparation": {
      label: "Chuẩn bị sinh",
      description: "Những việc mẹ nên tìm hiểu và chuẩn bị trước ngày dự sinh.",
      group: "prep"
    },
    "guidance": {
      label: "Hướng dẫn",
      description: "Nội dung giúp mẹ biết cách chuẩn bị hoặc thực hiện một hoạt động trong thai kỳ.",
      group: "prep"
    }
  };

  var chips = Array.prototype.slice.call(document.querySelectorAll("#hanh-trinh [data-tooltip-key]"));
  if (!chips.length) {
    return;
  }

  var descriptions = document.createElement("div");
  Object.keys(entries).forEach(function (key) {
    var node = document.createElement("span");
    node.id = "care-tag-desc-" + key;
    node.className = "care-tag-desc";
    node.textContent = entries[key].description;
    descriptions.appendChild(node);
  });
  document.body.appendChild(descriptions);

  var tip = document.createElement("div");
  tip.className = "care-tooltip";
  tip.id = "care-tag-tooltip";
  tip.setAttribute("role", "tooltip");
  tip.setAttribute("aria-hidden", "true");
  tip.hidden = true;
  tip.innerHTML = '<span class="care-tooltip__dot" aria-hidden="true"></span><p></p>';
  document.body.appendChild(tip);

  var textNode = tip.querySelector("p");
  var current = null;
  var hideTimer = 0;
  var openedAt = 0;
  var hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function entryFor(chip) {
    return entries[chip.getAttribute("data-tooltip-key")];
  }

  function place(anchor) {
    var margin = 8;
    var header = document.querySelector(".site-header");
    var topLimit = header ? header.getBoundingClientRect().bottom + margin : margin;
    var anchorRect = anchor.getBoundingClientRect();
    var tipRect = tip.getBoundingClientRect();
    var left = anchorRect.left + anchorRect.width / 2 - tipRect.width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - tipRect.width - margin));
    var above = anchorRect.top - tipRect.height - margin;
    var top = above >= topLimit ? above : anchorRect.bottom + margin;
    var maxTop = window.innerHeight - tipRect.height - margin;
    if (top > maxTop) {
      top = Math.max(topLimit, maxTop);
    }
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }

  function openTip(chip) {
    var entry = entryFor(chip);
    if (!entry) {
      return;
    }
    window.clearTimeout(hideTimer);
    openedAt = Date.now();
    current = chip;
    textNode.textContent = entry.description;
    tip.className = "care-tooltip care-tooltip--" + entry.group;
    tip.hidden = false;
    tip.setAttribute("aria-hidden", "true");
    place(chip);
    window.requestAnimationFrame(function () {
      if (current === chip) {
        tip.classList.add("is-open");
      }
    });
  }

  function closeTip() {
    window.clearTimeout(hideTimer);
    current = null;
    tip.classList.remove("is-open");
    tip.hidden = true;
    tip.setAttribute("aria-hidden", "true");
  }

  function scheduleClose() {
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(closeTip, 90);
  }

  chips.forEach(function (chip) {
    var entry = entryFor(chip);
    if (!entry) {
      return;
    }
    chip.tabIndex = 0;
    chip.setAttribute("aria-describedby", "care-tag-desc-" + chip.getAttribute("data-tooltip-key"));
    chip.addEventListener("mouseenter", function () {
      if (!hoverCapable) {
        return;
      }
      openTip(chip);
    });
    chip.addEventListener("mouseleave", function () {
      if (!hoverCapable || document.activeElement === chip) {
        return;
      }
      scheduleClose();
    });
    chip.addEventListener("focus", function () {
      openTip(chip);
    });
    chip.addEventListener("blur", function () {
      scheduleClose();
    });
    chip.addEventListener("click", function (event) {
      if (hoverCapable) {
        return;
      }
      event.stopPropagation();
      if (current === chip && !tip.hidden) {
        closeTip();
      } else {
        openTip(chip);
      }
    });
  });

  tip.addEventListener("mouseenter", function () {
    if (hoverCapable) {
      window.clearTimeout(hideTimer);
    }
  });
  tip.addEventListener("mouseleave", function () {
    if (hoverCapable) {
      scheduleClose();
    }
  });

  document.addEventListener("click", function (event) {
    if (!current) {
      return;
    }
    if (current.contains(event.target) || tip.contains(event.target)) {
      return;
    }
    closeTip();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && current) {
      closeTip();
    }
  });

  window.addEventListener(
    "scroll",
    function () {
      if (Date.now() - openedAt < 250) {
        return;
      }
      closeTip();
    },
    true
  );
  window.addEventListener("resize", closeTip);
})();

(function () {
  var details = document.querySelector("#nguon details");
  if (!details) {
    return;
  }
  function openFromHash() {
    if (location.hash === "#nguon") {
      details.open = true;
    }
  }
  openFromHash();
  window.addEventListener("hashchange", openFromHash);
})();
