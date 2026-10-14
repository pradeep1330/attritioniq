import os
import json
import logging
import requests
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

def generate_fallback_advisor_plan(
    employee_data: Dict[str, Any],
    risk_level: str,
    probability: float,
    top_factors: List[str]
) -> Dict[str, Any]:
    """Structured, professional retention plan generated rule-based when AI key is absent or unavailable."""
    role = employee_data.get("JobRole", "Team Member")
    dept = employee_data.get("Department", "Operations")
    age = employee_data.get("Age", 32)
    tenure = employee_data.get("YearsAtCompany", 3)
    ot = str(employee_data.get("OverTime", "No")).strip().lower() in ["yes", "y", "true", "1"]
    factors_str = ", ".join(top_factors) if top_factors else "Tenure and workplace dynamics"

    summary = f"{role} ({dept}) with {tenure} years of company tenure. Assessed at {risk_level} flight risk ({probability:.1%})."

    exec_summary = (
        f"This employee presents an elevated retention concern primarily driven by {factors_str}. "
        f"Immediate intervention within the next two business weeks is recommended to avoid preventable voluntary attrition "
        f"and the associated hiring and onboarding replacement costs."
    )

    immediate_actions = [
        "Schedule an empathetic 1:1 'stay interview' with an HR Business Partner within 5 business days.",
        "Immediately review and mitigate recurring overtime or excessive after-hours workload commitments." if ot else "Evaluate current workload distribution to ensure role clarity and bandwidth.",
        "Assess compensation against departmental midpoint and consider a retention adjustment or spot bonus."
    ]

    long_term_strategy = [
        "Formulate a documented 12-month career pathway with transparent milestones toward promotional advancement.",
        "Provide flexible scheduling or hybrid work options to reinforce work-life balance and reduce commute friction.",
        "Enroll the employee in specialized technical or executive leadership mentorship programs."
    ]

    talking_points = [
        f"'We recognize your strong contributions to the {dept} team and want to make sure your daily experience aligns with your career goals.'",
        "'How can we better support your workload balance and reduce current operational friction points?'",
        "'Let's look ahead at the next 6-12 months together: what key projects or leadership roles excite you most?'"
    ]

    return {
        "employee_summary": summary,
        "executive_summary": exec_summary,
        "immediate_actions": immediate_actions,
        "long_term_strategy": long_term_strategy,
        "manager_talking_points": talking_points,
        "is_ai_generated": False
    }

def get_ai_retention_plan(
    employee_data: Dict[str, Any],
    risk_level: str,
    probability: float,
    top_factors: List[str]
) -> Dict[str, Any]:
    """
    Calls Gemini API using GEMINI_API_KEY from environment to generate a customized retention plan.
    Falls back gracefully to rule-based plan on any error or missing key.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "MY_GEMINI_API_KEY":
        return generate_fallback_advisor_plan(employee_data, risk_level, probability, top_factors)

    role = employee_data.get("JobRole", "Employee")
    dept = employee_data.get("Department", "General")
    tenure = employee_data.get("YearsAtCompany", 2)
    salary = employee_data.get("MonthlyIncome", 5000)
    overtime = employee_data.get("OverTime", "No")
    satisfaction = employee_data.get("JobSatisfaction", 3)
    balance = employee_data.get("WorkLifeBalance", 3)
    promo_gap = employee_data.get("YearsSinceLastPromotion", 1)
    distance = employee_data.get("DistanceFromHome", 10)

    prompt = f"""You are an executive HR Retention Consultant and Organizational Psychologist.
Analyze this single employee profile flagged by an Attrition Prediction Model:
- Role: {role}
- Department: {dept}
- Tenure at Company: {tenure} years
- Monthly Income: ${salary:,}
- OverTime: {overtime}
- Job Satisfaction (1-4): {satisfaction}
- Work Life Balance (1-4): {balance}
- Years Since Last Promotion: {promo_gap} years
- Commute Distance: {distance} miles
- Assessed Risk Level: {risk_level} (Attrition Probability: {probability:.1%})
- Top Flags: {", ".join(top_factors)}

Generate a practical, high-impact HR Retention Plan in JSON format matching this schema:
{{
  "employee_summary": "1 concise sentence summarizing the employee's role and flight risk",
  "executive_summary": "2-3 sentences explaining why they are at risk and the business consequence",
  "immediate_actions": ["Action 1 (first 7 days)", "Action 2 (workload/pay fix)", "Action 3 (check-in)"],
  "long_term_strategy": ["Initiative 1 (career growth)", "Initiative 2 (flexibility/culture)"],
  "manager_talking_points": ["Question/phrase 1", "Question/phrase 2", "Question/phrase 3"]
}}
Return ONLY raw JSON, no markdown formatting or commentary.
"""

    try:
        # First attempt with google-genai SDK if available
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            raw_text = response.text.strip()
        except Exception:
            # Fallback to direct REST endpoint with requests
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.4}
            }
            res = requests.post(url, json=payload, timeout=12)
            if res.status_code == 200:
                data = res.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            else:
                return generate_fallback_advisor_plan(employee_data, risk_level, probability, top_factors)

        # Parse JSON
        if raw_text.startswith("```json"):
            raw_text = raw_text.replace("```json", "", 1)
        if raw_text.startswith("```"):
            raw_text = raw_text.replace("```", "", 1)
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        parsed = json.loads(raw_text.strip())

        return {
            "employee_summary": parsed.get("employee_summary", f"{role} at {risk_level} risk."),
            "executive_summary": parsed.get("executive_summary", ""),
            "immediate_actions": parsed.get("immediate_actions", []),
            "long_term_strategy": parsed.get("long_term_strategy", []),
            "manager_talking_points": parsed.get("manager_talking_points", []),
            "is_ai_generated": True
        }
    except Exception as e:
        logger.warning(f"Gemini advisor call failed: {e}. Falling back to rule-based.")
        return generate_fallback_advisor_plan(employee_data, risk_level, probability, top_factors)
