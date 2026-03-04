from dataclasses import dataclass, asdict
from typing import Optional

@dataclass
class UserProfile:
    id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    updated_at: Optional[str] = None

    def to_dict(self):
        return {k: v for k, v in asdict(self).items() if v is not None}
