import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type BookingsParams = {
  date?: string;
  court_id?: number;
  status?: string;
  limit?: number;
  offset?: number;
};

export const bookingsKeys = {
  all: ["bookings"] as const,
  list: (params?: BookingsParams) => [...bookingsKeys.all, params] as const,
};

export function useBookings(params?: BookingsParams) {
  return useQuery({
    queryKey: bookingsKeys.list(params),
    queryFn: () => api.getBookings(params),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingsKeys.all });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingsKeys.all });
    },
  });
}
