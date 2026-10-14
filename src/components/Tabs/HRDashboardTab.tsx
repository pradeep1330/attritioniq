import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  ShieldCheck,
  Building2,
  TrendingDown,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { DashboardResponse } from '../../types';

interface HRDashboardTabProps {
  dashboard: DashboardResponse | null;
  loading: boolean;
  onSelectEmployeeForAdvisor?: (emp: any) => void;
}

const RISK_COLORS = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#10b981'
};

export const HRDashboardTab: React.FC<HRDashboardTabProps> = ({
  dashboard,
  loading,
  onSelectEmployeeForAdvisor
}) => {
  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Compiling Organizational HR Executive Dashboard...
        </p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <p className="text-sm text-slate-500">
          Executive dashboard data unavailable. Please verify dataset is loaded.
        </p>
      </div>
    );
  }

  const pieData = [
    { name: 'High Risk (>60%)', value: dashboard.risk_distribution.HIGH, color: RISK_COLORS.HIGH },
    { name: 'Medium Risk (30-60%)', value: dashboard.risk_distribution.MEDIUM, color: RISK_COLORS.MEDIUM },
    { name: 'Low Risk (<30%)', value: dashboard.risk_distribution.LOW, color: RISK_COLORS.LOW }
  ];

  const deptChartData = dashboard.by_department.map(d => ({
    department: d.department,
    'High Risk Staff': d.high_risk_count,
    'Total Headcount': d.total_employees,
    rate: Number((d.high_risk_rate * 100).toFixed(1))
  }));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <LayoutDashboard className="w-5 h-5 text-indigo-500" />
            <span>Executive Retention Intelligence Dashboard</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Macro-level organizational risk posture and flight-risk intervention prioritization
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span>Evaluated Workforce:</span>
          <span className="font-bold text-slate-900 dark:text-white font-mono">
            {dashboard.total_employees.toLocaleString()} employees
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Company Exposure</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {dashboard.total_employees.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Active monitored personnel
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-500">
              Immediate High Risk
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {dashboard.risk_distribution.HIGH}
          </div>
          <p className="text-[11px] text-rose-500 font-medium mt-1">
            {dashboard.risk_percentages.HIGH}% priority intervention
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-500">
              Moderate Risk
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-500">
            {dashboard.risk_distribution.MEDIUM}
          </div>
          <p className="text-[11px] text-amber-500 font-medium mt-1">
            {dashboard.risk_percentages.MEDIUM}% require check-ins
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500">
              Stable Retained
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {dashboard.risk_distribution.LOW}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            {dashboard.risk_percentages.LOW}% low risk
          </p>
        </div>
      </div>

      {/* Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution Donut */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Workforce Flight-Risk Distribution
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Categorized into High, Medium, and Low flight-risk tiers
            </p>
          </div>

          <div className="h-64 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString()} staff`, 'Count']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 text-center">
            Weighted Average Attrition Probability: {(dashboard.avg_probability * 100).toFixed(1)}%
          </div>
        </div>

        {/* High Risk by Department Bar Chart */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span>High-Risk Concentration by Department</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Headcount volume and percentage of staff in high-risk bracket
            </p>
          </div>

          <div className="h-64 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 15, right: 15, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any, name: any) => [val, name]}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="High Risk Staff" fill="#ef4444" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Total Headcount" fill="#94a3b8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            Departments with &gt;25% high-risk density warrant cross-departmental HR review.
          </div>
        </div>
      </div>

      {/* Priority Flight-Risk Roster (Top 10 Employees) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Priority Flight-Risk Roster (Top 10 At-Risk Staff)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Immediate retention candidate roster ranked by estimated turnover probability
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Emp ID</th>
                <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Department</th>
                <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Role</th>
                <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Monthly Pay</th>
                <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Probability</th>
                <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Risk Tier</th>
                <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Primary Catalyst</th>
                <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Immediate Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {dashboard.top_risk_employees.map((emp, i) => (
                <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    {emp.employee_id}
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">{emp.department}</td>
                  <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{emp.job_role}</td>
                  <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                    ${emp.monthly_income.toLocaleString()}
                  </td>
                  <td className="p-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                    {(emp.probability * 100).toFixed(1)}%
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                      HIGH RISK
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{emp.top_risk_reason}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 max-w-sm truncate" title={emp.suggested_priority_action}>
                    {emp.suggested_priority_action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
