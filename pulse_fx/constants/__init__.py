# In pulse_fx/constants/__init__.py or a registry file
from .vn.VCBBank import VCBBank
from .vn.BIDVBank import BIDVBank
from .vn.VietinBank import VietinBank
from .vn.ACBBank import ACBBank

BANK_CONSTANTS = {
    "vcb": VCBBank(),
    "bidv": BIDVBank(),
    "vtb": VietinBank(),
    "acb": ACBBank(),
    # "mb": MBBank,
}

BANK_UPDATE_TIMES = {
    "vcb": ["00:00:00 UTC+7"],
    "bidv": ["09:00:00 UTC+7", "21:00:00 UTC+7"],

}

def get_bank_constants() -> dict:
    return BANK_CONSTANTS

def get_bank_constant(bank_name: str):
    if bank_name not in BANK_CONSTANTS:
        return None
    return BANK_CONSTANTS[bank_name]()

def get_bank_update_time(bank_name: str) -> list[str]:
    if bank_name not in BANK_UPDATE_TIMES:
        return []
    return BANK_UPDATE_TIMES[bank_name]
