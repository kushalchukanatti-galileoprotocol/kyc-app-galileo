import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';

interface ProtectedRouteProps {
  children: React.ReactNode;
  verificationType?: 'kyc' | 'kyb';
}

export const ProtectedRoute = ({ children, verificationType }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { data: verificationStatus, isLoading: verificationLoading } = useVerificationStatus();

  if (loading || (user && verificationLoading)) {
    return (
      <div className="min-h-screen bg-accent flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If user has already completed either verification, redirect to home
  if (verificationStatus?.hasKYC || verificationStatus?.hasKYB) {
    return <Navigate to="/" replace />;
  }

  // If trying to access KYC but already has KYB verification
  if (verificationType === 'kyc' && verificationStatus?.hasKYB) {
    return <Navigate to="/" replace />;
  }

  // If trying to access KYB but already has KYC verification
  if (verificationType === 'kyb' && verificationStatus?.hasKYC) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};