import * as React from 'react';
import {useNavigate} from 'react-router';
import useNotifications from '../hooks/useNotifications/useNotifications';
import {type FormFieldValue,} from './EmployeeForm';
import PageContainer from './PageContainer';
import LockForm, {LockFormState} from "./LockForm.tsx";

const INITIAL_FORM_VALUES: Partial<LockFormState['values']> = {
};

interface Lock {
    id: string;
    name: string;
}

type ValidationResult = { issues: { message: string; path: (keyof Lock)[] }[] };

function validateLock(lock: Partial<Lock>): ValidationResult {
    let issues: ValidationResult['issues'] = [];

    if (!lock.id) {
        issues = [...issues, { message: 'ID is required', path: ['id'] }];
    }

    if (!lock.name) {
        issues = [...issues, { message: 'Name is required', path: ['name'] }];
    } else if (lock.name.length > 32) {
        issues = [...issues, { message: 'Name must be no longer than 32 characters', path: ['name'] }];
    }

    return { issues };
}

async function createLock(data: Lock) {
    const response = await fetch('http://localhost:8080/locks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: data.id,
            name: data.name
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
    }

    return await response.json();
}

export default function LockCreate() {
    const navigate = useNavigate();

    const notifications = useNotifications();

    const [formState, setFormState] = React.useState<LockFormState>(() => ({
        values: INITIAL_FORM_VALUES,
        errors: {},
    }));
    const formValues = formState.values;
    const formErrors = formState.errors;

    const setFormValues = React.useCallback(
        (newFormValues: Partial<LockFormState['values']>) => {
            setFormState((previousState) => ({
                ...previousState,
                values: newFormValues,
            }));
        },
        [],
    );

    const setFormErrors = React.useCallback(
        (newFormErrors: Partial<LockFormState['errors']>) => {
            setFormState((previousState) => ({
                ...previousState,
                errors: newFormErrors,
            }));
        },
        [],
    );

    const handleFormFieldChange = React.useCallback(
        (name: keyof LockFormState['values'], value: FormFieldValue) => {
            const validateField = async (values: Partial<LockFormState['values']>) => {
                const { issues } = validateLock(values);
                setFormErrors({
                    ...formErrors,
                    [name]: issues?.find((issue) => issue.path?.[0] === name)?.message,
                });
            };

            const newFormValues = { ...formValues, [name]: value } as Partial<LockFormState['values']>;

            setFormValues(newFormValues);
            validateField(newFormValues);
        },
        [formValues, formErrors, setFormErrors, setFormValues],
    );

    const handleFormReset = React.useCallback(() => {
        setFormValues(INITIAL_FORM_VALUES);
    }, [setFormValues]);

    const handleFormSubmit = React.useCallback(async () => {
        const { issues } = validateLock(formValues);
        if (issues && issues.length > 0) {
            setFormErrors(
                Object.fromEntries(issues.map((issue) => [issue.path?.[0], issue.message])),
            );
            return;
        }
        setFormErrors({});

        try {
            await createLock(formValues as Lock);
            notifications.show('Lock created successfully.', {
                severity: 'success',
                autoHideDuration: 3000,
            });

            navigate('/locks');
        } catch (createError) {
            notifications.show(
                `Failed to create lock. Reason: ${(createError as Error).message}`,
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
            title="New Lock"
            breadcrumbs={[{ title: 'Locks', path: '/locks' }, { title: 'New' }]}
        >
            <LockForm
                formState={formState}
                onFieldChange={handleFormFieldChange}
                onSubmit={handleFormSubmit}
                onReset={handleFormReset}
                submitButtonLabel="Create"
            />
        </PageContainer>
    );
}