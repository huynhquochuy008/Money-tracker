from pydantic import BaseModel, Field
from typing import Optional

class Budget(BaseModel):
    user_id: str
    category: str = Field(..., min_length=1)
    limit_amount: float = Field(ge=0)
    updated_at: Optional[str] = None

    def to_dict(self):
        # Filter out None values to match existing behavior
        return {k: v for k, v in self.model_dump().items() if v is not None}
