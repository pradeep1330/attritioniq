"""
AttritionIQ API Test Suite
Run against a running FastAPI server:
    python test_api.py
or
    pytest test_api.py
"""
import sys
import requests

BASE_URL = "http://localhost:8000"
if len(sys.argv) > 1:
    BASE_URL = sys.argv[1]

print(f"Testing AttritionIQ API at: {BASE_URL}")

def test_health():
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    data = res.json()
    assert data["status"] == "ok"
    print("  [PASS] GET /health -> OK")

def test_sample_data():
    res = requests.post(f"{BASE_URL}/sample-data")
    assert res.status_code == 200, f"Sample data load failed: {res.text}"
    data = res.json()
    assert data["total_rows"] >= 1400
    assert "attrition_rate" in data
    print(f"  [PASS] POST /sample-data -> {data['total_rows']} rows, attrition rate: {data['attrition_rate']:.1%}")

def test_summary():
    res = requests.get(f"{BASE_URL}/dataset/summary")
    assert res.status_code == 200
    data = res.json()
    assert len(data["preview"]) > 0
    print(f"  [PASS] GET /dataset/summary -> {len(data['features'])} features analyzed")

def test_eda():
    res = requests.get(f"{BASE_URL}/eda")
    assert res.status_code == 200
    data = res.json()
    assert len(data["key_findings"]) > 0
    print(f"  [PASS] GET /eda -> {len(data['key_findings'])} key findings auto-generated")

def test_train():
    res = requests.post(f"{BASE_URL}/train")
    assert res.status_code == 200
    data = res.json()
    assert len(data["models"]) == 5
    print(f"  [PASS] POST /train -> Champion model: {data['best_model']}")

def test_feature_importance():
    res = requests.get(f"{BASE_URL}/feature-importance")
    assert res.status_code == 200
    data = res.json()
    assert len(data["top_features"]) > 0
    top = data["top_features"][0]
    print(f"  [PASS] GET /feature-importance -> Top factor: {top['display_name']} ({top['direction']})")

def test_predict():
    payload = {
        "Age": 28,
        "BusinessTravel": "Travel_Frequently",
        "Department": "Sales",
        "DistanceFromHome": 24,
        "Education": 3,
        "EducationField": "Marketing",
        "EnvironmentSatisfaction": 1,
        "Gender": "Male",
        "JobInvolvement": 2,
        "JobLevel": 1,
        "JobRole": "Sales Representative",
        "JobSatisfaction": 1,
        "MaritalStatus": "Single",
        "MonthlyIncome": 2400,
        "NumCompaniesWorked": 4,
        "OverTime": "Yes",
        "PercentSalaryHike": 12,
        "PerformanceRating": 3,
        "RelationshipSatisfaction": 2,
        "StockOptionLevel": 0,
        "TotalWorkingYears": 4,
        "TrainingTimesLastYear": 1,
        "WorkLifeBalance": 1,
        "YearsAtCompany": 2,
        "YearsInCurrentRole": 1,
        "YearsSinceLastPromotion": 2,
        "YearsWithCurrManager": 1
    }
    res = requests.post(f"{BASE_URL}/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "probability" in data
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    print(f"  [PASS] POST /predict -> Risk: {data['risk_level']} ({data['probability']:.1%}) with {len(data['top_factors'])} factors")

def test_dashboard():
    res = requests.get(f"{BASE_URL}/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "risk_distribution" in data
    print(f"  [PASS] GET /dashboard -> Evaluated {data['total_employees']} staff across {len(data['by_department'])} depts")

def test_advisor():
    payload = {
        "employee_data": {
            "JobRole": "Sales Representative",
            "Department": "Sales",
            "MonthlyIncome": 2400,
            "OverTime": "Yes",
            "JobSatisfaction": 1,
            "WorkLifeBalance": 1,
            "YearsAtCompany": 2
        },
        "risk_level": "HIGH",
        "probability": 0.82,
        "top_factors": ["Frequent Overtime", "Critical Job Dissatisfaction", "Below-Benchmark Compensation"]
    }
    res = requests.post(f"{BASE_URL}/advisor", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["immediate_actions"]) > 0
    print(f"  [PASS] POST /advisor -> Retention plan generated (AI: {data['is_ai_generated']})")

if __name__ == "__main__":
    print("Executing AttritionIQ Test Suite...")
    try:
        test_health()
        test_sample_data()
        test_summary()
        test_eda()
        test_train()
        test_feature_importance()
        test_predict()
        test_dashboard()
        test_advisor()
        print("\nALL 9 ENDPOINT TESTS PASSED SUCCESSFULLY!")
    except Exception as e:
        print(f"\nTEST SUITE FAILED: {e}")
        sys.exit(1)
