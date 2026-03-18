from datetime import datetime
from typing import Optional

output_folder = "./output_news/"
website = "https://www.worldmonitor.app/"
webdriver_path = "./edgedriver_145/msedgedriver.exe"
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
    "economic_indicators": "economicContent",
    "trade_policy": "trade-policyContent",
    "supply_chain": "supply-chainContent",
    "financial": "financeContent",

    # Technology
    "technology": "techContent",
    "crypto": "cryptoContent",
    "ai_ml": "aiContent"
}

def get_output_folder() -> str:
    name = datetime.now().strftime("%Y%m%d")
    return output_folder + name

def get_webdriver_path() -> str:
    return webdriver_path

def get_website() -> str:
    return website

def get_wms_ids(indexes: Optional[list[str]] = None) -> dict:
    if indexes is None or len(indexes) == 0:
        return wms_ids
    return {key: wms_ids[key] for key in indexes}