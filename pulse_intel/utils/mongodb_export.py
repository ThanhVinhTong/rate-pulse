from __future__ import annotations

import os
import re
import emoji
from pathlib import Path

from dotenv import load_dotenv
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

# ---------------------------------------------------------------------------
# Load .env (only affects this process, does not overwrite existing env vars)
# ---------------------------------------------------------------------------

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

_MONGO_URI: str = os.environ.get("MONGO_URI", "")
if not _MONGO_URI:
    raise EnvironmentError(
        "MONGO_URI is not set. Copy pulse_intel/.env.example to pulse_intel/.env "
        "and fill in your credentials."
    )


_client: MongoClient | None = None


def _get_client() -> MongoClient:
    """Return a cached MongoClient (lazy init)."""
    global _client
    if _client is None:
        _client = MongoClient(_MONGO_URI, server_api=ServerApi("1"))
    return _client


def ping() -> bool:
    """Return True if the connection is healthy."""
    try:
        _get_client().admin.command("ping")
        print("Pinged your deployment. You successfully connected to MongoDB!")
        return True
    except Exception as exc:
        print(f"MongoDB ping failed: {exc}")
        return False


# ---------------------------------------------------------------------------
# Internal helpers  (mirrors excel_export.py logic)
# ---------------------------------------------------------------------------

def _normalise_feed_section(section_data: dict) -> list[dict]:
    """
    Convert a feed section dict  { title: {href, time, source?} }
    into a list of flat article dicts.
    """
    articles: list[dict] = []
    if not isinstance(section_data, dict):
        return articles

    for title, payload in section_data.items():
        href = ""
        published = ""
        source = ""
        if isinstance(payload, dict):
            href = str(payload.get("href", ""))
            published = str(payload.get("time", ""))
            source = str(payload.get("source", ""))

        articles.append(
            {
                "title": str(title),
                "href": href,
                "domain": urlparse(href).netloc if href else "",
                "time": published,
                "source": source,
            }
        )
    return articles


_GEO_COUNTS_RE = re.compile(r"(\d+)\s+signal types?.*?(\d+)\s+events?", re.IGNORECASE)


def _normalise_geo_insights(geo_insights: list) -> list[dict]:
    """
    Convert each raw geo insight from:
        { "Region\\nRegion: detail\\n2 signal types • 6 events": "detail" }
    into a clean structured object:
        { "region": "Middle East", "detail": "...", "signal_types": 2, "events": 6 }
    """
    result: list[dict] = []
    if not isinstance(geo_insights, list):
        return result
    for item in geo_insights:
        if not isinstance(item, dict):
            continue
        for raw_key, detail in item.items():
            first_line = raw_key.split("\n", 1)[0].strip()
            matched = _GEO_COUNTS_RE.search(raw_key)
            result.append({
                "region": first_line,
                "detail": str(detail),
                "signal_types": int(matched.group(1)) if matched else None,
                "events": int(matched.group(2)) if matched else None,
            })
    return result


def _build_document(news_data: dict) -> dict:
    """
    Transform the raw scrape payload into the MongoDB document shape:

    {
        generated_at: datetime,
        ai_insights:  { world_brief, geo_insights, break_news },
        feeds: { <category>: [ {title, href, domain, time, source} ] },
        meta: { feed_category_count, feed_item_count, breaking_news_count,
                geo_insight_count }
    }
    """
    ai_insights: dict = news_data.get("ai_insights", {})
    if not isinstance(ai_insights, dict):
        ai_insights = {}

    # Separate feed sections from ai_insights
    feed_sections: dict[str, dict] = {
        key: value
        for key, value in news_data.items()
        if key != "ai_insights" and isinstance(value, dict)
    }

    feeds: dict[str, list[dict]] = {
        category: _normalise_feed_section(section_data)
        for category, section_data in feed_sections.items()
    }

    feed_item_count = sum(len(v) for v in feeds.values())
    break_news = ai_insights.get("break_news", [])
    geo_insights = ai_insights.get("geo_insights", [])

    return _strip_emoji_from_doc({
        "generated_at": datetime.now(timezone.utc),
        "ai_insights": {
            "world_brief": ai_insights.get("world_brief", ""),
            "geo_insights": _normalise_geo_insights(geo_insights),
            "break_news": break_news if isinstance(break_news, list) else [],
        },
        "feeds": feeds,
        "meta": {
            "feed_category_count": len(feed_sections),
            "feed_item_count": feed_item_count,
            "breaking_news_count": len(break_news) if isinstance(break_news, list) else 0,
            "geo_insight_count": len(geo_insights) if isinstance(geo_insights, list) else 0,
        },
    })


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def export_news_to_mongodb(
    news_data: dict,
    output_folder: Optional[str] = None,   # kept for API compatibility with excel_export
    *,
    db_name: str = "rate_pulse",
    collection_name: str = "news-rate-pulse",
) -> str | None:
    """
    Persist a scrape snapshot to MongoDB.

    Returns the inserted document's string ID, which main.py can print as the
    "path" (analogous to the Excel file path returned by export_news_to_excel).
    """
    try:
        document = _build_document(news_data)

        db = _get_client()[db_name]
        collection = db[collection_name]

        result = collection.insert_one(document)
        inserted_id = str(result.inserted_id)
        print(f"Snapshot stored → {db_name}.{collection_name} / _id={inserted_id}")
        return inserted_id
    except Exception as exc:
        print(f"MongoDB insert failed: {exc}")
        return None


# Decorative UI symbols that Selenium picks up from the website layout
_DECORATIVE_SYMBOLS = str.maketrans("", "", "●•◆◇▶▷▸◉○◎★☆")


# Maps typographic (curly) quotes → straight ASCII equivalents
_QUOTE_NORM = str.maketrans({
    "\u2018": "'",   # '  left single quotation mark
    "\u2019": "'",   # '  right single quotation mark
    "\u201c": '"',   # "  left double quotation mark
    "\u201d": '"',   # "  right double quotation mark
    "\u2032": "'",   # ′  prime (used as apostrophe)
    "\u2033": '"',   # ″  double prime
})


def _clean_str(text: str) -> str:
    """Normalise typographic quotes, strip emoji and decorative UI symbols."""
    text = text.translate(_QUOTE_NORM)           # curly quotes → straight ASCII
    text = emoji.replace_emoji(text, replace="") # remove emoji
    text = text.translate(_DECORATIVE_SYMBOLS)   # remove decorative symbols
    return text.strip()


def _strip_emoji_from_doc(obj):
    """Recursively strip emoji and decorative symbols from all string keys AND values."""
    if isinstance(obj, dict):
        return {
            (_clean_str(k) if isinstance(k, str) else k): _strip_emoji_from_doc(v)
            for k, v in obj.items()
        }
    if isinstance(obj, list):
        return [_strip_emoji_from_doc(i) for i in obj]
    if isinstance(obj, str):
        return _clean_str(obj)   # ← was emoji.replace_emoji(...) only, now uses _clean_str
    return obj



# ---------------------------------------------------------------------------
# Module-level connection check (runs on import, matches original behaviour)
# ---------------------------------------------------------------------------

ping()