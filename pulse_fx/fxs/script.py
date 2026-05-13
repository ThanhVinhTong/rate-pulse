import logging

from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError

from fxs.vn.ACB import ACB
from fxs.vn.BIDV import BIDV
from fxs.vn.MBB import MBB
from fxs.vn.VCB import VCB
from fxs.vn.VTB import VTB

logger = logging.getLogger(__name__)


class Script:
    def __init__(self, driver, db_uri: str) -> None:
        self.driver = driver
        self.db_uri = db_uri

    def get_fx(self) -> None:
        if not self.db_uri or not str(self.db_uri).strip():
            logger.error("DB_SOURCE / db_uri is missing or empty; aborting.")
            return

        try:
            engine = create_engine(self.db_uri)
        except SQLAlchemyError:
            logger.exception("Could not create SQLAlchemy engine (check DB_SOURCE).")
            return
        except Exception:
            logger.exception("Unexpected error creating database engine.")
            return

        bank_classes = [VCB, BIDV, ACB, VTB, MBB]
        # bank_classes = [VTB] # for debugging only

        conn = engine.connect()
        for cls in bank_classes:
            label = cls.__name__
            try:
                logger.info("--- Starting %s ---", label)
                bank = cls(self.driver, conn)
                bank.get_fx()
            except Exception:
                logger.exception("%s: unhandled error; rolling back and continuing with next bank", label)
                try:
                    conn.rollback()
                except SQLAlchemyError:
                    logger.warning("%s: rollback after failure also failed", label)

        conn.close()
        engine.dispose()