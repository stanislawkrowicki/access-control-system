import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import {
    DataGrid,
    GridColDef,
    GridFilterModel,
    GridPaginationModel,
    GridSortModel,
    GridEventListener,
    gridClasses, GridActionsCellItem,
} from '@mui/x-data-grid';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import PageContainer from './PageContainer';
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import useNotifications from "../hooks/useNotifications/useNotifications.tsx";

const INITIAL_PAGE_SIZE = 10;

interface UserAccessApiData {
    user_id: number;
    username: string;
}

interface UserAccessGridRow {
    id: number; // Mapped from user_id
    username: string;
}

const fetchLockUsers = async (
    lockId: string,
    pagination: GridPaginationModel,
    sort: GridSortModel,
    filter: GridFilterModel
): Promise<{ rows: UserAccessGridRow[]; rowCount: number }> => {
    const url = new URL(`http://localhost:8080/access/lock/${lockId}`);

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data: UserAccessApiData[] = await response.json();

    const rows = data.map((user) => ({
        id: user.user_id,
        username: user.username,
    }));

    return {
        rows: rows,
        rowCount: rows.length,
    };
};

const postRevokeAccess = async (
    userId: number,
    lockId: string | undefined
) => {
    if (lockId === undefined) {
        console.error('Tried to revoke access but lockId is undefined!')
        return;
    }

    const url = new URL(`http://localhost:8080/access/revoke`)

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            lock_id: lockId
        })
    });

    if (!response.ok) {
        throw new Error(`Error revoking access: ${response.statusText}`);
    }
}

export default function LockAccessList() {
    const { pathname } = useLocation();
    const { lockId } = useParams();

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const notifications = useNotifications();

    React.useEffect(() => {
        if (!lockId) {
            navigate('/locks');
        }
    }, [lockId, navigate]);

    const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
        page: searchParams.get('page') ? Number(searchParams.get('page')) : 0,
        pageSize: searchParams.get('pageSize')
            ? Number(searchParams.get('pageSize'))
            : INITIAL_PAGE_SIZE,
    });

    const [filterModel, setFilterModel] = React.useState<GridFilterModel>(
        searchParams.get('filter') ? JSON.parse(searchParams.get('filter') ?? '') : { items: [] },
    );

    const [sortModel, setSortModel] = React.useState<GridSortModel>(
        searchParams.get('sort') ? JSON.parse(searchParams.get('sort') ?? '') : [],
    );

    const {
        data,
        isLoading,
        isError,
        error,
        refetch
    } = useQuery({
        queryKey: ['lock-access', lockId, paginationModel, sortModel, filterModel],
        queryFn: () => fetchLockUsers(lockId!, paginationModel, sortModel, filterModel),
        placeholderData: keepPreviousData,
        enabled: !!lockId,
    });

    const handlePaginationModelChange = React.useCallback(
        (model: GridPaginationModel) => {
            setPaginationModel(model);
            searchParams.set('page', String(model.page));
            searchParams.set('pageSize', String(model.pageSize));
            navigate(`${pathname}?${searchParams.toString()}`);
        },
        [navigate, pathname, searchParams],
    );

    const handleFilterModelChange = React.useCallback(
        (model: GridFilterModel) => {
            setFilterModel(model);
            if (model.items.length > 0) {
                searchParams.set('filter', JSON.stringify(model));
            } else {
                searchParams.delete('filter');
            }
            navigate(`${pathname}?${searchParams.toString()}`);
        },
        [navigate, pathname, searchParams],
    );

    const handleSortModelChange = React.useCallback(
        (model: GridSortModel) => {
            setSortModel(model);
            if (model.length > 0) {
                searchParams.set('sort', JSON.stringify(model));
            } else {
                searchParams.delete('sort');
            }
            navigate(`${pathname}?${searchParams.toString()}`);
        },
        [navigate, pathname, searchParams],
    );

    const handleRevokeAccess = React.useCallback(
        (row: UserAccessGridRow) => async () => {
            try {
                await postRevokeAccess(row.id, lockId)
                notifications.show("Access revoked", {
                    severity: 'success',
                    autoHideDuration: 3000,
                })
                await refetch()
            } catch (revokeError) {
                notifications.show(
                    `Failed to revoke access. Reason: ${(revokeError as Error).message}`,
                    {
                        severity: 'error',
                        autoHideDuration: 3000,
                    },
                );
                throw revokeError;
            }
        },
        [postRevokeAccess, notifications, refetch],
    );

    const handleGrantClick = React.useCallback(() => {
        navigate(`/locks/${lockId}/grant`);
    }, [navigate]);

    const columns = React.useMemo<GridColDef[]>(
        () => [
            { field: 'id', headerName: 'User ID', width: 100 },
            {
                field: 'username',
                headerName: 'Username',
                width: 300,
                renderCell: (params) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon color="action" fontSize="small" />
                        {params.value}
                    </Box>
                )
            },
            {
                field: 'actions',
                type: 'actions',
                flex: 1,
                align: 'right',
                sortable: false, // Important: disable sorting on button columns
                renderCell: ({ row }) => (
                    <IconButton
                        aria-label="revoke access"
                        onClick={handleRevokeAccess(row)}
                        size="small"
                        sx={{
                            '&': {
                                bgcolor: 'error.main',
                                color: 'white',
                            },
                            '&:hover': {
                                bgcolor: 'error.dark',
                            },
                        }}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                ),
            }
        ],
        [handleRevokeAccess]
    );

    const pageTitle = `Access for lock ${lockId}`;

    return (
        <PageContainer
            title={pageTitle}
            breadcrumbs={[
                { title: 'Locks', path: '/locks' },
                { title: lockId || 'Unknown', path: `/locks` },
                { title: 'Access List' }
            ]}
            actions={
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Tooltip title="Reload data" placement="right" enterDelay={1000}>
                        <div>
                            <IconButton size="small" aria-label="refresh" onClick={() => refetch()}>
                                <RefreshIcon />
                            </IconButton>
                        </div>
                    </Tooltip>
                    <Button
                        variant="contained"
                        onClick={handleGrantClick}
                        startIcon={<AddIcon />}
                    >
                        Grant access
                    </Button>
                </Stack>
            }
        >
            <Box sx={{ flex: 1, width: '100%' }}>
                {isError ? (
                    <Box sx={{ flexGrow: 1 }}>
                        <Alert severity="error">{error?.message || "An error occurred"}</Alert>
                    </Box>
                ) : (
                    <DataGrid
                        rows={data?.rows ?? []}
                        rowCount={data?.rowCount ?? 0}
                        loading={isLoading}

                        columns={columns}
                        pagination
                        sortingMode="server"
                        filterMode="server"
                        paginationMode="server"

                        paginationModel={paginationModel}
                        onPaginationModelChange={handlePaginationModelChange}

                        sortModel={sortModel}
                        onSortModelChange={handleSortModelChange}

                        filterModel={filterModel}
                        onFilterModelChange={handleFilterModelChange}

                        disableRowSelectionOnClick

                        initialState={{
                            pagination: { paginationModel: { pageSize: INITIAL_PAGE_SIZE } },
                        }}
                        showToolbar
                        pageSizeOptions={[5, INITIAL_PAGE_SIZE, 25]}
                        sx={{
                            [`& .${gridClasses.columnHeader}, & .${gridClasses.cell}`]: {
                                outline: 'transparent',
                            },
                            [`& .${gridClasses.columnHeader}:focus-within, & .${gridClasses.cell}:focus-within`]: {
                                outline: 'none',
                            },
                            [`& .${gridClasses.row}:hover`]: {
                                cursor: 'pointer',
                            },
                        }}
                        slotProps={{
                            loadingOverlay: {
                                variant: 'circular-progress',
                                noRowsVariant: 'circular-progress',
                            },
                            baseIconButton: {
                                size: 'small',
                            },
                        }}
                    />
                )}
            </Box>
        </PageContainer>
    );
}