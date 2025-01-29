import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Building, Briefcase, Factory, Database, Shield, Check, X, Info, User, Users, Globe, Clock3, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import countryList from 'react-select-country-list';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { saveKYBVerification } from "@/lib/supabase";
import { validateEVMAddress } from "@/lib/validations";

export const BusinessVerificationForm = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [kybStep, setKybStep] = useState(1);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("+1");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneSearchQuery, setPhoneSearchQuery] = useState("");
  
  const countries = useMemo(() => countryList().getData(), []);

  const [kybData, setKybData] = useState({
    companyName: "",
    registrationNumber: "",
    vatNumber: "",
    incorporationDate: "",
    companyType: "",
    streetAddress: "",
    city: "",
    postalCode: "",
    country: "",
    legalRepFirstName: "",
    legalRepLastName: "",
    legalRepPosition: "",
    legalRepEmail: user?.email || "",
    legalRepPhone: "",
    registrationDoc: null as File | null,
    articlesDoc: null as File | null,
    financialDoc: null as File | null,
    ownershipDoc: null as File | null,
  });

  const showError = (message: string) => {
    toast({
      variant: "destructive",
      title: "Error",
      description: message,
    });
  };

  const showSuccess = (message: string) => {
    toast({
      variant: "default",
      title: "Success",
      description: message,
    });
  };

  const handleKybNext = async () => {
    if (kybStep === 5) {
      if (!walletAddress) {
        showError(t("wallet.instruction.1"));
        return;
      }
      
      if (!validateEVMAddress(walletAddress)) {
        showError(t("wallet.instruction.2"));
        return;
      }

      // Prepare verification data
      const verificationData = {
        companyName: kybData.companyName,
        registrationNumber: kybData.registrationNumber,
        vatNumber: kybData.vatNumber,
        incorporationDate: kybData.incorporationDate,
        companyType: kybData.companyType,
        streetAddress: kybData.streetAddress,
        city: kybData.city,
        postalCode: kybData.postalCode,
        country: kybData.country,
        legalRepFirstName: kybData.legalRepFirstName,
        legalRepLastName: kybData.legalRepLastName,
        legalRepPosition: kybData.legalRepPosition,
        legalRepEmail: kybData.legalRepEmail,
        legalRepPhone: kybData.legalRepPhone,
        walletAddress
      };

      // Prepare documents
      const documents = {
        registration: kybData.registrationDoc,
        articles: kybData.articlesDoc,
        financial: kybData.financialDoc,
        ownership: kybData.ownershipDoc
      };

      try {
        if (!user) throw new Error('No user found');
        
        await saveKYBVerification(user.id, verificationData, documents);
        setKybStep(kybStep + 1);
      } catch (error: any) {
        showError(error.message || 'Failed to submit verification');
        return;
      }
    } else {
      setKybStep(kybStep + 1);
      if (kybStep < 5) {
        showSuccess(t("step.completed"));
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
      <Card className="p-6">
        <div className="space-y-6">
          {kybStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{t("company.details")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">{t("company.name")}</Label>
                  <Input
                    id="companyName"
                    value={kybData.companyName}
                    onChange={(e) => setKybData({ ...kybData, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">{t("company.registration")}</Label>
                  <Input
                    id="registrationNumber"
                    value={kybData.registrationNumber}
                    onChange={(e) => setKybData({ ...kybData, registrationNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {kybStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{t("company.address")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="streetAddress">{t("address.street")}</Label>
                  <Input
                    id="streetAddress"
                    value={kybData.streetAddress}
                    onChange={(e) => setKybData({ ...kybData, streetAddress: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">{t("address.city")}</Label>
                  <Input
                    id="city"
                    value={kybData.city}
                    onChange={(e) => setKybData({ ...kybData, city: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {kybStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{t("legal.representative")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legalRepFirstName">{t("legal.firstName")}</Label>
                  <Input
                    id="legalRepFirstName"
                    value={kybData.legalRepFirstName}
                    onChange={(e) => setKybData({ ...kybData, legalRepFirstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legalRepLastName">{t("legal.lastName")}</Label>
                  <Input
                    id="legalRepLastName"
                    value={kybData.legalRepLastName}
                    onChange={(e) => setKybData({ ...kybData, legalRepLastName: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {kybStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{t("documents.upload")}</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationDoc">{t("documents.registration")}</Label>
                  <Input
                    id="registrationDoc"
                    type="file"
                    onChange={(e) => setKybData({ ...kybData, registrationDoc: e.target.files?.[0] || null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="articlesDoc">{t("documents.articles")}</Label>
                  <Input
                    id="articlesDoc"
                    type="file"
                    onChange={(e) => setKybData({ ...kybData, articlesDoc: e.target.files?.[0] || null })}
                  />
                </div>
              </div>
            </div>
          )}

          {kybStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{t("wallet.connect")}</h2>
              <div className="space-y-2">
                <Label htmlFor="walletAddress">{t("wallet.address")}</Label>
                <Input
                  id="walletAddress"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                />
              </div>
            </div>
          )}

          {kybStep === 6 && (
            <div className="text-center space-y-4">
              <Check className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">{t("verification.submitted")}</h2>
              <p>{t("verification.processing")}</p>
            </div>
          )}

          {kybStep < 6 && (
            <div className="flex justify-end space-x-4">
              {kybStep > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setKybStep(kybStep - 1)}
                >
                  {t("button.previous")}
                </Button>
              )}
              <Button onClick={handleKybNext}>
                {kybStep === 5 ? t("button.submit") : t("button.next")}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};