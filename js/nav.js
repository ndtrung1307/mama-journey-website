(function () {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".site-nav__toggle");
  const nav = document.querySelector(".site-nav");

  if (!header || !toggle || !nav) {
    return;
  }

  const mobileQuery = window.matchMedia("(max-width: 600px)");

  function setOpen(isOpen) {
    header.classList.toggle("site-header--nav-open", isOpen);
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    toggle.setAttribute(
      "aria-label",
      isOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"
    );
  }

  function closeNav() {
    setOpen(false);
  }

  toggle.addEventListener("click", function () {
    setOpen(!header.classList.contains("site-header--nav-open"));
  });

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeNav();
    }
  });

  mobileQuery.addEventListener("change", function (event) {
    if (!event.matches) {
      closeNav();
    }
  });
})();
