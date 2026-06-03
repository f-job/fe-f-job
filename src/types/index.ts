export interface Category {
  id: string;
  name: string;
  icon: string;
  jobCount: number;
  type: 'event' | 'role';
}

export interface Job {
  id: string;
  title: string;
  company: string;
  logo: string;
  verified: boolean;
  salary: string;
  location: string;
  date: string;
  slots: number;
  eventType: string;
  shift: 'Sáng' | 'Chiều' | 'Tối' | 'Cả ngày';
  tags: ('urgent' | 'hot' | 'new')[];
  deadline: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  fullName?: string;
  avatarUrl?: string | null;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errorCode?: string;
}
