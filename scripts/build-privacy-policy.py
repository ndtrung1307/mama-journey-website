#!/usr/bin/env python3
"""Generate the static privacy policy page from the shared JSON source."""

from __future__ import annotations

import html
import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from markdown_utils import markdown_to_html

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "shared" / "legal" / "privacy-policy" / "privacy-policy.json"
OUTPUT = ROOT / "privacy-policy" / "index.html"


def format_effective_date(iso_date: str) -> str:
    parsed = datetime.strptime(iso_date, "%Y-%m-%d")
    return parsed.strftime("%d/%m/%Y")


def render_table(table: dict) -> str:
    columns = table["columns"]
    rows = table["rows"]
    header = "".join(
        f'<th scope="col">{html.escape(col)}</th>' for col in columns
    )
    body_rows = []
    for row in rows:
        cells = "".join(
            f'<td data-label="{html.escape(columns[i])}">{html.escape(cell)}</td>'
            for i, cell in enumerate(row)
        )
        body_rows.append(f"<tr>{cells}</tr>")
    body = "".join(body_rows)
    return f"""<div class="table-wrapper" role="region" aria-label="Bảng dịch vụ bên thứ ba" tabindex="0">
          <table>
            <thead>
              <tr>
                {header}
              </tr>
            </thead>
            <tbody>
              {body}
            </tbody>
          </table>
        </div>"""


def render_section(section: dict, index: int) -> str:
    section_id = section["id"]
    title = section["title"]
    content_html = markdown_to_html(section.get("content", ""))
    table_html = render_table(section["table"]) if section.get("table") else ""
    content_after_html = markdown_to_html(section.get("contentAfter", ""))
    return f"""<h2 id="{section_id}">{index}. {title}</h2>
        {content_html}
        {table_html}
        {content_after_html}"""


def build_toc(sections: list) -> str:
    items = []
    for section in sections:
        toc_title = section.get("tocTitle", section["title"])
        items.append(
            f'<li><a href="#{section["id"]}">{toc_title}</a></li>'
        )
    return "\n          ".join(items)


def build_page(document: dict) -> str:
    email = document["contact"]["email"]
    effective_date = format_effective_date(document["effectiveDate"])
    intro_html = markdown_to_html(document.get("introduction", ""), "intro")
    sections_html = "\n\n        ".join(
        render_section(section, index + 1)
        for index, section in enumerate(document["sections"])
    )
    toc_html = build_toc(document["sections"])

    return f"""<!DOCTYPE html>
<html lang="{document["language"]}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Chính sách quyền riêng tư của MamaJourney — cách ứng dụng xử lý thông tin và dữ liệu của bạn.">
  <title>MamaJourney — {document["title"]}</title>
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <!-- Generated from shared/legal/privacy-policy/privacy-policy.json -->
  <!-- Do not edit manually. Run: python3 scripts/build-privacy-policy.py -->
  <div class="page-wrapper">
    <header class="site-header">
      <div class="site-header__inner">
        <a href="../" class="site-logo" aria-label="MamaJourney — Trang chủ">
          <img src="../assets/application-icon.png" alt="" class="site-logo__icon" width="40" height="40">
          <img src="../assets/home-header.png" alt="MamaJourney" class="site-logo__wordmark" width="260" height="22">
        </a>
        <button
          type="button"
          class="site-nav__toggle"
          aria-expanded="false"
          aria-controls="primary-nav"
          aria-label="Mở menu điều hướng"
        >
          <span class="site-nav__toggle-icon" aria-hidden="true">
            <span class="site-nav__toggle-bar"></span>
          </span>
        </button>
        <nav class="site-nav" id="primary-nav" aria-label="Điều hướng chính">
          <ul>
            <li><a href="../">Trang chủ</a></li>
            <li><a href="../privacy-policy/" aria-current="page">Chính sách quyền riêng tư</a></li>
            <li><a href="../contact/">Liên hệ</a></li>
          </ul>
        </nav>
      </div>
    </header>

    <main>
      <header class="page-header">
        <h1>{document["title"]}</h1>
        <p class="page-header__subtitle">{document.get("subtitle", "MamaJourney")}</p>
        <p class="page-header__date">Cập nhật lần cuối: {effective_date}</p>
      </header>

      <nav class="toc" aria-label="Mục lục">
        <h2>Mục lục</h2>
        <ol>
          {toc_html}
        </ol>
      </nav>

      <article class="legal-content">
        {intro_html}

        {sections_html}
      </article>
    </main>

    <footer class="site-footer">
      <div class="site-footer__inner">
        <p class="site-footer__brand">MamaJourney</p>
        <p class="site-footer__tagline">Ứng dụng được phát triển độc lập</p>
        <nav class="site-footer__links" aria-label="Liên kết chân trang">
          <a href="../privacy-policy/">Chính sách quyền riêng tư</a>
          <a href="../contact/">Liên hệ</a>
        </nav>
        <p class="site-footer__email">
          Thư điện tử: <a href="mailto:{email}">{email}</a>
        </p>
      </div>
    </footer>
  </div>
  <script src="../js/nav.js"></script>
</body>
</html>
"""


def main() -> None:
    document = json.loads(SOURCE.read_text(encoding="utf-8"))
    OUTPUT.write_text(build_page(document), encoding="utf-8")
    print(f"Generated {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
