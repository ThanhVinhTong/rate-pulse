import logging
import re

logger = logging.getLogger(__name__)


def parse_rate(rate_str: str | None):
    """Parse a displayed rate; return None if empty, dash, or unparsable."""
    if rate_str is None:
        return None
    rate_str = str(rate_str).replace("\xa0", " ").strip()
    if not rate_str or rate_str == "-" or rate_str == "0":
        return None

    rate_str = re.sub(r"\s+", "", rate_str)
    if "," in rate_str and "." in rate_str:
        if rate_str.rfind(",") > rate_str.rfind("."):
            rate_str = rate_str.replace(".", "").replace(",", ".")
        else:
            rate_str = rate_str.replace(",", "")
    elif "," in rate_str:
        if re.fullmatch(r"\d{1,3}(?:,\d{3})+", rate_str):
            rate_str = rate_str.replace(",", "")
        else:
            rate_str = rate_str.replace(",", ".")
    elif "." in rate_str and re.fullmatch(r"\d{1,3}(?:\.\d{3})+", rate_str):
        rate_str = rate_str.replace(".", "")

    try:
        return float(rate_str)
    except (ValueError, TypeError) as e:
        logger.debug("parse_rate rejected %r: %s", rate_str, e)
        return None


def clean_symbol(symbol: str | None) -> str:
    if symbol is None:
        return ""
    return str(symbol).replace("#", "").replace("&", "").strip()