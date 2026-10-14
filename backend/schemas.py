from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    message: str
    dataset_loaded: bool
    models_trained: bool
    best_model: Optional[str] = None
    row_count: int = 0


class FeatureInfo(BaseModel):
    name: str
    type: str  # 'numeric' or 'categorical'
    missing_count: int
    unique_values: int
    example_values: List[Any]


class DatasetSummaryResponse(BaseModel):
    total_rows: int
    total_columns: int
    target_column: str
    attrition_count: int
    attrition_rate: float
    retention_count: int
    retention_rate: float
    features: List[FeatureInfo]
    preview: List[Dict[str, Any]]


class EDABarItem(BaseModel):
    category: str
    total: int
    attrition_count: int
    attrition_rate: float


class CorrelationItem(BaseModel):
    feature: str
    correlation: float
    strength: str
    direction: str


class EDAResponse(BaseModel):
    overall_attrition_rate: float
    by_department: List[EDABarItem]
    by_job_role: List[EDABarItem]
    by_overtime: List[EDABarItem]
    by_marital_status: List[EDABarItem]
    by_business_travel: List[EDABarItem]
    by_age_group: List[EDABarItem]
    by_income_band: List[EDABarItem]
    by_distance_band: List[EDABarItem]
    by_years_since_promotion: List[EDABarItem]
    correlations: List[CorrelationItem]
    key_findings: List[str]


class ConfusionMatrixData(BaseModel):
    true_negative: int
    false_positive: int
    false_negative: int
    true_positive: int


class ROCPoint(BaseModel):
    fpr: float
    tpr: float


class ModelEvaluation(BaseModel):
    model_name: str
    display_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    cv_f1_mean: float
    cv_f1_std: float
    confusion_matrix: ConfusionMatrixData
    roc_points: List[ROCPoint]


class TrainingResponse(BaseModel):
    message: str
    train_size: int
    test_size: int
    models: List[ModelEvaluation]
    best_model: str
    recommendation_reason: str


class FeatureImportanceItem(BaseModel):
    feature: str
    display_name: str
    rf_importance: float
    lr_coefficient: float
    direction: str  # 'Increases Risk' | 'Decreases Risk' | 'Neutral'
    impact_explanation: str


class FeatureImportanceResponse(BaseModel):
    top_features: List[FeatureImportanceItem]
    methodology: str


class EmployeeInput(BaseModel):
    Age: int = Field(default=35, ge=18, le=65)
    BusinessTravel: str = Field(default="Travel_Rarely")
    DailyRate: Optional[int] = Field(default=800, ge=100, le=2000)
    Department: str = Field(default="Research & Development")
    DistanceFromHome: int = Field(default=8, ge=1, le=50)
    Education: int = Field(default=3, ge=1, le=5)
    EducationField: str = Field(default="Life Sciences")
    EnvironmentSatisfaction: int = Field(default=3, ge=1, le=4)
    Gender: str = Field(default="Male")
    HourlyRate: Optional[int] = Field(default=65, ge=20, le=120)
    JobInvolvement: int = Field(default=3, ge=1, le=4)
    JobLevel: int = Field(default=2, ge=1, le=5)
    JobRole: str = Field(default="Research Scientist")
    JobSatisfaction: int = Field(default=3, ge=1, le=4)
    MaritalStatus: str = Field(default="Married")
    MonthlyIncome: int = Field(default=5000, ge=1000, le=30000)
    MonthlyRate: Optional[int] = Field(default=14000, ge=2000, le=35000)
    NumCompaniesWorked: int = Field(default=2, ge=0, le=15)
    OverTime: str = Field(default="No")
    PercentSalaryHike: int = Field(default=14, ge=5, le=35)
    PerformanceRating: int = Field(default=3, ge=1, le=4)
    RelationshipSatisfaction: int = Field(default=3, ge=1, le=4)
    StockOptionLevel: int = Field(default=1, ge=0, le=3)
    TotalWorkingYears: int = Field(default=10, ge=0, le=45)
    TrainingTimesLastYear: int = Field(default=2, ge=0, le=10)
    WorkLifeBalance: int = Field(default=3, ge=1, le=4)
    YearsAtCompany: int = Field(default=5, ge=0, le=45)
    YearsInCurrentRole: int = Field(default=3, ge=0, le=30)
    YearsSinceLastPromotion: int = Field(default=1, ge=0, le=20)
    YearsWithCurrManager: int = Field(default=3, ge=0, le=20)


class FactorImpact(BaseModel):
    factor: str
    impact: str  # 'High Risk' | 'Moderate Risk' | 'Protective'
    description: str


class PredictionResult(BaseModel):
    employee_id: Optional[str] = None
    probability: float
    probability_percentage: float
    risk_level: str  # 'LOW' | 'MEDIUM' | 'HIGH'
    model_used: str
    thresholds: Dict[str, float]
    top_factors: List[FactorImpact]
    suggested_actions: List[str]


class BatchPredictionSummary(BaseModel):
    total_evaluated: int
    low_risk_count: int
    low_risk_percent: float
    medium_risk_count: int
    medium_risk_percent: float
    high_risk_count: int
    high_risk_percent: float
    avg_attrition_probability: float


class BatchPredictionResponse(BaseModel):
    summary: BatchPredictionSummary
    results: List[Dict[str, Any]]


class HighRiskByDepartment(BaseModel):
    department: str
    total_employees: int
    high_risk_count: int
    high_risk_rate: float


class DashboardEmployee(BaseModel):
    employee_id: str
    department: str
    job_role: str
    monthly_income: int
    probability: float
    risk_level: str
    top_risk_reason: str
    suggested_priority_action: str


class DashboardResponse(BaseModel):
    total_employees: int
    risk_distribution: Dict[str, int]
    risk_percentages: Dict[str, float]
    avg_probability: float
    by_department: List[HighRiskByDepartment]
    top_risk_employees: List[DashboardEmployee]


class AdvisorRequest(BaseModel):
    employee_data: Dict[str, Any]
    risk_level: str
    probability: float
    top_factors: List[str]


class AdvisorResponse(BaseModel):
    employee_summary: str
    executive_summary: str
    immediate_actions: List[str]
    long_term_strategy: List[str]
    manager_talking_points: List[str]
    is_ai_generated: bool
