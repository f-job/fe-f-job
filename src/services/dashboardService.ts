import api from './api';

export interface DashboardStats {
  stats: {
    totalUsers: number;
    totalEmployers: number;
    totalJobs: number;
    activeJobs: number;
    pendingVerifications: number;
  };
  userGrowthData: Array<{
    name: string;
    users: number;
    employers: number;
  }>;
  jobsData: Array<{
    name: string;
    active: number;
    pending: number;
  }>;
  recentActivities: Array<{
    id: number;
    action: string;
    target: string;
    time: string;
    type: string;
  }>;
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get<DashboardStats>('/admin/dashboard/stats');
    return data;
  },
};
