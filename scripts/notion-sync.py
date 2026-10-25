#!/usr/bin/env python3
"""Read project overviews from Notion for the cloud website refresh."""

import argparse
import json
import os
from pathlib import Path
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
API = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"
# These IDs point to pages, not a Projects database. Tasks use separate linked views.
PROJECTS = {
    "da-timeless": "401662e3-8d25-8157-a241-d721b8084c5f",
    "daiana": "402662e3-8d25-8175-870e-eb836a8baff8",
    "pokeml": "401662e3-8d25-8185-bc4f-c5cc6c194d43",
    "beanim": "401662e3-8d25-8166-b228-dddb41801f47",
    "digital-presenter": "401662e3-8d25-81ec-935f-cb35d5d2b554",
    "string-cosmo": "401662e3-8d25-814b-b732-d5727aeb0099",
}
REPOSITORY_URLS = {
    "da-timeless": "https://github.com/PanoPepino/da-timeless-platform",
    "daiana": "https://github.com/PanoPepino/Daiana",
    "pokeml": "https://github.com/PanoPepino/ml_pokemon",
    "beanim": "https://github.com/PanoPepino/mtheoretical",
    "digital-presenter": "https://github.com/PanoPepino/digital_presenter",
    "string-cosmo": "https://github.com/PanoPepino/string_cosmo_communication",
}


def api(path):
    token = os.environ.get("NOTION_TOKEN")
    if not token:
        raise ValueError("Set NOTION_TOKEN")
    request = Request(API + path, headers={
        "Authorization": f"Bearer {token}", "Notion-Version": NOTION_VERSION,
        "Accept": "application/json",
    })
    with urlopen(request, timeout=30) as response:
        return json.load(response)


def children(block_id):
    result, cursor = [], None
    while True:
        suffix = "?page_size=100" + (f"&start_cursor={quote(cursor)}" if cursor else "")
        data = api(f"/blocks/{quote(block_id, safe='')}/children{suffix}")
        result.extend(data["results"])
        if not data.get("has_more"):
            return result
        cursor = data["next_cursor"]


def rich_markdown(rich):
    out = []
    for item in rich or []:
        value = item.get("plain_text", "")
        ann = item.get("annotations", {})
        if ann.get("code"):
            value = f"`{value}`"
        if ann.get("bold"):
            value = f"**{value}**"
        if ann.get("italic"):
            value = f"*{value}*"
        if item.get("href"):
            value = f"[{value}]({item['href']})"
        out.append(value)
    return "".join(out)


def blocks_markdown(blocks, depth=0):
    lines = []
    for block in blocks:
        kind = block["type"]
        body = block.get(kind, {})
        value = rich_markdown(body.get("rich_text", []))
        if kind in ("heading_1", "heading_2", "heading_3"):
            value = "#" * int(kind[-1]) + " " + value
        elif kind in ("bulleted_list_item", "numbered_list_item"):
            value = ("  " * depth) + ("- " if kind == "bulleted_list_item" else "1. ") + value
        elif kind == "to_do":
            value = ("  " * depth) + ("- [x] " if body.get("checked") else "- [ ] ") + value
        elif kind == "quote":
            value = "> " + value
        elif kind == "code":
            value = f"```{body.get('language', '')}\n{''.join(x.get('plain_text', '') for x in body.get('rich_text', []))}\n```"
        elif kind == "divider":
            value = "---"
        elif kind == "image":
            image = body.get("external", {}).get("url") or body.get("file", {}).get("url")
            if not image:
                raise ValueError("Notion image has no readable URL")
            caption = rich_markdown(body.get("caption", [])) or "image"
            value = f"![{caption}]({image})"
        elif kind == "table":
            rows = children(block["id"])
            rendered = []
            for row in rows:
                if row["type"] != "table_row":
                    raise ValueError("Unsupported Notion table row")
                cells = [rich_markdown(cell).replace("|", "\\|").replace("\n", "<br>")
                         for cell in row["table_row"].get("cells", [])]
                rendered.append("| " + " | ".join(cells) + " |")
            if rendered:
                if body.get("has_column_header") and len(rendered) > 1:
                    separator = "| " + " | ".join("---" for _ in range(body.get("table_width", 0))) + " |"
                    rendered.insert(1, separator)
                lines.extend(rendered)
            continue
        elif kind in ("child_page", "child_database", "unsupported"):
            raise ValueError(f"Unsupported Notion overview block: {kind}")
        elif kind not in ("paragraph", "heading_1", "heading_2", "heading_3", "bulleted_list_item",
                          "numbered_list_item", "to_do", "quote", "code", "divider", "callout", "image"):
            raise ValueError(f"Unsupported Notion overview block: {kind}")
        if value:
            lines.append(value)
        if block.get("has_children"):
            lines.extend(blocks_markdown(children(block["id"]), depth + 1))
    return lines


def page_content(project_id):
    page_id = PROJECTS[project_id]
    overview_blocks, in_overview = [], False
    after_task_view = False
    for block in children(page_id):
        kind = block["type"]
        body = block.get(kind, {})
        if kind.startswith("heading_"):
            in_overview = "".join(x.get("plain_text", "") for x in body.get("rich_text", [])).strip().casefold() == "overview"
        elif project_id == "manim-ecosystem" and kind == "child_database":
            after_task_view = True
        elif project_id == "manim-ecosystem" and after_task_view and kind == "child_page":
            break
        elif project_id == "manim-ecosystem" and after_task_view and kind not in ("bookmark", "link_preview"):
            overview_blocks.append(block)
        elif in_overview and kind not in ("child_page", "child_database", "bookmark", "link_preview"):
            if kind == "paragraph" and any(x.get("href") == REPOSITORY_URLS.get(project_id) for x in body.get("rich_text", [])):
                in_overview = False
                continue
            overview_blocks.append(block)
    overview = "\n\n".join(blocks_markdown(overview_blocks)).strip()
    return overview


def load_projects():
    result = {}
    for project_id in PROJECTS:
        overview = page_content(project_id)
        if not overview:
            raise ValueError(f"Overview missing: {project_id}")
        result[project_id] = {"overview": overview}
    return result


def refresh_website(projects):
    file = ROOT / "src/data/projects.json"
    cards = json.loads(file.read_text(encoding="utf-8"))
    by_id = {project["id"]: project for project in cards}
    for project_id, project in by_id.items():
        if project_id in projects:
            project["description"] = projects[project_id]["overview"]
        elif project_id != "manim-ecosystem":
            raise ValueError(f"Missing Notion project page: {project_id}")
        for component in project.get("components", []):
            child_id = component["id"]
            component_description = projects[child_id]["overview"]
            component["description"] = component_description
    file.write_text(json.dumps(cards, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Updated src/data/projects.json from Notion overviews")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("website",))
    parser.parse_args()
    projects = load_projects()
    refresh_website(projects)


if __name__ == "__main__":
    try:
        main()
    except (HTTPError, URLError, OSError, ValueError, KeyError, json.JSONDecodeError) as error:
        print(f"Notion sync failed: {error}", file=sys.stderr)
        sys.exit(1)
