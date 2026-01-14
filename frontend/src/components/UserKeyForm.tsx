import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormGroup from '@mui/material/FormGroup';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router';

export interface UserKey {
    description: string;
    payload: string;
    userId: number;
}

export interface UserKeyFormState {
    values: Partial<UserKey>;
    errors: Partial<Record<keyof UserKeyFormState['values'], string>>;
}

export type FormFieldValue = string | string[] | number | boolean | File | null;

export interface UserKeyFormProps {
    formState: UserKeyFormState;
    onFieldChange: (
        name: keyof UserKeyFormState['values'],
        value: FormFieldValue,
    ) => void;
    onSubmit: (formValues: Partial<UserKeyFormState['values']>) => Promise<void>;
    onReset?: (formValues: Partial<UserKeyFormState['values']>) => void;
    submitButtonLabel: string;
    backButtonPath?: string;
}

export default function UserKeyForm(props: UserKeyFormProps) {
    const {
        formState,
        onFieldChange,
        onSubmit,
        onReset,
        submitButtonLabel,
        backButtonPath,
    } = props;

    const formValues = formState.values;
    const formErrors = formState.errors;

    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = React.useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            setIsSubmitting(true);
            try {
                await onSubmit(formValues);
            } finally {
                setIsSubmitting(false);
            }
        },
        [formValues, onSubmit],
    );

    const handleTextFieldChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onFieldChange(
                event.target.name as keyof UserKeyFormState['values'],
                event.target.value,
            );
        },
        [onFieldChange],
    );

    const handleReset = React.useCallback(() => {
        if (onReset) {
            onReset(formValues);
        }
    }, [formValues, onReset]);

    const handleBack = React.useCallback(() => {
        if (backButtonPath) {
            navigate(backButtonPath);
        } else {
            navigate('..', { relative: 'path' });
        }
    }, [navigate, backButtonPath]);

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            autoComplete="off"
            onReset={handleReset}
            sx={{ width: '100%' }}
        >
            <FormGroup>
                <Grid container spacing={2} sx={{ mb: 2, width: '100%' }}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            value={formValues.description ?? ''}
                            onChange={handleTextFieldChange}
                            name="description"
                            label="Description"
                            error={!!formErrors.description}
                            helperText={formErrors.description ?? ' '}
                            fullWidth
                            autoFocus
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            value={formValues.payload ?? ''}
                            onChange={handleTextFieldChange}
                            name="payload"
                            label="Payload (32 Hex Characters)"
                            error={!!formErrors.payload}
                            helperText={formErrors.payload ?? 'Example: 4A1B...'}
                            fullWidth
                            slotProps={{
                                htmlInput: {
                                    maxLength: 32,
                                    style: { fontFamily: 'monospace', textTransform: 'uppercase' }
                                }
                            }}
                        />
                    </Grid>
                </Grid>
            </FormGroup>
            <Stack direction="row" spacing={2} justifyContent="space-between">
                <Button
                    variant="contained"
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBack}
                >
                    Back
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    loading={isSubmitting}
                >
                    {submitButtonLabel}
                </Button>
            </Stack>
        </Box>
    );
}