import random
import numpy as np
import pandas as pd

def generate_hr_dataset(num_rows: int = 1470, seed: int = 42) -> pd.DataFrame:
    """
    Generates a realistic synthetic HR dataset strictly adhering to the IBM HR Analytics Employee Attrition schema.
    Embeds realistic statistical relationships:
    - Overtime strongly drives higher attrition
    - Low Job Satisfaction and Work-Life Balance increase attrition
    - Lower Monthly Income relative to role/level increases attrition
    - Long Distance From Home increases attrition
    - Stagnant promotions (YearsSinceLastPromotion) increase attrition
    - Frequent job changers (NumCompaniesWorked) have higher turnover
    - Young, single, frequent travelers show higher mobility
    """
    random.seed(seed)
    np.random.seed(seed)

    departments = ["Research & Development", "Sales", "Human Resources"]
    dept_weights = [0.65, 0.30, 0.05]

    roles_by_dept = {
        "Research & Development": [
            ("Research Scientist", 1, 2),
            ("Laboratory Technician", 1, 2),
            ("Manufacturing Director", 2, 4),
            ("Healthcare Representative", 2, 3),
            ("Research Director", 3, 5),
            ("Manager", 4, 5)
        ],
        "Sales": [
            ("Sales Executive", 2, 3),
            ("Sales Representative", 1, 2),
            ("Manager", 4, 5)
        ],
        "Human Resources": [
            ("Human Resources", 1, 3),
            ("Manager", 4, 5)
        ]
    }

    edu_fields_by_dept = {
        "Research & Development": ["Life Sciences", "Medical", "Technical Degree", "Other"],
        "Sales": ["Marketing", "Life Sciences", "Medical", "Other"],
        "Human Resources": ["Human Resources", "Life Sciences", "Medical", "Other"]
    }

    rows = []

    for i in range(num_rows):
        emp_num = 1001 + i
        dept = np.random.choice(departments, p=dept_weights)
        role_choices = roles_by_dept[dept]
        role_info = random.choice(role_choices)
        job_role = role_info[0]
        min_level, max_level = role_info[1], role_info[2]
        job_level = int(np.random.randint(min_level, max_level + 1))

        # Age and experience coherence
        age = int(np.random.choice(
            [np.random.randint(20, 30), np.random.randint(30, 45), np.random.randint(45, 60)],
            p=[0.25, 0.55, 0.20]
        ))
        
        max_exp = max(0, age - 18)
        total_working_years = min(max_exp, int(np.random.exponential(scale=6) + (job_level * 2.5)))
        total_working_years = min(total_working_years, 40)

        years_at_company = int(np.random.randint(0, max(1, total_working_years + 1)))
        years_in_current_role = int(np.random.randint(0, max(1, years_at_company + 1)))
        years_since_promotion = int(np.random.randint(0, max(1, years_at_company + 1)))
        years_with_manager = int(np.random.randint(0, max(1, years_at_company + 1)))

        # Salary calibrated by Job Level
        base_salary_by_level = {
            1: (2200, 3800),
            2: (4000, 6800),
            3: (7000, 10500),
            4: (11000, 15500),
            5: (16000, 19999)
        }
        sal_min, sal_max = base_salary_by_level[job_level]
        monthly_income = int(np.random.uniform(sal_min, sal_max))

        # Demographic & workplace factors
        gender = np.random.choice(["Male", "Female"], p=[0.60, 0.40])
        marital_status = np.random.choice(["Married", "Single", "Divorced"], p=[0.46, 0.32, 0.22])
        travel = np.random.choice(["Travel_Rarely", "Travel_Frequently", "Non-Travel"], p=[0.71, 0.19, 0.10])
        distance = int(np.random.choice([np.random.randint(1, 10), np.random.randint(10, 29)], p=[0.65, 0.35]))
        
        overtime = np.random.choice(["Yes", "No"], p=[0.28, 0.72])
        
        # Satisfaction ratings (1 to 4)
        job_sat = int(np.random.choice([1, 2, 3, 4], p=[0.19, 0.20, 0.31, 0.30]))
        env_sat = int(np.random.choice([1, 2, 3, 4], p=[0.19, 0.20, 0.31, 0.30]))
        work_life = int(np.random.choice([1, 2, 3, 4], p=[0.10, 0.23, 0.53, 0.14]))
        job_inv = int(np.random.choice([1, 2, 3, 4], p=[0.06, 0.25, 0.59, 0.10]))
        rel_sat = int(np.random.choice([1, 2, 3, 4], p=[0.18, 0.21, 0.31, 0.30]))

        num_companies = int(np.random.choice(range(10), p=[0.14, 0.35, 0.10, 0.11, 0.10, 0.05, 0.05, 0.05, 0.03, 0.02]))
        stock_opt = int(np.random.choice([0, 1, 2, 3], p=[0.43, 0.40, 0.11, 0.06]))
        salary_hike = int(np.random.randint(11, 25))
        perf_rating = 4 if salary_hike >= 20 else 3
        training_times = int(np.random.randint(0, 7))
        education = int(np.random.choice([1, 2, 3, 4, 5], p=[0.12, 0.19, 0.39, 0.27, 0.03]))
        edu_field = random.choice(edu_fields_by_dept[dept])
        
        daily_rate = int(np.random.randint(102, 1499))
        hourly_rate = int(np.random.randint(30, 100))
        monthly_rate = int(np.random.randint(2094, 26999))

        # Realistically modeled Attrition log-odds (target baseline ~16.5%)
        log_odds = -2.35

        # Strong predictors
        if overtime == "Yes":
            log_odds += 1.35
        if job_sat == 1:
            log_odds += 0.95
        elif job_sat == 2:
            log_odds += 0.40
        elif job_sat == 4:
            log_odds -= 0.45

        if work_life == 1:
            log_odds += 0.85
        elif work_life in [3, 4]:
            log_odds -= 0.35

        if env_sat == 1:
            log_odds += 0.65

        if marital_status == "Single":
            log_odds += 0.65
        elif marital_status == "Divorced":
            log_odds -= 0.25

        if travel == "Travel_Frequently":
            log_odds += 0.60
        elif travel == "Non-Travel":
            log_odds -= 0.40

        # Distance penalty
        if distance > 15:
            log_odds += 0.50
        elif distance < 5:
            log_odds -= 0.25

        # Income vs role average
        expected_mid = (sal_min + sal_max) / 2.0
        income_ratio = monthly_income / expected_mid
        if income_ratio < 0.85:
            log_odds += 0.55
        elif income_ratio > 1.15:
            log_odds -= 0.45

        # Promotion stagnation
        if years_since_promotion >= 5:
            log_odds += 0.60
        if years_at_company < 2 and total_working_years > 3:
            log_odds += 0.45  # Early tenure churn
        if years_with_manager < 1:
            log_odds += 0.35

        if age < 28:
            log_odds += 0.40
        elif age > 48:
            log_odds -= 0.50

        if stock_opt == 0:
            log_odds += 0.40

        # Convert log-odds to probability
        prob = 1.0 / (1.0 + np.exp(-log_odds))
        attrition = "Yes" if np.random.rand() < prob else "No"

        rows.append({
            "Age": age,
            "Attrition": attrition,
            "BusinessTravel": travel,
            "DailyRate": daily_rate,
            "Department": dept,
            "DistanceFromHome": distance,
            "Education": education,
            "EducationField": edu_field,
            "EmployeeCount": 1,
            "EmployeeNumber": emp_num,
            "EnvironmentSatisfaction": env_sat,
            "Gender": gender,
            "HourlyRate": hourly_rate,
            "JobInvolvement": job_inv,
            "JobLevel": job_level,
            "JobRole": job_role,
            "JobSatisfaction": job_sat,
            "MaritalStatus": marital_status,
            "MonthlyIncome": monthly_income,
            "MonthlyRate": monthly_rate,
            "NumCompaniesWorked": num_companies,
            "Over18": "Y",
            "OverTime": overtime,
            "PercentSalaryHike": salary_hike,
            "PerformanceRating": perf_rating,
            "RelationshipSatisfaction": rel_sat,
            "StandardHours": 80,
            "StockOptionLevel": stock_opt,
            "TotalWorkingYears": total_working_years,
            "TrainingTimesLastYear": training_times,
            "WorkLifeBalance": work_life,
            "YearsAtCompany": years_at_company,
            "YearsInCurrentRole": years_in_current_role,
            "YearsSinceLastPromotion": years_since_promotion,
            "YearsWithCurrManager": years_with_manager
        })

    return pd.DataFrame(rows)
