(function () {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".site-nav__toggle");
  const nav = document.querySelector(".site-nav");

  if (!header || !toggle || !nav) {
    return;
  }

  const breakpoint = header.getAttribute("data-nav-breakpoint") || "600px";
  const mobileQuery = window.matchMedia(
    "(max-width: " + (/^\d+px$/.test(breakpoint) ? breakpoint : "600px") + ")"
  );

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

(function () {
  const screens = document.querySelectorAll("[data-app-shot]");

  screens.forEach(function (screen) {
    const src = screen.getAttribute("data-app-shot");
    if (!src) {
      return;
    }

    const img = new Image();
    img.className = "phone__shot";
    img.alt = screen.getAttribute("data-app-shot-alt") || "";
    img.decoding = "async";
    img.onload = function () {
      const note = screen.querySelector(".phone__placeholder");
      if (note) {
        note.hidden = true;
      }
      screen.classList.add("phone__screen--ready");
      screen.insertBefore(img, screen.firstChild);
    };
    img.src = src;
  });
})();
