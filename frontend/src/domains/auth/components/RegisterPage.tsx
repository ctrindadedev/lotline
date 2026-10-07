import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router';
import { FormTextField } from '../../../shared/components/FormTextField';
import { messages } from '../../../shared/i18n/messages';
import { useRegister } from '../hooks/useAuth';
import type { NewAccount } from '../types';
import {
  describeAuthError,
  EMPTY_ACCOUNT,
  resolverFor,
  toNewAccount,
  validateAccount,
} from '../utils/authForm';
import type { AuthRedirect } from '../utils/redirect';
import { AuthCard } from './AuthCard';

const text = messages.auth;

export function RegisterPage() {
  const navigate = useNavigate();
  const redirect = (useLocation().state ?? {}) as AuthRedirect;
  const register = useRegister();
  const form = useForm<NewAccount>({
    defaultValues: EMPTY_ACCOUNT,
    resolver: resolverFor(validateAccount),
  });

  const submit = form.handleSubmit((values) =>
    register.mutate(toNewAccount(values), {
      onSuccess: () => navigate(redirect.from ?? '/', { replace: true }),
      onError: (error) => {
        const { fieldErrors } = describeAuthError(error);
        for (const [field, message] of Object.entries(fieldErrors)) {
          form.setError(field as keyof NewAccount, { type: 'server', message });
        }
      },
    }),
  );

  return (
    <AuthCard
      title={text.register.title}
      notice={redirect.reason === 'listPlot' ? text.logIn.reasonListPlot : undefined}
      error={describeAuthError(register.error).message}
      footer={
        <>
          {text.register.hasAccount}{' '}
          <Link component={RouterLink} to="/login" state={redirect}>
            {text.menu.logIn}
          </Link>
        </>
      }
    >
      <Stack
        component="form"
        noValidate
        spacing={2}
        onSubmit={submit}
        aria-label={text.register.title}
      >
        <FormTextField
          name="name"
          control={form.control}
          label={text.fields.name}
          autoComplete="name"
          required
        />
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
          autoComplete="new-password"
          helperText={text.register.passwordHint}
          required
        />
        <Button type="submit" variant="contained" loading={register.isPending}>
          {text.register.submit}
        </Button>
      </Stack>
    </AuthCard>
  );
}
