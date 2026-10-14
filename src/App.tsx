import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  BarChart2,
  Sliders,
  Cpu,
  UserCheck,
  LayoutDashboard,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Terminal,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { api } from './services/api';
import {
  HealthStatus,
  DatasetSummary,
  EDAResponse,
  TrainingResponse,
  FeatureImportanceResponse,
  PredictionResult,
  BatchPredictionResponse,
  DashboardResponse,
  AdvisorResponse
} from './types';

import { Header } from './components/Header';
import { HowItWorksModal } from './components/HowItWorksModal';
import { AIAdvisorModal } from './components/AIAdvisorModal';
import { DataOverviewTab } from './components/Tabs/DataOverviewTab';
import { EDAInsightsTab } from './components/Tabs/EDAInsightsTab';
import { FeatureImportanceTab } from './components/Tabs/FeatureImportanceTab';
import { ModelTrainingTab } from './components/Tabs/ModelTrainingTab';
import { PredictRiskTab } from './components/Tabs/PredictRiskTab';
import { HRDashboardTab } from './components/Tabs/HRDashboardTab';

export type TabId = 'overview' | 'eda' | 'features' | 'models' | 'predict' | 'dashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Health state
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [checkingHealth, setCheckingHealth] = useState<boolean>(false);

  // Data states
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [eda, setEda] = useState<EDAResponse | null>(null);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportanceResponse | null>(null);
  const [trainingData, setTrainingData] = useState<TrainingResponse | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);

  // Prediction states
  const [singleResult, setSingleResult] = useState<PredictionResult | null>(null);
  const [batchResult, setBatchResult] = useState<BatchPredictionResponse | null>(null);

  // Loading states
  const [loadingSample, setLoadingSample] = useState<boolean>(false);
  const [uploadingCsv, setUploadingCsv] = useState<boolean>(false);
  const [loadingEDA, setLoadingEDA] = useState<boolean>(false);
  const [loadingFeatures, setLoadingFeatures] = useState<boolean>(false);
  const [trainingModels, setTrainingModels] = useState<boolean>(false);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(false);
  const [predicting, setPredicting] = useState<boolean>(false);

  // Modals
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState<boolean>(false);
  const [advisorPlan, setAdvisorPlan] = useState<AdvisorResponse | null>(null);
  const [advisorLoading, setAdvisorLoading] = useState<boolean>(false);

  // Toast / error banner
  const [toastMessage, setToastMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'error' | 'success' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Check health and ping
  const checkHealth = useCallback(async () => {
    setCheckingHealth(true);
    try {
      const h = await api.getHealth();
      setHealth(h);
      return h;
    } catch (err) {
      setHealth({
        status: 'offline',
        message: 'Could not connect to FastAPI server',
        dataset_loaded: false,
        models_trained: false,
        row_count: 0
      });
      return null;
    } finally {
      setCheckingHealth(false);
    }
  }, []);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const s = await api.getDatasetSummary();
      setSummary(s);
      return s;
    } catch (err: any) {
      console.warn('Dataset summary fetch warning:', err.message);
      return null;
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initApp = async () => {
      const h = await checkHealth();
      if (h && h.status === 'ok') {
        const s = await fetchSummary();
        if (s) {
          // Pre-fetch EDA & Training if available
          try {
            const [edaData, featData, trainData, dashData] = await Promise.allSettled([
              api.getEDA(),
              api.getFeatureImportance(),
              api.trainModels(),
              api.getDashboard()
            ]);
            if (edaData.status === 'fulfilled') setEda(edaData.value);
            if (featData.status === 'fulfilled') setFeatureImportance(featData.value);
            if (trainData.status === 'fulfilled') setTrainingData(trainData.value);
            if (dashData.status === 'fulfilled') setDashboard(dashData.value);
          } catch (e) {
            console.warn('Pre-fetch non-fatal:', e);
          }
        }
      }
    };
    initApp();

    // Interval health check
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth, fetchSummary]);

  // Actions
  const handleLoadSample = async () => {
    setLoadingSample(true);
    try {
      const s = await api.loadSampleData();
      setSummary(s);
      showToast('1,470 realistic IBM HR records loaded successfully!', 'success');
      // Refresh subsequent stats
      const [edaRes, featRes, dashRes] = await Promise.all([
        api.getEDA(),
        api.getFeatureImportance(),
        api.getDashboard()
      ]);
      setEda(edaRes);
      setFeatureImportance(featRes);
      setDashboard(dashRes);
      checkHealth();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to load sample dataset.', 'error');
    } finally {
      setLoadingSample(false);
    }
  };

  const handleUploadCsv = async (file: File, targetCol?: string) => {
    setUploadingCsv(true);
    try {
      const s = await api.uploadCsv(file, targetCol);
      setSummary(s);
      showToast(`Uploaded ${s.total_rows.toLocaleString()} records! Target: ${s.target_column}`, 'success');
      // Retrain models on new data
      handleRetrain(s.target_column);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to upload CSV file.', 'error');
    } finally {
      setUploadingCsv(false);
    }
  };

  const handleRetrain = async (targetColumn?: string) => {
    setTrainingModels(true);
    try {
      const res = await api.trainModels(targetColumn);
      setTrainingData(res);
      showToast(`All 5 models benchmarked! Champion model: ${res.best_model}`, 'success');

      // Refresh features & dashboard
      const [featRes, dashRes, edaRes] = await Promise.all([
        api.getFeatureImportance(),
        api.getDashboard(),
        api.getEDA()
      ]);
      setFeatureImportance(featRes);
      setDashboard(dashRes);
      setEda(edaRes);
      checkHealth();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Training failed.', 'error');
    } finally {
      setTrainingModels(false);
    }
  };

  const handlePredictSingle = async (
    employeeData: Record<string, any>,
    model?: string,
    low?: number,
    high?: number
  ) => {
    setPredicting(true);
    try {
      const res = await api.predictEmployee(employeeData, model, low, high);
      setSingleResult(res);
      showToast(`Predicted flight risk: ${res.risk_level} (${res.probability_percentage}%)`, 'info');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Prediction failed.', 'error');
    } finally {
      setPredicting(false);
    }
  };

  const handlePredictBatch = async (
    file: File,
    model?: string,
    low?: number,
    high?: number
  ) => {
    setPredicting(true);
    try {
      const res = await api.predictBatch(file, model, low, high);
      setBatchResult(res);
      showToast(`Scored ${res.summary.total_evaluated} employees in cohort!`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Batch prediction failed.', 'error');
    } finally {
      setPredicting(false);
    }
  };

  const handleGenerateAIAdvisor = async () => {
    if (!singleResult) return;
    setAdvisorLoading(true);
    setIsAdvisorOpen(true);
    try {
      const plan = await api.getAIAdvisor({
        employee_data: {
          JobRole: singleResult.employee_id,
          probability: singleResult.probability,
          risk_level: singleResult.risk_level
        },
        risk_level: singleResult.risk_level,
        probability: singleResult.probability,
        top_factors: singleResult.top_factors.map(f => f.factor)
      });
      setAdvisorPlan(plan);
    } catch (err: any) {
      showToast('Advisor generation warning; rule-based plan prepared.', 'info');
    } finally {
      setAdvisorLoading(false);
    }
  };

  const isConnected = health && health.status === 'ok';
  const hasModels = health && health.models_trained;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Header */}
      <Header
        health={health}
        checkingHealth={checkingHealth}
        onRefreshHealth={checkHealth}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Offline Alert Banner */}
      {!isConnected && (
        <div className="bg-rose-600 text-white px-4 py-3 text-xs shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                <strong>FastAPI Backend Offline:</strong> The Python ML engine is not responding at{' '}
                <code>{import.meta.env.VITE_API_URL || 'same-origin'}</code>.
              </span>
            </div>
            <div className="flex items-center space-x-2 font-mono bg-rose-700/80 px-2 py-1 rounded-md">
              <Terminal className="w-3.5 h-3.5 text-rose-200" />
              <span>cd backend && uvicorn main:app --reload</span>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center space-x-2.5 border ${
              toastMessage.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : toastMessage.type === 'success' ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto py-2.5 no-scrollbar">
            {[
              { id: 'overview', label: '1. Data Overview', icon: Database, badge: summary ? `${summary.total_rows}` : null },
              { id: 'eda', label: '2. Attrition Insights', icon: BarChart2, badge: null },
              { id: 'features', label: '3. Factors Driving Attrition', icon: Sliders, badge: 'Top 15' },
              { id: 'models', label: '4. Model Training & Comparison', icon: Cpu, badge: '5 Models' },
              { id: 'predict', label: '5. Predict Risk', icon: UserCheck, badge: 'Sim & Batch' },
              { id: 'dashboard', label: '6. HR Dashboard', icon: LayoutDashboard, badge: 'Executive' }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        isActive
                          ? 'bg-indigo-500/80 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <DataOverviewTab
            summary={summary}
            loading={loadingSample}
            onLoadSample={handleLoadSample}
            onUploadCsv={handleUploadCsv}
            uploading={uploadingCsv}
          />
        )}

        {activeTab === 'eda' && (
          <EDAInsightsTab
            eda={eda}
            loading={loadingEDA}
          />
        )}

        {activeTab === 'features' && (
          <FeatureImportanceTab
            data={featureImportance}
            loading={loadingFeatures}
          />
        )}

        {activeTab === 'models' && (
          <ModelTrainingTab
            trainingData={trainingData}
            loading={trainingModels}
            onRetrain={() => handleRetrain()}
          />
        )}

        {activeTab === 'predict' && (
          <PredictRiskTab
            trainingData={trainingData}
            onPredictSingle={handlePredictSingle}
            onPredictBatch={handlePredictBatch}
            singleResult={singleResult}
            batchResult={batchResult}
            predicting={predicting}
            onOpenAdvisor={handleGenerateAIAdvisor}
            advisorLoading={advisorLoading}
          />
        )}

        {activeTab === 'dashboard' && (
          <HRDashboardTab
            dashboard={dashboard}
            loading={loadingDashboard}
          />
        )}
      </main>

      {/* Modals */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />

      <AIAdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        plan={advisorPlan}
        loading={advisorLoading}
      />
    </div>
  );
}
