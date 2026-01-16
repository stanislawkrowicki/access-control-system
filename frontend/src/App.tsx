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
import LockCreate from "./components/LockCreate.tsx";
import UserKeyList from "./components/UserKeyList.tsx";
import UserKeyCreate from "./components/UserKeyCreate.tsx";
import LockAccessList from "./components/LockAccessList.tsx";
import LockAccessGrant from "./components/LockAccessGrant.tsx";
import LogList from "./components/LogList.tsx";

const router = createHashRouter([
    {
        Component: DashboardLayout,
        children: [
            {
                path: '/locks',
                Component: LockList
            },
            {
                path: '/locks/new',
                Component: LockCreate
            },
            {
                path: '/locks/:lockId/access',
                Component: LockAccessList
            },
            {
                path: '/locks/:lockId/grant',
                Component: LockAccessGrant,
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
                path: '/users/:userId/keys',
                Component: UserKeyList
            },
            {
                path: '/users/:userId/keys/new',
                Component: UserKeyCreate
            },
            {
                path: '/logs',
                Component: LogList
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
