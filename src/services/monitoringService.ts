import api from './api';

export interface HealthStatus {
  status: string;
  timestamp?: string;
  uptime?: number;
  memoryUsage?: Record<string, number>;
}

export interface AlertPayload {
  alerts: Array<Record<string, unknown>>;
}

const monitoringService = {
  getMetrics() {
    return api.get<string>('/monitoring/metrics', { responseType: 'text' });
  },

  getHealth() {
    return api.get<HealthStatus>('/monitoring/health');
  },

  getReadiness() {
    return api.get<HealthStatus>('/monitoring/readiness');
  },

  getLiveness() {
    return api.get<HealthStatus>('/monitoring/liveness');
  },

  sendAlert(payload: AlertPayload) {
    return api.post('/monitoring/alerts', payload);
  },

  simulateError() {
    return api.get('/monitoring/simulate-error');
  },

  triggerGc() {
    return api.get('/monitoring/trigger-gc');
  },

  simulateMemoryLeak() {
    return api.get('/monitoring/simulate-memory-leak');
  },
};

export default monitoringService;
