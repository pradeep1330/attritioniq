export interface HealthStatus {
  status: string;
  message: string;
  dataset_loaded: boolean;
  models_trained: boolean;
  best_model?: string | null;
  row_count: number;
}

export interface FeatureInfo {
  name: string;
  type: 'numeric' | 'categorical';
  missing_count: number;
  unique_values: number;
  example_values: any[];
}

export interface DatasetSummary {
  total_rows: number;
  total_columns: number;
  target_column: string;
  attrition_count: number;
  attrition_rate: number;
  retention_count: number;
  retention_rate: number;
  features: FeatureInfo[];
  preview: Record<string, any>[];
}

export interface EDABarItem {
  category: string;
  total: number;
  attrition_count: number;
  attrition_rate: number;
}

export interface CorrelationItem {
  feature: string;
  correlation: number;
  strength: 'Strong' | 'Moderate' | 'Weak';
  direction: string;
}

export interface EDAResponse {
  overall_attrition_rate: number;
  by_department: EDABarItem[];
  by_job_role: EDABarItem[];
  by_overtime: EDABarItem[];
  by_marital_status: EDABarItem[];
  by_business_travel: EDABarItem[];
  by_age_group: EDABarItem[];
  by_income_band: EDABarItem[];
  by_distance_band: EDABarItem[];
  by_years_since_promotion: EDABarItem[];
  correlations: CorrelationItem[];
  key_findings: string[];
}

export interface ConfusionMatrixData {
  true_negative: number;
  false_positive: number;
  false_negative: number;
  true_positive: number;
}

export interface ROCPoint {
  fpr: number;
  tpr: number;
}

export interface ModelEvaluation {
  model_name: string;
  display_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  cv_f1_mean: number;
  cv_f1_std: number;
  confusion_matrix: ConfusionMatrixData;
  roc_points: ROCPoint[];
}

export interface TrainingResponse {
  message: string;
  train_size: number;
  test_size: number;
  models: ModelEvaluation[];
  best_model: string;
  recommendation_reason: string;
}

export interface FeatureImportanceItem {
  feature: string;
  display_name: string;
  rf_importance: number;
  lr_coefficient: number;
  direction: 'Increases Risk' | 'Decreases Risk' | 'Neutral';
  impact_explanation: string;
}

export interface FeatureImportanceResponse {
  top_features: FeatureImportanceItem[];
  methodology: string;
}

export interface FactorImpact {
  factor: string;
  impact: 'High Risk' | 'Moderate Risk' | 'Protective';
  description: string;
}

export interface PredictionResult {
  employee_id?: string;
  probability: number;
  probability_percentage: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  model_used: string;
  thresholds: {
    low: number;
    high: number;
  };
  top_factors: FactorImpact[];
  suggested_actions: string[];
}

export interface BatchSummary {
  total_evaluated: number;
  low_risk_count: number;
  low_risk_percent: number;
  medium_risk_count: number;
  medium_risk_percent: number;
  high_risk_count: number;
  high_risk_percent: number;
  avg_attrition_probability: number;
}

export interface BatchItem {
  employee_id: string;
  department: string;
  job_role: string;
  monthly_income: number;
  probability: number;
  probability_percentage: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  top_risk_reason: string;
  suggested_priority_action: string;
}

export interface BatchPredictionResponse {
  summary: BatchSummary;
  results: BatchItem[];
}

export interface DepartmentRisk {
  department: string;
  total_employees: number;
  high_risk_count: number;
  high_risk_rate: number;
}

export interface DashboardResponse {
  total_employees: number;
  risk_distribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
  };
  risk_percentages: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
  };
  avg_probability: number;
  by_department: DepartmentRisk[];
  top_risk_employees: BatchItem[];
}

export interface AdvisorResponse {
  employee_summary: string;
  executive_summary: string;
  immediate_actions: string[];
  long_term_strategy: string[];
  manager_talking_points: string[];
  is_ai_generated: boolean;
}
