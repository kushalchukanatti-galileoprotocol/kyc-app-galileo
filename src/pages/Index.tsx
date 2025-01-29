import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Building2, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/AuthForm";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: verificationStatus, isLoading } = useVerificationStatus();

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

  if (verificationStatus?.hasKYC || verificationStatus?.hasKYB) {
    return (
      <div className="min-h-screen bg-accent">
        <Header />
        <main className="container py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Verification Status</h1>
            {verificationStatus.hasKYC && (
              <div className="mb-4 p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-2">Individual Verification (KYC)</h2>
                <p className="text-gray-600">Status: {verificationStatus.kycStatus}</p>
              </div>
            )}
            {verificationStatus.hasKYB && (
              <div className="mb-4 p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-2">Business Verification (KYB)</h2>
                <p className="text-gray-600">Status: {verificationStatus.kybStatus}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent">
      <Header />
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
        </div>
      </main>
    </div>
  );
};

export default Index;