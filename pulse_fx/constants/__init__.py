# In pulse_fx/constants/__init__.py or a registry file
from .vn.VCBConstant import VCBConstant
from .vn.BIDVConstant import BIDVConstant
from .vn.VTBConstant import VTBConstant
from .vn.ACBConstant import ACBConstant
from .vn.MBBConstant import MBBConstant

BANK_CONSTANTS = {
    "vcb": VCBConstant,
    "bidv": BIDVConstant,
    "vtb": VTBConstant,
    "acb": ACBConstant,
    "mbb": MBBConstant,
}

def get_bank_constants() -> dict:
    return BANK_CONSTANTS

def get_bank_constant(bank_name: str):
    if bank_name not in BANK_CONSTANTS:
        return None
    return BANK_CONSTANTS[bank_name]()


def require_bank_constant(bank_name: str):
    """Return bank constant instance or raise KeyError with a clear message."""
    key = bank_name.lower() if isinstance(bank_name, str) else bank_name
    if key not in BANK_CONSTANTS:
        raise KeyError(f"Unknown bank constant: {bank_name!r}")
    return BANK_CONSTANTS[key]()
