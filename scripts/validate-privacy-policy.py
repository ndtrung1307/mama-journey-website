#!/usr/bin/env python3
"""Validate the shared privacy policy JSON source."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "shared" / "legal" / "privacy-policy" / "privacy-policy.json"

REQUIRED_TOP_LEVEL = [
    "id",
    "version",
    "language",
    "title",
    "effectiveDate",
    "contact",
    "sections",
]
REQUIRED_SECTION_FIELDS = ["id", "title", "content"]
HTML_TAG_PATTERN = re.compile(r"<[^>]+>")
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
KEBAB_CASE_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    sys.exit(1)


def warn(message: str) -> None:
    print(f"WARNING: {message}", file=sys.stderr)


def validate_document(document: dict) -> None:
    for field in REQUIRED_TOP_LEVEL:
        if field not in document:
            fail(f"Missing required field: {field}")

    if document["id"] != "mamajourney-privacy-policy":
        warn('Document id is not "mamajourney-privacy-policy".')

    if not DATE_PATTERN.match(document["effectiveDate"]):
        fail("effectiveDate must use YYYY-MM-DD format.")

    email = document.get("contact", {}).get("email", "")
    if email != "support@mama-journey.io.vn":
        fail(f"Contact email must remain support@mama-journey.io.vn (found: {email})")

    sections = document["sections"]
    if not sections:
        fail("sections must not be empty.")

    seen_ids: set[str] = set()
    combined_text_parts: list[str] = []

    for index, section in enumerate(sections):
        for field in REQUIRED_SECTION_FIELDS:
            if field not in section or not str(section[field]).strip():
                fail(f"Section at index {index} is missing required field: {field}")

        section_id = section["id"]
        if section_id in seen_ids:
            fail(f"Duplicate section id: {section_id}")
        seen_ids.add(section_id)

        if not KEBAB_CASE_PATTERN.match(section_id):
            fail(f"Section id must be kebab-case: {section_id}")

        for key in ("content", "contentAfter"):
            value = section.get(key, "")
            if value and HTML_TAG_PATTERN.search(value):
                fail(f"Section {section_id} contains raw HTML in {key}.")

        if section.get("table"):
            table = section["table"]
            if "columns" not in table or "rows" not in table:
                fail(f"Section {section_id} table must include columns and rows.")
            for row in table["rows"]:
                if len(row) != len(table["columns"]):
                    fail(f"Section {section_id} has a table row with invalid column count.")

        combined_text_parts.extend(
            [
                section.get("content", ""),
                section.get("contentAfter", ""),
                json.dumps(section.get("table", {}), ensure_ascii=False),
            ]
        )

    combined_text = "\n".join(combined_text_parts).lower()

    if "tối đa 30 ngày" not in combined_text:
        fail("Expected PostHog/Sentry retention of up to 30 days.")
    if "tối đa 12 tháng" not in combined_text:
        fail("Expected feedback retention of up to 12 months.")

    if "không lưu địa chỉ ip" not in combined_text:
        fail("Expected statement that IP addresses are not stored on server.")

    gestational_sent_patterns = [
        "gửi thông tin tuần thai đến posthog",
        "gửi thông tin về tuần thai",
        "không gửi thông tin về tuần thai",
        "không gửi thông tin tuần thai",
    ]
    if not any(pattern in combined_text for pattern in gestational_sent_patterns):
        fail("Expected explicit statement that gestational week info is not sent to PostHog.")

    if re.search(r"gửi.*tuần thai.*đến posthog", combined_text) and "không gửi" not in combined_text:
        fail("Gestational week appears to be described as sent to PostHog.")

    print("Privacy policy validation passed.")
    print(f"- Document: {document['id']} v{document['version']}")
    print(f"- Effective date: {document['effectiveDate']}")
    print(f"- Sections: {len(sections)}")
    print(f"- Contact: {email}")


def main() -> None:
    if not SOURCE.exists():
        fail(f"Source file not found: {SOURCE}")

    try:
        document = json.loads(SOURCE.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        fail(f"Invalid JSON: {error}")

    validate_document(document)


if __name__ == "__main__":
    main()
