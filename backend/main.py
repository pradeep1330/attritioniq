import os
import sys
import io
import logging

# Ensure backend root is always in Python search path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, APIRouter
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np

from schemas import (
    HealthResponse, DatasetSummaryResponse, EDAResponse,
    TrainingResponse, FeatureImportanceResponse, EmployeeInput,
    PredictionResult, BatchPredictionResponse, DashboardResponse,
    AdvisorRequest, AdvisorResponse
)
from services.sample_data import generate_hr_dataset
from services.preprocessing import detect_target_column
from services.training import train_all_models, get_feature_importances, MODELS_DIR
from services.eda import compute_eda
from services.prediction import (
    predict_single, predict_batch_df, generate_dashboard_data, get_loaded_pipeline_and_meta
)
from services.advisor import get_ai_retention_plan

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AttritionIQ-Backend")

app = FastAPI(
    title="AttritionIQ Backend API",
    description="Full-stack ML & HR Analytics engine for Employee Attrition Prediction & Insights",
    version="1.0.0"
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory dataset state
CURRENT_DATA: Optional[pd.DataFrame] = None
TARGET_COL: str = "Attrition"

def are_models_trained() -> bool:
    meta_file = os.path.join(MODELS_DIR, "metadata.joblib")
    return os.path.exists(meta_file)

def get_best_model_name() -> Optional[str]:
    import joblib
    meta_file = os.path.join(MODELS_DIR, "metadata.joblib")
    if os.path.exists(meta_file):
        try:
            meta = joblib.load(meta_file)
            return meta.get("best_model")
        except Exception:
            return None
    return None

# Router for creating endpoints accessible at both / and /api
router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check():
    global CURRENT_DATA
    trained = are_models_trained()
    best = get_best_model_name() if trained else None
    return HealthResponse(
        status="ok",
        message="AttritionIQ Python Backend is fully operational",
        dataset_loaded=CURRENT_DATA is not None and not CURRENT_DATA.empty,
        models_trained=trained,
        best_model=best,
        row_count=len(CURRENT_DATA) if CURRENT_DATA is not None else 0
    )

@router.post("/sample-data", response_model=DatasetSummaryResponse)
def load_sample_dataset():
    """Generates ~1,470 realistic rows adhering strictly to the IBM HR Analytics schema."""
    global CURRENT_DATA, TARGET_COL
    logger.info("Generating realistic synthetic IBM HR dataset...")
    df = generate_hr_dataset(num_rows=1470, seed=42)
    CURRENT_DATA = df
    TARGET_COL = "Attrition"
    
    # Auto-train models on initial sample load so app is ready immediately
    try:
        train_all_models(CURRENT_DATA, target_col=TARGET_COL)
    except Exception as e:
        logger.warning(f"Initial model training warning: {e}")
        
    return get_dataset_summary()

@router.post("/upload", response_model=DatasetSummaryResponse)
async def upload_csv(
    file: UploadFile = File(...),
    target_column: Optional[str] = Form(None)
):
    """Uploads a user CSV, parses it, and auto-detects or sets the target column."""
    global CURRENT_DATA, TARGET_COL
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are currently supported.")

    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8", errors="replace")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {str(e)}")

    if df.empty or len(df) < 20:
        raise HTTPException(status_code=400, detail="Dataset is too small (must have at least 20 rows).")

    try:
        detected_target = detect_target_column(df, user_specified=target_column)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    CURRENT_DATA = df
    TARGET_COL = detected_target
    logger.info(f"Loaded dataset with {len(df)} rows. Target column: {TARGET_COL}")

    return get_dataset_summary()

@router.get("/dataset/summary", response_model=DatasetSummaryResponse)
def get_dataset_summary():
    """Returns dataset metrics, column analysis, missing value counts, and preview rows."""
    global CURRENT_DATA, TARGET_COL
    if CURRENT_DATA is None or CURRENT_DATA.empty:
        # Load sample data automatically if nothing loaded
        CURRENT_DATA = generate_hr_dataset(num_rows=1470, seed=42)
        TARGET_COL = "Attrition"

    df = CURRENT_DATA
    target = TARGET_COL

    if target not in df.columns:
        raise HTTPException(status_code=400, detail=f"Target column '{target}' not present in dataset.")

    binary_target = df[target].astype(str).str.strip().str.lower().isin(["yes", "1", "true", "y"]).astype(int)
    att_count = int(binary_target.sum())
    total_count = len(df)
    att_rate = round(att_count / total_count, 4) if total_count else 0.0
    ret_count = total_count - att_count
    ret_rate = round(ret_count / total_count, 4) if total_count else 0.0

    features_info = []
    for col in df.columns:
        if col == target:
            continue
        is_num = pd.api.types.is_numeric_dtype(df[col])
        missing = int(df[col].isna().sum())
        uniques = int(df[col].nunique(dropna=True))
        sample_vals = df[col].dropna().head(3).tolist()
        features_info.append({
            "name": col,
            "type": "numeric" if is_num else "categorical",
            "missing_count": missing,
            "unique_values": uniques,
            "example_values": sample_vals
        })

    preview = df.head(10).replace({np.nan: None}).to_dict(orient="records")

    return DatasetSummaryResponse(
        total_rows=total_count,
        total_columns=len(df.columns),
        target_column=target,
        attrition_count=att_count,
        attrition_rate=att_rate,
        retention_count=ret_count,
        retention_rate=ret_rate,
        features=features_info,
        preview=preview
    )

@router.get("/eda", response_model=EDAResponse)
def get_eda():
    """Computes all exploratory statistics, segmentations, correlations, and auto-generated findings."""
    global CURRENT_DATA, TARGET_COL
    if CURRENT_DATA is None or CURRENT_DATA.empty:
        CURRENT_DATA = generate_hr_dataset(num_rows=1470, seed=42)
        TARGET_COL = "Attrition"

    try:
        return compute_eda(CURRENT_DATA, target_col=TARGET_COL)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing EDA: {str(e)}")

@router.post("/train", response_model=TrainingResponse)
def train_models(target_column: Optional[str] = Query(None)):
    """Trains 5 classification models using 5-fold stratified CV, evaluates test set, and picks champion."""
    global CURRENT_DATA, TARGET_COL
    if CURRENT_DATA is None or CURRENT_DATA.empty:
        CURRENT_DATA = generate_hr_dataset(num_rows=1470, seed=42)
        TARGET_COL = "Attrition"

    target = target_column if (target_column and target_column in CURRENT_DATA.columns) else TARGET_COL
    TARGET_COL = target

    try:
        results = train_all_models(CURRENT_DATA, target_col=target)
        return TrainingResponse(**results)
    except Exception as e:
        logger.error(f"Training failed: {e}")
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")

@router.get("/feature-importance", response_model=FeatureImportanceResponse)
def get_feature_importance():
    """Returns top 15 features from Random Forest and Logistic Regression coefficients with directions."""
    if not are_models_trained():
        if CURRENT_DATA is None or CURRENT_DATA.empty:
            load_sample_dataset()
        else:
            train_all_models(CURRENT_DATA, target_col=TARGET_COL)

    features = get_feature_importances()
    if not features:
        raise HTTPException(status_code=400, detail="Models must be trained first.")

    return FeatureImportanceResponse(
        top_features=features,
        methodology="Combined Gini Importance (Random Forest) and Regularized Odds Ratios (Logistic Regression)"
    )

@router.post("/predict", response_model=PredictionResult)
def predict_employee(
    employee: EmployeeInput,
    model_name: Optional[str] = Query(None),
    threshold_low: float = Query(0.30, ge=0.05, le=0.50),
    threshold_high: float = Query(0.60, ge=0.50, le=0.95)
):
    """Predicts attrition probability, assigns risk tier, identifies top factors, and suggests actions."""
    if not are_models_trained():
        # Ensure sample and models are ready
        if CURRENT_DATA is None or CURRENT_DATA.empty:
            load_sample_dataset()
        else:
            train_all_models(CURRENT_DATA, target_col=TARGET_COL)

    try:
        data_dict = employee.model_dump()
        result = predict_single(
            data_dict,
            model_name=model_name,
            threshold_low=threshold_low,
            threshold_high=threshold_high
        )
        return PredictionResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.post("/predict-batch", response_model=BatchPredictionResponse)
async def predict_batch(
    file: UploadFile = File(...),
    model_name: Optional[str] = Form(None),
    threshold_low: float = Form(0.30),
    threshold_high: float = Form(0.60)
):
    """Uploads CSV of employee records to generate cohort predictions with risk classifications."""
    if not are_models_trained():
        if CURRENT_DATA is None or CURRENT_DATA.empty:
            load_sample_dataset()
        else:
            train_all_models(CURRENT_DATA, target_col=TARGET_COL)

    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8", errors="replace")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded batch file is empty.")

    try:
        res = predict_batch_df(
            df,
            model_name=model_name,
            threshold_low=threshold_low,
            threshold_high=threshold_high
        )
        return BatchPredictionResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard():
    """Generates organizational risk breakdown, high-risk departments, and top 10 at-risk staff."""
    global CURRENT_DATA
    if CURRENT_DATA is None or CURRENT_DATA.empty:
        load_sample_dataset()

    if not are_models_trained():
        train_all_models(CURRENT_DATA, target_col=TARGET_COL)

    try:
        dash_data = generate_dashboard_data(CURRENT_DATA)
        return DashboardResponse(**dash_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard generation error: {str(e)}")

@router.post("/advisor", response_model=AdvisorResponse)
def get_retention_advisor(request: AdvisorRequest):
    """Generates an executive-level HR retention plan via Gemini AI (with resilient fallback)."""
    try:
        plan = get_ai_retention_plan(
            employee_data=request.employee_data,
            risk_level=request.risk_level,
            probability=request.probability,
            top_factors=request.top_factors
        )
        return AdvisorResponse(**plan)
    except Exception as e:
        logger.error(f"Advisor error: {e}")
        fallback = generate_fallback_advisor_plan(
            request.employee_data,
            request.risk_level,
            request.probability,
            request.top_factors
        )
        return AdvisorResponse(**fallback)

# Mount endpoints on both '/' and '/api'
app.include_router(router, prefix="")
app.include_router(router, prefix="/api")

# Serve the built frontend if a folder "static" exists
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if not os.path.exists(static_dir) and os.path.exists("static"):
    static_dir = "static"

if os.path.exists(static_dir):
    from fastapi.staticfiles import StaticFiles
    logger.info(f"Serving built frontend from '{static_dir}'")
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    # Default to port 8000 when run standalone; or 8001 if port 8000 occupied
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
