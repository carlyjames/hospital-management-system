import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export const usePatient = () => {
  const queryClient = useQueryClient();

  // Fetch patient's deliveries
  const { data: patientDeliveries, isLoading: patientDeliveriesLoading, error: patientDeliveriesError } = useQuery({
    queryKey: ['patientDeliveries'],
    queryFn: async () => {
      const response = await api.get('/deliveries/patient/');
      return response.data;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch patient's appointments
  const { data: patientAppointments, isLoading: patientAppointmentsLoading, error: patientAppointmentsError } = useQuery({
    queryKey: ['patientAppointments'],
    queryFn: async () => {
      const response = await api.get('/appointments/patient/');
      return response.data;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch patient metrics
  const { data: patientMetrics, isLoading: patientMetricsLoading, error: patientMetricsError } = useQuery({
    queryKey: ['patientMetrics'],
    queryFn: async () => {
      const response = await api.get('/metrics/patient/');
      return response.data;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  return {
    // Deliveries
    patientDeliveries: patientDeliveries || [],
    patientDeliveriesLoading,
    patientDeliveriesError,

    // Appointments
    patientAppointments: patientAppointments || [],
    patientAppointmentsLoading,
    patientAppointmentsError,

    // Metrics
    patientMetrics: patientMetrics || {},
    patientMetricsLoading,
    patientMetricsError,
  };
};