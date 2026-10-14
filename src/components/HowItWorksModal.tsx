import React from 'react';
import { X, Layers, BarChart3, Cpu, Sparkles, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      icon: <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      title: "1. Data Ingestion & Hygiene",
      desc: "Upload custom CSVs or generate realistic IBM HR data. The pipeline automatically drops zero-variance IDs (EmployeeCount, StandardHours), applies median imputation for numeric features, and mode imputation for categorical data."
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: "2. Statistical EDA & Exploratory Insights",
      desc: "Examines friction across departments, job roles, overtime disparity, commute distance, and promotion stagnation. Computes correlation coefficients and plain-English operational findings directly from real data."
    },
    {
      icon: <Cpu className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      title: "3. 5-Model Tournament & 5-Fold Stratified CV",
      desc: "Trains Logistic Regression, Decision Tree, Random Forest, Gradient Boosting, and KNN with balanced class weighting. Evaluates test Accuracy, Precision, Recall, F1, and ROC-AUC to select the champion model."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      title: "4. Individual Risk Scoring & Factor Attribution",
      desc: "Calculates attrition probability (Low < 30%, Medium 30-60%, High > 60%). Compares individual employee features against baseline medians to explain exactly why this specific employee is at risk."
    },
    {
      icon: <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
      title: "5. Executive AI Retention Advisory",
      desc: "Combines domain-expert HR intervention rules with Google Gemini AI to generate customized 14-day action plans, career progression initiatives, and direct manager talking points."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              How AttritionIQ Works
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              End-to-End Enterprise Machine Learning for Human Resources
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Architecture Summary */}
          <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
            <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
              Full-Stack Architecture
            </h3>
            <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
              <strong>Frontend:</strong> React + TypeScript + Vite + Tailwind CSS + Recharts + Axios. Clean, reactive dashboard with zero client-side ML leakage.<br />
              <strong>Backend:</strong> Python 3.10+ FastAPI server running scikit-learn, pandas, numpy, and joblib for all preprocessing, cross-validation, model persistence, and inferencing.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-4 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
              >
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700">
                  {s.icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {s.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Metric Guide */}
          <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              HR Metric Interpretation Guide
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">F1-Score: </span>
                Balance between finding employees who will leave without crying wolf too often. Essential for imbalanced turnover datasets.
              </div>
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">ROC-AUC: </span>
                Measures how reliably the model ranks high-risk employees above low-risk employees across all probability thresholds.
              </div>
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Recall: </span>
                The percentage of actual voluntary exits correctly flagged. Missing a departing star employee is far more costly than a check-in.
              </div>
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Balanced Weights: </span>
                Penalizes misclassifying the minority attrition class during training so models don't just predict "No" for everyone.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors"
          >
            Got it, Let's Explore
          </button>
        </div>
      </div>
    </div>
  );
};
