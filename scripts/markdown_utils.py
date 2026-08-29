#!/usr/bin/env python3
"""Shared markdown helpers for privacy policy build scripts."""

from __future__ import annotations

import html
import re
from typing import List


LINK_PATTERN = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
BOLD_PATTERN = re.compile(r"\*\*(.+?)\*\*")
ITALIC_PATTERN = re.compile(r"(?<!\*)\*([^*]+)\*(?!\*)")
HTML_TAG_PATTERN = re.compile(r"<[^>]+>")


def escape_text(text: str) -> str:
    return html.escape(text, quote=True)


def inline_markdown(text: str) -> str:
    result = escape_text(text)
    result = BOLD_PATTERN.sub(r"<strong>\1</strong>", result)
    result = ITALIC_PATTERN.sub(r"<em>\1</em>", result)
    result = LINK_PATTERN.sub(
        lambda match: (
            f'<a href="{escape_text(match.group(2))}">{escape_text(match.group(1))}</a>'
        ),
        result,
    )
    return result


SUBSECTION_IDS = {
    "10.1": "xoa-thiet-bi",
    "10.2": "xoa-phan-tich",
    "10.3": "xoa-phan-hoi",
}


def is_section_label(paragraph: str) -> bool:
    stripped = paragraph.strip()
    if not (stripped.startswith("**") and stripped.count("**") == 2):
        return False

    if stripped.endswith(":**"):
        inner = stripped[2:-3]
    elif stripped.endswith("**"):
        inner = stripped[2:-2]
    else:
        return False

    if inner.endswith("."):
        return False

    return len(inner) <= 60


def render_section_label(paragraph: str) -> str:
    stripped = paragraph.strip()
    if stripped.endswith(":**"):
        label = stripped[2:-3]
        return f'<p class="section-label">{escape_text(label)}:</p>'

    label = stripped[2:-2]
    return f'<p class="section-label">{escape_text(label)}</p>'


def render_paragraph(paragraph: str, css_class: str | None = None) -> str:
    if is_section_label(paragraph):
        return render_section_label(paragraph)

    class_attr = f' class="{css_class}"' if css_class else ""
    return f"<p{class_attr}>{inline_markdown(paragraph)}</p>"


def render_list(items: List[str], ordered: bool = False) -> str:
    tag = "ol" if ordered else "ul"
    rendered_items = "".join(
        f"<li>{inline_markdown(item)}</li>" for item in items
    )
    return f"<{tag}>{rendered_items}</{tag}>"


def markdown_to_html(markdown: str, paragraph_class: str | None = None) -> str:
    blocks = re.split(r"\n\n+", markdown.strip())
    parts: List[str] = []
    index = 0

    while index < len(blocks):
        block = blocks[index].strip()
        if not block:
            index += 1
            continue

        if block.startswith("### "):
            heading_match = re.match(r"^###\s+(.+)$", block)
            if heading_match:
                heading_text = heading_match.group(1).strip()
                number_match = re.match(r"^(10\.\d+)\s+(.+)$", heading_text)
                heading_id = ""
                if number_match:
                    heading_id = SUBSECTION_IDS.get(number_match.group(1), "")
                id_attr = f' id="{heading_id}"' if heading_id else ""
                parts.append(
                    f"<h3{id_attr}>{inline_markdown(heading_text)}</h3>"
                )
            index += 1
            continue

        lines = block.split("\n")
        if all(line.startswith("- ") for line in lines):
            items = [line[2:].strip() for line in lines]
            parts.append(render_list(items))
            index += 1
            continue

        if all(re.match(r"^\d+\.\s+", line) for line in lines):
            items = [re.sub(r"^\d+\.\s+", "", line).strip() for line in lines]
            parts.append(render_list(items, ordered=True))
            index += 1
            continue

        parts.append(render_paragraph(block, paragraph_class))
        index += 1

    return "\n        ".join(parts)
