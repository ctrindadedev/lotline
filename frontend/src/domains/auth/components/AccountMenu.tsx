import Logout from '@mui/icons-material/Logout';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import { messages } from '../../../shared/i18n/messages';
import { useCurrentUser, useLogOut } from '../hooks/useAuth';
import { initialsOf } from '../utils/initials';

const text = messages.auth.menu;

export function AccountMenu() {
  const { user, isLoading } = useCurrentUser();
  const logOut = useLogOut();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

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

  const close = () => setAnchor(null);
  const goTo = (panel: string) => {
    close();
    navigate(`/?panel=${panel}`);
  };

  return (
    <>
      <IconButton
        aria-label={text.open}
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        onClick={(event) => setAnchor(event.currentTarget)}
        size="small"
      >
        <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: 'primary.main' }}>
          {initialsOf(user.name)}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={anchor !== null}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Stack sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2">{text.greeting(user.name)}</Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Stack>
        <Divider />
        <MenuItem onClick={() => goTo('mine')}>{text.myListings}</MenuItem>
        <MenuItem onClick={() => goTo('reserved')}>{text.myReservations}</MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            close();
            logOut.mutate();
          }}
        >
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          {text.logOut}
        </MenuItem>
      </Menu>
    </>
  );
}
