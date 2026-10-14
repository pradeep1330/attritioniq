import React, { useState } from 'react';
import {
  Users,
  Target,
  UserX,
  UserCheck,
  CheckCircle,
  UploadCloud,
  Database,
  FileSpreadsheet,
  AlertCircle,
  Search,
  Filter,
  Check
} from 'lucide-react';
import { DatasetSummary } from '../../types';

interface DataOverviewTabProps {
  summary: DatasetSummary | null;
  loading: boolean;
  onLoadSample: () => void;
  onUploadCsv: (file: File, targetCol?: string) => void;
  uploading: boolean;
}

export const DataOverviewTab: React.FC<DataOverviewTabProps> = ({
  summary,
  loading,
  onLoadSample,
  onUploadCsv,
  uploading
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string>('Attrition');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        onUploadCsv(file, selectedTarget);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadCsv(e.target.files[0], selectedTarget);
    }
  };

  const numFeatures = summary?.features.filter(f => f.type === 'numeric').length || 0;
  const catFeatures = summary?.features.filter(f => f.type === 'categorical').length || 0;

  // Filter preview columns based on search
  const filteredColumns = summary?.features
    .map(f => f.name)
    .filter(col => col.toLowerCase().includes(searchTerm.toLowerCase())) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Load Sample Dataset Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-200/80 dark:border-indigo-800/60 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md shadow-indigo-600/20">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              IBM HR Analytics Dataset
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Generate 1,470 realistic employee records with canonical schemas, verified attrition distributions (16.2%), and operational correlations.
            </p>
          </div>
          <button
            onClick={onLoadSample}
            disabled={loading || uploading}
            className="mt-4 w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>{loading ? 'Generating Synthetic HR Cohort...' : 'Load Sample Dataset'}</span>
          </button>
        </div>

        {/* Upload Custom CSV Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`lg:col-span-2 p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Upload Custom Employee CSV
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            Drag and drop your company's attrition CSV or click to browse. Target column ("Attrition", Yes/No) will be automatically detected.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <label className="cursor-pointer px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold shadow-sm transition-all">
              <span>Browse CSV File</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                disabled={uploading}
                className="hidden"
              />
            </label>

            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span>Target Column:</span>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="Attrition">Attrition (Default)</option>
                <option value="Left">Left</option>
                <option value="Turnover">Turnover</option>
                <option value="Status">Status</option>
              </select>
            </div>
          </div>
          {uploading && (
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-2 animate-pulse">
              Parsing CSV and validating schema...
            </p>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Records</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary.total_rows.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {summary.total_columns} columns total
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Target Column</span>
              <Target className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white truncate">
              {summary.target_column}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              Binary Classification
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Attrition Rate</span>
              <UserX className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {(summary.attrition_rate * 100).toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {summary.attrition_count.toLocaleString()} employees left
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Retention Rate</span>
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {(summary.retention_rate * 100).toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {summary.retention_count.toLocaleString()} employees retained
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Numeric Features</span>
              <span className="text-xs font-mono text-indigo-500 font-bold">#</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {numFeatures}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Scaled via StandardScaler
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Categorical</span>
              <span className="text-xs font-mono text-purple-500 font-bold">Aa</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {catFeatures}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              OneHotEncoded
            </div>
          </div>
        </div>
      )}

      {/* Preprocessing Pipeline Checklist */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Automated Preprocessing & Data Engineering Pipeline</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200 mb-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>1. Constant/ID Filter</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Drops zero-variance columns: EmployeeCount, EmployeeNumber, Over18, StandardHours.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200 mb-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>2. Imputation Engine</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Median replacement for skewed numerics; mode imputation for categorical attributes.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200 mb-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>3. ColumnTransformer</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              OneHotEncoder (ignore unknowns) + StandardScaler for standardized distance metrics.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200 mb-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>4. Stratified Split</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              80/20 train/test split maintaining identical 16.2% attrition ratio across both partitions.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200 mb-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>5. Imbalance Balancing</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              class_weight='balanced' in classifiers to counter majority-class retention bias.
            </p>
          </div>
        </div>
      </div>

      {/* Dataset Preview Table */}
      {summary && summary.preview.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
                <span>Raw Dataset Inspection (Sample 10 Rows)</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Displaying first 10 observations with active features and labels
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter column names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl max-h-96">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">
                    Target: {summary.target_column}
                  </th>
                  {filteredColumns.map((col) => (
                    <th key={col} className="p-3 font-semibold text-slate-600 dark:text-slate-300">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {summary.preview.map((row, idx) => {
                  const targetVal = String(row[summary.target_column] || 'No');
                  const isAttr = targetVal.toLowerCase() === 'yes' || targetVal === '1';
                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isAttr
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          }`}
                        >
                          {targetVal}
                        </span>
                      </td>
                      {filteredColumns.map((col) => (
                        <td key={col} className="p-3 text-slate-700 dark:text-slate-300">
                          {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
