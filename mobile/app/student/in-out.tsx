import React from 'react';
import { useAuth } from '../../store/AuthContext';
import { StudentView } from '../dashboard/in-out';

export default function StudentInOut() {
  const { user } = useAuth();
  return <StudentView user={user} />;
}
