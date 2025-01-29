import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Building, 
  Briefcase, 
  Factory, 
  Database, 
  Shield, 
  Check, 
  X, 
  Info, 
  User, 
  Users, 
  Globe, 
  Clock3, 
  Search,
  Loader2,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const stepIndicators = [
  { id: 1, icon: Building, label: "company.info", step: 1 },
  { id: 2, icon: Globe, label: "company.address", step: 2 },
  { id: 3, icon: User, label: "legal.representative", step: 3 },
  { id: 4, icon: Shield, label: "documents.upload", step: 4 },
  { id: 5, icon: Check, label: "verification.submitted", step: 5 },
];

export const BusinessVerificationForm = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [kybStep, setKybStep] = useState(1);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const countries = useMemo(() => countryList().getData(), []);

  const [kybData, setKybData] = useState({
    companyName: "",
    registrationNumber: "",
    vatNumber: "",
    incorporationDate: "",
    companyType: "llc",
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

  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 200);
    return interval;
  };

  const handleKybNext = async () => {
    if (kybStep === 1) {
      if (!kybData.companyName || !kybData.registrationNumber || !kybData.incorporationDate || !kybData.companyType) {
        showError(t("fill.required"));
        return;
      }
    }

    if (kybStep === 2) {
      if (!kybData.streetAddress || !kybData.city || !kybData.postalCode || !kybData.country) {
        showError(t("fill.required"));
        return;
      }
    }

    if (kybStep === 3) {
      if (!kybData.legalRepFirstName || !kybData.legalRepLastName || !kybData.legalRepPosition || !kybData.legalRepEmail || !kybData.legalRepPhone) {
        showError(t("fill.required"));
        return;
      }
    }

    if (kybStep === 4) {
      if (!kybData.registrationDoc || !kybData.articlesDoc) {
        showError(t("doc.instruction.1"));
        return;
      }
    }

    if (kybStep === 5) {
      if (!walletAddress) {
        showError(t("wallet.instruction.1"));
        return;
      }
      
      if (!validateEVMAddress(walletAddress)) {
        showError(t("wallet.instruction.2"));
        return;
      }

      setIsSubmitting(true);
      const progressInterval = simulateProgress();

      try {
        if (!user) throw new Error('No user found');
        
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

        const documents = {
          registration: kybData.registrationDoc,
          articles: kybData.articlesDoc,
          financial: kybData.financialDoc,
          ownership: kybData.ownershipDoc
        };

        await saveKYBVerification(user.id, verificationData, documents);
        setUploadProgress(100);
        clearInterval(progressInterval);
        setTimeout(() => {
          setKybStep(kybStep + 1);
          setIsSubmitting(false);
        }, 500);
      } catch (error: any) {
        clearInterval(progressInterval);
        setIsSubmitting(false);
        setUploadProgress(0);
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
    <Card className="w-full max-w-2xl p-6 animate-fadeIn">
      <div className="space-y-6">
        <div className="relative w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${(kybStep / 5) * 100}%` }}
          ></div>
        </div>

        <div className="flex justify-between mb-8">
          <TooltipProvider>
            {stepIndicators.map(({ id, icon: Icon, label, step }) => (
              <div 
                key={id}
                className={`flex flex-col items-center ${kybStep >= step ? 'text-primary' : 'text-gray-400'}`}
              >
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${kybStep >= step ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent 
                    className="md:hidden bg-white text-black border border-gray-200 shadow-lg font-medium"
                    sideOffset={5}
                  >
                    <p>{t(label)}</p>
                  </TooltipContent>
                </Tooltip>
                <span className="text-xs hidden md:block text-center w-full">{t(label)}</span>
              </div>
            ))}
          </TooltipProvider>
        </div>

        {kybStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t("company.info")}</h2>
            <div className="space-y-3">
              <Input
                placeholder={t("company.name")}
                value={kybData.companyName}
                onChange={(e) => setKybData({ ...kybData, companyName: e.target.value })}
                disabled={isSubmitting}
                required
              />
              <Input
                placeholder={t("registration.number")}
                value={kybData.registrationNumber}
                onChange={(e) => setKybData({ ...kybData, registrationNumber: e.target.value })}
                disabled={isSubmitting}
                required
              />
              <Input
                placeholder={t("vat.number")}
                value={kybData.vatNumber}
                onChange={(e) => setKybData({ ...kybData, vatNumber: e.target.value })}
                disabled={isSubmitting}
              />
              <div className="space-y-2">
                <Label>{t("incorporation.date")}</Label>
                <Input
                  type="date"
                  value={kybData.incorporationDate}
                  onChange={(e) => setKybData({ ...kybData, incorporationDate: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("company.type")}</Label>
                <RadioGroup
                  value={kybData.companyType}
                  onValueChange={(value) => setKybData({ ...kybData, companyType: value })}
                  disabled={isSubmitting}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <RadioGroupItem value="llc" id="llc" className="peer sr-only" />
                      <Label
                        htmlFor="llc"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <span>{t("llc")}</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="corporation" id="corporation" className="peer sr-only" />
                      <Label
                        htmlFor="corporation"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <span>{t("corporation")}</span>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        )}

        {kybStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t("company.address")}</h2>
            <div className="space-y-3">
              <Input
                placeholder={t("street.address")}
                value={kybData.streetAddress}
                onChange={(e) => setKybData({ ...kybData, streetAddress: e.target.value })}
                disabled={isSubmitting}
                required
              />
              <Input
                placeholder={t("city")}
                value={kybData.city}
                onChange={(e) => setKybData({ ...kybData, city: e.target.value })}
                disabled={isSubmitting}
                required
              />
              <Input
                placeholder={t("postal.code")}
                value={kybData.postalCode}
                onChange={(e) => setKybData({ ...kybData, postalCode: e.target.value })}
                disabled={isSubmitting}
                required
              />
              <select
                className="w-full h-10 px-3 py-2 text-base bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={kybData.country}
                onChange={(e) => setKybData({ ...kybData, country: e.target.value })}
                disabled={isSubmitting}
                required
              >
                <option value="">{t("select.country")}</option>
                {countries.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {kybStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t("legal.representative")}</h2>
            <div className="space-y-3">
              <Input
                placeholder={t("first.name")}
                value={kybData.legalRepFirstName}
                onChange={(e) => setKybData({ ...kybData, legalRepFirstName: e.target.value })}
                disabled={isSubmitting}
                required
              />
              <Input
                placeholder={t("last.name")}
                value={kybData.legalRepLastName}
                onChange={(e) => setKybData({ ...kybData, legalRepLastName: e.target.value })}
                disabled={isSubmitting}
                required
              />
              <Input
                placeholder={t("position")}
                value={kybData.legalRepPosition}
                onChange={(e) => setKybData({ ...kybData, legalRepPosition: e.target.value })}
                disabled={isSubmitting}
                required
              />
              <Input
                type="email"
                placeholder={t("business.email")}
                value={kybData.legalRepEmail}
                onChange={(e) => setKybData({ ...kybData, legalRepEmail: e.target.value })}
                disabled={isSubmitting}
                required
              />
              <div className="space-y-2">
                <Label>{t("phone.number")}</Label>
                <Input
                  type="tel"
                  placeholder="+33612345678"
                  value={kybData.legalRepPhone}
                  onChange={(e) => setKybData({ ...kybData, legalRepPhone: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
                <p className="text-sm text-gray-500">
                  {t("phone.international.format")}
                </p>
              </div>
            </div>
          </div>
        )}

        {kybStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t("documents.upload")}</h2>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2">{t("document.guidelines")}</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                <li>{t("doc.instruction.1")}</li>
                <li>{t("doc.instruction.2")}</li>
                <li>{t("doc.instruction.3")}</li>
                <li>{t("doc.instruction.4")}</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("certificate.incorporation")}</Label>
                <Input
                  type="file"
                  onChange={(e) => setKybData({ ...kybData, registrationDoc: e.target.files?.[0] || null })}
                  disabled={isSubmitting}
                  required
                />
                <p className="text-sm text-gray-500">{t("registration.doc.hint")}</p>
              </div>

              <div className="space-y-2">
                <Label>{t("articles.association")}</Label>
                <Input
                  type="file"
                  onChange={(e) => setKybData({ ...kybData, articlesDoc: e.target.files?.[0] || null })}
                  disabled={isSubmitting}
                  required
                />
                <p className="text-sm text-gray-500">{t("articles.doc.hint")}</p>
              </div>

              <div className="space-y-2">
                <Label>{t("financial.statements")}</Label>
                <Input
                  type="file"
                  onChange={(e) => setKybData({ ...kybData, financialDoc: e.target.files?.[0] || null })}
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500">{t("financial.doc.hint")}</p>
              </div>
            </div>
          </div>
        )}

        {kybStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t("wallet.connect")}</h2>
            <p className="text-gray-600">
              {t("wallet.instruction.1")}
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="walletAddress">{t("evm.address")}</Label>
              <Input
                id="walletAddress"
                placeholder="0x..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="font-mono"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500">
                {t("wallet.format.hint")}
              </p>
            </div>

            {isSubmitting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Uploading verification data...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
        )}

        {kybStep === 6 && (
          <div className="text-center space-y-4">
            <Check className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">{t("verification.submitted")}</h2>
            <p className="text-gray-600">
              {t("review.message")}
            </p>
            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <div className="flex items-center justify-center text-blue-600 gap-2">
                <Clock3 className="h-5 w-5" />
                <p className="font-medium">{t("processing.time")}</p>
              </div>
              <p className="text-sm text-gray-600">
                {t("processing.details")}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {t("reward.address.label")} {walletAddress}
              </p>
            </div>
          </div>
        )}

        {kybStep < 6 && (
          <div className="flex gap-4">
            {kybStep > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setKybStep(kybStep - 1)}
                disabled={isSubmitting}
                className="flex-1 group"
              >
                <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
                {t("back")}
              </Button>
            )}
            <Button 
              onClick={handleKybNext}
              disabled={isSubmitting}
              className="flex-1 group"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                <>
                  {kybStep === 5 ? t("submit") : t("next.step")}
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};