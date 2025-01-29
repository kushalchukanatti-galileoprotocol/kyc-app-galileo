import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Camera, CheckCircle, ArrowLeft, ArrowRight, Wallet, Clock3, User, Shield, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { CameraCapture } from "./CameraCapture";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const stepIndicators = [
  { icon: User, label: "personal.info", step: 1 },
  { icon: Shield, label: "id.verification", step: 2 },
  { icon: Camera, label: "selfie.verification", step: 3 },
  { icon: Wallet, label: "reward.address", step: 4 },
  { icon: Check, label: "verification.submitted", step: 5 },
];

export const VerificationForm = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [kycStep, setKycStep] = useState(1);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [showCamera, setShowCamera] = useState(false);
  const [kycData, setKycData] = useState({
    documentType: "id_card",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    documentNumber: "",
    documentExpiry: "",
    idFront: null as File | null,
    idBack: null as File | null,
    passportPage: null as File | null,
    selfie: null as File | null,
  });

  const validatePhoneNumber = (phone: string) => {
    const cleanedNumber = phone.replace(/[^\d+]/g, '');
    const numberWithoutPlus = cleanedNumber.replace(/^\+/, '');
    return numberWithoutPlus.length >= 10 && numberWithoutPlus.length <= 12;
  };

  const validateEVMAddress = (address: string) => {
    const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return evmAddressRegex.test(address);
  };

  const validateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age >= 18;
  };

  const handleKycNext = () => {
    if (kycStep === 1) {
      if (!kycData.firstName || !kycData.lastName || !kycData.dateOfBirth || !kycData.email || !kycData.phone) {
        toast({
          title: t("missing.info"),
          description: t("fill.required"),
          variant: "destructive",
        });
        return;
      }

      if (!validateAge(kycData.dateOfBirth)) {
        toast({
          title: t("min.age"),
          description: t("age.requirement"),
          variant: "destructive",
        });
        return;
      }

      if (!validatePhoneNumber(kycData.phone)) {
        toast({
          title: t("invalid.phone"),
          description: t("phone.format"),
          variant: "destructive",
        });
        return;
      }
    }

    if (kycStep === 2) {
      if (!kycData.documentType || !kycData.documentNumber || !kycData.documentExpiry) {
        toast({
          title: t("missing.info"),
          description: t("fill.required"),
          variant: "destructive",
        });
        return;
      }

      if (!kycData.idFront || !kycData.idBack) {
        toast({
          title: t("missing.info"),
          description: t("doc.instruction.1"),
          variant: "destructive",
        });
        return;
      }
    }

    if (kycStep === 3 && !kycData.selfie) {
      toast({
        title: t("missing.info"),
        description: t("selfie.instruction.1"),
        variant: "destructive",
      });
      return;
    }

    if (kycStep === 4) {
      if (!walletAddress) {
        toast({
          title: t("missing.info"),
          description: t("wallet.instruction.1"),
          variant: "destructive",
        });
        return;
      }
      
      if (!validateEVMAddress(walletAddress)) {
        toast({
          title: t("invalid.address"),
          description: t("wallet.instruction.2"),
          variant: "destructive",
        });
        return;
      }
    }

    setKycStep(kycStep + 1);
  };

  const handleKycBack = () => {
    setKycStep(kycStep - 1);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: keyof typeof kycData) => {
    const file = event.target.files?.[0];
    if (file) {
      setKycData({ ...kycData, [type]: file });
      toast({
        title: t("file.uploaded"),
        description: t("file.success"),
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl p-6 animate-fadeIn">
      <div className="space-y-6">
        <div className="relative w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${(kycStep / 5) * 100}%` }}
          ></div>
        </div>

        <div className="flex justify-between mb-8">
          <TooltipProvider>
            {stepIndicators.map(({ icon: Icon, label, step }) => (
              <div 
                key={`step-${step}`}
                className={`flex flex-col items-center ${kycStep >= step ? 'text-primary' : 'text-gray-400'}`}
              >
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${kycStep >= step ? 'bg-primary text-white' : 'bg-gray-200'}`}>
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
                <span className="text-xs hidden md:block">{t(label)}</span>
              </div>
            ))}
          </TooltipProvider>
        </div>

        {kycStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t("personal.info")}</h2>
            <div className="space-y-3">
              <Input
                placeholder={t("first.name")}
                value={kycData.firstName}
                onChange={(e) => setKycData({ ...kycData, firstName: e.target.value })}
                required
              />
              <Input
                placeholder={t("last.name")}
                value={kycData.lastName}
                onChange={(e) => setKycData({ ...kycData, lastName: e.target.value })}
                required
              />
              <div className="space-y-2">
                <Label>{t("date.of.birth")}</Label>
                <Input
                  type="date"
                  value={kycData.dateOfBirth}
                  onChange={(e) => setKycData({ ...kycData, dateOfBirth: e.target.value })}
                  required
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                />
              </div>
              <Input
                type="email"
                placeholder={t("email")}
                value={kycData.email}
                onChange={(e) => setKycData({ ...kycData, email: e.target.value })}
                required
              />
              <div className="space-y-2">
                <Label>{t("phone.number")}</Label>
                <Input
                  type="tel"
                  placeholder="+33612345678"
                  value={kycData.phone}
                  onChange={(e) => setKycData({ ...kycData, phone: e.target.value })}
                  required
                />
                <p className="text-sm text-gray-500">
                  {t("phone.international.format")}
                </p>
              </div>
            </div>
            <Button onClick={handleKycNext} className="w-full group">
              {t("next.step")}
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}

        {kycStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t("id.verification")}</h2>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="space-y-2 mb-4">
                <Label>{t("document.type")}</Label>
                <RadioGroup
                  value={kycData.documentType}
                  onValueChange={(value) => setKycData({ ...kycData, documentType: value })}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <RadioGroupItem value="id_card" id="id_card" className="peer sr-only" />
                      <Label
                        htmlFor="id_card"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <span>{t("id.card")}</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="passport" id="passport" className="peer sr-only" />
                      <Label
                        htmlFor="passport"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <span>{t("passport")}</span>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              <h3 className="font-semibold mb-2">{t("document.guidelines")}</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                <li>{t("doc.instruction.1")}</li>
                <li>{t("doc.instruction.2")}</li>
                <li>{t("doc.instruction.3")}</li>
                <li>{t("doc.instruction.4")}</li>
              </ul>
            </div>

            <div className="space-y-4">
              <Input
                placeholder={t("doc.number")}
                value={kycData.documentNumber}
                onChange={(e) => setKycData({ ...kycData, documentNumber: e.target.value })}
                required
              />
              <div className="space-y-2">
                <Label>{t("doc.expiry")}</Label>
                <Input
                  type="date"
                  value={kycData.documentExpiry}
                  onChange={(e) => setKycData({ ...kycData, documentExpiry: e.target.value })}
                  required
                />
              </div>

              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => document.getElementById('idFront')?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 font-medium">{t("id.card.front")}</p>
                <p className="text-sm text-gray-500 mt-1">{t("id.card.front.hint")}</p>
                <input
                  id="idFront"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'idFront')}
                />
              </div>
              {kycData.idFront && (
                <p className="text-sm text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t("document.uploaded")}: {kycData.idFront.name}
                </p>
              )}

              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => document.getElementById('idBack')?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 font-medium">{t("id.card.back")}</p>
                <p className="text-sm text-gray-500 mt-1">{t("id.card.back.hint")}</p>
                <input
                  id="idBack"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'idBack')}
                />
              </div>
              {kycData.idBack && (
                <p className="text-sm text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t("document.uploaded")}: {kycData.idBack.name}
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <Button onClick={handleKycBack} variant="outline" className="flex-1 group">
                <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
                {t("back")}
              </Button>
              <Button onClick={handleKycNext} className="flex-1 group">
                {t("next.step")}
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        )}

        {kycStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t("selfie.verification")}</h2>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2">{t("selfie.instructions")}</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                <li>{t("selfie.instruction.1")}</li>
                <li>{t("selfie.instruction.2")}</li>
                <li>{t("selfie.instruction.3")}</li>
                <li>{t("selfie.instruction.4")}</li>
                <li>{t("selfie.instruction.5")}</li>
              </ul>
            </div>

            {showCamera && (
              <CameraCapture
                onCapture={(file) => {
                  setKycData({ ...kycData, selfie: file });
                  setShowCamera(false);
                  toast({
                    title: t("file.uploaded"),
                    description: t("file.success"),
                  });
                }}
                onClose={() => setShowCamera(false)}
              />
            )}

            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => setShowCamera(true)}
            >
              <Camera className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 font-medium">{t("take.selfie")}</p>
              <p className="text-sm text-gray-500 mt-1">{t("selfie.hint")}</p>
            </div>
            {kycData.selfie && (
              <p className="text-sm text-green-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                {t("document.uploaded")}: {kycData.selfie.name}
              </p>
            )}

            <div className="flex gap-4">
              <Button onClick={handleKycBack} variant="outline" className="flex-1 group">
                <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
                {t("back")}
              </Button>
              <Button onClick={handleKycNext} className="flex-1 group">
                {t("next.step")}
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        )}

        {kycStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t("reward.address")}</h2>
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
              />
              <p className="text-sm text-gray-500">
                {t("wallet.format.hint")}
              </p>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleKycBack} variant="outline" className="flex-1 group">
                <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
                {t("back")}
              </Button>
              <Button onClick={handleKycNext} className="flex-1 group">
                {t("submit")}
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        )}

        {kycStep === 5 && (
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
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
              <Button 
                onClick={() => navigate('/')} 
                className="mt-4 w-full"
                variant="outline"
              >
                {t("close")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};