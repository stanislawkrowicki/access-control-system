import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 0
            // cacheTime: 1000 * 60 * 10,
        },
    },
})
