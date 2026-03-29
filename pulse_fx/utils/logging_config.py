"""Central logging setup for pulse_fx."""

import logging
import sys
from pathlib import Path


def configure_logging(level: int = logging.INFO, log_file: str | None = None) -> str | None:
    """
    Configure root logger with stdout; optionally also write to log_file.
    Returns the resolved absolute log path when file logging is enabled.
    """
    root = logging.getLogger()
    fmt = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    root.handlers.clear()
    root.setLevel(level)

    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(fmt)
    root.addHandler(sh)

    resolved: str | None = None
    if log_file:
        path = Path(log_file).expanduser().resolve()
        path.parent.mkdir(parents=True, exist_ok=True)
        fh = logging.FileHandler(path, encoding="utf-8")
        fh.setFormatter(fmt)
        root.addHandler(fh)
        resolved = str(path)

    return resolved
