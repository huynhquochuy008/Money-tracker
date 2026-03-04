from dataclasses import dataclass, asdict
from typing import Optional

@dataclass
class Expense:
    amount: float
    category: str
    date: str
    user_id: str
    id: Optional[int] = None
    note: Optional[str] = None
    created_at: Optional[str] = None

    def to_dict(self, exclude_id=False):
        d = asdict(self)
        if exclude_id:
            d.pop('id', None)
        return {k: v for k, v in d.items() if v is not None}
