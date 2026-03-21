# In pulse_fx/constants/__init__.py or a registry file
from .vn.VCBBank import VCBBank

BANK_CONSTANTS = {
    "vcb": VCBBank,
    # "bidv": BIDVBank,
    # "vtb": VietinBank,
    # "acb": ACBBank,
    # "mb": MBBank,
}

def get_bank_constants() -> dict:
    return BANK_CONSTANTS

def get_bank_constant(bank_name: str):
    if bank_name not in BANK_CONSTANTS:
        raise ValueError(f"Unknown bank: {bank_name}")
    return BANK_CONSTANTS[bank_name]()