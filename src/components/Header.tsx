import React from 'react';
import { Activity, HelpCircle, Moon, Sun, Server, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { HealthStatus } from '../types';

interface HeaderProps {
  health: HealthStatus | null;
  checkingHealth: boolean;
  onRefreshHealth: () => void;
  onOpenHowItWorks: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  checkingHealth,
  onRefreshHealth,
  onOpenHowItWorks,
  darkMode,
  onToggleDarkMode
}) => {
  const isConnected = health && health.status === 'ok';

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Attrition<span className="text-indigo-600 dark:text-indigo-400">IQ</span>
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                ML + HR Analytics
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Predict. Understand. Retain.
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {/* Backend Health Badge */}
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              isConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
            }`}
            title={isConnected ? `FastAPI backend connected (${health?.row_count || 0} rows cached)` : 'Backend is unreachable'}
          >
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              ></span>
            </span>
            <span className="hidden md:inline">
              {isConnected ? 'Backend: Connected (FastAPI + ML)' : 'Backend: Offline'}
            </span>
            <span className="md:hidden">
              {isConnected ? 'Live' : 'Offline'}
            </span>
            <button
              onClick={onRefreshHealth}
              disabled={checkingHealth}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ml-1"
              title="Ping backend"
            >
              <RefreshCw className={`w-3 h-3 ${checkingHealth ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* How It Works Button */}
          <button
            onClick={onOpenHowItWorks}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-indigo-500" />
            <span className="hidden sm:inline">How It Works</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
