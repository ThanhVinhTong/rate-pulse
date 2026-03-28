"""Small Selenium helpers shared by bank scrapers."""

from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver


def find_table_by_class_variants(driver: WebDriver, class_names: tuple[str, ...]):
    """
    Return the first tbody for a table matching any of the given class names.
    Raises NoSuchElementException if none match (site layout change or no table).
    """
    last: NoSuchElementException | None = None
    for cls in class_names:
        try:
            table = driver.find_element(By.CLASS_NAME, cls)
            return table.find_element(By.TAG_NAME, "tbody")
        except NoSuchElementException as e:
            last = e
    if last:
        raise last
    raise NoSuchElementException("No table class variants matched")
