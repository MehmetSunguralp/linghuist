'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { createClient } from '@supabase/supabase-js';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from 'next/navigation';

function parseHashParams(hash: string): Record<string, string> {
  const result: Record<string, string> = {};
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  for (const part of raw.split('&')) {
    const [k, v] = part.split('=');
    if (k) result[decodeURIComponent(k)] = decodeURIComponent(v || '');
  }
  return result;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as
    | string
    | undefined;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as
    | string
    | undefined;

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    return createClient(supabaseUrl, supabaseAnonKey);
  }, [supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    // Supabase redirects with tokens in the URL hash
    const params = parseHashParams(window.location.hash);
    const at = params['access_token'] || null;
    const rt = params['refresh_token'] || null;
    setAccessToken(at);
    setRefreshToken(rt);
    setInitializing(false);
  }, []);

  const canSubmit =
    !initializing &&
    !!supabase &&
    !!accessToken &&
    !!refreshToken &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  const onSubmit = async () => {
    if (!supabase) {
      toaster.create({
        title: 'Configuration error',
        description: 'Supabase is not configured',
        type: 'error',
      });
      return;
    }
    if (!accessToken || !refreshToken) {
      toaster.create({ title: 'Invalid reset link', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toaster.create({ title: 'Passwords do not match', type: 'warning' });
      return;
    }
    if (newPassword.length < 8) {
      toaster.create({
        title: 'Password too short',
        description: 'Use at least 8 characters',
        type: 'warning',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Establish session from URL tokens
      const { error: sessionErr } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionErr) throw sessionErr;

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      toaster.create({ title: 'Password updated', type: 'success' });
      router.push('/signin');
    } catch (e: any) {
      const message = e?.message || 'Failed to reset password';
      toaster.create({
        title: 'Reset failed',
        description: message,
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex h='calc(100vh - 64px)' align='center' justify='center' px={{ base: 3, sm: 6 }}>
      <Box maxW='600px' w='full' px={{ base: 4, sm: 6 }}>
        <VStack gap={{ base: 1, sm: 2 }} mb={{ base: 6, sm: 8 }} textAlign='center'>
          <Heading size={{ base: '2xl', sm: '3xl', md: '4xl' }}>Reset Password</Heading>
          <Text color='gray.600' fontSize={{ base: 'sm', sm: 'md' }}>Set a new password for your account</Text>
        </VStack>

        {!supabase && (
          <Text color='red.400' mb={4} fontSize={{ base: 'xs', sm: 'sm' }}>
            Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </Text>
        )}

        <VStack gap={{ base: 3, sm: 4 }} align='stretch'>
          <Box>
            <Input
              name='newPassword'
              placeholder='New password'
              size={{ base: 'md', sm: 'lg' }}
              type='password'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Text color='gray.500' fontSize={{ base: 'xs', sm: 'sm' }} mt={1}>
              Must be at least 8 characters and different from your previous
              password.
            </Text>
          </Box>
          <Box>
            <Input
              name='confirmPassword'
              placeholder='Confirm new password'
              size={{ base: 'md', sm: 'lg' }}
              type='password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Box>

          <Button
            size={{ base: 'md', sm: 'lg' }}
            colorScheme='blue'
            onClick={onSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? 'Updating...' : 'Update Password'}
          </Button>

          {!accessToken && (
            <Text color='red.400' fontSize={{ base: 'xs', sm: 'sm' }}>
              Invalid or expired link. Request a new reset email.
            </Text>
          )}
        </VStack>
      </Box>
    </Flex>
  );
}
