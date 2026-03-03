import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const courtsKeys = {
  all: ["courts"] as const,
  list: (branchId?: number) => [...courtsKeys.all, branchId] as const,
};

export function useCourts(branchId?: number) {
  return useQuery({
    queryKey: courtsKeys.list(branchId),
    queryFn: () => api.getCourts(branchId),
  });
}

export function useCreateCourt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createCourt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courtsKeys.all });
    },
  });
}

export function useUpdateCourt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof api.updateCourt>[1] }) =>
      api.updateCourt(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courtsKeys.all });
    },
  });
}
