from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

class Expense(BaseModel):
    amount: float = Field(gt=0, description="Amount must be greater than 0")
    category: str = Field(..., min_length=1)
    date: str = Field(..., description="Format: YYYY-MM-DD")
    user_id: str
    id: Optional[int] = None
    note: Optional[str] = ""
    is_recurring: bool = False
    recurrence_interval: Optional[str] = None # daily, weekly, monthly
    last_recurrence_date: Optional[str] = None # YYYY-MM-DD
    created_at: Optional[str] = None

    @field_validator('date')
    @classmethod
    def validate_date(cls, v: str) -> str:
        try:
            if len(v) >= 10:
                datetime.strptime(v[:10], "%Y-%m-%d")
            return v
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")

    def to_dict(self, exclude_id=False):
        d = self.model_dump()
        if exclude_id:
            d.pop('id', None)
        return {k: v for k, v in d.items() if v is not None}
