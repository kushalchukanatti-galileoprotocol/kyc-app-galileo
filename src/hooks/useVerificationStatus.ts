import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type VerificationStatus = {
  hasKYC: boolean;
  hasKYB: boolean;
  kycStatus?: string;
  kybStatus?: string;
};

export const useVerificationStatus = () => {
  const { user } = useAuth();

  return useQuery<VerificationStatus>({
    queryKey: ['verificationStatus', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user');

      const [{ data: kycData }, { data: kybData }] = await Promise.all([
        supabase
          .from('kyc_verifications')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('kyb_verifications')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      return {
        hasKYC: !!kycData,
        hasKYB: !!kybData,
        kycStatus: kycData?.status,
        kybStatus: kybData?.status,
      };
    },
    enabled: !!user,
  });
};