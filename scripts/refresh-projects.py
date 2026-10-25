#!/usr/bin/env python3
"""Create change receipts from website content snapshots."""

import argparse
import difflib
import json
from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]


def content_receipt(before_decks, after_decks, before_projects, after_projects,
                    before_tree=None, after_tree=None):
    """Describe only changed cards and public text; ignore sync and image metadata."""
    output = []

    def text(value):
        """Normalise whitespace for meaningful text comparison."""
        return " ".join(str(value or "").split())

    def field_changes(label, old, new):
        """Return old/new lines only when displayed text changes."""
        old, new = text(old), text(new)
        if old != new:
            return [f"- {label}: {old or '(empty)'}", f"+ {label}: {new or '(empty)'}"]
        return []

    def text_changes(label, old, new):
        """Return only edited paragraphs from longer descriptions or primers."""
        old_lines = [text(part) for part in re.split(r"\n\s*\n", old or "") if part.strip()]
        new_lines = [text(part) for part in re.split(r"\n\s*\n", new or "") if part.strip()]
        diff = [line for line in difflib.ndiff(old_lines, new_lines) if line.startswith(("- ", "+ "))]
        if diff:
            return [label + ":", *diff]
        return []

    def cards(deck):
        """Count cards by section and name."""
        result = {}
        for section in deck.get("sections", []):
            for card in section["cards"]:
                key = (section["name"], text(card["name"]))
                result[key] = result.get(key, 0) + card["quantity"]
        return result

    for identifier in sorted(before_decks.keys() | after_decks.keys()):
        old, new = before_decks.get(identifier, {}), after_decks.get(identifier, {})
        changes = []
        old_cards, new_cards = cards(old), cards(new)
        for section, name in sorted(old_cards.keys() | new_cards.keys()):
            previous, current = old_cards.get((section, name), 0), new_cards.get((section, name), 0)
            if previous != current:
                changes.append(f"{'+' if current > previous else '-'} {section}: {name} — {previous} → {current}")
        changes.extend(field_changes("Name", old.get("name"), new.get("name")))
        for field, label in (("primerEnglish", "Primer (English)"), ("primerSpanish", "Primer (Spanish)")):
            changes.extend(text_changes(label, old.get(field), new.get(field)))
        if changes:
            output.append(f"## Magic — {text(new.get('name') or old.get('name') or identifier)}\n\n```diff\n" + "\n".join(changes) + "\n```")

    def projects_by_id(projects):
        """Index visible project entries and any nested components by stable ID."""
        result = {}
        for project in projects:
            result[project["id"]] = project
            result.update(projects_by_id(project.get("components", [])))
        return result

    old_projects, new_projects = projects_by_id(before_projects), projects_by_id(after_projects)
    for identifier in sorted(old_projects.keys() | new_projects.keys()):
        old, new = old_projects.get(identifier, {}), new_projects.get(identifier, {})
        changes = []
        for field in ("title", "url"):
            changes.extend(field_changes(field.capitalize(), old.get(field), new.get(field)))
        changes.extend(text_changes("Description", old.get("description"), new.get("description")))
        old_tags, new_tags = set(old.get("technologies", [])), set(new.get("technologies", []))
        changes.extend(f"- Technology: {tag}" for tag in sorted(old_tags - new_tags))
        changes.extend(f"+ Technology: {tag}" for tag in sorted(new_tags - old_tags))
        if changes:
            output.append(f"## Website — {text(new.get('title') or old.get('title') or identifier)}\n\n```diff\n" + "\n".join(changes) + "\n```")
    def tree_lines(nodes, parent="projects/"):
        lines = []
        for node in nodes:
            path = parent + node["title"]
            lines.append(path + (f" → {node['url']}" if node.get("url") else "/"))
            lines.extend(tree_lines(node.get("children", []), path + "/"))
        return lines

    tree_changes = [line for line in difflib.ndiff(tree_lines(before_tree or []), tree_lines(after_tree or []))
                    if line.startswith(("- ", "+ "))]
    if tree_changes:
        output.append("## Website — Project navigation\n\n```diff\n" + "\n".join(tree_changes) + "\n```")
    return "\n\n".join(output) + "\n" if output else "No content changes.\n"


def main():
    """Compare checked-in snapshots and write the workflow change receipt."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receipt-before", type=Path, help="Directory with snapshots saved before refresh")
    parser.add_argument("--receipt-output", type=Path, help="Markdown receipt destination")
    args = parser.parse_args()
    if not args.receipt_before or not args.receipt_output:
        parser.error("--receipt-before and --receipt-output are required")
    before, after = args.receipt_before, ROOT / "src/data"
    read = lambda folder, name: json.loads((folder / name).read_text(encoding="utf-8"))
    receipt = content_receipt(read(before, "moxfield-seeds.json"), read(after, "moxfield-seeds.json"),
                              read(before, "projects.json"), read(after, "projects.json"),
                              read(before, "project-tree.json"), read(after, "project-tree.json"))
    args.receipt_output.write_text(receipt, encoding="utf-8")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as error:
        print(f"Receipt generation failed: {error}", file=sys.stderr)
        sys.exit(1)
