import os

def init_root_folder(folder_path: str) -> str:
    os.makedirs(folder_path, exist_ok=True)
    return folder_path

def init_subfolder(folder_path: str) -> int:
    try:
        return len(os.listdir(folder_path))
    except FileNotFoundError:
        os.makedirs(folder_path, exist_ok=True)
        return 0