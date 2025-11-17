// hooks/useAuth.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: storeUser, setAuth, clearAuth } = useAuthStore();
  const [user, setUser] = useState(null);

  // Get user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log('Parsed user from localStorage:', parsedUser);
        // Sync with store if needed
        if (!storeUser) {
          const token = localStorage.getItem('token');
          setAuth(parsedUser, token);
        }
      } catch (error) {
        console.error('Error parsing user:', error);
      }
    }
  }, [storeUser, setAuth]);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Just clear local data, no API call needed
      return Promise.resolve();
    },
    onSuccess: () => {
      clearAuth();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      queryClient.clear();
      setUser(null);
      router.push('/login');
    },
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: !!user,
    retry: false,
  });

  return {
    user: currentUser || user || storeUser,
    login: (credentials) => loginMutation.mutate(credentials),
    logout: () => logoutMutation.mutate(),
    isLoading: loginMutation.isPending,
    isError: loginMutation.isError,
    error: loginMutation.error,
    message: loginMutation.data?.message,
  };
};