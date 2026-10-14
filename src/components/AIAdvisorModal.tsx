import React, { useState } from 'react';
import { X, Sparkles, CheckSquare, Compass, MessageCircle, Copy, Check, ShieldAlert } from 'lucide-react';
import { AdvisorResponse } from '../types';

interface AIAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: AdvisorResponse | null;
  loading: boolean;
}

export const AIAdvisorModal: React.FC<AIAdvisorModalProps> = ({
  isOpen,
  onClose,
  plan,
  loading
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!plan) return;
    const text = `=== ATTRITIONIQ RETENTION ACTION PLAN ===
Profile: ${plan.employee_summary}

EXECUTIVE ASSESSMENT:
${plan.executive_summary}

IMMEDIATE INTERVENTIONS (NEXT 14 DAYS):
${plan.immediate_actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

LONG-TERM RETENTION STRATEGY:
${plan.long_term_strategy.map((s, i) => `- ${s}`).join('\n')}

MANAGER STAY-INTERVIEW TALKING POINTS:
${plan.manager_talking_points.map((t, i) => `* ${t}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  AI HR Retention Advisor
                </h2>
                {plan && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      plan.is_ai_generated
                        ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {plan.is_ai_generated ? 'Gemini 2.5/3.8 Flash' : 'Expert Rule Engine'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tailored executive retention strategy and manager talking points
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Consulting AI HR Advisor...
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Analyzing employee parameters, calculating retention leverage, and synthesizing actionable intervention steps.
              </p>
            </div>
          ) : plan ? (
            <div className="space-y-6">
              {/* Employee Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>Employee Context</span>
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {plan.employee_summary}
                </p>
                {plan.executive_summary && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {plan.executive_summary}
                  </p>
                )}
              </div>

              {/* Immediate Actions */}
              <div>
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3">
                  <CheckSquare className="w-4 h-4" />
                  <span>Immediate Interventions (Next 14 Days)</span>
                </div>
                <div className="space-y-2.5">
                  {plan.immediate_actions.map((act, i) => (
                    <div
                      key={i}
                      className="flex items-start space-x-3 p-3 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/30 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Long-term Strategy */}
              <div>
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
                  <Compass className="w-4 h-4" />
                  <span>Strategic Retention Roadmap</span>
                </div>
                <div className="space-y-2">
                  {plan.long_term_strategy.map((strat, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/30 text-xs text-slate-800 dark:text-slate-200 leading-relaxed"
                    >
                      • {strat}
                    </div>
                  ))}
                </div>
              </div>

              {/* Manager Talking Points */}
              <div>
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
                  <MessageCircle className="w-4 h-4" />
                  <span>Manager Stay-Interview Talking Points</span>
                </div>
                <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                  {plan.manager_talking_points.map((tp, i) => (
                    <div key={i} className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                      "{tp.replace(/^["']|["']$/g, '')}"
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">
              No plan generated yet.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handleCopy}
            disabled={!plan || loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Plan</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
