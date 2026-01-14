import * as React from 'react';
import {useNavigate} from 'react-router';
import useNotifications from '../hooks/useNotifications/useNotifications';
import {type FormFieldValue,} from './EmployeeForm';
import PageContainer from './PageContainer';
import UserForm, {UserFormState} from "./UserForm.tsx";

const INITIAL_FORM_VALUES: Partial<UserFormState['values']> = {
};

interface User {
    username: string
}

type ValidationResult = { issues: { message: string; path: (keyof User)[] }[] };

function validateUser(user: Partial<User>): ValidationResult {
    let issues: ValidationResult['issues'] = [];

    if (!user.username) {
        issues = [...issues, { message: 'Name is required', path: ['username'] }];
    } else if (user.username.length > 32) {
        issues = [...issues, { message: 'Name must be no longer than 32 characters', path: ['username'] }];
    }

    return { issues };
}

async function createUser(data: Omit<User, 'id'>) {
    const response = await fetch('http://localhost:8080/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: data.username
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
    }

    return await response.json();
}

export default function UserCreate() {
    const navigate = useNavigate();

    const notifications = useNotifications();

    const [formState, setFormState] = React.useState<UserFormState>(() => ({
        values: INITIAL_FORM_VALUES,
        errors: {},
    }));
    const formValues = formState.values;
    const formErrors = formState.errors;

    const setFormValues = React.useCallback(
        (newFormValues: Partial<UserFormState['values']>) => {
            setFormState((previousState) => ({
                ...previousState,
                values: newFormValues,
            }));
        },
        [],
    );

    const setFormErrors = React.useCallback(
        (newFormErrors: Partial<UserFormState['errors']>) => {
            setFormState((previousState) => ({
                ...previousState,
                errors: newFormErrors,
            }));
        },
        [],
    );

    const handleFormFieldChange = React.useCallback(
        (name: keyof UserFormState['values'], value: FormFieldValue) => {
            const validateField = async (values: Partial<UserFormState['values']>) => {
                const { issues } = validateUser(values);
                setFormErrors({
                    ...formErrors,
                    [name]: issues?.find((issue) => issue.path?.[0] === name)?.message,
                });
            };

            const newFormValues = { ...formValues, [name]: value } as Partial<UserFormState['values']>;

            setFormValues(newFormValues);
            validateField(newFormValues);
        },
        [formValues, formErrors, setFormErrors, setFormValues],
    );

    const handleFormReset = React.useCallback(() => {
        setFormValues(INITIAL_FORM_VALUES);
    }, [setFormValues]);

    const handleFormSubmit = React.useCallback(async () => {
        const { issues } = validateUser(formValues);
        if (issues && issues.length > 0) {
            setFormErrors(
                Object.fromEntries(issues.map((issue) => [issue.path?.[0], issue.message])),
            );
            return;
        }
        setFormErrors({});

        try {
            await createUser(formValues as Omit<User, 'id'>);
            notifications.show('User created successfully.', {
                severity: 'success',
                autoHideDuration: 3000,
            });

            navigate('/users');
        } catch (createError) {
            notifications.show(
                `Failed to create user. Reason: ${(createError as Error).message}`,
                {
                    severity: 'error',
                    autoHideDuration: 3000,
                },
            );
            throw createError;
        }
    }, [formValues, navigate, notifications, setFormErrors]);

    return (
        <PageContainer
            title="New User"
            breadcrumbs={[{ title: 'Users', path: '/users' }, { title: 'New' }]}
        >
            <UserForm
                formState={formState}
                onFieldChange={handleFormFieldChange}
                onSubmit={handleFormSubmit}
                onReset={handleFormReset}
                submitButtonLabel="Create"
            />
        </PageContainer>
    );
}
