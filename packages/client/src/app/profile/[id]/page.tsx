// This route uses the same ProfilePage component but with dynamic params
'use client';
import { useParams } from 'next/navigation';
import ProfilePage from '../page';

export default function UserProfilePage() {
  return <ProfilePage />;
}

