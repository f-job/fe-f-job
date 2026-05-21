import api from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'USER';
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: 'ADMIN' | 'USER';
}

const userService = {
  getAll() {
    return api.get<{ data: User[] }>('/users');
  },

  getById(id: string) {
    return api.get<{ data: User }>(`/users/${id}`);
  },

  create(payload: CreateUserPayload) {
    return api.post<{ data: User }>('/users', payload);
  },

  update(id: string, payload: UpdateUserPayload) {
    return api.patch<{ data: User }>(`/users/${id}`, payload);
  },

  delete(id: string) {
    return api.delete(`/users/${id}`);
  },
};

export default userService;
