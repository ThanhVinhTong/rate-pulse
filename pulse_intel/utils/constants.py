from datetime import datetime
from typing import Optional

output_folder = "./output_news/"
webdriver_path = "./edgedriver_145/msedgedriver.exe"

wms_website = "https://www.worldmonitor.app/"
yfs_website = "https://finance.yahoo.com/quote/"

wms_ids = {
    # Insights by AI
    "ai_insights": "insightsContent",

    # Wars intel
    "intel_feed": "intelContent",

    # News by continents
    "world_news": "politicsContent",
    "united_states": "usContent",
    "europe": "europeContent",
    "middle_east": "middleeastContent",
    "africa": "africaContent",
    "latin_america": "latamContent",
    "asia_pacific": "asiaContent",

    # Energies, resources, environment and government
    "energy_and_resources": "energyContent",
    "government": "govContent",
    "think_tanks": "thinktanksContent",

    # Supply chain
    # "markets": "marketsContent",
    # "economic_indicators": "economicContent",
    # "trade_policy": "trade-policyContent",
    # "supply_chain": "supply-chainContent",
    "financial": "financeContent",

    # Technology
    "technology": "techContent",
    "crypto": "cryptoContent",
    "ai_ml": "aiContent"
}

yfs_ids = {
    "bank_usa": ["JPM", "GS", "BAC"],
    "mega_cap_usa": ["AAPL", "MSFT", "NVDA", "AMZN"],
    "energy_global": ["XOM", "CVX", "COP", "SLB"],
    "miners_global": ["BHP", "RIO", "VALE", "FCX"],
    "japan_export_finance": ["TM", "SONY", "MUFG"],
    "europe_core": ["ASML", "SAP", "SIE.DE", "BNP.PA"],
    "asia_semis": ["TSM", "005930.KS"],
    # "fx_macro": [
    #     "DX-Y.NYB",   # DXY
    #     "^TNX",       # US 10Y yield
    #     "CL=F",       # WTI crude
    #     "GC=F",       # Gold
    #     "EURUSD=X",
    #     "USDJPY=X",
    #     "GBPUSD=X",
    #     "AUDUSD=X",
    #     "USDCAD=X",
    # ],
}

def get_output_folder() -> str:
    name = datetime.now().strftime("%Y%m%d")
    return output_folder + name

def get_webdriver_path() -> str:
    return webdriver_path

def get_wms_website() -> str:
    return wms_website

def get_yfs_website() -> str:
    return yfs_website

def get_wms_ids(indexes: Optional[list[str]] = None) -> dict:
    if indexes is None or len(indexes) == 0:
        return wms_ids
    return {key: wms_ids[key] for key in indexes}