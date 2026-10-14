import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models_store")

def get_loaded_pipeline_and_meta(model_name: Optional[str] = None):
    """Loads specified pipeline or defaults to the benchmarked champion model."""
    meta_path = os.path.join(MODELS_DIR, "metadata.joblib")
    if not os.path.exists(meta_path):
        raise ValueError("No models have been trained yet. Please train the models first.")

    meta = joblib.load(meta_path)
    selected_name = model_name if (model_name and model_name.strip()) else meta.get("best_model", "random_forest")
    model_path = os.path.join(MODELS_DIR, f"{selected_name}.joblib")

    if not os.path.exists(model_path):
        # Fallback to random forest or first available
        selected_name = "random_forest"
        model_path = os.path.join(MODELS_DIR, f"{selected_name}.joblib")
        if not os.path.exists(model_path):
            raise ValueError(f"Model file for '{selected_name}' could not be located.")

    pipeline = joblib.load(model_path)
    return pipeline, meta, selected_name

def compute_employee_top_factors(employee_data: Dict[str, Any], meta: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Evaluates individual employee attributes against baseline distributions
    to pinpoint the exact operational drivers elevating or reducing attrition risk.
    """
    factors = []
    averages = meta.get("dataset_averages", {})

    # Overtime
    ot = str(employee_data.get("OverTime", "No")).strip().lower()
    if ot in ["yes", "y", "true", "1"]:
        factors.append({
            "factor": "Frequent Overtime",
            "impact": "High Risk",
            "description": "Working recurring overtime is the #1 statistical catalyst for employee burnout and turnover."
        })
    else:
        factors.append({
            "factor": "Standard Working Hours",
            "impact": "Protective",
            "description": "Predictable schedule helps sustain work-life boundaries."
        })

    # Job Satisfaction
    js = int(employee_data.get("JobSatisfaction", 3))
    if js <= 1:
        factors.append({
            "factor": "Critical Job Dissatisfaction",
            "impact": "High Risk",
            "description": f"Rating of {js}/4 indicates severe role disengagement or unfulfilled career expectations."
        })
    elif js == 2:
        factors.append({
            "factor": "Sub-par Job Satisfaction",
            "impact": "Moderate Risk",
            "description": f"Rating of {js}/4 signals emerging dissatisfaction that requires proactive HR attention."
        })
    elif js == 4:
        factors.append({
            "factor": "High Role Fulfillment",
            "impact": "Protective",
            "description": "High job satisfaction (4/4) serves as a primary psychological retention anchor."
        })

    # Work-Life Balance
    wlb = int(employee_data.get("WorkLifeBalance", 3))
    if wlb <= 1:
        factors.append({
            "factor": "Severe Work-Life Imbalance",
            "impact": "High Risk",
            "description": "Critical rating of 1/4 indicates exhaustion, conflict with personal life, and high flight risk."
        })
    elif wlb == 2:
        factors.append({
            "factor": "Compromised Work-Life Balance",
            "impact": "Moderate Risk",
            "description": "Rating of 2/4 suggests schedule friction or excessive weekend connectivity."
        })

    # Promotion Stagnation
    promo_years = int(employee_data.get("YearsSinceLastPromotion", 0))
    if promo_years >= 6:
        factors.append({
            "factor": "Severe Promotion Stagnation",
            "impact": "High Risk",
            "description": f"{promo_years} years without a promotion creates a feeling of career dead-end."
        })
    elif promo_years >= 3:
        factors.append({
            "factor": "Lagging Promotion Cycle",
            "impact": "Moderate Risk",
            "description": f"{promo_years} years in role without upward mobility increases external recruiter receptivity."
        })

    # Commute Distance
    dist = int(employee_data.get("DistanceFromHome", 5))
    if dist >= 20:
        factors.append({
            "factor": "Extreme Commute Distance",
            "impact": "High Risk",
            "description": f"{dist} miles daily transit induces continuous commuting strain."
        })
    elif dist >= 12:
        factors.append({
            "factor": "Extended Commute Distance",
            "impact": "Moderate Risk",
            "description": f"{dist} miles distance from office moderately exacerbates travel friction."
        })

    # Monthly Income Comparison
    income = float(employee_data.get("MonthlyIncome", 5000))
    avg_income = float(averages.get("MonthlyIncome", 6000))
    if income < avg_income * 0.75:
        diff = int(avg_income - income)
        factors.append({
            "factor": "Below-Benchmark Compensation",
            "impact": "High Risk",
            "description": f"Monthly salary is ${diff:,} below cohort median, posing a major risk of poaching."
        })
    elif income > avg_income * 1.25:
        factors.append({
            "factor": "Competitive Compensation",
            "impact": "Protective",
            "description": "Above-average compensation creates strong financial retention affinity."
        })

    # Marital status & travel mobility
    marital = str(employee_data.get("MaritalStatus", "")).strip().capitalize()
    travel = str(employee_data.get("BusinessTravel", "")).strip()
    if marital == "Single" and "Frequently" in travel:
        factors.append({
            "factor": "High Geographic Mobility & Frequent Travel",
            "impact": "High Risk",
            "description": "Combination of single marital status and intense business travel amplifies career mobility."
        })

    # Sort high risk first
    impact_order = {"High Risk": 0, "Moderate Risk": 1, "Protective": 2}
    factors.sort(key=lambda x: impact_order.get(x["impact"], 3))
    return factors[:6]

def generate_suggested_actions(employee_data: Dict[str, Any], risk_level: str) -> List[str]:
    """Generates concrete, rule-based HR retention actions based on flagged profile attributes."""
    actions = []

    ot = str(employee_data.get("OverTime", "No")).strip().lower()
    if ot in ["yes", "y", "true", "1"]:
        actions.append("Workload Audit: Rebalance quarterly deliverables and cap mandatory overtime immediately.")

    js = int(employee_data.get("JobSatisfaction", 3))
    if js <= 2:
        actions.append("1:1 Engagement Check-in: HR partner and department lead should hold a confidential stay-interview.")

    wlb = int(employee_data.get("WorkLifeBalance", 3))
    if wlb <= 2:
        actions.append("Schedule Flexibility: Grant core-hours or compressed 4-day/hybrid work arrangements.")

    promo_years = int(employee_data.get("YearsSinceLastPromotion", 0))
    if promo_years >= 3:
        actions.append("Career Progression Review: Map out explicit promotion milestones and lateral leadership pathways.")

    dist = int(employee_data.get("DistanceFromHome", 5))
    if dist >= 12:
        actions.append("Remote / Commute Policy: Offer 2-3 remote work days per week and commute expense stipends.")

    income = float(employee_data.get("MonthlyIncome", 5000))
    level = int(employee_data.get("JobLevel", 2))
    if income < 4000 and level >= 2:
        actions.append("Salary Benchmark Adjustment: Accelerate mid-year compensation review to restore peer parity.")

    mgr_years = int(employee_data.get("YearsWithCurrManager", 3))
    if mgr_years < 1:
        actions.append("Manager Onboarding Support: Facilitate structured check-ins to build trust with new supervisor.")

    if not actions:
        if risk_level == "HIGH":
            actions.append("Comprehensive Stay Interview: Conduct immediate executive retention dialogue.")
        else:
            actions.append("Continuous Recognition: Acknowledge high-performance contributions during upcoming town hall.")

    return actions

def predict_single(
    employee_dict: Dict[str, Any],
    model_name: Optional[str] = None,
    threshold_low: float = 0.30,
    threshold_high: float = 0.60
) -> Dict[str, Any]:
    """Scores a single employee record and generates explainable factors + actions."""
    pipeline, meta, selected_name = get_loaded_pipeline_and_meta(model_name)

    input_df = pd.DataFrame([employee_dict])

    # Predict probability
    if hasattr(pipeline, "predict_proba"):
        prob = float(pipeline.predict_proba(input_df)[0][1])
    elif hasattr(pipeline, "decision_function"):
        score = float(pipeline.decision_function(input_df)[0])
        prob = float(1.0 / (1.0 + np.exp(-score)))
    else:
        prob = float(pipeline.predict(input_df)[0])

    prob = round(prob, 4)

    # Risk level threshold logic
    if prob < threshold_low:
        risk_level = "LOW"
    elif prob <= threshold_high:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    top_factors = compute_employee_top_factors(employee_dict, meta)
    actions = generate_suggested_actions(employee_dict, risk_level)

    return {
        "employee_id": str(employee_dict.get("EmployeeNumber", employee_dict.get("EmployeeId", "EMP-SIM"))),
        "probability": prob,
        "probability_percentage": round(prob * 100.0, 1),
        "risk_level": risk_level,
        "model_used": selected_name,
        "thresholds": {"low": threshold_low, "high": threshold_high},
        "top_factors": top_factors,
        "suggested_actions": actions
    }

def predict_batch_df(
    df: pd.DataFrame,
    model_name: Optional[str] = None,
    threshold_low: float = 0.30,
    threshold_high: float = 0.60
) -> Dict[str, Any]:
    """Generates predictions across a cohort dataframe with aggregate summary."""
    pipeline, meta, selected_name = get_loaded_pipeline_and_meta(model_name)

    # Ensure required features exist or drop target if present
    data = df.copy()
    if "Attrition" in data.columns:
        data = data.drop(columns=["Attrition"])

    if hasattr(pipeline, "predict_proba"):
        probs = pipeline.predict_proba(data)[:, 1]
    elif hasattr(pipeline, "decision_function"):
        scores = pipeline.decision_function(data)
        probs = 1.0 / (1.0 + np.exp(-scores))
    else:
        probs = pipeline.predict(data).astype(float)

    probs = np.round(probs, 4)

    results = []
    low_count = 0
    med_count = 0
    high_count = 0

    for idx, (row_idx, row) in enumerate(data.iterrows()):
        p = float(probs[idx])
        if p < threshold_low:
            r_level = "LOW"
            low_count += 1
        elif p <= threshold_high:
            r_level = "MEDIUM"
            med_count += 1
        else:
            r_level = "HIGH"
            high_count += 1

        emp_id = str(row.get("EmployeeNumber", row.get("EmployeeId", f"EMP-{1001 + idx}")))
        dept = str(row.get("Department", "General"))
        role = str(row.get("JobRole", "Specialist"))
        income = int(row.get("MonthlyIncome", 0))

        # Top factor summary
        ot = str(row.get("OverTime", "No")).lower() == "yes"
        js = int(row.get("JobSatisfaction", 3))
        promo = int(row.get("YearsSinceLastPromotion", 0))
        dist = int(row.get("DistanceFromHome", 0))

        reasons = []
        if ot:
            reasons.append("Overtime")
        if js <= 1:
            reasons.append("Low Satisfaction")
        if promo >= 4:
            reasons.append("Promo Gap")
        if dist >= 15:
            reasons.append("Long Commute")
        top_reason = ", ".join(reasons) if reasons else ("Balanced Profile" if r_level == "LOW" else "Salary / Tenured Risk")

        results.append({
            "employee_id": emp_id,
            "department": dept,
            "job_role": role,
            "monthly_income": income,
            "probability": p,
            "probability_percentage": round(p * 100.0, 1),
            "risk_level": r_level,
            "top_risk_reason": top_reason,
            "suggested_priority_action": generate_suggested_actions(row.to_dict(), r_level)[0]
        })

    total = len(data)
    summary = {
        "total_evaluated": total,
        "low_risk_count": low_count,
        "low_risk_percent": round((low_count / total * 100.0) if total else 0, 1),
        "medium_risk_count": med_count,
        "medium_risk_percent": round((med_count / total * 100.0) if total else 0, 1),
        "high_risk_count": high_count,
        "high_risk_percent": round((high_count / total * 100.0) if total else 0, 1),
        "avg_attrition_probability": round(float(np.mean(probs)) if total else 0, 4)
    }

    return {
        "summary": summary,
        "results": results
    }

def generate_dashboard_data(df: pd.DataFrame) -> Dict[str, Any]:
    """Calculates executive dashboard stats, departmental risk counts, and top 10 flagged staff."""
    batch_res = predict_batch_df(df)
    results = batch_res["results"]
    summary = batch_res["summary"]

    # High risk by department
    dept_map = {}
    for r in results:
        d = r["department"]
        if d not in dept_map:
            dept_map[d] = {"total": 0, "high_risk": 0}
        dept_map[d]["total"] += 1
        if r["risk_level"] == "HIGH":
            dept_map[d]["high_risk"] += 1

    by_dept = []
    for d, stats in dept_map.items():
        rate = round((stats["high_risk"] / stats["total"]) if stats["total"] else 0, 4)
        by_dept.append({
            "department": d,
            "total_employees": stats["total"],
            "high_risk_count": stats["high_risk"],
            "high_risk_rate": rate
        })
    by_dept.sort(key=lambda x: x["high_risk_count"], reverse=True)

    # Top 10 highest-risk employees
    sorted_results = sorted(results, key=lambda x: x["probability"], reverse=True)
    top_10 = sorted_results[:10]

    return {
        "total_employees": summary["total_evaluated"],
        "risk_distribution": {
            "LOW": summary["low_risk_count"],
            "MEDIUM": summary["medium_risk_count"],
            "HIGH": summary["high_risk_count"]
        },
        "risk_percentages": {
            "LOW": summary["low_risk_percent"],
            "MEDIUM": summary["medium_risk_percent"],
            "HIGH": summary["high_risk_percent"]
        },
        "avg_probability": summary["avg_attrition_probability"],
        "by_department": by_dept,
        "top_risk_employees": top_10
    }
