# House Price Prediction — End-to-End ML Web App

Predict Indian real-estate prices from a Jupyter notebook, served through a FastAPI
backend, with a React frontend where you enter property details and get back an
estimated price.

## Overview

The project has three parts that plug into each other:

1. **`notebooks/`** — cleans the raw dataset, explores it, trains and compares two
   regression models, and exports the winning one as a single scikit-learn `Pipeline`
   (`house_price.pkl`).
2. **`backend/`** — a FastAPI service that loads `house_price.pkl` once at startup and
   exposes it over a small JSON API.
3. **`frontend/`** — a React + TypeScript form where a user fills in property details
   and sees the predicted price.

### New feature: predicted price range

Most versions of this project just show one number. This one also shows a **range**.
A Random Forest is an ensemble of ~200 individual trees, and each tree makes its own
slightly different guess for the same house. Instead of only averaging them into one
number, the backend also reads the 10th–90th percentile spread across all the trees
and returns it as a "likely between X and Y" range next to the main prediction. No
extra model or training is needed — it's the same forest, just read more carefully.
A tight range means the model is confident about a listing like others it has seen;
a wide range means the listing is more unusual and the estimate is shakier. See the
dedicated markdown cell in the notebook for the implementation.

## Architecture

```
 ┌─────────────┐      HTTP (JSON)      ┌──────────────┐      loads once      ┌────────────────────┐
 │   Frontend  │  ───────────────────► │   Backend    │ ───────────────────► │  house_price.pkl    │
 │ React + Vite│  ◄─────────────────── │  FastAPI     │                      │ (sklearn Pipeline:  │
 │  (port 5173)│   predicted_price,    │ (port 8000)  │                      │  preprocessing + RF) │
 └─────────────┘   low/high estimate   └──────────────┘                      └────────────────────┘
                                                                                        ▲
                                                                                        │ exported by
                                                                                 ┌──────┴───────┐
                                                                                 │  notebooks/   │
                                                                                 │  Jupyter model │
                                                                                 └───────────────┘
```

## Tech stack

- **Modeling:** Python, pandas, scikit-learn (`Pipeline` + `ColumnTransformer`), matplotlib, seaborn, joblib
- **Backend:** FastAPI, Pydantic / pydantic-settings, uvicorn
- **Frontend:** React 19, TypeScript, Vite, React Router
- **Tooling:** pytest + httpx for API tests, Docker for backend packaging

## Project structure

```
house-price-project/
├── notebooks/
│   ├── data/house_prices.csv        # not committed — see Dataset below
│   ├── house_price_model.ipynb
│   ├── house_price.pkl              # exported model
│   └── locations.json               # allowed location list for the dropdown
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, lifespan model loading
│   │   ├── api/routes/prediction.py # GET /health, POST /predict
│   │   ├── core/config.py           # settings from .env
│   │   ├── schemas/prediction.py    # PredictionRequest / PredictionResponse
│   │   ├── services/
│   │   │   ├── preprocessing.py     # request → one-row DataFrame
│   │   │   └── inference.py         # load .pkl, predict + price range
│   │   └── utils/logging_config.py
│   ├── models/house_price.pkl       # copied from the notebook
│   ├── locations.json
│   ├── tests/test_prediction.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/predictionClient.ts
│   │   ├── components/PredictionForm.tsx
│   │   ├── pages/HomePage.tsx | ResultPage.tsx | NotFoundPage.tsx
│   │   ├── types/prediction.ts
│   │   └── App.tsx
│   ├── public/locations.json
│   ├── package.json
│   └── .env.example
├── Screenshots/
|   ├── frontend
│   ├── backend
│   └── notebook
├── .gitignore
└── README.md
```

## Dataset

**House Price** by Juhi Bhojani — <https://www.kaggle.com/datasets/juhibhojani/house-price>
(~187,000 real property listings from India). The raw CSV is intentionally messy:
prices are written as `"42 Lac"` / `"1.2 Cr"` / `"Call for Price"`, areas mix `sqft`
and `sqm`, floors look like `"3 out of 10"`, and several columns have missing values —
cleaning that up is most of the work in the notebook.

Download it before running the notebook:

```bash
pip install kaggle
# Get your API token: Kaggle → Settings → API → "Create New Token"
# Place kaggle.json in C:\Users\<you>\.kaggle\ (Windows) or ~/.kaggle/ (macOS/Linux)
kaggle datasets download -d juhibhojani/house-price -p notebooks/data --unzip
```

or download the ZIP manually from the link above and place `house_prices.csv` in
`notebooks/data/`.

> The notebook in this repo was developed and tested against a locally generated
> sample with the same column names and messiness, since the full Kaggle file isn't
> bundled here. Re-run the notebook top-to-bottom against the real CSV before
> submitting — the cleaning code targets the exact same columns either way.

## Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # .venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
# open http://localhost:8000/docs
```

Run the tests:

```bash
pytest
```

### Environment variables (backend/.env)

| Variable          | Default                    | Description                              |
|-------------------|-----------------------------|-------------------------------------------|
| `MODEL_PATH`       | `models/house_price.pkl`   | Path to the exported pipeline             |
| `LOCATIONS_PATH`   | `locations.json`           | Allowed locations for one-hot encoding    |
| `ALLOWED_ORIGIN`   | `http://localhost:5173`    | Frontend origin allowed by CORS           |

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
# open http://localhost:5173
```

### Environment variables (frontend/.env)

| Variable              | Default                  | Description                    |
|-----------------------|---------------------------|---------------------------------|
| `VITE_API_BASE_URL`   | `http://localhost:8000`  | Base URL of the FastAPI backend |

## API reference

### `GET /health`

```json
{ "status": "ok" }
```

### `POST /predict`

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Indiranagar",
    "carpet_area_sqft": 1200,
    "floor_num": 4,
    "bathroom": 2,
    "balcony": 1,
    "furnishing": "Semi-Furnished",
    "transaction": "Resale",
    "ownership": "Freehold",
    "facing": "East"
  }'
```

Response:

```json
{
  "predicted_price": 9239350.0,
  "low_estimate": 6205000.0,
  "high_estimate": 13900000.0
}
```

## Model metrics

Trained on `log1p(price)` and evaluated on a held-out 20% test split:

| Model              | MAE (₹)     | RMSE (₹)    | R²     |
|--------------------|-------------|-------------|--------|
| Linear Regression  | 4,302,087   | 5,455,478   | 0.548  |
| Random Forest       | 4,230,044   | 5,369,695   | 0.562  |

**Random Forest** was chosen as the final model — it beats the linear baseline on
every metric because it can capture the non-linear way location, area and amenities
interact to set a price. See the notebook for the full comparison, the
predicted-vs-actual plot, and the 5-fold cross-validation score.


