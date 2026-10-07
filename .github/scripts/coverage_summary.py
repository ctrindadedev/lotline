"""Prints a Markdown coverage table from a JaCoCo XML report or a Vitest json-summary file."""

import json
import sys
import xml.etree.ElementTree as ET

THRESHOLD = 80.0


def jacoco(path):
    root = ET.parse(path).getroot()
    rows = {}
    for counter in root.findall("counter"):
        missed, covered = int(counter.get("missed")), int(counter.get("covered"))
        rows[counter.get("type")] = (covered, covered + missed)
    names = {"LINE": "Lines", "BRANCH": "Branches", "METHOD": "Methods", "CLASS": "Classes"}
    return [(label, *rows[key]) for key, label in names.items() if key in rows]


def vitest(path):
    total = json.load(open(path))["total"]
    return [
        (name.capitalize(), total[name]["covered"], total[name]["total"])
        for name in ["lines", "branches", "functions", "statements"]
    ]


def table(title, rows):
    lines = [f"### {title} coverage", "", "| Metric | Covered | Total | % |", "|---|---:|---:|---:|"]
    for name, covered, total in rows:
        percent = 100.0 * covered / total if total else 100.0
        mark = "✅" if percent >= THRESHOLD else "❌"
        lines.append(f"| {name} | {covered} | {total} | {percent:.2f}% {mark} |")
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    kind, report = sys.argv[1], sys.argv[2]
    rows = jacoco(report) if kind == "backend" else vitest(report)
    print(table(kind.capitalize(), rows))
