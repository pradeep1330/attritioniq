import React, { useState } from 'react';
import {
  UserCheck,
  UserX,
  AlertTriangle,
  Sparkles,
  Upload,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Sliders,
  FileSpreadsheet,
  Cpu,
  Layers,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import {
  PredictionResult,
  BatchPredictionResponse,
  TrainingResponse
} from '../../types';

interface PredictRiskTabProps {
  trainingData: TrainingResponse | null;
  onPredictSingle: (employeeData: Record<string, any>, model?: string, low?: number, high?: number) => void;
  onPredictBatch: (file: File, model?: string, low?: number, high?: number) => void;
  singleResult: PredictionResult | null;
  batchResult: BatchPredictionResponse | null;
  predicting: boolean;
  onOpenAdvisor: () => void;
  advisorLoading: boolean;
}

export const PredictRiskTab: React.FC<PredictRiskTabProps> = ({
  trainingData,
  onPredictSingle,
  onPredictBatch,
  singleResult,
  batchResult,
  predicting,
  onOpenAdvisor,
  advisorLoading
}) => {
  const [subMode, setSubMode] = useState<'single' | 'batch'>('single');
  const [selectedModel, setSelectedModel] = useState<string>(trainingData?.best_model || '');
  const [thresholdLow, setThresholdLow] = useState<number>(0.30);
  const [thresholdHigh, setThresholdHigh] = useState<number>(0.60);

  // Single employee form state with realistic HR defaults
  const [formData, setFormData] = useState<Record<string, any>>({
    Age: 32,
    BusinessTravel: 'Travel_Frequently',
    Department: 'Sales',
    DistanceFromHome: 18,
    Education: 3,
    EducationField: 'Marketing',
    EnvironmentSatisfaction: 2,
    Gender: 'Male',
    JobInvolvement: 2,
    JobLevel: 2,
    JobRole: 'Sales Executive',
    JobSatisfaction: 1,
    MaritalStatus: 'Single',
    MonthlyIncome: 4500,
    NumCompaniesWorked: 4,
    OverTime: 'Yes',
    PercentSalaryHike: 12,
    PerformanceRating: 3,
    RelationshipSatisfaction: 2,
    StockOptionLevel: 0,
    TotalWorkingYears: 8,
    TrainingTimesLastYear: 2,
    WorkLifeBalance: 1,
    YearsAtCompany: 3,
    YearsInCurrentRole: 2,
    YearsSinceLastPromotion: 4,
    YearsWithCurrManager: 1,
    DailyRate: 800,
    HourlyRate: 65,
    MonthlyRate: 15000
  });

  // Batch search and filter state
  const [batchSearch, setBatchSearch] = useState<string>('');
  const [batchRiskFilter, setBatchRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPredictSingle(formData, selectedModel || undefined, thresholdLow, thresholdHigh);
  };

  const handleBatchFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onPredictBatch(e.target.files[0], selectedModel || undefined, thresholdLow, thresholdHigh);
    }
  };

  const downloadBatchCsv = () => {
    if (!batchResult || !batchResult.results.length) return;
    const headers = ['Employee ID', 'Department', 'Job Role', 'Monthly Income', 'Attrition Probability', 'Risk Level', 'Top Factor', 'Suggested Action'];
    const rows = batchResult.results.map(r => [
      r.employee_id,
      r.department,
      `"${r.job_role}"`,
      r.monthly_income,
      r.probability,
      r.risk_level,
      `"${r.top_risk_reason}"`,
      `"${r.suggested_priority_action}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attrition_predictions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredBatchResults = batchResult?.results.filter(item => {
    const matchesFilter = batchRiskFilter === 'ALL' || item.risk_level === batchRiskFilter;
    const matchesSearch =
      item.employee_id.toLowerCase().includes(batchSearch.toLowerCase()) ||
      item.department.toLowerCase().includes(batchSearch.toLowerCase()) ||
      item.job_role.toLowerCase().includes(batchSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Sub-mode switcher & controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Toggle Mode */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          <button
            onClick={() => setSubMode('single')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              subMode === 'single'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Individual Employee Simulator
          </button>
          <button
            onClick={() => setSubMode('batch')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              subMode === 'batch'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Batch CSV Evaluation
          </button>
        </div>

        {/* Global Controls: Model & Thresholds */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500">Inference Engine:</span>
            <select
              value={selectedModel || (trainingData?.best_model || '')}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-semibold"
            >
              {trainingData?.models.map(m => (
                <option key={m.model_name} value={m.model_name}>
                  {m.display_name} {m.model_name === trainingData.best_model ? '★ (Best)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
            <span className="text-slate-500">Thresholds:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">&lt;{(thresholdLow * 100).toFixed(0)}% Low</span>
            <span className="text-slate-400">|</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">&gt;{(thresholdHigh * 100).toFixed(0)}% High</span>
          </div>
        </div>
      </div>

      {/* SINGLE EMPLOYEE SIMULATOR */}
      {subMode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Parameters */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Employee Attribute Profile
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Adjust sliders and inputs to simulate what-if retention scenarios
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    Age: 26,
                    BusinessTravel: 'Travel_Frequently',
                    Department: 'Sales',
                    DistanceFromHome: 24,
                    Education: 2,
                    EducationField: 'Marketing',
                    EnvironmentSatisfaction: 1,
                    Gender: 'Female',
                    JobInvolvement: 2,
                    JobLevel: 1,
                    JobRole: 'Sales Representative',
                    JobSatisfaction: 1,
                    MaritalStatus: 'Single',
                    MonthlyIncome: 2600,
                    NumCompaniesWorked: 4,
                    OverTime: 'Yes',
                    PercentSalaryHike: 11,
                    PerformanceRating: 3,
                    RelationshipSatisfaction: 1,
                    StockOptionLevel: 0,
                    TotalWorkingYears: 4,
                    TrainingTimesLastYear: 1,
                    WorkLifeBalance: 1,
                    YearsAtCompany: 1,
                    YearsInCurrentRole: 1,
                    YearsSinceLastPromotion: 1,
                    YearsWithCurrManager: 0
                  });
                }}
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                Load High-Risk Preset
              </button>
            </div>

            <form onSubmit={handleSingleSubmit} className="space-y-6">
              {/* Category 1: Workload & Core Risk Factors */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3 flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Workload & Workplace Satisfaction</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Overtime Toggle */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                        Recurring Overtime
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Strongest individual risk driver
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange('OverTime', formData.OverTime === 'Yes' ? 'No' : 'Yes')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.OverTime === 'Yes' ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.OverTime === 'Yes' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Job Satisfaction */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Job Satisfaction</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{formData.JobSatisfaction} / 4</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={4}
                      value={formData.JobSatisfaction}
                      onChange={(e) => handleInputChange('JobSatisfaction', Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                      <span>1: Low</span>
                      <span>2: Medium</span>
                      <span>3: High</span>
                      <span>4: Very High</span>
                    </div>
                  </div>

                  {/* Work-Life Balance */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Work-Life Balance</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{formData.WorkLifeBalance} / 4</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={4}
                      value={formData.WorkLifeBalance}
                      onChange={(e) => handleInputChange('WorkLifeBalance', Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Environment Satisfaction */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Environment Rating</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{formData.EnvironmentSatisfaction} / 4</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={4}
                      value={formData.EnvironmentSatisfaction}
                      onChange={(e) => handleInputChange('EnvironmentSatisfaction', Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Category 2: Role & Compensation */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3 flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Role & Compensation</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department
                    </label>
                    <select
                      value={formData.Department}
                      onChange={(e) => handleInputChange('Department', e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <option value="Research & Development">Research & Development</option>
                      <option value="Sales">Sales</option>
                      <option value="Human Resources">Human Resources</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Job Role
                    </label>
                    <select
                      value={formData.JobRole}
                      onChange={(e) => handleInputChange('JobRole', e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg truncate"
                    >
                      <option value="Sales Executive">Sales Executive</option>
                      <option value="Research Scientist">Research Scientist</option>
                      <option value="Laboratory Technician">Laboratory Technician</option>
                      <option value="Manufacturing Director">Manufacturing Director</option>
                      <option value="Healthcare Representative">Healthcare Representative</option>
                      <option value="Manager">Manager</option>
                      <option value="Sales Representative">Sales Representative</option>
                      <option value="Research Director">Research Director</option>
                      <option value="Human Resources">Human Resources</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Monthly Salary ($)
                    </label>
                    <input
                      type="number"
                      min={1000}
                      max={30000}
                      step={100}
                      value={formData.MonthlyIncome}
                      onChange={(e) => handleInputChange('MonthlyIncome', Number(e.target.value))}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Job Level (1 - 5)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={formData.JobLevel}
                      onChange={(e) => handleInputChange('JobLevel', Number(e.target.value))}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Stock Option Level (0 - 3)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={3}
                      value={formData.StockOptionLevel}
                      onChange={(e) => handleInputChange('StockOptionLevel', Number(e.target.value))}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Last Salary Hike (%)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={35}
                      value={formData.PercentSalaryHike}
                      onChange={(e) => handleInputChange('PercentSalaryHike', Number(e.target.value))}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Category 3: Career Progression & Demographics */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3 flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Tenure, Career Growth & Demographics</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      min={18}
                      max={65}
                      value={formData.Age}
                      onChange={(e) => handleInputChange('Age', Number(e.target.value))}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Commute (Miles)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={formData.DistanceFromHome}
                      onChange={(e) => handleInputChange('DistanceFromHome', Number(e.target.value))}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Years At Company
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={40}
                      value={formData.YearsAtCompany}
                      onChange={(e) => handleInputChange('YearsAtCompany', Number(e.target.value))}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Years Since Promo
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={formData.YearsSinceLastPromotion}
                      onChange={(e) => handleInputChange('YearsSinceLastPromotion', Number(e.target.value))}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Marital Status
                    </label>
                    <select
                      value={formData.MaritalStatus}
                      onChange={(e) => handleInputChange('MaritalStatus', e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Business Travel
                    </label>
                    <select
                      value={formData.BusinessTravel}
                      onChange={(e) => handleInputChange('BusinessTravel', e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <option value="Travel_Rarely">Travel Rarely</option>
                      <option value="Travel_Frequently">Travel Frequently</option>
                      <option value="Non-Travel">Non-Travel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Years w/ Manager
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={formData.YearsWithCurrManager}
                      onChange={(e) => handleInputChange('YearsWithCurrManager', Number(e.target.value))}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Prior Companies
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={formData.NumCompaniesWorked}
                      onChange={(e) => handleInputChange('NumCompaniesWorked', Number(e.target.value))}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={predicting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <Cpu className="w-4 h-4" />
                <span>{predicting ? 'Scoring Flight Probability...' : 'Compute Attrition Risk & Interventions'}</span>
              </button>
            </form>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-5 space-y-6">
            {singleResult ? (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in duration-300">
                {/* Score Gauge & Risk Tier Badge */}
                <div className="text-center space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Predicted Flight Probability
                  </span>

                  <div className="flex items-center justify-center space-x-4">
                    <div
                      className={`text-5xl font-black font-mono ${
                        singleResult.risk_level === 'HIGH'
                          ? 'text-rose-600 dark:text-rose-400'
                          : singleResult.risk_level === 'MEDIUM'
                          ? 'text-amber-500'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {singleResult.probability_percentage}%
                    </div>

                    <div className="text-left">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full inline-block mb-1 ${
                          singleResult.risk_level === 'HIGH'
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : singleResult.risk_level === 'MEDIUM'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        }`}
                      >
                        {singleResult.risk_level} RISK
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Evaluated via {singleResult.model_used.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  {/* AI HR Advisor Trigger Button */}
                  <button
                    onClick={onOpenAdvisor}
                    disabled={advisorLoading}
                    className="mt-2 w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                    <span>{advisorLoading ? 'Synthesizing Plan...' : 'Generate AI HR Retention Plan'}</span>
                  </button>
                </div>

                {/* Top Contributing Risk Drivers */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
                    Individual Risk Attribution
                  </h4>
                  <div className="space-y-2">
                    {singleResult.top_factors.map((fac, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs ${
                          fac.impact === 'High Risk'
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40 text-slate-800 dark:text-slate-200'
                            : fac.impact === 'Moderate Risk'
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 text-slate-800 dark:text-slate-200'
                            : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold">{fac.factor}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 shadow-xs">
                            {fac.impact}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          {fac.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested HR Actions */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
                    Targeted Retention Interventions
                  </h4>
                  <div className="space-y-2">
                    {singleResult.suggested_actions.map((act, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-2 text-xs text-slate-700 dark:text-slate-300 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 leading-relaxed"
                      >
                        <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Ready for Simulation
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Adjust any parameters on the left and click "Compute Attrition Risk" to evaluate retention probability.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BATCH CSV EVALUATION MODE */}
      {subMode === 'batch' && (
        <div className="space-y-6">
          {/* Upload Dropzone */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Upload Cohort CSV for Batch Prediction
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Upload an employee roster CSV. The model will score each employee, classify flight-risk tiers, and output a downloadable action plan.
              </p>
            </div>

            <label className="cursor-pointer inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all">
              <Upload className="w-4 h-4" />
              <span>Select Employee CSV File</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleBatchFileUpload}
                disabled={predicting}
                className="hidden"
              />
            </label>
            {predicting && (
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 animate-pulse">
                Scoring cohort records and attributing risk factors...
              </p>
            )}
          </div>

          {/* Batch Results View */}
          {batchResult && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Total Evaluated
                  </span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {batchResult.summary.total_evaluated.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Avg Risk: {(batchResult.summary.avg_attrition_probability * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-500">
                    High Risk Cohort
                  </span>
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                    {batchResult.summary.high_risk_count}
                  </div>
                  <div className="text-[11px] text-rose-500 font-semibold mt-0.5">
                    {batchResult.summary.high_risk_percent}% of workforce
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-500">
                    Medium Risk
                  </span>
                  <div className="text-2xl font-bold text-amber-500 mt-1">
                    {batchResult.summary.medium_risk_count}
                  </div>
                  <div className="text-[11px] text-amber-500 font-semibold mt-0.5">
                    {batchResult.summary.medium_risk_percent}% monitoring
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500">
                    Low Risk (Stable)
                  </span>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {batchResult.summary.low_risk_count}
                  </div>
                  <div className="text-[11px] text-emerald-500 font-semibold mt-0.5">
                    {batchResult.summary.low_risk_percent}% stable
                  </div>
                </div>
              </div>

              {/* Table Controls */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(tier => (
                      <button
                        key={tier}
                        onClick={() => setBatchRiskFilter(tier)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          batchRiskFilter === tier
                            ? tier === 'HIGH'
                              ? 'bg-rose-500 text-white'
                              : tier === 'MEDIUM'
                              ? 'bg-amber-500 text-white'
                              : tier === 'LOW'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {tier} Risk
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="relative w-48 sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search ID, role, dept..."
                        value={batchSearch}
                        onChange={(e) => setBatchSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <button
                      onClick={downloadBatchCsv}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl max-h-96">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Employee ID</th>
                        <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Department</th>
                        <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Role</th>
                        <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Salary</th>
                        <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Probability</th>
                        <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Risk Tier</th>
                        <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Primary Risk Driver</th>
                        <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Recommended Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredBatchResults.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                            {r.employee_id}
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">{r.department}</td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">{r.job_role}</td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                            ${r.monthly_income.toLocaleString()}
                          </td>
                          <td className="p-3 font-mono font-bold">
                            {(r.probability * 100).toFixed(1)}%
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.risk_level === 'HIGH'
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                  : r.risk_level === 'MEDIUM'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              }`}
                            >
                              {r.risk_level}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{r.top_risk_reason}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={r.suggested_priority_action}>
                            {r.suggested_priority_action}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
