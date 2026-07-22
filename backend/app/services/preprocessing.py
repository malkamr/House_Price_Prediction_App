import json

import pandas as pd

from app.core.config import settings
from app.schemas.prediction import PredictionRequest

with open(settings.locations_path) as f:
    ALLOWED_LOCATIONS = set(json.load(f))


def request_to_dataframe(payload: PredictionRequest) -> pd.DataFrame:
    location = payload.location if payload.location in ALLOWED_LOCATIONS else "other"

    row = {
        "carpet_area_sqft": payload.carpet_area_sqft,
        "floor_num": payload.floor_num,
        "bathroom": payload.bathroom,
        "balcony": payload.balcony,
        "location_grouped": location,
        "Furnishing": payload.furnishing,
        "Transaction": payload.transaction,
        "Ownership": payload.ownership,
        "facing": payload.facing,
    }
    return pd.DataFrame([row])
