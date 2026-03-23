from abc import ABC, abstractmethod

class Constant(ABC):
    @abstractmethod
    def get_website(self) -> str:
        pass
    
    @abstractmethod
    def get_info(self) -> dict:
        pass

    @abstractmethod
    def get_translate_column(self) -> dict:
        pass