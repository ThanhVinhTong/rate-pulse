from .vn.VCBConstant import VCBConstant
from .vn.BaoVietConstant import BaoVietConstant
from .vn.EximbankConstant import EximbankConstant
from .vn.GPBankConstant import GPBankConstant
from .au.CBAConstant import CBAConstant
from .vn.BIDVConstant import BIDVConstant
from .vn.VTBConstant import VTBConstant
from .vn.ACBConstant import ACBConstant
from .vn.MBBConstant import MBBConstant
from .vn.TCBConstant import TCBConstant
from .vn.AgribankConstant import AgribankConstant
from .vn.HSBCVNConstant import HSBCVNConstant
from .vn.KLBConstant import KLBConstant
from .vn.TPBConstant import TPBConstant

BANK_CONSTANTS = {
    "vcb": VCBConstant,
    "baoviet": BaoVietConstant,
    "bvb": BaoVietConstant,
    "eximbank": EximbankConstant,
    "exim": EximbankConstant,
    "gpbank": GPBankConstant,
    "cba": CBAConstant,
    "bidv": BIDVConstant,
    "vtb": VTBConstant,
    "acb": ACBConstant,
    "mbb": MBBConstant,
    "tcb": TCBConstant,
    "agribank": AgribankConstant,
    "hsbcvn": HSBCVNConstant,
    "klb": KLBConstant,
    "tpb": TPBConstant,
}

BANK_CODES = {
    "vcb": "VCB",
    "baoviet": "BAOVIET",
    "bvb": "BAOVIET",
    "eximbank": "EXIMBANK",
    "exim": "EXIMBANK",
    "gpbank": "GPBANK",
    "cba": "CBA",
    "bidv": "BIDV",
    "vtb": "VTB",
    "acb": "ACB",
    "mbb": "MBB",
    "tcb": "TCB",
    "agribank": "AGRIBANK",
    "hsbcvn": "HSBC-VN",
    "klb": "KLB",
    "tpb": "TPB",
}

def get_bank_constants() -> dict:
    return BANK_CONSTANTS

def get_bank_constant(bank_name: str):
    key = bank_name.lower() if isinstance(bank_name, str) else bank_name
    if key not in BANK_CONSTANTS:
        return None
    return BANK_CONSTANTS[key]()

def get_bank_code(bank_name: str):
    key = bank_name.lower() if isinstance(bank_name, str) else bank_name
    return BANK_CODES.get(key)

def require_bank_constant(bank_name: str):
    """Return bank constant instance or raise KeyError with a clear message."""
    key = bank_name.lower() if isinstance(bank_name, str) else bank_name
    if key not in BANK_CONSTANTS:
        raise KeyError(f"Unknown bank constant: {bank_name!r}")
    return BANK_CONSTANTS[key]()
