import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  Cpu,
  Trophy,
  Play,
  RotateCw,
  HelpCircle,
  Info,
  CheckCircle2,
  Grid
} from 'lucide-react';
import { TrainingResponse, ModelEvaluation } from '../../types';

interface ModelTrainingTabProps {
  trainingData: TrainingResponse | null;
  loading: boolean;
  onRetrain: () => void;
}

const MODEL_COLORS: Record<string, string> = {
  logistic_regression: '#6366f1',
  decision_tree: '#ec4899',
  random_forest: '#10b981',
  gradient_boosting: '#f59e0b',
  knn: '#06b6d4'
};

export const ModelTrainingTab: React.FC<ModelTrainingTabProps> = ({
  trainingData,
  loading,
  onRetrain
}) => {
  const [selectedConfusionModel, setSelectedConfusionModel] = useState<string>(
    trainingData?.best_model || 'logistic_regression'
  );

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Training 5 Machine Learning Classifiers...
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Executing stratified 5-fold cross-validation, hyperparameter calibration, test-set scoring, and calculating ROC curves across all pipelines.
        </p>
      </div>
    );
  }

  if (!trainingData || !trainingData.models || trainingData.models.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <Cpu className="w-10 h-10 text-indigo-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Models Not Yet Trained
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Click below to initiate the automated ML tournament across Logistic Regression, Decision Tree, Random Forest, Gradient Boosting, and KNN.
        </p>
        <button
          onClick={onRetrain}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer inline-flex items-center space-x-2"
        >
          <Play className="w-4 h-4" />
          <span>Train All 5 Models</span>
        </button>
      </div>
    );
  }

  const bestModelObj = trainingData.models.find(m => m.model_name === trainingData.best_model) || trainingData.models[0];
  const activeConfusionModel = trainingData.models.find(m => m.model_name === selectedConfusionModel) || bestModelObj;

  // Comparison Bar Chart data
  const metricsChartData = trainingData.models.map(m => ({
    name: m.display_name.replace('Classifier', '').trim(),
    'F1-Score': Number((m.f1_score * 100).toFixed(1)),
    'ROC-AUC': Number((m.roc_auc * 100).toFixed(1)),
    Recall: Number((m.recall * 100).toFixed(1)),
    Accuracy: Number((m.accuracy * 100).toFixed(1))
  }));

  // Build unified ROC Curve chart data
  // Group by step index 0..25
  const maxPoints = Math.max(...trainingData.models.map(m => m.roc_points?.length || 0));
  const rocChartData: any[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const pointObj: any = { index: i };
    trainingData.models.forEach(m => {
      if (m.roc_points && m.roc_points[i]) {
        pointObj[`${m.model_name}_fpr`] = m.roc_points[i].fpr;
        pointObj[`${m.model_name}_tpr`] = m.roc_points[i].tpr;
      }
    });
    rocChartData.push(pointObj);
  }

  const cm = activeConfusionModel.confusion_matrix;
  const cmTotal = cm.true_negative + cm.false_positive + cm.false_negative + cm.true_positive;

  return (
    <div className="space-y-6">
      {/* Retrain Action & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-indigo-500" />
            <span>Model Benchmark & Evaluation Tournament</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evaluated on stratified 80/20 test set ({trainingData.test_size} employees) with 5-fold cross-validation
          </p>
        </div>

        <button
          onClick={onRetrain}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Retrain All Models</span>
        </button>
      </div>

      {/* Champion Model Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-transparent border border-amber-300/80 dark:border-amber-800/60 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Champion Deployment Model
              </span>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {bestModelObj.display_name}
              </h4>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">F1-Score</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {(bestModelObj.f1_score * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">ROC-AUC</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {(bestModelObj.roc_auc * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">Recall</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {(bestModelObj.recall * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Why this model callout */}
        <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-amber-200/60 dark:border-amber-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">
            Why this model was selected for production HR inference:
          </span>
          {trainingData.recommendation_reason}
        </div>
      </div>

      {/* Metrics Comparison Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          Classification Performance Matrix
        </h4>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                  Model Algorithm
                </th>
                <th className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center space-x-1" title="Percentage of total predictions that were correct">
                    <span>Accuracy</span>
                    <HelpCircle className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center space-x-1" title="When the model predicts an employee will leave, how often is it right?">
                    <span>Precision</span>
                    <HelpCircle className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center space-x-1" title="What fraction of all actual churning employees did the model successfully catch?">
                    <span>Recall</span>
                    <HelpCircle className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center space-x-1" title="Harmonic mean of Precision and Recall. The gold standard for imbalanced HR data.">
                    <span>F1-Score</span>
                    <HelpCircle className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center space-x-1" title="Area under ROC Curve. Ability to distinguish churners from stayers across all thresholds.">
                    <span>ROC-AUC</span>
                    <HelpCircle className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center space-x-1" title="Average F1 across 5 independent cross-validation splits to verify stability">
                    <span>5-Fold CV (F1)</span>
                    <HelpCircle className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {trainingData.models.map((m) => {
                const isChampion = m.model_name === trainingData.best_model;
                return (
                  <tr
                    key={m.model_name}
                    className={`transition-colors ${
                      isChampion
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 font-medium'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-3.5">
                      <div className="flex items-center space-x-2">
                        {isChampion && (
                          <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {m.display_name}
                        </span>
                        {isChampion && (
                          <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-bold">
                            Champion
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono">{(m.accuracy * 100).toFixed(1)}%</td>
                    <td className="p-3.5 font-mono">{(m.precision * 100).toFixed(1)}%</td>
                    <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                      {(m.recall * 100).toFixed(1)}%
                    </td>
                    <td className="p-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {(m.f1_score * 100).toFixed(1)}%
                    </td>
                    <td className="p-3.5 font-mono text-purple-600 dark:text-purple-400 font-bold">
                      {(m.roc_auc * 100).toFixed(1)}%
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {(m.cv_f1_mean * 100).toFixed(1)}% ± {(m.cv_f1_std * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row: Metrics Bar Chart & ROC Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grouped Metrics Comparison Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Cross-Model Metric Benchmark
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Comparison of F1, ROC-AUC, Recall, and Accuracy across all 5 architectures
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricsChartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, '']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="F1-Score" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ROC-AUC" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Recall" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Accuracy" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-Model ROC Curves */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Receiver Operating Characteristic (ROC) Curves
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            True Positive Rate vs. False Positive Rate across classification thresholds
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  type="number"
                  dataKey="fpr"
                  domain={[0, 1]}
                  tick={{ fontSize: 11 }}
                  label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  domain={[0, 1]}
                  tick={{ fontSize: 11 }}
                  label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fontSize: 10 }}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [Number(val).toFixed(3), name]}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />
                <ReferenceLine
                  segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                />
                {trainingData.models.map(m => (
                  <Line
                    key={m.model_name}
                    data={m.roc_points}
                    type="monotone"
                    dataKey="tpr"
                    name={`${m.display_name} (${(m.roc_auc * 100).toFixed(0)}%)`}
                    stroke={MODEL_COLORS[m.model_name] || '#6366f1'}
                    strokeWidth={m.model_name === trainingData.best_model ? 2.5 : 1.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Confusion Matrix Widget */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Grid className="w-4 h-4 text-indigo-500" />
              <span>Confusion Matrix Inspector</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Detailed error breakdown on test set ({cmTotal} employees evaluated)
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500">Select Model:</span>
            <select
              value={selectedConfusionModel}
              onChange={(e) => setSelectedConfusionModel(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold"
            >
              {trainingData.models.map(m => (
                <option key={m.model_name} value={m.model_name}>
                  {m.display_name} {m.model_name === trainingData.best_model ? '★ Best' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* 2x2 Matrix */}
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto w-full">
            {/* True Negative */}
            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
                True Negatives (TN)
              </span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">
                {cm.true_negative}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Correctly predicted to STAY ({((cm.true_negative / cmTotal) * 100).toFixed(1)}%)
              </p>
            </div>

            {/* False Positive */}
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-1">
                False Positives (FP)
              </span>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-300">
                {cm.false_positive}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                False Alarm: Stayed, but flagged ({((cm.false_positive / cmTotal) * 100).toFixed(1)}%)
              </p>
            </div>

            {/* False Negative */}
            <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block mb-1">
                False Negatives (FN)
              </span>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-300">
                {cm.false_negative}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Missed Risk: Left without alert ({((cm.false_negative / cmTotal) * 100).toFixed(1)}%)
              </p>
            </div>

            {/* True Positive */}
            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block mb-1">
                True Positives (TP)
              </span>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                {cm.true_positive}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Successfully Caught Churners ({((cm.true_positive / cmTotal) * 100).toFixed(1)}%)
              </p>
            </div>
          </div>

          {/* Matrix Narrative */}
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <h5 className="font-bold text-slate-900 dark:text-white text-sm">
              Operational Takeaway for HR Leaders:
            </h5>
            <p>
              In corporate workforce planning, <strong>False Negatives (missing an employee who subsequently resigns)</strong> are substantially more damaging than False Positives. A false alert simply leads to a helpful, supportive stay-interview check-in.
            </p>
            <p>
              The selected champion model achieves a <strong>Recall of {(activeConfusionModel.recall * 100).toFixed(1)}%</strong>, capturing {cm.true_positive} out of {cm.true_positive + cm.false_negative} departures while maintaining high precision.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
