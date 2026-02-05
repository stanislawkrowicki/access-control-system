import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import KeyIcon from '@mui/icons-material/Key';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import {
    DataGrid,
    GridActionsCellItem,
    GridColDef,
    GridFilterModel,
    GridPaginationModel,
    GridSortModel,
    GridEventListener,
    gridClasses,
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import PageContainer from './PageContainer';

const INITIAL_PAGE_SIZE = 10;

interface LogApiData {
    id: number,
    user: {
        id: number,
        username: string
    },
    lock: {
        id: string,
        name: string
    },
    had_access: boolean
    message: string
}

interface LogGridRow {
    id: number,
    user: {
        id: number,
        username: string
    },
    lock: {
        id: string,
        name: string
    },
    had_access: boolean
    message: string
}

interface PageResponse<T> {
    content: T[];
    total_elements: number;
    total_pages: number;
    size: number;
    number: number;
}

const fetchLogs = async (
    pagination: GridPaginationModel,
    sort: GridSortModel,
    filter: GridFilterModel
): Promise<{ rows: LogGridRow[]; rowCount: number }> => {
    const url = new URL('http://localhost:8080/logs');

    const lockFilter = filter.items.find((item) => item.field === 'lockId');
    if (lockFilter?.value) {
        url.searchParams.append('lockId', lockFilter.value);
    }

    const userFilter = filter.items.find((item) => item.field === 'username');
    if (userFilter?.value) {
        url.searchParams.append('username', userFilter.value);
    }

    url.searchParams.append('page', pagination.page.toString());
    url.searchParams.append('size', pagination.pageSize.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data: PageResponse<LogApiData> = await response.json();

    const rows = data.content.map((log) => ({
            id: log.id,
            user: {
                id: log.user?.id,
                username: log.user?.username
            },
            lock: {
                id: log.lock?.id,
                name: log.lock?.name
            },
            had_access: log.had_access,
            message: log.message
        }
    ));

    return {
        rows: rows,
        rowCount: data.total_elements,
    };
};

export default function LogList() {
    const { pathname } = useLocation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

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
        queryKey: ['logs', paginationModel, sortModel, filterModel],
        queryFn: () => fetchLogs(paginationModel, sortModel, filterModel),
        placeholderData: keepPreviousData,
    });

    const handlePaginationModelChange = React.useCallback(
        (model: GridPaginationModel) => {
            setPaginationModel(model);
            searchParams.set('page', String(model.page));
            searchParams.set('pageSize', String(model.pageSize));
            fetchLogs(paginationModel, sortModel, filterModel).then()
        },
        [searchParams],
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

    const columns = React.useMemo<GridColDef[]>(
        () => [
            {
                field: 'lockId',
                headerName: 'Lock ID',
                width: 200,
                valueGetter: (_, row) => row.lock?.id
            },
            {
                field: 'lockName',
                headerName: 'Lock name',
                width: 200,
                valueGetter: (_, row) => row.lock?.name
            },
            {
                field: 'username',
                headerName: 'User',
                width: 200,
                valueGetter: (_, row) => row.user?.username || 'Unknown'
            },
            {
                field: 'had_access',
                headerName: 'Accessed',
                width: 100,
                renderCell: (params) => {
                    if (params.value === null) return null

                    return (
                        <Box sx={{
                        color: params.value ? 'success.main' : 'error.main',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        height: '100%'
                    }}>
                        {params.value ? 'Yes' : 'No'}
                        </Box>
                    )
                }
            },
            { field: 'message', headerName: 'Message', width: 400}
        ],
        []
    );

    const pageTitle = 'Logs';

    return (
        <PageContainer
            title={pageTitle}
            actions={
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Tooltip title="Reload data" placement="right" enterDelay={1000}>
                        <div>
                            <IconButton size="small" aria-label="refresh" onClick={() => refetch()}>
                                <RefreshIcon />
                            </IconButton>
                        </div>
                    </Tooltip>
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