import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { setAuthUser } from '@/store/reducers/authSlice';
import { client } from '@/lib/apolloClient';
import { GET_CURRENT_USER } from '@/lib/authQueries';

export const useAuthInit = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const initAuth = async () => {
      // Check if we have a token in sessionStorage
      const token = sessionStorage.getItem('access_token');

      if (token) {
        try {
          // Fetch user data with the stored token
          const { data } = await client.query<{
            me: { id: string; email: string; name?: string; username?: string };
          }>({
            query: GET_CURRENT_USER,
            fetchPolicy: 'network-only', // Always fetch fresh data
          });

          if (data?.me) {
            dispatch(setAuthUser({ id: data.me.id, email: data.me.email }));
          }
        } catch (error) {
          // Token is invalid or expired, clear it
          console.error('Auth initialization failed:', error);
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
        }
      }
    };

    initAuth();
  }, [dispatch]);
};
