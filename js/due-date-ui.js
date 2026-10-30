(function () {
  var form = document.querySelector("[data-due-date-form]");
  if (!form || !window.MamaDueDate) {
    return;
  }

  var lmpInput = form.querySelector("[name='lmp']");
  var cycleInput = form.querySelector("[name='cycle']");
  var errorEl = document.querySelector("[data-due-date-error]");
  var resultEl = document.querySelector("[data-due-date-result]");
  var promoEl = document.querySelector("[data-due-date-promo]");
  var resetButton = document.querySelector("[data-due-date-reset]");

  var messages = {
    empty: "Hãy nhập ngày đầu kỳ kinh cuối.",
    invalid: "Ngày này không hợp lệ. Hãy kiểm tra lại.",
    future: "Ngày kinh cuối không thể ở tương lai. Hãy kiểm tra lại.",
    range:
      "Ngày này nằm ngoài khoảng công cụ hỗ trợ, khoảng 44 tuần kể từ ngày kinh cuối. Hãy kiểm tra lại hoặc trao đổi với bác sĩ.",
    cycle: "Độ dài chu kỳ cần từ 21 đến 35 ngày."
  };

  function formatDate(parts) {
    return parts.day + " tháng " + parts.month + " năm " + parts.year;
  }

  function setText(name, text) {
    if (!resultEl) {
      return;
    }
    var el = resultEl.querySelector('[data-result="' + name + '"]');
    if (el) {
      el.textContent = text;
    }
  }

  function hideResult() {
    if (resultEl) {
      resultEl.hidden = true;
    }
    if (promoEl) {
      promoEl.hidden = true;
    }
  }

  function showError(code) {
    hideResult();
    if (lmpInput) {
      lmpInput.setAttribute("aria-invalid", "true");
    }
    if (!errorEl) {
      return;
    }
    errorEl.hidden = false;
    errorEl.textContent = messages[code] || messages.invalid;
  }

  function showResult(result) {
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }
    if (lmpInput) {
      lmpInput.removeAttribute("aria-invalid");
    }
    if (!resultEl) {
      return;
    }

    setText(
      "basis",
      "Dựa trên ngày kinh cuối " +
        formatDate(result.lmp) +
        " và chu kỳ " +
        result.cycleLength +
        " ngày."
    );
    setText("due", formatDate(result.dueDate));
    setText(
      "due-note",
      result.cycleLength === 28
        ? "Khoảng 40 tuần kể từ ngày kinh cuối."
        : "Đã điều chỉnh theo chu kỳ " + result.cycleLength + " ngày."
    );
    setText(
      "age",
      result.gestationalWeeks + " tuần " + result.gestationalDays + " ngày"
    );
    setText("age-note", "Tính từ ngày đầu kỳ kinh cuối.");

    if (result.status === "upcoming") {
      setText("remain-label", "Số ngày còn lại");
      setText("remain", String(result.daysRemaining));
      setText("remain-note", "đến ngày dự sinh ước tính");
    } else if (result.status === "today") {
      setText("remain-label", "Số ngày còn lại");
      setText("remain", "Hôm nay");
      setText("remain-note", "trùng với ngày dự sinh ước tính");
    } else {
      setText("remain-label", "Đã qua ngày dự sinh");
      setText("remain", String(Math.abs(result.daysRemaining)));
      setText("remain-note", "ngày, không còn đếm ngược");
    }

    setText(
      "disclaimer",
      "Ngày dự sinh chỉ là ước tính. Siêu âm và thăm khám có thể điều chỉnh ngày dự sinh trên thực tế."
    );
    resultEl.hidden = false;
    if (promoEl) {
      promoEl.hidden = false;
    }
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var now = new Date();
    var result = window.MamaDueDate.calculate({
      lmp: lmpInput ? lmpInput.value : "",
      cycleLength: cycleInput ? cycleInput.value : 28,
      today: {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate()
      }
    });
    if (!result.ok) {
      showError(result.error);
      return;
    }
    showResult(result);
  });

  if (resetButton && lmpInput) {
    resetButton.addEventListener("click", function () {
      hideResult();
      lmpInput.focus();
    });
  }
})();
