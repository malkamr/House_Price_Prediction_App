import numpy as np
import joblib
import pandas as pd

from app.core.config import settings

_model = None


def load_model():
    global _model
    if _model is None:
        _model = joblib.load(settings.model_path)
    return _model


def predict_with_range(X_row: pd.DataFrame) -> dict:
    pipeline = load_model()
    prep = pipeline.named_steps["prep"]
    forest = pipeline.named_steps["reg"]

    X_transformed = prep.transform(X_row)
    tree_preds_log = np.array([tree.predict(X_transformed) for tree in forest.estimators_])
    tree_preds = np.expm1(tree_preds_log)

    return {
        "predicted_price": float(tree_preds.mean()),
        "low_estimate": float(np.percentile(tree_preds, 10)),
        "high_estimate": float(np.percentile(tree_preds, 90)),
    }
