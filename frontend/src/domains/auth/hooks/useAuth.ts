import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, logIn, logOut, register } from '../services/auth.api';
import type { User } from '../types';

export const authKeys = { me: ['auth', 'me'] as const };

export function useCurrentUser() {
  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: ({ signal }) => getCurrentUser(signal),
    retry: false,
    staleTime: Infinity,
  });
  return { user: query.data ?? null, isLoading: query.isPending };
}

function useSessionChange() {
  const queryClient = useQueryClient();
  return async (user: User | null) => {
    queryClient.setQueryData(authKeys.me, user);
    await queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
  };
}

/** For a session lost elsewhere: the app shows the visitor's options again. */
export function useForgetUser() {
  const queryClient = useQueryClient();
  return async () => {
    queryClient.setQueryData(authKeys.me, null);
    // Asking "me" again also brings a new CSRF cookie, if a logout in another tab cleared it.
    await queryClient.invalidateQueries();
  };
}

export function useLogIn() {
  const onSessionChange = useSessionChange();
  return useMutation({ mutationFn: logIn, onSuccess: onSessionChange });
}

export function useRegister() {
  const onSessionChange = useSessionChange();
  return useMutation({ mutationFn: register, onSuccess: onSessionChange });
}

export function useLogOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logOut,
    // A logout also clears the CSRF cookie: refetching "me" gets a new one for the next login.
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me, null);
      return queryClient.invalidateQueries();
    },
  });
}
