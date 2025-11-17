import api from '@/lib/axios';

export const authApi = {
  login: async (credentials) => {
    const { data } = await api.post(
      `/auth/login`,
      credentials
    );
    return data;
  },

  logout: async () => {
    localStorage.removeItem('token');
  },

  getCurrentUser: async () => {
    const { data } = await api.get('/profile');
    return data;
  },
};