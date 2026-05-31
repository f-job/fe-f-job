import api from './api';
import type { CreateReportPayload, ReportView } from '@/types/api';

/**
 * Reports API — Capability 4 (reporter surface).
 * Backend prefix `/reports`. Any authenticated user may file a report
 * (JwtAuthGuard + BlockedUserGuard; no role restriction).
 */
const reportService = {
  /** POST /reports — file a report against a JOB posting or another USER. */
  create(payload: CreateReportPayload) {
    return api.post<ReportView>('/reports', payload);
  },
};

export default reportService;
