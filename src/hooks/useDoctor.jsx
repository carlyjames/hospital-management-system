import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export const useDoctor = () => {
  const queryClient = useQueryClient();

  // Fetch all patients/users (for general use)
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/accounts/patients/');
      return response.data;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch all patients (dedicated query for dropdowns/selections)
  const { data: allPatients, isLoading: allPatientsLoading, error: allPatientsError } = useQuery({
    queryKey: ['allPatients'],
    queryFn: async () => {
      const response = await api.get('/accounts/patients/');
      return response.data;
    },
    retry: 2,
    staleTime: 2 * 60 * 1000, // Refresh more frequently for selections
  });

  // Fetch all appointments
  const { data: allAppointments, isLoading: allAppointmentsLoading, error: allAppointmentsError } = useQuery({
    queryKey: ['allAppointments'],
    queryFn: async () => {
      const response = await api.get('/appointments/doctor/');
      return response.data;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch admin metrics
  const { data: adminMetrics, isLoading: adminMetricsLoading, error: adminMetricsError } = useQuery({
    queryKey: ['adminMetrics'],
    queryFn: async () => {
      const response = await api.get('/metrics/doctor/');
      return response.data;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // ====== DELIVERIES API INTEGRATION ======

  // Fetch all doctor's deliveries
  const { data: deliveries, isLoading: deliveriesLoading, error: deliveriesError } = useQuery({
    queryKey: ['deliveries'],
    queryFn: async () => {
      const response = await api.get('/deliveries/doctor/');
      return response.data;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch patient's deliveries (optional - for specific patient view)
  const fetchPatientDeliveries = (patientId) => {
    return useQuery({
      queryKey: ['patientDeliveries', patientId],
      queryFn: async () => {
        const response = await api.get(`/deliveries/patient/?patient_id=${patientId}`);
        return response.data;
      },
      enabled: !!patientId,
      retry: 2,
      staleTime: 5 * 60 * 1000,
    });
  };

  // Create new delivery mutation
  const addDeliveryMutation = useMutation({
    mutationFn: async (deliveryData) => {
      // Clean payload - remove empty fields
      const payload = {};
      Object.keys(deliveryData).forEach(key => {
        if (deliveryData[key] !== '' && deliveryData[key] !== null && deliveryData[key] !== undefined) {
          payload[key] = deliveryData[key];
        }
      });

      const response = await api.post('/deliveries/create/', payload);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch deliveries after successful creation
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
    },
    onError: (error) => {
      console.error('Failed to create delivery:', error);
    }
  });

  // Update delivery mutation
  const updateDeliveryMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Clean payload
      const payload = {};
      Object.keys(data).forEach(key => {
        if (data[key] !== '' && data[key] !== null && data[key] !== undefined) {
          payload[key] = data[key];
        }
      });

      const response = await api.put(`/deliveries/${id}/update/`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
    },
    onError: (error) => {
      console.error('Failed to update delivery:', error);
    }
  });

  // ====== PATIENT MUTATIONS ======

  const addPatientMutation = useMutation({
    mutationFn: async (patientData) => {
      const payload = {};
      Object.keys(patientData).forEach(key => {
        if (patientData[key] !== '' && patientData[key] !== null && patientData[key] !== undefined) {
          payload[key] = patientData[key];
        }
      });

      if (payload.age) {
        payload.age = parseInt(payload.age);
      }

      const response = await api.post('/patients/create/', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/accounts/users/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/accounts/users/${id}/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    // Users/Patients data
    users: users || [],
    usersLoading,
    usersError,

    allPatients: allPatients || [],
    allPatientsLoading,
    allPatientsError,

    // Appointments
    allAppointments: allAppointments || [],
    allAppointmentsLoading,
    allAppointmentsError,

    // Admin metrics
    adminMetrics: adminMetrics || {},
    adminMetricsLoading,
    adminMetricsError,

    // ====== DELIVERIES ======
    deliveries: deliveries || [],
    deliveriesLoading,
    deliveriesError,

    // Add delivery
    addDelivery: (data) => addDeliveryMutation.mutateAsync(data),
    addDeliveryLoading: addDeliveryMutation.isPending,
    addDeliveryError: addDeliveryMutation.error,

    // Update delivery
    updateDelivery: (id, data) => updateDeliveryMutation.mutateAsync({ id, data }),
    updateDeliveryLoading: updateDeliveryMutation.isPending,
    updateDeliveryError: updateDeliveryMutation.error,

    // Fetch patient deliveries (for specific patient)
    fetchPatientDeliveries,

    // ====== PATIENTS ======
    // Add patient
    addPatient: (data) => addPatientMutation.mutateAsync(data),
    addPatientLoading: addPatientMutation.isPending,
    addPatientError: addPatientMutation.error,

    // Update patient
    updatePatient: (id, data) => updatePatientMutation.mutateAsync({ id, data }),
    updatePatientLoading: updatePatientMutation.isPending,

    // Delete patient
    deletePatient: (id) => deletePatientMutation.mutateAsync(id),
    deletePatientLoading: deletePatientMutation.isPending,
  };
};