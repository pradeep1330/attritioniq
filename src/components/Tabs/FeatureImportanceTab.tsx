import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Sliders, AlertTriangle, ShieldCheck, Info, HelpCircle } from 'lucide-react';
import { FeatureImportanceResponse } from '../../types';

interface FeatureImportanceTabProps {
  data: FeatureImportanceResponse | null;
  loading: boolean;
}

export const FeatureImportanceTab: React.FC<FeatureImportanceTabProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Computing Feature Weights & Directional Impacts...
        </p>
      </div>
    );
  }

  if (!data || !data.top_features || data.top_features.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <p className="text-sm text-slate-500">
          Feature importances require trained models. Please visit the Model Training tab to train the models.
        </p>
      </div>
    );
  }

  // Chart data sorted by importance
  const chartData = [...data.top_features]
    .slice(0, 10)
    .reverse()
    .map(f => ({
      name: f.display_name,
      importance: Number((f.rf_importance * 100).toFixed(1)),
      direction: f.direction
    }));

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-indigo-500" />
            <span>Top Factors Driving Employee Turnover</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Derived by synthesizing <strong>Random Forest Gini Impurity reduction</strong> (feature predictive power) with <strong>Logistic Regression regularized log-odds</strong> (directionality: whether the factor elevates or reduces departure risk).
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Increases Risk</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Protective Factor</span>
          </div>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Top 10 Most Influential Workplace Attributes
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Relative predictive influence (% importance score)
        </p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis type="number" unit="%" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                width={120}
              />
              <Tooltip
                formatter={(val: any) => [`${val}%`, 'Relative Importance']}
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Bar dataKey="importance" radius={[0, 6, 6, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.direction === 'Increases Risk' ? '#ef4444' : '#10b981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Factor Cards Grid with HR Plain-English Explanations */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Detailed Attribute Breakdowns & Action Implications (Top 15 Factors)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.top_features.map((item, idx) => {
            const isRisk = item.direction === 'Increases Risk';
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      #{idx + 1}. {item.display_name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        isRisk
                          ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                          : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      }`}
                    >
                      {item.direction}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.impact_explanation}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>RF Importance: {(item.rf_importance * 100).toFixed(1)}%</span>
                  <span>Coeff: {item.lr_coefficient > 0 ? `+${item.lr_coefficient}` : item.lr_coefficient}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
