import axios from 'axios';
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
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 45000,
});

export const api = {
  async getHealth(): Promise<HealthStatus> {
    const res = await apiClient.get<HealthStatus>('/health');
    return res.data;
  },

  async loadSampleData(): Promise<DatasetSummary> {
    const res = await apiClient.post<DatasetSummary>('/sample-data');
    return res.data;
  },

  async uploadCsv(file: File, targetColumn?: string): Promise<DatasetSummary> {
    const formData = new FormData();
    formData.append('file', file);
    if (targetColumn) {
      formData.append('target_column', targetColumn);
    }
    const res = await apiClient.post<DatasetSummary>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  async getDatasetSummary(): Promise<DatasetSummary> {
    const res = await apiClient.get<DatasetSummary>('/dataset/summary');
    return res.data;
  },

  async getEDA(): Promise<EDAResponse> {
    const res = await apiClient.get<EDAResponse>('/eda');
    return res.data;
  },

  async trainModels(targetColumn?: string): Promise<TrainingResponse> {
    const params = targetColumn ? { target_column: targetColumn } : {};
    const res = await apiClient.post<TrainingResponse>('/train', null, { params });
    return res.data;
  },

  async getFeatureImportance(): Promise<FeatureImportanceResponse> {
    const res = await apiClient.get<FeatureImportanceResponse>('/feature-importance');
    return res.data;
  },

  async predictEmployee(
    employeeData: Record<string, any>,
    modelName?: string,
    thresholdLow: number = 0.30,
    thresholdHigh: number = 0.60
  ): Promise<PredictionResult> {
    const params: Record<string, any> = {
      threshold_low: thresholdLow,
      threshold_high: thresholdHigh
    };
    if (modelName) params.model_name = modelName;

    const res = await apiClient.post<PredictionResult>('/predict', employeeData, { params });
    return res.data;
  },

  async predictBatch(
    file: File,
    modelName?: string,
    thresholdLow: number = 0.30,
    thresholdHigh: number = 0.60
  ): Promise<BatchPredictionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (modelName) formData.append('model_name', modelName);
    formData.append('threshold_low', String(thresholdLow));
    formData.append('threshold_high', String(thresholdHigh));

    const res = await apiClient.post<BatchPredictionResponse>('/predict-batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  async getDashboard(): Promise<DashboardResponse> {
    const res = await apiClient.get<DashboardResponse>('/dashboard');
    return res.data;
  },

  async getAIAdvisor(payload: {
    employee_data: Record<string, any>;
    risk_level: string;
    probability: number;
    top_factors: string[];
  }): Promise<AdvisorResponse> {
    const res = await apiClient.post<AdvisorResponse>('/advisor', payload);
    return res.data;
  }
};
