import pandas as pd
import numpy as np
from typing import Tuple, List, Dict, Any, Optional
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

DEFAULT_DROP_COLUMNS = [
    "EmployeeCount", "EmployeeNumber", "Over18", "StandardHours", "Id", "ID", "Unnamed: 0"
]

def detect_target_column(df: pd.DataFrame, user_specified: Optional[str] = None) -> str:
    """Finds or validates the target attrition column."""
    if user_specified and user_specified in df.columns:
        return user_specified
    
    candidates = ["Attrition", "attrition", "Left", "left", "Turnover", "turnover", "Status", "status"]
    for col in candidates:
        if col in df.columns:
            return col
    
    # Check binary columns with 'Yes'/'No'
    for col in df.columns:
        unique_vals = set(df[col].dropna().astype(str).str.strip().str.lower().unique())
        if unique_vals in [{'yes', 'no'}, {'1', '0'}, {'true', 'false'}]:
            return col
            
    raise ValueError("Target column could not be automatically detected. Please specify the target column.")

def clean_and_split_data(
    df: pd.DataFrame,
    target_col: str = "Attrition",
    test_size: float = 0.2,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Cleans raw DataFrame:
    - Drops zero-variance/ID columns
    - Converts target to binary (1 for Attrition=Yes, 0 for No)
    - Separates numeric and categorical features
    - Creates scikit-learn ColumnTransformer
    - Performs stratified train-test split
    """
    data = df.copy()

    if target_col not in data.columns:
        raise ValueError(f"Target column '{target_col}' not found in dataset.")

    # Convert target to 0/1
    raw_target = data[target_col].astype(str).str.strip().str.lower()
    positive_flags = ["yes", "1", "true", "y", "left"]
    y = raw_target.isin(positive_flags).astype(int).values

    # Drop target and uninformative constant/ID columns
    cols_to_drop = [target_col]
    for c in DEFAULT_DROP_COLUMNS:
        if c in data.columns:
            cols_to_drop.append(c)
            
    # Also drop columns with single unique value
    for col in data.columns:
        if col not in cols_to_drop and data[col].nunique(dropna=False) <= 1:
            cols_to_drop.append(col)

    X = data.drop(columns=cols_to_drop, errors="ignore")

    # Classify numeric vs categorical features
    numeric_features = []
    categorical_features = []

    for col in X.columns:
        if pd.api.types.is_numeric_dtype(X[col]):
            numeric_features.append(col)
        else:
            categorical_features.append(col)

    # Build preprocessing sub-pipelines
    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    transformers = []
    if numeric_features:
        transformers.append(("num", numeric_transformer, numeric_features))
    if categorical_features:
        transformers.append(("cat", categorical_transformer, categorical_features))

    preprocessor = ColumnTransformer(transformers=transformers, remainder="drop")

    # Stratified Train-Test Split (guarantees proportional attrition in both sets)
    stratify_target = y if len(np.unique(y)) > 1 and np.min(np.bincount(y)) >= 2 else None

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=stratify_target
    )

    return {
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train,
        "y_test": y_test,
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
        "dropped_columns": cols_to_drop,
        "preprocessor": preprocessor,
        "target_col": target_col,
        "raw_features_df": X
    }

def get_transformed_feature_names(preprocessor: ColumnTransformer, numeric_features: List[str], categorical_features: List[str]) -> List[str]:
    """Extracts human-interpretable feature names post one-hot encoding."""
    feature_names = []
    
    # Numeric features retain original names
    feature_names.extend(numeric_features)
    
    # Categorical features get expanded via OneHotEncoder
    try:
        cat_encoder = preprocessor.named_transformers_["cat"].named_steps["onehot"]
        encoded_cats = cat_encoder.get_feature_names_out(categorical_features)
        feature_names.extend(encoded_cats)
    except Exception:
        # Fallback if preprocessor hasn't been fitted or cat transformer absent
        feature_names.extend(categorical_features)
        
    return feature_names
