'use client';
import { useEffect, useState } from 'react';
import { Box, Grid, GridItem, Heading, Text } from '@chakra-ui/react';
import UserCard from '@/components/UserCard';
import { client } from '@/lib/apolloClient';
import { GET_USERS } from '@/lib/userQueries';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

export default function Discover() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data } = await client.query<{ users: any[] }>({
          query: GET_USERS,
          fetchPolicy: 'cache-first',
        });
        if (!isMounted) return;
        setUsers(data?.users ?? []);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load users');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Box maxW='1200px' mx='auto' px={6} py={6}>
        <Text>Loading users...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box maxW='1200px' mx='auto' px={6} py={6}>
        <Text color='red.500'>{error}</Text>
      </Box>
    );
  }

  const filtered = users.filter((u: any) =>
    currentUser?.id ? u.id !== currentUser.id : true,
  );

  return (
    <Box maxW='1200px' mx='auto' px={6} py={6}>
      <Heading size='xl' mb={4}>
        Discover
      </Heading>
      <Grid
        templateColumns={{
          base: '1fr',
          md: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
        }}
        gap={4}
      >
        {filtered.map((u: any) => (
          <GridItem key={u.id}>
            <UserCard
              id={u.id}
              name={u.name}
              email={u.email}
              username={u.username}
              avatarUrl={u.avatarUrl}
              country={u.country}
              age={u.age}
              languagesKnown={u.languagesKnown}
              languagesLearn={u.languagesLearn}
            />
          </GridItem>
        ))}
      </Grid>
    </Box>
  );
}
