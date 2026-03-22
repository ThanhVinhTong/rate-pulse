import os
from pprint import pprint

from utils.sessions import start_driver
from fxs.script import Script
from dotenv import load_dotenv

def main() -> None:
    load_dotenv()
    webdriver_path = os.getenv("EDGE_DRIVER_PATH", "./edgedriver_145/msedgedriver.exe")
    db_uri = os.getenv("SUPABASE_URI")

    driver = start_driver(webdriver_path)
    print("Driver started successfully")

    try:
        script = Script(driver, db_uri)
        fx_data = script.get_fx()

        print(f"Fetched {len(fx_data)} currencies")
        # show first 5 for quick check
        preview_keys = list(fx_data.keys())[:5]
        preview = {k: fx_data[k] for k in preview_keys}
        pprint(preview)
    finally:
        driver.quit()
        print("Driver closed")


if __name__ == "__main__":
    main()