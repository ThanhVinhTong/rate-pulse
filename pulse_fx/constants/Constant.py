from abc import ABC, abstractmethod

class Constant:
    @abstractmethod
    def get_website(self) -> str:
        pass

    @abstractmethod
    def get_elements_info(self) -> dict:
        pass