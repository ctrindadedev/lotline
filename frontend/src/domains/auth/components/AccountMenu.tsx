import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';
import { messages } from '../../../shared/i18n/messages';
import { useCurrentUser, useLogOut } from '../hooks/useAuth';

const text = messages.auth.menu;

export function AccountMenu() {
  const { user, isLoading } = useCurrentUser();
  const logOut = useLogOut();

  if (isLoading) {
    return null;
  }
  if (!user) {
    return (
      <Stack direction="row" spacing={1}>
        <Button component={RouterLink} to="/login" size="small">
          {text.logIn}
        </Button>
        <Button component={RouterLink} to="/register" size="small" variant="outlined">
          {text.register}
        </Button>
      </Stack>
    );
  }
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Typography variant="body2">{text.greeting(user.name)}</Typography>
      <Button size="small" onClick={() => logOut.mutate()} loading={logOut.isPending}>
        {text.logOut}
      </Button>
    </Stack>
  );
}
