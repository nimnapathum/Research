"""Render the study's current methodology as an editable academic flowchart."""

from pathlib import Path
from xml.sax.saxutils import escape


OUT = Path(__file__).with_name("methodology_flow.svg")
W, H = 3000, 2250
INK = "#1d2b34"
MUTED = "#455861"
ACCENT = "#315f66"
LINE = "#9caeb4"
PALE = "#f5f7f7"
ACCENT_PALE = "#e8f0f0"

parts = [
    f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title desc">',
    '<title id="title">Research methodology flow</title>',
    '<desc id="desc">Four-stage flow from preparation and pilot to recruitment, two coding tasks with four security review checkpoints each, evidence collection, and analysis.</desc>',
    '<defs><marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M 1 1 L 11 6 L 1 11" fill="none" stroke="#315f66" stroke-width="2.2"/></marker></defs>',
    '<rect width="3000" height="2250" fill="#ffffff"/>',
]


def rect(x, y, w, h, fill="white", stroke=LINE, radius=22, sw=3):
    parts.append(
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
    )


def txt(x, y, value, size=29, weight=400, color=INK, anchor="start"):
    parts.append(
        f'<text x="{x}" y="{y}" fill="{color}" font-family="Arial, Helvetica, sans-serif" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}">{escape(value)}</text>'
    )


def card(x, y, w, h, heading, lines, fill="white", title_size=35, body_size=28):
    rect(x, y, w, h, fill=fill)
    txt(x + 30, y + 50, heading, title_size, 700)
    for i, line in enumerate(lines):
        txt(x + 30, y + 94 + i * 35, line, body_size, 400, MUTED)


def arrow(x1, y1, x2, y2, sw=4):
    parts.append(
        f'<path d="M {x1} {y1} L {x2} {y2}" fill="none" stroke="{ACCENT}" stroke-width="{sw}" marker-end="url(#arrow)"/>'
    )


def band(y, h, number, heading):
    rect(65, y, 2870, h, fill=PALE, stroke="#d1dadd", radius=28, sw=2)
    rect(95, y + 24, 67, 67, fill=ACCENT, stroke=ACCENT, radius=18, sw=0)
    txt(129, y + 71, str(number), 35, 700, "white", "middle")
    txt(185, y + 72, heading, 42, 700)


txt(72, 82, "Research methodology", 59, 700)
txt(75, 119, "Security trust calibration during agent-assisted JavaScript coding", 32, 400, MUTED)

# Phase 1 — study preparation.
band(155, 320, 1, "Prepare and pilot before main data collection")
card(100, 260, 890, 175, "Match tasks and proposals", [
    "Two small JavaScript projects",
    "SQL injection and path traversal",
    "Secure and vulnerable code variants",
])
card(1055, 260, 890, 175, "Validate evidence", [
    "Normal and attack tests; review rubric",
    "Record candidate origin and exact diff",
    "Label constructed stimuli honestly",
])
card(2010, 260, 890, 175, "Pilot, revise, freeze", [
    "4–6 separate pilot participants",
    "Test capture, task timing, mode separation",
    "Freeze materials before main study",
])
arrow(993, 347, 1047, 347)
arrow(1948, 347, 2002, 347)
arrow(1500, 478, 1500, 517)

# Phase 2 — people and randomization.
band(525, 285, 2, "Recruit, prepare, and allocate 30 completed participants")
card(100, 625, 890, 145, "Recruit and consent", [
    "Final-year CS/IT students and junior SEs",
    "Basic JavaScript and IDE eligibility",
], title_size=34, body_size=28)
card(1055, 625, 890, 145, "Baseline and training", [
    "Experience, security and agent-use survey",
    "Portal ZIP, Antigravity and agent-mode practice",
], title_size=34, body_size=28)
card(2010, 625, 890, 145, "Balanced assignment", [
    "Project A + B; one task per condition",
    "Counterbalance project and task order",
], title_size=34, body_size=28)
arrow(993, 697, 1047, 697)
arrow(1948, 697, 2002, 697)
arrow(1500, 813, 1500, 857)

# Phase 3 — participant session and nested checkpoint protocol.
band(865, 750, 3, "Participant session: two coding tasks with the same review workflow")
card(100, 970, 1100, 130, "Task 1", [
    "Project A or B; assigned acceleration or exploration; 35–45 min",
], title_size=35, body_size=27)
card(1260, 970, 480, 130, "Reset", [
    "5-minute break; new workspace",
], title_size=35, body_size=27)
card(1800, 970, 1100, 130, "Task 2", [
    "Other project and other condition; 35–45 min",
], title_size=35, body_size=27)
arrow(1204, 1035, 1252, 1035)
arrow(1744, 1035, 1792, 1035)
txt(100, 1161, "Inside each task: repeat four feature checkpoints", 34, 700, ACCENT)
txt(2900, 1161, "1 secure + 1 vulnerable SQL; 1 secure + 1 vulnerable path", 28, 400, MUTED, "end")

checkpoint_cards = [
    ("1  Feature brief", ["Function and explicit", "security requirement"]),
    ("2  Agent work", ["Discuss, inspect, plan", "before target edit"]),
    ("3  Reveal proposal", ["Controlled secure or", "vulnerable code applied"]),
    ("4  Review", ["Frozen snapshot;", "inspect, ask, test"]),
    ("5  Decide and rate", ["Provisional keep/reject", "0–100% security confidence"]),
    ("6  Repair and test", ["Edit or replace freely;", "check final feature"]),
]
for i, (heading, lines) in enumerate(checkpoint_cards):
    x = 100 + i * 475
    card(x, 1200, 420, 205, heading, lines, fill="white" if i != 4 else ACCENT_PALE, title_size=29, body_size=25)
    if i < 5:
        arrow(x + 425, 1302, x + 468, 1302, sw=3)

rect(100, 1455, 2800, 112, fill=ACCENT_PALE, stroke="#c0d2d3", radius=18, sw=2)
txt(130, 1501, "Captured throughout", 31, 700, ACCENT)
txt(510, 1501, "Portal decisions and ratings  •  screen video  •  agent transcript  •  client/IDE events  •  diffs and hashes", 27, 400, INK)
txt(130, 1541, "At each task end: final repository snapshot and short post-task form", 26, 400, MUTED)
arrow(1500, 1618, 1500, 1662)

# Phase 4 — evaluation.
band(1670, 490, 4, "Interview, assess security, and answer the research questions")
card(100, 1780, 890, 225, "Participant reflection", [
    "Video-cued interview after both tasks",
    "Ask why code was kept, checked, repaired",
    "Clarify intention and observed mode",
], title_size=34, body_size=27)
card(1055, 1780, 890, 225, "Independent assessment", [
    "Normal + attack oracles; blinded review",
    "Code pre/post decision security checks",
    "Code observed mode separately from assignment",
], title_size=34, body_size=27)
card(2010, 1780, 890, 225, "Paired and process analysis", [
    "RQ1 confidence–security alignment",
    "RQ2 final vulnerability retention",
    "RQ3 checks; RQ4 SQL/path exploratory",
], title_size=34, body_size=27)
arrow(993, 1892, 1047, 1892)
arrow(1948, 1892, 2002, 1892)
txt(1500, 2104, "Interpret assigned encouragement and observed interaction mode separately; 30 people are the independent participant sample.", 27, 400, MUTED, "middle")

txt(2940, 2220, "Protocol summary • 12 Oct 2026", 21, 400, MUTED, "end")
parts.append("</svg>")
OUT.write_text("\n".join(parts), encoding="utf-8")
print(OUT)
