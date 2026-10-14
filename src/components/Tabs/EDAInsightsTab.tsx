import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  Lightbulb,
  TrendingUp,
  Briefcase,
  Clock,
  Compass,
  DollarSign,
  MapPin,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { EDAResponse } from '../../types';

interface EDAInsightsTabProps {
  eda: EDAResponse | null;
  loading: boolean;
}

const COLORS = ['#6366f1', '#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];
const PIE_COLORS = ['#ef4444', '#10b981'];

export const EDAInsightsTab: React.FC<EDAInsightsTabProps> = ({ eda, loading }) => {
  const [activeMetricTab, setActiveMetricTab] = useState<'rate' | 'total'>('rate');

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Synthesizing Exploratory Data Analysis & Correlations...
        </p>
      </div>
    );
  }

  if (!eda) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <p className="text-sm text-slate-500">
          No dataset loaded yet. Please visit the Data Overview tab to load data.
        </p>
      </div>
    );
  }

  // Attrition split data for Donut Chart
  const pieData = [
    { name: 'Voluntary Exits (Attrition)', value: Math.round(eda.overall_attrition_rate * 1000) },
    { name: 'Retained Staff', value: Math.round((1 - eda.overall_attrition_rate) * 1000) }
  ];

  const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Dynamic Key Findings Panel */}
      {eda.key_findings && eda.key_findings.length > 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-200/80 dark:border-indigo-800/60 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Automated Plain-English Statistical Findings</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {eda.key_findings.map((finding, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-900/50 text-xs text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm flex items-start space-x-2.5"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                <span>{finding}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 1: Donut Split & OverTime Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attrition Split Donut */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>Overall Attrition Distribution</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Baseline organizational churn vs retention
            </p>
          </div>

          <div className="h-64 flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${(Number(val) / 10).toFixed(1)}%`, 'Proportion']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs">
            <span className="text-slate-500">Churn Rate:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">
              {(eda.overall_attrition_rate * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Overtime Disparity Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-rose-500" />
                <span>Overtime Impact on Attrition Rate</span>
              </h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                Primary Risk Catalyst
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Employees with recurring overtime depart at 3x the baseline rate
            </p>
          </div>

          <div className="h-64 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eda.by_overtime} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatPercent} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Attrition Rate']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar
                  dataKey="attrition_rate"
                  name="Attrition Rate"
                  radius={[8, 8, 0, 0]}
                  fill="#ef4444"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            Overtime=Yes creates acute fatigue and work-life friction, directly accelerating voluntary departures.
          </div>
        </div>
      </div>

      {/* Row 2: Department & Job Role */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Attrition */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-indigo-500" />
            <span>Attrition by Department</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
            Sales typically experiences highest turnover due to quota pressure and market demand
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eda.by_department} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tickFormatter={formatPercent} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Attrition Rate']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="attrition_rate" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Job Role Attrition */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-blue-500" />
            <span>Attrition by Job Role</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
            Sales Representatives and Lab Techs exhibit higher exit rates than Directors
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eda.by_job_role} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="category" tick={{ fontSize: 9 }} interval={0} angle={-35} textAnchor="end" />
                <YAxis tickFormatter={formatPercent} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Attrition Rate']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="attrition_rate" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Income Bands & Commute Distance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Bands */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span>Attrition by Monthly Income Tier</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
            Higher compensation serves as a dominant retention anchor
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eda.by_income_band} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={formatPercent} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Attrition Rate']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="attrition_rate" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distance from Home */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-amber-500" />
            <span>Attrition by Commute Distance</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
            Commutes exceeding 15 miles double employee turnover risk
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eda.by_distance_band} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={formatPercent} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Attrition Rate']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="attrition_rate" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Promotion Stagnation & Marital Status / Travel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Promotion Stagnation */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span>Attrition by Years Since Last Promotion</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
            Lack of vertical mobility over 4+ years triggers active job hunting
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eda.by_years_since_promotion} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={formatPercent} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Attrition Rate']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="attrition_rate" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Business Travel */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Compass className="w-4 h-4 text-cyan-500" />
            <span>Attrition by Business Travel Frequency</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
            Frequent travelers show 25%+ churn compared to non-traveling peers
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eda.by_business_travel} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatPercent} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Attrition Rate']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="attrition_rate" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 5: Feature Correlations with Attrition */}
      {eda.correlations && eda.correlations.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Pearson Correlation with Employee Attrition</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Positive values indicate higher attrition hazard; negative values indicate retention stabilization
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {eda.correlations.map((item, idx) => {
              const isPositive = item.correlation > 0;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[170px]">
                      {item.feature}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {item.direction} • {item.strength}
                    </span>
                  </div>
                  <div
                    className={`font-mono text-xs font-bold px-2 py-1 rounded-lg ${
                      isPositive
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {isPositive ? `+${item.correlation.toFixed(3)}` : item.correlation.toFixed(3)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
