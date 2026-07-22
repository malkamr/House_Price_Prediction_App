from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    location: str
    carpet_area_sqft: float = Field(gt=0)
    floor_num: int
    bathroom: int
    balcony: int
    furnishing: str
    transaction: str
    ownership: str
    facing: str


class PredictionResponse(BaseModel):
    predicted_price: float
    low_estimate: float
    high_estimate: float
