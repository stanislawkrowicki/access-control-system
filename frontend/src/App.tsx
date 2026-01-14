import CssBaseline from '@mui/material/CssBaseline'
import { createHashRouter, RouterProvider } from 'react-router'
import DashboardLayout from './components/DashboardLayout'
import NotificationsProvider from './hooks/useNotifications/NotificationsProvider'
import DialogsProvider from './hooks/useDialogs/DialogsProvider'
import AppTheme from './theme/AppTheme'
import {
    dataGridCustomizations,
    datePickersCustomizations,
    sidebarCustomizations,
    formInputCustomizations,
} from './theme/customizations'
import { queryClient } from './queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import LockList from "./components/LockList.tsx";
import UserList from "./components/UserList.tsx";
import UserCreate from "./components/UserCreate.tsx";

const router = createHashRouter([
    {
        Component: DashboardLayout,
        children: [
            {
                path: '/locks',
                Component: LockList
            },
            {
                path: '/users',
                Component: UserList,
            },
            {
                path: '/users/new',
                Component: UserCreate,
            },
            {
                path: '*',
                Component: LockList,
            },
        ],
    },
])

const themeComponents = {
    ...dataGridCustomizations,
    ...datePickersCustomizations,
    ...sidebarCustomizations,
    ...formInputCustomizations,
}

export default function App(props: { disableCustomTheme?: boolean }) {
    return (
        <QueryClientProvider client={queryClient}>
            <AppTheme {...props} themeComponents={themeComponents}>
                <CssBaseline enableColorScheme />
                <NotificationsProvider>
                    <DialogsProvider>
                        <RouterProvider router={router} />
                    </DialogsProvider>
                </NotificationsProvider>
            </AppTheme>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    )
}
