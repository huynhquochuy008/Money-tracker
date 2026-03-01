import json
import os
import threading
from typing import List, Dict, Any, Optional

class JSONStorage:
    _instances = {}
    _lock = threading.Lock()

    def __new__(cls, file_path: str):
        with cls._lock:
            if file_path not in cls._instances:
                instance = super().__new__(cls)
                instance._init_storage(file_path)
                cls._instances[file_path] = instance
            return cls._instances[file_path]

    def _init_storage(self, file_path: str):
        self.file_path = file_path
        self.lock = threading.Lock()
        self._ensure_file()

    def _ensure_file(self):
        os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
        if not os.path.exists(self.file_path) or os.stat(self.file_path).st_size == 0:
            with open(self.file_path, 'w', encoding='utf-8') as f:
                json.dump([], f if self.file_path.endswith('expenses.json') else {}, f)

    def read(self) -> Any:
        with self.lock:
            try:
                with open(self.file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return [] if self.file_path.endswith('expenses.json') else {}

    def write(self, data: Any):
        with self.lock:
            with open(self.file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
