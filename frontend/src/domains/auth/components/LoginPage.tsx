import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router';
import { FormTextField } from '../../../shared/components/FormTextField';
import { messages } from '../../../shared/i18n/messages';
import { useLogIn } from '../hooks/useAuth';
import type { Credentials } from '../types';
import {
  describeAuthError,
  EMPTY_CREDENTIALS,
  resolverFor,
  toCredentials,
  validateCredentials,
} from '../utils/authForm';
import type { AuthRedirect } from '../utils/redirect';
import { AuthCard } from './AuthCard';

const text = messages.auth;

export function LoginPage() {
  const navigate = useNavigate();
  const redirect = (useLocation().state ?? {}) as AuthRedirect;
  const logIn = useLogIn();
  const form = useForm<Credentials>({
    defaultValues: EMPTY_CREDENTIALS,
    resolver: resolverFor(validateCredentials),
  });

  const submit = form.handleSubmit((values) =>
    logIn.mutate(toCredentials(values), {
      onSuccess: () => navigate(redirect.from ?? '/', { replace: true }),
      onError: (error) => {
        const { fieldErrors } = describeAuthError(error);
        for (const [field, message] of Object.entries(fieldErrors)) {
          form.setError(field as keyof Credentials, { type: 'server', message });
        }
      },
    }),
  );

  return (
    <AuthCard
      title={text.logIn.title}
      notice={redirect.reason && text.logIn.reasons[redirect.reason]}
      error={describeAuthError(logIn.error).message}
      footer={
        <>
          {text.logIn.noAccount}{' '}
          <Link component={RouterLink} to="/register" state={redirect}>
            {text.menu.register}
          </Link>
        </>
      }
    >
      <Stack
        component="form"
        noValidate
        spacing={2}
        onSubmit={submit}
        aria-label={text.logIn.title}
      >
        <FormTextField
          name="email"
          control={form.control}
          label={text.fields.email}
          type="email"
          autoComplete="email"
          required
        />
        <FormTextField
          name="password"
          control={form.control}
          label={text.fields.password}
          type="password"
          autoComplete="current-password"
          required
        />
        <Button type="submit" variant="contained" loading={logIn.isPending}>
          {text.logIn.submit}
        </Button>
      </Stack>
    </AuthCard>
  );
}
