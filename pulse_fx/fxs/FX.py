from selenium import webdriver
from abc import ABC, abstractmethod

class FX:
    @abstractmethod
    def __init__(self, driver: webdriver.Edge, bank_name: str) -> None:
        pass
    
    @abstractmethod
    def get_fx(self) -> dict[str, dict[str, str]]:
        pass