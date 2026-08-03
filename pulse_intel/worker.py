import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING
from pymongo.server_api import ServerApi

from utils.cloud_delivery import deliver_run_notifications
from utils.logging_config import configure_logging

logger = logging.getLogger(__name__)

MIN_PROD_RECORDS = 10
MIN_WEEKLY_RECORDS = 60


def _default_log_path() -> str:
    base = os.getcwd()
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    return os.path.join(base, "logs", f"pulse_intel_worker_{ts}.log")


def prune_collection(collection, min_limit: int, name: str):
    count = collection.count_documents({})
    if count <= min_limit:
        logger.info("[%s] Total documents (%d) <= limit (%d). Skipping deletion.", name, count, min_limit)
        return

    to_delete_count = count - min_limit
    oldest_docs = list(collection.find({}, {"_id": 1}).sort("generated_at", ASCENDING).limit(to_delete_count))
    if oldest_docs:
        delete_ids = [d["_id"] for d in oldest_docs]
        res = collection.delete_many({"_id": {"$in": delete_ids}})
        logger.info("[%s] Deleted %d oldest records. Retained %d records.", name, res.deleted_count, min_limit)


def sync_and_prune() -> int:
    load_dotenv(Path(__file__).parent / ".env")

    log_file = os.getenv("PULSE_INTEL_LOG_FILE", "") or _default_log_path()
    configure_logging(log_file=log_file)
    logger.info("Worker process starting...")

    prod_uri = os.environ.get("MONGO_URI", "")
    prod_db = os.environ.get("MONGO_DB", "rate_pulse")
    prod_col_name = os.environ.get("MONGO_COLLECTION", "news-rate-pulse")

    weekly_uri = os.environ.get("MONGO_WEEKLY_URI", "")
    weekly_db = os.environ.get("MONGO_WEEKLY_DB", "rate_pulse")
    weekly_col_name = os.environ.get("MONGO_WEEKLY_COLLECTION", "news-rate-pulse-weekly")

    if not prod_uri:
        logger.error("MONGO_URI is not set.")
        deliver_run_notifications(log_path=log_file, success=False)
        return 1

    exit_code = 0
    try:
        prod_client = MongoClient(prod_uri, server_api=ServerApi("1"))
        prod_col = prod_client[prod_db][prod_col_name]

        # Determine if a distinct second cluster/URI is configured
        is_valid_weekly = bool(
            weekly_uri 
            and not weekly_uri.startswith("mongodb+srv://<user>") 
            and "<" not in weekly_uri 
            and weekly_uri != prod_uri
        )

        if not is_valid_weekly:
            logger.info("MONGO_WEEKLY_URI is unconfigured, placeholder, or identical to PROD_URI. Skipping sync to weekly cluster.")
            prune_collection(prod_col, MIN_PROD_RECORDS, "prod")
            logger.info("Worker prune completed successfully.")
            return 0

        weekly_client = MongoClient(weekly_uri, server_api=ServerApi("1"))
        weekly_col = weekly_client[weekly_db][weekly_col_name]

        prod_docs = list(prod_col.find({}, {"_id": 1, "generated_at": 1}))
        if not prod_docs:
            logger.info("No documents found in prod collection.")
        else:
            logger.info("Found %d documents in prod collection.", len(prod_docs))
            existing_weekly_ids = set(weekly_col.distinct("_id"))
            new_ids = [doc["_id"] for doc in prod_docs if doc["_id"] not in existing_weekly_ids]

            if new_ids:
                docs_to_transfer = list(prod_col.find({"_id": {"$in": new_ids}}))
                weekly_col.insert_many(docs_to_transfer)
                logger.info("Transferred %d new records to weekly collection.", len(docs_to_transfer))
            else:
                logger.info("No new records to transfer. Weekly collection is up-to-date.")

        prune_collection(prod_col, MIN_PROD_RECORDS, "prod")
        prune_collection(weekly_col, MIN_WEEKLY_RECORDS, "weekly")
        logger.info("Worker sync and prune completed successfully.")

    except Exception:
        logger.exception("Worker process encountered an unhandled error.")
        exit_code = 1
    finally:
        deliver_run_notifications(log_path=log_file, success=(exit_code == 0))

    return exit_code


if __name__ == "__main__":
    sys.exit(sync_and_prune())
