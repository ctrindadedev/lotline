import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Component, type ReactNode } from 'react';
import { messages } from '../shared/i18n/messages';

const text = messages.crash;

interface ErrorBoundaryProps {
  children: ReactNode;
  onReload?: () => void;
}

/** Shows a message instead of a blank page when rendering throws. React has no hook for this. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) {
      return this.props.children;
    }
    const reload = this.props.onReload ?? (() => window.location.reload());
    return (
      <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={reload}>
              {text.reload}
            </Button>
          }
        >
          <AlertTitle>{text.title}</AlertTitle>
          {text.body}
        </Alert>
      </Box>
    );
  }
}
