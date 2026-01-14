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
import {useLocation, useNavigate, useParams, useSearchParams} from 'react-router';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import PageContainer from './PageContainer';

const INITIAL_PAGE_SIZE = 10;

interface KeyApiData {
    id: number
    description: string
    payload: string
}

interface KeyGridRow {
    id: number
    description: string
    payload: string
}

const fetchKeys = async (
    ownerId: number,
    pagination: GridPaginationModel,
    sort: GridSortModel,
    filter: GridFilterModel
): Promise<{ rows: KeyGridRow[]; rowCount: number }> => {
    const url = new URL(`http://localhost:8080/keys?ownerId=${ownerId}`);

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data: KeyApiData[] = await response.json();

    const rows = data.map((key) => ({
        id: key.id,
        description: key.description,
        payload: key.payload
    }));

    return {
        rows: rows,
        rowCount: rows.length,
    };
};

export default function UserKeyList() {
    const { pathname } = useLocation();
    const { userId } = useParams()

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const numericId = Number(userId)

    if (isNaN(numericId))
        navigate("/users")

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
        queryKey: ['locks', paginationModel, sortModel, filterModel],
        queryFn: () => fetchKeys(numericId, paginationModel, sortModel, filterModel),
        placeholderData: keepPreviousData,
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

    const handleRowClick = React.useCallback<GridEventListener<'rowClick'>>(
        ({ row }) => navigate(`/users/${userId}/keys/${row.id}/edit`),
        [navigate],
    );

    const handleCreateClick = React.useCallback(() => {
        navigate(`/users/${userId}/keys/new`);
    }, [navigate]);

    const handleRowEdit = React.useCallback(
        (row: KeyGridRow) => () => {
            navigate(`/users/${userId}/keys/${row.id}/edit`);
        },
        [navigate],
    );

    const columns = React.useMemo<GridColDef[]>(
        () => [
            { field: 'description', headerName: 'Description', width: 300 },
            { field: 'payload', headerName: 'Payload', width: 200 }
        ],
        [handleRowEdit]
    );

    const pageTitle = `${userId}'s keys`

    return (
        <PageContainer
            title={pageTitle}
            breadcrumbs={[{ title: pageTitle }]}
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
                        onClick={handleCreateClick}
                        startIcon={<AddIcon />}
                    >
                        Create
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
                        onRowClick={handleRowClick}

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