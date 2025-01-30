import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Building2, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/AuthForm";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: verificationStatus, isLoading } = useVerificationStatus();

  // Query to fetch all verifications
  const { data: verifications } = useQuery({
    queryKey: ['verifications', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user');

      const [{ data: kycData }, { data: kybData }] = await Promise.all([
        supabase
          .from('kyc_verifications')
          .select('id, created_at, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('kyb_verifications')
          .select('id, created_at, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      // Combine and sort verifications
      const combined = [
        ...(kycData || []).map(v => ({ ...v, type: 'KYC' })),
        ...(kybData || []).map(v => ({ ...v, type: 'KYB' })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return combined;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-accent">
        <Header />
        <main className="container py-12">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Welcome to Identity Verification</h1>
            <p className="text-gray-600 mb-8">
              Please sign in or create an account to proceed with verification.
            </p>
            <div className="flex justify-center">
              <AuthForm />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-accent">
        <Header />
        <main className="container py-12">
          <div className="max-w-3xl mx-auto text-center">
            <p>Loading verification status...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent">
      <Header />
      <div className="container">
        <div className="flex justify-end mt-2">
          <p className="text-sm text-gray-600">Signed in as: {user?.email}</p>
        </div>
      </div>
      <main className="container py-12">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Secure Identity Verification</h1>
          <p className="text-gray-600 mb-8">
            Choose the type of verification you need to proceed with.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <Button 
                onClick={() => navigate('/kyc')} 
                className="w-full h-auto flex flex-col items-center gap-4 p-6"
                variant="ghost"
              >
                <User className="w-12 h-12" />
                <div>
                  <h2 className="text-xl font-semibold mb-2">Individual Verification</h2>
                  <p className="text-sm text-gray-600">
                    Verify your personal identity (KYC)
                  </p>
                </div>
              </Button>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <Button 
                onClick={() => navigate('/kyb')} 
                className="w-full h-auto flex flex-col items-center gap-4 p-6"
                variant="ghost"
              >
                <Building2 className="w-12 h-12" />
                <div>
                  <h2 className="text-xl font-semibold mb-2">Business Verification</h2>
                  <p className="text-sm text-gray-600">
                    Verify your business identity (KYB)
                  </p>
                </div>
              </Button>
            </div>
          </div>

          {verifications && verifications.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Verification History</h2>
              <div className="bg-white rounded-lg shadow-lg p-4">
                <ScrollArea className="h-[300px] w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">Type</TableHead>
                        <TableHead className="text-center">Date Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {verifications.map((verification) => (
                        <TableRow key={verification.id}>
                          <TableCell className="font-medium">{verification.type}</TableCell>
                          <TableCell>
                            {new Date(verification.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit'
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;