'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { startNavigation, stopNavigation } from '@/store/reducers/loadingSlice';

export const useNavigationLoading = () => {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const isInitialMount = useRef(true);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // Skip loading on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousPathname.current = pathname;
      return;
    }

    // Only show loading if pathname actually changed
    if (previousPathname.current !== pathname) {
      // Start loading when pathname changes
      dispatch(startNavigation());

      // Stop loading after the route transition completes
      // Use a shorter timeout for fast navigation, but allow enough time for initial render
      const timeoutId = setTimeout(() => {
        dispatch(stopNavigation());
      }, 300); // Increased delay to allow cached data to render first

      previousPathname.current = pathname;

      return () => {
        clearTimeout(timeoutId);
        // Also stop navigation on cleanup
        dispatch(stopNavigation());
      };
    }
  }, [pathname, dispatch]);
};

