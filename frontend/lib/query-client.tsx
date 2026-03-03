"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState } from "react";

const defaultOptions = {
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
    },
  },
};

export function createQueryClient() {
  return new QueryClient(defaultOptions);
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
