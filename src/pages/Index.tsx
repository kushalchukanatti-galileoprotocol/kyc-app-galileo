import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Building2, User } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

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