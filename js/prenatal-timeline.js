(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.MamaPrenatal = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function weekNumber(value) {
    if (value == null || value === "") {
      return null;
    }
    var week = Number(value);
    if (!Number.isInteger(week)) {
      return null;
    }
    return week;
  }

  function rangesOf(item) {
    var ranges = [];
    if (item.weekStart != null && item.weekEnd != null) {
      ranges.push([item.weekStart, item.weekEnd]);
    }
    (item.alsoRanges || []).forEach(function (range) {
      ranges.push(range);
    });
    return ranges;
  }

  function weekRelation(item, weekValue) {
    var week = weekNumber(weekValue);
    if (week == null) {
      return "all";
    }
    if (item.span === "context" || item.span === "ongoing") {
      return "context";
    }
    var ranges = rangesOf(item);
    if (!ranges.length) {
      return "context";
    }
    var matched = ranges.some(function (range) {
      return week >= range[0] && week <= range[1];
    });
    return matched ? "match" : "dim";
  }

  function matchesFilter(item, filter) {
    if (!filter || filter === "all") {
      return true;
    }
    if (filter === "screening") {
      return item.category === "screening" || item.category === "laboratory_test";
    }
    if (filter === "optional_choice") {
      return item.recommendation === "optional_choice";
    }
    if (filter === "indicated") {
      return (
        item.recommendation === "risk_dependent" ||
        item.recommendation === "clinician_directed"
      );
    }
    return item.category === filter;
  }

  function stageForWeek(week) {
    if (week < 14) {
      return "Ba tháng đầu";
    }
    if (week < 28) {
      return "Ba tháng giữa";
    }
    if (week < 40) {
      return "Ba tháng cuối";
    }
    return "Từ 40 tuần trở đi";
  }

  function readItem(element) {
    var also = element.getAttribute("data-also-ranges");
    return {
      category: element.getAttribute("data-category"),
      recommendation: element.getAttribute("data-recommendation"),
      span: element.getAttribute("data-span") || "",
      weekStart: weekNumber(element.getAttribute("data-week-start")),
      weekEnd: weekNumber(element.getAttribute("data-week-end")),
      alsoRanges: also
        ? also.split(",").map(function (pair) {
            var parts = pair.split("-");
            return [Number(parts[0]), Number(parts[1])];
          })
        : []
    };
  }

  return {
    weekRelation: weekRelation,
    matchesFilter: matchesFilter,
    stageForWeek: stageForWeek,
    readItem: readItem
  };
});
