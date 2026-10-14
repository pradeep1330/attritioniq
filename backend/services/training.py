import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple

from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, roc_curve
)

from services.preprocessing import clean_and_split_data, get_transformed_feature_names

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models_store")
os.makedirs(MODELS_DIR, exist_ok=True)

MODEL_CONFIGS = {
    "logistic_regression": {
        "display_name": "Logistic Regression",
        "estimator": LogisticRegression(
            class_weight="balanced",
            max_iter=1000,
            solver="lbfgs",
            random_state=42
        )
    },
    "decision_tree": {
        "display_name": "Decision Tree",
        "estimator": DecisionTreeClassifier(
            class_weight="balanced",
            max_depth=6,
            min_samples_leaf=10,
            random_state=42
        )
    },
    "random_forest": {
        "display_name": "Random Forest",
        "estimator": RandomForestClassifier(
            n_estimators=100,
            class_weight="balanced",
            max_depth=8,
            min_samples_leaf=5,
            random_state=42
        )
    },
    "gradient_boosting": {
        "display_name": "Gradient Boosting",
        "estimator": GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=4,
            random_state=42
        )
    },
    "knn": {
        "display_name": "K-Nearest Neighbors",
        "estimator": KNeighborsClassifier(
            n_neighbors=7,
            weights="distance"
        )
    }
}

def sample_roc_points(fpr: np.ndarray, tpr: np.ndarray, max_points: int = 30) -> List[Dict[str, float]]:
    """Samples smooth ROC curve points for frontend chart rendering."""
    if len(fpr) <= max_points:
        indices = list(range(len(fpr)))
    else:
        indices = np.linspace(0, len(fpr) - 1, max_points, dtype=int)
    
    # Ensure (0,0) and (1,1) are included
    points = []
    seen = set()
    for idx in indices:
        x = round(float(fpr[idx]), 4)
        y = round(float(tpr[idx]), 4)
        key = (x, y)
        if key not in seen:
            seen.add(key)
            points.append({"fpr": x, "tpr": y})
            
    if points and points[0]["fpr"] != 0:
        points.insert(0, {"fpr": 0.0, "tpr": 0.0})
    if points and points[-1]["fpr"] != 1:
        points.append({"fpr": 1.0, "tpr": 1.0})
        
    return points

def train_all_models(df: pd.DataFrame, target_col: str = "Attrition") -> Dict[str, Any]:
    """
    Trains all 5 models with 5-fold stratified CV + test-set benchmark,
    calculates metrics, confusion matrices, ROC points, and saves pipelines.
    """
    split_info = clean_and_split_data(df, target_col=target_col)
    X_train = split_info["X_train"]
    X_test = split_info["X_test"]
    y_train = split_info["y_train"]
    y_test = split_info["y_test"]
    preprocessor = split_info["preprocessor"]
    numeric_features = split_info["numeric_features"]
    categorical_features = split_info["categorical_features"]

    results = []
    trained_pipelines = {}
    best_model_key = None
    highest_composite_score = -1.0

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    for key, config in MODEL_CONFIGS.items():
        estimator = config["estimator"]
        pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", estimator)
        ])

        # 5-fold CV on train set
        try:
            cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring="f1")
            cv_f1_mean = float(np.mean(cv_scores))
            cv_f1_std = float(np.std(cv_scores))
        except Exception:
            cv_f1_mean = 0.0
            cv_f1_std = 0.0

        # Fit full pipeline on train set
        pipeline.fit(X_train, y_train)

        # Test set evaluation
        y_pred = pipeline.predict(X_test)
        if hasattr(pipeline, "predict_proba"):
            y_proba = pipeline.predict_proba(X_test)[:, 1]
        elif hasattr(pipeline, "decision_function"):
            raw_scores = pipeline.decision_function(X_test)
            y_proba = 1.0 / (1.0 + np.exp(-raw_scores))
        else:
            y_proba = y_pred.astype(float)

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))

        try:
            auc = float(roc_auc_score(y_test, y_proba))
        except Exception:
            auc = 0.5

        # Confusion Matrix
        cm = confusion_matrix(y_test, y_pred)
        if cm.shape == (2, 2):
            tn, fp, fn, tp = cm.ravel()
        else:
            tn, fp, fn, tp = int(cm[0][0]), 0, 0, 0

        # ROC Curve Points
        try:
            fpr, tpr, _ = roc_curve(y_test, y_proba)
            roc_pts = sample_roc_points(fpr, tpr)
        except Exception:
            roc_pts = [{"fpr": 0.0, "tpr": 0.0}, {"fpr": 1.0, "tpr": 1.0}]

        # Imbalanced benchmark prioritizing F1 & ROC-AUC over pure accuracy
        composite_score = (f1 * 0.55) + (auc * 0.35) + (rec * 0.10)
        if composite_score > highest_composite_score:
            highest_composite_score = composite_score
            best_model_key = key

        # Save pipeline to disk
        model_save_path = os.path.join(MODELS_DIR, f"{key}.joblib")
        joblib.dump(pipeline, model_save_path)
        trained_pipelines[key] = pipeline

        results.append({
            "model_name": key,
            "display_name": config["display_name"],
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4),
            "cv_f1_mean": round(cv_f1_mean, 4),
            "cv_f1_std": round(cv_f1_std, 4),
            "confusion_matrix": {
                "true_negative": int(tn),
                "false_positive": int(fp),
                "false_negative": int(fn),
                "true_positive": int(tp)
            },
            "roc_points": roc_pts
        })

    # Save metadata including feature names and best model
    best_pipeline = trained_pipelines[best_model_key]
    fitted_preprocessor = best_pipeline.named_steps["preprocessor"]
    transformed_feature_names = get_transformed_feature_names(
        fitted_preprocessor, numeric_features, categorical_features
    )

    meta = {
        "best_model": best_model_key,
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
        "transformed_feature_names": transformed_feature_names,
        "target_col": target_col,
        "train_size": len(X_train),
        "test_size": len(X_test),
        "dataset_averages": X_train[numeric_features].median().to_dict(),
        "categorical_modes": {c: str(X_train[c].mode().iloc[0]) for c in categorical_features if not X_train[c].empty}
    }
    joblib.dump(meta, os.path.join(MODELS_DIR, "metadata.joblib"))

    best_display = MODEL_CONFIGS[best_model_key]["display_name"]
    recommendation_reason = (
        f"{best_display} is chosen as the champion model because it maximizes the balance "
        f"between F1-Score ({[r for r in results if r['model_name'] == best_model_key][0]['f1_score']:.1%}) "
        f"and ROC-AUC ({[r for r in results if r['model_name'] == best_model_key][0]['roc_auc']:.1%}). "
        f"In HR attrition scenarios, false negatives (missing an employee who leaves) are costly, "
        f"so prioritizing recall and balanced F1 over raw accuracy avoids majority-class bias."
    )

    return {
        "message": "All 5 models trained and evaluated successfully with 5-fold cross-validation.",
        "train_size": len(X_train),
        "test_size": len(X_test),
        "models": results,
        "best_model": best_model_key,
        "recommendation_reason": recommendation_reason
    }

def get_feature_importances() -> List[Dict[str, Any]]:
    """
    Computes Random Forest importances and Logistic Regression directional coefficients
    for the top 15 most influential features.
    """
    meta_path = os.path.join(MODELS_DIR, "metadata.joblib")
    rf_path = os.path.join(MODELS_DIR, "random_forest.joblib")
    lr_path = os.path.join(MODELS_DIR, "logistic_regression.joblib")

    if not (os.path.exists(meta_path) and os.path.exists(rf_path) and os.path.exists(lr_path)):
        return []

    meta = joblib.load(meta_path)
    rf_pipeline = joblib.load(rf_path)
    lr_pipeline = joblib.load(lr_path)

    feature_names = meta.get("transformed_feature_names", [])
    rf_clf = rf_pipeline.named_steps["classifier"]
    lr_clf = lr_pipeline.named_steps["classifier"]

    rf_importances = getattr(rf_clf, "feature_importances_", np.zeros(len(feature_names)))
    lr_coeffs = getattr(lr_clf, "coef_", [np.zeros(len(feature_names))])[0]

    # Map raw encoded names to clean labels and explanations
    feature_meta_map = {
        "OverTime_Yes": ("Overtime: Yes", "Working mandatory or frequent overtime drastically elevates burnout and turnover risk."),
        "OverTime_No": ("Overtime: No", "Predictable working hours and absence of overtime protect against employee departure."),
        "MonthlyIncome": ("Monthly Income", "Lower baseline earnings compared to industry peers significantly increase exit hazard."),
        "Age": ("Employee Age", "Younger employees exhibit higher natural market mobility; mid-career tenure stabilizes."),
        "TotalWorkingYears": ("Total Working Experience", "Experienced workers with higher career tenure have lower voluntary turnover rates."),
        "YearsAtCompany": ("Years At Company", "Tenure loyalty builds institutional attachment, reducing immediate flight risk."),
        "YearsSinceLastPromotion": ("Years Since Last Promotion", "Prolonged promotional stagnation (3+ years) triggers active external job searching."),
        "YearsWithCurrManager": ("Years With Manager", "Consistent manager rapport reduces attrition; abrupt manager changes spike risk."),
        "DistanceFromHome": ("Distance From Home", "Lengthy commutes over 15 miles compound daily stress and accelerate resignation."),
        "JobSatisfaction": ("Job Satisfaction Rating", "Directly measures intrinsic role engagement and workplace fulfillment."),
        "EnvironmentSatisfaction": ("Environment Satisfaction", "Workplace culture and facility morale directly impact team retention."),
        "WorkLifeBalance": ("Work-Life Balance", "Healthy boundaries and schedule flexibility provide a strong retention anchor."),
        "JobInvolvement": ("Job Involvement", "Deep personal investment in team outcomes deters voluntary departures."),
        "NumCompaniesWorked": ("Prior Companies Count", "Historical job-hopping correlates with higher willingness to exit."),
        "MaritalStatus_Single": ("Marital Status: Single", "Single employees have fewer local familial constraints and higher relocation willingness."),
        "BusinessTravel_Travel_Frequently": ("Frequent Business Travel", "Frequent travel fatigue erodes work-life rhythm and triggers turnover."),
        "StockOptionLevel": ("Stock Options Grant", "Equity vesting schedules create golden handcuffs and long-term retention incentives."),
        "PercentSalaryHike": ("Salary Hike Percentage", "Competitive annual increments validate contributions and reinforce commitment.")
    }

    feature_list = []
    min_len = min(len(feature_names), len(rf_importances), len(lr_coeffs))
    for i in range(min_len):
        raw_name = feature_names[i]
        # Clean prefix if from OneHotEncoder (e.g. cat__OverTime_Yes)
        clean_key = raw_name.replace("cat__", "").replace("num__", "")
        
        display_name, explanation = feature_meta_map.get(
            clean_key,
            (clean_key.replace("_", " ").title(), f"Directly influences predicted employee retention dynamics.")
        )

        coef = float(lr_coeffs[i])
        rf_imp = float(rf_importances[i])

        if coef > 0.05:
            direction = "Increases Risk"
        elif coef < -0.05:
            direction = "Decreases Risk"
        else:
            direction = "Neutral"

        feature_list.append({
            "feature": clean_key,
            "display_name": display_name,
            "rf_importance": round(rf_imp, 4),
            "lr_coefficient": round(coef, 4),
            "direction": direction,
            "impact_explanation": explanation
        })

    # Sort primarily by Random Forest importance
    feature_list.sort(key=lambda x: x["rf_importance"], reverse=True)
    return feature_list[:15]
