# In pulse_fx/constants/__init__.py or a registry file
from .vn.VCBBank import VCBBank
from .vn.BIDVBank import BIDVBank
from .vn.VietinBank import VietinBank
from .vn.ACBBank import ACBBank

BANK_CONSTANTS = {
    "vcb": VCBBank,
    "bidv": BIDVBank,
    "vtb": VietinBank,
    "acb": ACBBank,
    # "mb": MBBank,
}

def get_bank_constants() -> dict:
    return BANK_CONSTANTS

def get_bank_constant(bank_name: str):
    if bank_name not in BANK_CONSTANTS:
        return None
    return BANK_CONSTANTS[bank_name]()
