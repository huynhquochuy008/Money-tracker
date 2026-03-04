from dataclasses import dataclass, asdict
from typing import Optional

@dataclass
class Budget:
    user_id: str
    category: str
    limit_amount: float
    updated_at: Optional[str] = None

    def to_dict(self):
        return {k: v for k, v in asdict(self).items() if v is not None}
