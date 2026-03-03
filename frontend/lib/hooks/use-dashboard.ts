import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  kpis: () => [...dashboardKeys.all, "kpis"] as const,
  revenueTrend: (days?: number) => [...dashboardKeys.all, "revenue-trend", days] as const,
  utilization: () => [...dashboardKeys.all, "utilization"] as const,
};

export function useDashboardKPIs() {
  return useQuery({
    queryKey: dashboardKeys.kpis(),
    queryFn: api.getDashboardKPIs,
  });
}

export function useRevenueTrend(days?: number) {
  return useQuery({
    queryKey: dashboardKeys.revenueTrend(days),
    queryFn: () => api.getRevenueTrend(days),
  });
}

export function useUtilization() {
  return useQuery({
    queryKey: dashboardKeys.utilization(),
    queryFn: api.getUtilization,
  });
}
