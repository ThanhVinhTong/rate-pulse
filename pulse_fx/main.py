import os

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
        script.get_fx()
    finally:
        driver.quit()
        print("Driver closed")


if __name__ == "__main__":
    main()