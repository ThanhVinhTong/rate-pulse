import os
from pprint import pprint

from pulse_fx.utils.sessions import start_driver
from pulse_fx.fxs.script import Script


def main() -> None:
    # Option 1: set in environment (recommended)
    # PowerShell: $env:EDGE_DRIVER_PATH="C:/path/to/msedgedriver.exe"
    webdriver_path = os.getenv("EDGE_DRIVER_PATH", "./edgedriver_145/msedgedriver.exe")

    driver = start_driver(webdriver_path)
    print("Driver started successfully")

    try:
        script = Script(driver)
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