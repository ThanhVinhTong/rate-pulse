from sqlalchemy import create_engine
from fxs.vn.VCB import VCB
from fxs.vn.BIDV import BIDV
from fxs.vn.ACB import ACB
from fxs.vn.VTB import VTB
from fxs.vn.MBB import MBB

class Script:
    def __init__(self, driver, db_uri: str) -> None:
        self.driver = driver
        self.db_uri = db_uri

    def get_fx(self) -> None:
        connection_engine = create_engine(self.db_uri)
        connection = connection_engine.connect()
        
        # List of all banks
        banks = [
            VCB(self.driver, connection),
            BIDV(self.driver, connection),
            ACB(self.driver, connection),
            VTB(self.driver, connection),
            MBB(self.driver, connection),
        ]
        
        for bank in banks:
            bank.get_fx()  # each one checks its own time, scrapes, and inserts!
            
        connection.close()
