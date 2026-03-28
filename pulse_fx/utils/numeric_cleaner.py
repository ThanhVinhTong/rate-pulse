import logging

logger = logging.getLogger(__name__)


def parse_rate(rate_str: str | None):
    """Parse a displayed rate; return None if empty, dash, or unparsable."""
    if rate_str is None:
        return None
    rate_str = str(rate_str).strip()
    if not rate_str or rate_str == "-" or rate_str == "0":
        return None
    try:
        return float(rate_str.replace(",", ""))
    except (ValueError, TypeError) as e:
        logger.debug("parse_rate rejected %r: %s", rate_str, e)
        return None


def clean_symbol(symbol: str | None) -> str:
    if symbol is None:
        return ""
    return str(symbol).replace("#", "").replace("&", "").strip()