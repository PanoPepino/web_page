#!/usr/bin/env python3
"""Build the website project catalog from approved README_FOR_WEBPAGE sources."""

import argparse
import base64
import difflib
import json
import os
from pathlib import Path
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
BLOCKS = ("SHARED", "WEBPAGE", "PANOPEPINO")
OWNER = "PanoPepino"
WEBSITE_PROJECT_IDS = {"da-timeless", "pokeml", "manim-ecosystem"}


def parse_source(text):
    """Validate marker blocks and return website-facing project copy."""
    blocks = {}
    remaining = text
    for name in BLOCKS:
        start, end = f"<!-- {name}:START -->", f"<!-- {name}:END -->"
        if text.count(start) != 1 or text.count(end) != 1:
            raise ValueError(f"Expected one {name} marker pair")
        before, rest = remaining.split(start, 1)
        body, remaining = rest.split(end, 1)
        if before.strip() or not body.strip():
            raise ValueError(f"Invalid or out-of-order {name} block")
        blocks[name] = body.strip()
    if remaining.strip():
        raise ValueError("Unexpected content outside source markers")

    shared = blocks["SHARED"].splitlines()
    if not shared or not re.fullmatch(r"# [\wÀ-ž .+–-]+", shared[0]):
        raise ValueError("SHARED must start with a plain project title")
    technology_line = " ".join(line.strip() for line in shared[1:] if line.strip())
    technologies = [item.strip() for item in technology_line.split("·") if item.strip()]
    if not technologies:
        raise ValueError("SHARED must list at least one technology")

    for url in re.findall(r"\]\(([^)]+)\)", blocks["WEBPAGE"]):
        if not url.startswith("https://"):
            raise ValueError(f"Project copy contains a non-HTTPS link: {url}")
    return {
        "title": shared[0][2:].strip(),
        "technologies": technologies,
        "description": blocks["WEBPAGE"],
    }


def github_json(path):
    """Read GitHub API data using optional runner authentication."""
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "PanoPepino-project-page-sync",
    }
    token = os.environ.get("GH_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = Request(f"https://api.github.com/{path}", headers=headers)
    with urlopen(request, timeout=30) as response:
        return json.load(response)


class SourceReader:
    def __init__(self, profile_root, portfolio_root, remote):
        self.profile_root = profile_root.resolve()
        self.portfolio_root = portfolio_root.resolve()
        self.remote = remote
        self.revisions = {}

    def read(self, entry):
        if "local" in entry:
            path = (self.profile_root / entry["local"]).resolve()
            if not path.is_relative_to(self.profile_root):
                raise ValueError("Local project source escapes profile repository")
            return path.read_text(encoding="utf-8")

        repository = entry.get("repository", "")
        if not re.fullmatch(rf"{OWNER}/[A-Za-z0-9_.-]+", repository):
            raise ValueError(f"Unexpected project repository: {repository}")

        if not self.remote:
            checkout = entry.get("checkout", "")
            path = (self.portfolio_root / checkout / "README_FOR_WEBPAGE.md").resolve()
            if not path.is_relative_to(self.portfolio_root):
                raise ValueError("Project checkout escapes portfolio directory")
            return path.read_text(encoding="utf-8")

        if repository not in self.revisions:
            metadata = github_json(f"repos/{repository}")
            if metadata.get("private"):
                raise ValueError(f"Project source must be public: {repository}")
            branch = quote(metadata["default_branch"], safe="")
            revision = github_json(f"repos/{repository}/commits/{branch}")["sha"]
            self.revisions[repository] = revision
            print(f"Project source {repository}@{revision}")
        revision = self.revisions[repository]
        content = github_json(
            f"repos/{repository}/contents/README_FOR_WEBPAGE.md?ref={revision}"
        )
        return base64.b64decode(content["content"], validate=False).decode("utf-8")


def build_entry(entry, reader, seen):
    identifier = entry.get("id", "")
    if not re.fullmatch(r"[a-z0-9-]+", identifier) or identifier in seen:
        raise ValueError(f"Invalid or duplicate project ID: {identifier}")
    seen.add(identifier)
    source = parse_source(reader.read(entry))
    project = {"id": identifier, **source}
    if "url" in entry:
        url = entry["url"]
        if not isinstance(url, str) or not url.startswith("https://"):
            raise ValueError(f"Project URL must use HTTPS: {identifier}")
        project["url"] = url
    components = entry.get("components", [])
    if not isinstance(components, list):
        raise ValueError(f"Components must be a list: {identifier}")
    if components:
        project["components"] = [build_entry(item, reader, seen) for item in components]
    return project


def selected_entries(entries):
    """Flatten approved website projects from the profile's grouped registry."""
    for entry in entries:
        if entry.get("id") in WEBSITE_PROJECT_IDS:
            yield entry
        else:
            components = entry.get("components", [])
            if not isinstance(components, list):
                raise ValueError(f"Components must be a list: {entry.get('id')}")
            yield from selected_entries(components)


def tree_nodes(projects):
    """Publish navigation metadata for the complete approved catalogue."""
    result = []
    for project in projects:
        node = {"id": project["id"], "title": project["title"]}
        if "url" in project:
            node["url"] = project["url"]
        if project.get("components"):
            node["children"] = tree_nodes(project["components"])
        result.append(node)
    return result


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
    """Refresh project copy, or compare saved content for a workflow receipt."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--profile-root", type=Path)
    parser.add_argument("--portfolio-root", type=Path)
    parser.add_argument("--remote", action="store_true", help="Read public GitHub repository sources")
    parser.add_argument("--receipt-before", type=Path, help="Directory with snapshots saved before refresh")
    parser.add_argument("--receipt-output", type=Path, help="Markdown receipt destination")
    args = parser.parse_args()
    if args.receipt_before:
        if not args.receipt_output:
            parser.error("--receipt-before requires --receipt-output")
        before, after = args.receipt_before, ROOT / "src/data"
        read = lambda folder, name: json.loads((folder / name).read_text(encoding="utf-8"))
        read_tree = lambda folder: read(folder, "project-tree.json")
        receipt = content_receipt(read(before, "moxfield-seeds.json"), read(after, "moxfield-seeds.json"),
                                  read(before, "projects.json"), read(after, "projects.json"),
                                  read_tree(before), read_tree(after))
        args.receipt_output.write_text(receipt, encoding="utf-8")
        return

    profile_root = args.profile_root or ROOT.parent / "portfolio" / "PanoPepino"
    portfolio_root = args.portfolio_root or ROOT.parent / "portfolio"
    profile_root = profile_root.resolve()
    registry_path = profile_root / "content" / "projects.json"
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    if registry.get("version") != 1 or not isinstance(registry.get("projects"), list):
        raise ValueError("Expected version 1 project registry")

    reader = SourceReader(profile_root, portfolio_root, args.remote)
    seen = set()
    catalogue = [build_entry(entry, reader, seen) for entry in registry["projects"]]
    projects = list(selected_entries(catalogue))
    selected_ids = {project["id"] for project in projects}
    if selected_ids != WEBSITE_PROJECT_IDS:
        missing = sorted(WEBSITE_PROJECT_IDS - selected_ids)
        raise ValueError(f"Project registry is missing website entries: {', '.join(missing)}")
    snapshots = {"projects.json": projects, "project-tree.json": tree_nodes(catalogue)}
    # Validate every source before replacing either checked-in snapshot.
    for name, content in snapshots.items():
        output = ROOT / "src" / "data" / name
        temporary = output.with_suffix(".json.tmp")
        temporary.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        temporary.replace(output)
        print(f"Wrote {len(content)} entries to {output.relative_to(ROOT)}")


if __name__ == "__main__":
    try:
        main()
    except (HTTPError, URLError, OSError, ValueError, KeyError, json.JSONDecodeError) as error:
        print(f"Project refresh failed: {error}", file=sys.stderr)
        sys.exit(1)
