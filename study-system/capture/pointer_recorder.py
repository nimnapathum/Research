"""Optional cross-platform mouse/trackpad summary recorder for a study task.

Only aggregate summaries are saved. No key, clipboard, or raw coordinate stream is saved.
The listener is global while this explicitly started process runs; stop it during breaks.
"""

import argparse
import json
import math
import os
import platform
import statistics
import sys
import time
from datetime import datetime, timezone
from pathlib import Path


def utc_now():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


class Window:
    def __init__(self, task_id, seconds=5):
        self.task_id = task_id
        self.seconds = seconds
        self.reset()

    def reset(self):
        self.started_utc = utc_now()
        self.started_mono = time.monotonic()
        self.last = None
        self.move_events = 0
        self.distance = 0.0
        self.speeds = []
        self.clicks = 0
        self.scrolls = 0

    def move(self, x, y, now=None):
        now = time.monotonic() if now is None else now
        self.move_events += 1
        if self.last is not None:
            old_x, old_y, old_time = self.last
            delta = now - old_time
            if 0 < delta <= 2:
                distance = math.hypot(x - old_x, y - old_y)
                self.distance += distance
                if distance > 0:
                    self.speeds.append(distance / delta)
        self.last = (x, y, now)

    def click(self):
        self.clicks += 1

    def scroll(self):
        self.scrolls += 1

    def due(self):
        return time.monotonic() - self.started_mono >= self.seconds

    def summary(self, elapsed=None):
        elapsed = max(0, time.monotonic() - self.started_mono if elapsed is None else elapsed)
        ordered = sorted(self.speeds)
        p90 = ordered[min(len(ordered) - 1, math.ceil(len(ordered) * 0.9) - 1)] if ordered else None
        return {
            "task_id": self.task_id,
            "source": "pointer-recorder",
            "actor": "participant",
            "event_type": "pointer_summary",
            "timestamp_utc": utc_now(),
            "data": {
                "window_started_utc": self.started_utc,
                "elapsed_ms": round(elapsed * 1000),
                "move_events": self.move_events,
                "distance_px": round(self.distance, 2),
                "median_speed_px_s": round(statistics.median(ordered), 2) if ordered else None,
                "p90_speed_px_s": round(p90, 2) if p90 is not None else None,
                "clicks": self.clicks,
                "scrolls": self.scrolls,
                "platform": platform.system().lower(),
                "scope": "all pointer activity while recorder runs; no foreground filter",
            },
        }


def available_backend():
    if platform.system() == "Linux":
        if os.environ.get("XDG_SESSION_TYPE", "").lower() == "wayland":
            raise RuntimeError("Linux Wayland pointer capture is unsupported by this recorder; use video coding and mark pointer data missing")
        if not os.environ.get("DISPLAY"):
            raise RuntimeError("Linux X11 capture requires DISPLAY and a desktop session")
    try:
        from pynput import mouse
    except ImportError as error:
        raise RuntimeError("Install the optional dependency with: python -m pip install pynput") from error
    if mouse.Listener.IS_TRUSTED is False:
        raise RuntimeError("This Python/terminal process lacks OS input-monitoring permission; grant the required permission and rerun --probe")
    return mouse


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--probe", action="store_true", help="check this OS and optional dependency")
    parser.add_argument("--self-test", action="store_true", help="test aggregation without mouse access")
    parser.add_argument("--run", action="store_true", help="start recording after study approval")
    args = parser.parse_args()
    if args.self_test:
        window = Window("P999-T1")
        window.move(0, 0, 1.0)
        window.move(3, 4, 1.1)
        window.click()
        window.scroll()
        result = window.summary(elapsed=5)
        assert result["data"]["distance_px"] == 5.0
        assert result["data"]["clicks"] == 1 and result["data"]["scrolls"] == 1
        print(json.dumps(result))
        return
    if not args.probe and not args.run:
        parser.error("Choose --probe or --run")
    mouse = available_backend()
    if args.probe:
        print(f"Pointer backend available on {platform.system()}. Confirm it receives events during the host rehearsal.")
        return
    workspace = Path(__file__).resolve().parent.parent
    config = json.loads((workspace / "study" / "CAPTURE_CONFIG.json").read_text(encoding="utf-8"))
    task_id = config["task_id"]
    capture_dir = workspace / ".study-capture"
    capture_dir.mkdir(exist_ok=True)
    output = capture_dir / "pointer-summary.jsonl"
    if not output.exists():
        output.touch(mode=0o600)
    window = Window(task_id)
    from threading import Lock
    lock = Lock()

    def on_move(x, y, injected=False):
        if injected:
            return
        with lock:
            window.move(x, y)

    def on_click(_x, _y, _button, pressed, injected=False):
        if pressed and not injected:
            with lock:
                window.click()

    def on_scroll(_x, _y, _dx, _dy, injected=False):
        if injected:
            return
        with lock:
            window.scroll()

    print(f"Pointer summaries for {task_id} are being recorded while this terminal runs.")
    print("The listener sees pointer activity across applications. Stop with Ctrl+C during breaks or when the task ends.")
    listener = mouse.Listener(on_move=on_move, on_click=on_click, on_scroll=on_scroll)
    interrupted = False
    try:
        listener.start()
        while listener.is_alive():
            time.sleep(0.2)
            with lock:
                if window.due():
                    with output.open("a", encoding="utf-8") as file:
                        file.write(json.dumps(window.summary()) + "\n")
                    window.reset()
    except KeyboardInterrupt:
        interrupted = True
    finally:
        listener.stop()
        with lock:
            if time.monotonic() - window.started_mono > 0.25:
                with output.open("a", encoding="utf-8") as file:
                    file.write(json.dumps(window.summary()) + "\n")
    if not interrupted:
        raise RuntimeError("Pointer listener stopped unexpectedly; treat this task's pointer stream as incomplete")
    print(f"Saved aggregate summaries to {output}")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as error:
        print(f"Pointer capture unavailable: {error}", file=sys.stderr)
        sys.exit(2)
