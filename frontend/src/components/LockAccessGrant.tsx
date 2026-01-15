import * as React from 'react';
import { useNavigate, useParams } from 'react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import useNotifications from '../hooks/useNotifications/useNotifications';
import PageContainer from './PageContainer';

interface UserOption {
    id: number;
    username: string;
}

interface GrantAccessRequest {
    user_id: number;
    lock_id: string;
}

async function fetchAllUsers(): Promise<UserOption[]> {
    const response = await fetch('http://localhost:8080/users');
    if (!response.ok) {
        throw new Error('Failed to load users');
    }
    const data = await response.json();
    return data.map((u: any) => ({ id: u.id, username: u.username }));
}

async function grantAccess(data: GrantAccessRequest) {
    const response = await fetch('http://localhost:8080/access/grant', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to grant access');
    }
}

export default function LockAccessGrant() {
    const navigate = useNavigate();
    const notifications = useNotifications();
    const { lockId } = useParams();

    const [users, setUsers] = React.useState<UserOption[]>([]);
    const [selectedUser, setSelectedUser] = React.useState<UserOption | null>(null);
    const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let active = true;

        (async () => {
            setIsLoadingUsers(true);
            try {
                const userList = await fetchAllUsers();
                if (active) {
                    setUsers(userList);
                }
            } catch (err) {
                if (active) {
                    notifications.show('Failed to load user list', { severity: 'error' });
                }
            } finally {
                if (active) {
                    setIsLoadingUsers(false);
                }
            }
        })();

        return () => { active = false; };
    }, [notifications]);

    const handleBack = () => {
        navigate(`/locks/${lockId}/access`);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!selectedUser || !lockId) {
            setError('Please select a user');
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            await grantAccess({
                user_id: selectedUser.id,
                lock_id: lockId,
            });

            notifications.show(`Access granted to ${selectedUser.username}`, {
                severity: 'success',
                autoHideDuration: 3000,
            });

            navigate(`/locks/${lockId}/access`);
        } catch (submitError) {
            notifications.show(
                `Failed to grant access: ${(submitError as Error).message}`,
                { severity: 'error', autoHideDuration: 4000 }
            );
            setIsSubmitting(false);
        }
    };

    return (
        <PageContainer
            title="Grant Access"
            breadcrumbs={[
                { title: 'Locks', path: '/locks' },
                { title: lockId || 'Lock', path: `/locks/${lockId}/access` },
                { title: 'Grant Access' }
            ]}
        >
            <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
                sx={{ width: '100%', maxWidth: 600 }}
            >
                <Stack spacing={3}>
                    <Autocomplete
                        id="user-select"
                        options={users}
                        loading={isLoadingUsers}
                        getOptionLabel={(option) => option.username}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        value={selectedUser}
                        onChange={(_, newValue: UserOption | null) => {
                            setSelectedUser(newValue);
                            if (newValue) setError(null);
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Select User"
                                required
                                error={!!error}
                                helperText={error}
                                slotProps={{
                                    input: {
                                        ...params.InputProps,
                                        endAdornment: (
                                            <React.Fragment>
                                                {isLoadingUsers ? 'Loading...' : null}
                                                {params.InputProps.endAdornment}
                                            </React.Fragment>
                                        ),
                                    },
                                }}
                            />
                        )}
                    />

                    <Stack direction="row" spacing={2} justifyContent="space-between">
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={handleBack}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={!selectedUser || isSubmitting}
                            loading={isSubmitting}
                        >
                            Grant Access
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </PageContainer>
    );
}