import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/authStore';
import { ME_QUERY } from '@/api/queries';
import type { User } from '@/types';

/**
 * Hook to fetch and sync the current user data
 * Fetches user data if authenticated but user is not in store
 */
export const useAuthUser = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, accessToken } = useAppSelector(
    (state) => state.auth,
  );

  const { data, loading, error } = useQuery(ME_QUERY, {
    skip: !isAuthenticated || !!user || !accessToken,
    fetchPolicy: 'network-only', // Always fetch fresh data, don't use cache
    errorPolicy: 'ignore',
  });

  useEffect(() => {
    if (data?.me && !user) {
      dispatch(setUser(data.me as User));
    }
  }, [data, user, dispatch]);

  return { user, loading, error };
};
