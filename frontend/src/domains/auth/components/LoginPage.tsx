import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router';
import { FormTextField } from '../../../shared/components/FormTextField';
import { PasswordField } from '../../../shared/components/PasswordField';
import { messages } from '../../../shared/i18n/messages';
import { useLogIn } from '../hooks/useAuth';
import type { Credentials } from '../types';
import {
  describeLoginError,
  EMPTY_CREDENTIALS,
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
  const form = useForm<Credentials>({ defaultValues: EMPTY_CREDENTIALS });
  const [incomplete, setIncomplete] = useState(false);

  // Checked on submit only, and any failure reads the same: no hint of which field was wrong.
  const submit = form.handleSubmit((values) => {
    const invalid = Object.keys(validateCredentials(values)).length > 0;
    setIncomplete(invalid);
    if (invalid) {
      logIn.reset();
      return;
    }
    logIn.mutate(toCredentials(values), {
      onSuccess: () => navigate(redirect.from ?? '/', { replace: true }),
    });
  });

  return (
    <AuthCard
      title={text.logIn.title}
      notice={redirect.reason && text.logIn.reasons[redirect.reason]}
      error={incomplete ? text.errors.badCredentials : describeLoginError(logIn.error)}
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
        <PasswordField
          name="password"
          control={form.control}
          label={text.fields.password}
          showLabel={text.fields.showPassword}
          hideLabel={text.fields.hidePassword}
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
