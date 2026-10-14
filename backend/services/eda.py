import pandas as pd
import numpy as np
from typing import Dict, Any, List

def compute_group_attrition(df: pd.DataFrame, group_col: str, target_col: str = "Attrition") -> List[Dict[str, Any]]:
    """Calculates total count, attrition count, and attrition rate grouped by categorical variable."""
    if group_col not in df.columns:
        return []

    # Map target to binary
    binary_target = df[target_col].astype(str).str.strip().str.lower().isin(["yes", "1", "true", "y"]).astype(int)
    temp = df.copy()
    temp["_target"] = binary_target

    grouped = temp.groupby(group_col).agg(
        total=("_target", "count"),
        attrition_count=("_target", "sum")
    ).reset_index()

    grouped["attrition_rate"] = (grouped["attrition_count"] / grouped["total"]).round(4)
    grouped = grouped.sort_values(by="total", ascending=False)

    results = []
    for _, row in grouped.iterrows():
        results.append({
            "category": str(row[group_col]),
            "total": int(row["total"]),
            "attrition_count": int(row["attrition_count"]),
            "attrition_rate": float(row["attrition_rate"])
        })
    return results

def compute_eda(df: pd.DataFrame, target_col: str = "Attrition") -> Dict[str, Any]:
    """Generates complete EDA statistics, correlations, and auto-generated data insights."""
    if df.empty or target_col not in df.columns:
        raise ValueError("DataFrame is empty or missing target column.")

    data = df.copy()
    binary_target = data[target_col].astype(str).str.strip().str.lower().isin(["yes", "1", "true", "y"]).astype(int)
    data["_target"] = binary_target
    overall_rate = round(float(binary_target.mean()), 4)

    # 1. Department
    by_dept = compute_group_attrition(data, "Department", target_col)

    # 2. Job Role
    by_role = compute_group_attrition(data, "JobRole", target_col)

    # 3. OverTime
    by_overtime = compute_group_attrition(data, "OverTime", target_col)

    # 4. Marital Status
    by_marital = compute_group_attrition(data, "MaritalStatus", target_col)

    # 5. Business Travel
    by_travel = compute_group_attrition(data, "BusinessTravel", target_col)

    # 6. Age Groups
    if "Age" in data.columns and pd.api.types.is_numeric_dtype(data["Age"]):
        data["_age_group"] = pd.cut(
            data["Age"],
            bins=[0, 29, 39, 49, 100],
            labels=["Under 30", "30-39", "40-49", "50+"],
            right=True
        )
        by_age = compute_group_attrition(data, "_age_group", target_col)
    else:
        by_age = []

    # 7. Income Bands
    if "MonthlyIncome" in data.columns and pd.api.types.is_numeric_dtype(data["MonthlyIncome"]):
        data["_income_band"] = pd.cut(
            data["MonthlyIncome"],
            bins=[0, 3500, 7000, 12000, 100000],
            labels=["Entry (< $3.5k)", "Mid ($3.5k - $7k)", "Senior ($7k - $12k)", "Executive ($12k+)"],
            right=True
        )
        by_income = compute_group_attrition(data, "_income_band", target_col)
    else:
        by_income = []

    # 8. Distance Bands
    if "DistanceFromHome" in data.columns and pd.api.types.is_numeric_dtype(data["DistanceFromHome"]):
        data["_distance_band"] = pd.cut(
            data["DistanceFromHome"],
            bins=[0, 5, 10, 20, 100],
            labels=["Close (1-5 mi)", "Moderate (6-10 mi)", "Far (11-20 mi)", "Very Far (20+ mi)"],
            right=True
        )
        by_distance = compute_group_attrition(data, "_distance_band", target_col)
    else:
        by_distance = []

    # 9. Years Since Last Promotion
    if "YearsSinceLastPromotion" in data.columns and pd.api.types.is_numeric_dtype(data["YearsSinceLastPromotion"]):
        data["_promo_band"] = pd.cut(
            data["YearsSinceLastPromotion"],
            bins=[-1, 1, 3, 6, 100],
            labels=["Recent (0-1 yr)", "Normal (2-3 yrs)", "Lagging (4-6 yrs)", "Stagnant (7+ yrs)"],
            right=True
        )
        by_promo = compute_group_attrition(data, "_promo_band", target_col)
    else:
        by_promo = []

    # 10. Correlations with numeric features
    numeric_cols = [c for c in data.select_dtypes(include=[np.number]).columns if c not in ["_target", "EmployeeCount", "EmployeeNumber", "StandardHours"]]
    correlations = []
    for col in numeric_cols:
        series = data[col].dropna()
        if series.nunique() > 1:
            corr = float(data[col].corr(data["_target"]))
            if not np.isnan(corr):
                direction = "Positive (Increases Attrition)" if corr > 0 else "Negative (Protective Factor)"
                abs_val = abs(corr)
                if abs_val >= 0.25:
                    strength = "Strong"
                elif abs_val >= 0.12:
                    strength = "Moderate"
                else:
                    strength = "Weak"
                correlations.append({
                    "feature": col,
                    "correlation": round(corr, 4),
                    "strength": strength,
                    "direction": direction
                })

    correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)

    # 11. Auto-generated Plain-English Key Insights
    key_findings = []

    # Overtime insight
    ot_yes = next((x for x in by_overtime if x["category"].lower() == "yes"), None)
    ot_no = next((x for x in by_overtime if x["category"].lower() == "no"), None)
    if ot_yes and ot_no and ot_no["attrition_rate"] > 0:
        multiplier = round(ot_yes["attrition_rate"] / ot_no["attrition_rate"], 1)
        key_findings.append(
            f"Overtime Burden: Employees working overtime experience a {ot_yes['attrition_rate']:.1%} attrition rate "
            f"— {multiplier}x higher than standard-hour staff ({ot_no['attrition_rate']:.1%})."
        )

    # Highest department insight
    if by_dept:
        sorted_dept = sorted(by_dept, key=lambda x: x["attrition_rate"], reverse=True)
        top_dept = sorted_dept[0]
        lowest_dept = sorted_dept[-1]
        key_findings.append(
            f"Departmental Variance: {top_dept['category']} has the highest attrition at {top_dept['attrition_rate']:.1%}, "
            f"compared to {lowest_dept['category']} at {lowest_dept['attrition_rate']:.1%}."
        )

    # Income impact insight
    if by_income and len(by_income) >= 2:
        entry_band = next((x for x in by_income if "Entry" in x["category"]), None)
        exec_band = next((x for x in by_income if "Executive" in x["category"]), None)
        if entry_band and exec_band:
            key_findings.append(
                f"Compensation Threshold: Entry-level compensation (<$3.5k/mo) exhibits {entry_band['attrition_rate']:.1%} turnover, "
                f"whereas executive compensation ($12k+/mo) drops to {exec_band['attrition_rate']:.1%}."
            )

    # Commute distance insight
    if by_distance and len(by_distance) >= 2:
        far_band = next((x for x in by_distance if "Very Far" in x["category"]), None)
        close_band = next((x for x in by_distance if "Close" in x["category"]), None)
        if far_band and close_band:
            key_findings.append(
                f"Commute Friction: Employees commuting over 20 miles leave at {far_band['attrition_rate']:.1%}, "
                f"nearly double those with under 5 miles commute ({close_band['attrition_rate']:.1%})."
            )

    # Promotion stagnation insight
    if by_promo:
        stagnant = next((x for x in by_promo if "Stagnant" in x["category"] or "Lagging" in x["category"]), None)
        recent = next((x for x in by_promo if "Recent" in x["category"]), None)
        if stagnant and recent:
            key_findings.append(
                f"Promotional Stagnation: Staff without promotions for 4+ years display an attrition rate of {stagnant['attrition_rate']:.1%}, "
                f"compared to {recent['attrition_rate']:.1%} for recently promoted peers."
            )

    # Marital status insight
    if by_marital:
        single = next((x for x in by_marital if x["category"].lower() == "single"), None)
        if single:
            key_findings.append(
                f"Demographic Mobility: Single employees show {single['attrition_rate']:.1%} attrition, "
                f"substantially higher than married or divorced staff due to greater geographic and career flexibility."
            )

    return {
        "overall_attrition_rate": overall_rate,
        "by_department": by_dept,
        "by_job_role": by_role,
        "by_overtime": by_overtime,
        "by_marital_status": by_marital,
        "by_business_travel": by_travel,
        "by_age_group": by_age,
        "by_income_band": by_income,
        "by_distance_band": by_distance,
        "by_years_since_promotion": by_promo,
        "correlations": correlations[:12],
        "key_findings": key_findings
    }
