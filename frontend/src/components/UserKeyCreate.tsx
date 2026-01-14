import * as React from 'react';
import { useNavigate, useParams } from 'react-router';
import useNotifications from '../hooks/useNotifications/useNotifications';
import { type FormFieldValue } from './EmployeeForm';
import PageContainer from './PageContainer';
import UserKeyForm, { UserKeyFormState, UserKey } from './UserKeyForm';

const INITIAL_FORM_VALUES: Partial<UserKeyFormState['values']> = {
    description: '',
    payload: ''
};

type ValidationResult = { issues: { message: string; path: (keyof UserKey)[] }[] };

function validateKey(key: Partial<UserKey>): ValidationResult {
    let issues: ValidationResult['issues'] = [];

    if (!key.description) {
        issues = [...issues, { message: 'Description is required', path: ['description'] }];
    }

    const hexRegex = /^[0-9A-Fa-f]+$/;

    if (!key.payload) {
        issues = [...issues, { message: 'Payload is required', path: ['payload'] }];
    } else {
        if (key.payload.length !== 32) {
            issues = [...issues, { message: 'Payload must be exactly 32 characters', path: ['payload'] }];
        }
        if (!hexRegex.test(key.payload)) {
            issues = [...issues, { message: 'Payload must be valid Hex (0-9, A-F)', path: ['payload'] }];
        }
    }

    return { issues };
}

async function createKey(data: UserKey) {
    const response = await fetch('http://localhost:8080/keys', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: data.userId,
            description: data.description,
            payload: data.payload
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
    }

    return await response.json();
}

export default function UserKeyCreate() {
    const navigate = useNavigate();
    const notifications = useNotifications();
    const { userId } = useParams();

    const numericUserId = Number(userId);

    React.useEffect(() => {
        if (isNaN(numericUserId)) {
            notifications.show('Invalid User ID', { severity: 'error' });
            navigate('/users');
        }
    }, [numericUserId, navigate, notifications]);

    const [formState, setFormState] = React.useState<UserKeyFormState>(() => ({
        values: { ...INITIAL_FORM_VALUES, userId: numericUserId },
        errors: {},
    }));

    const formValues = formState.values;
    const formErrors = formState.errors;

    const setFormValues = React.useCallback(
        (newFormValues: Partial<UserKeyFormState['values']>) => {
            setFormState((previousState) => ({
                ...previousState,
                values: newFormValues,
            }));
        },
        [],
    );

    const setFormErrors = React.useCallback(
        (newFormErrors: Partial<UserKeyFormState['errors']>) => {
            setFormState((previousState) => ({
                ...previousState,
                errors: newFormErrors,
            }));
        },
        [],
    );

    const handleFormFieldChange = React.useCallback(
        (name: keyof UserKeyFormState['values'], value: FormFieldValue) => {
            const validateField = async (values: Partial<UserKeyFormState['values']>) => {
                const { issues } = validateKey(values);
                setFormErrors({
                    ...formErrors,
                    [name]: issues?.find((issue) => issue.path?.[0] === name)?.message,
                });
            };

            const newFormValues = { ...formValues, [name]: value } as Partial<UserKeyFormState['values']>;

            setFormValues(newFormValues);
            validateField(newFormValues);
        },
        [formValues, formErrors, setFormErrors, setFormValues],
    );

    const handleFormReset = React.useCallback(() => {
        setFormValues({ ...INITIAL_FORM_VALUES, userId: numericUserId });
    }, [setFormValues, numericUserId]);

    const handleFormSubmit = React.useCallback(async () => {
        const dataToSubmit = { ...formValues, userId: numericUserId };

        const { issues } = validateKey(dataToSubmit);
        if (issues && issues.length > 0) {
            setFormErrors(
                Object.fromEntries(issues.map((issue) => [issue.path?.[0], issue.message])),
            );
            return;
        }
        setFormErrors({});

        try {
            await createKey(dataToSubmit as UserKey);
            notifications.show('Key created successfully.', {
                severity: 'success',
                autoHideDuration: 3000,
            });

            navigate(`/users/${numericUserId}/keys`);
        } catch (createError) {
            notifications.show(
                `Failed to create key. Reason: ${(createError as Error).message}`,
                {
                    severity: 'error',
                    autoHideDuration: 3000,
                },
            );
            throw createError;
        }
    }, [formValues, numericUserId, navigate, notifications, setFormErrors]);

    return (
        <PageContainer
            title="New Key"
            breadcrumbs={[
                { title: 'Users', path: '/users' },
                { title: `User ${numericUserId}`, path: `/users/${numericUserId}/keys` },
                { title: 'New Key' }
            ]}
        >
            <UserKeyForm
                formState={formState}
                onFieldChange={handleFormFieldChange}
                onSubmit={handleFormSubmit}
                onReset={handleFormReset}
                submitButtonLabel="Create"
                backButtonPath={`/users/${numericUserId}/keys`}
            />
        </PageContainer>
    );
}