import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Camera, CheckCircle, ArrowLeft, ArrowRight, Wallet, Clock3, User, Shield, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { CameraCapture } from "./CameraCapture";
import { saveKYCVerification } from "@/lib/supabase";
import { validateEVMAddress, validateAge, validatePhoneNumber } from "@/lib/validations";
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
  const { user } = useAuth();
  const [kycStep, setKycStep] = useState(1);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [showCamera, setShowCamera] = useState(false);
  const [kycData, setKycData] = useState({
    documentType: "id_card",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    email: user?.email || "",
    phone: "",
    documentNumber: "",
    documentExpiry: "",
    idFront: null as File | null,
    idBack: null as File | null,
    passportPage: null as File | null,
    selfie: null as File | null,
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

  const handleKycNext = async () => {
    if (kycStep === 1) {
      if (!kycData.firstName || !kycData.lastName || !kycData.dateOfBirth || !kycData.email || !kycData.phone) {
        showError(t("fill.required"));
        return;
      }

      if (!validateAge(kycData.dateOfBirth)) {
        showError(t("age.requirement"));
        return;
      }

      if (!validatePhoneNumber(kycData.phone)) {
        showError(t("phone.format"));
        return;
      }
    }

    if (kycStep === 2) {
      if (!kycData.documentType || !kycData.documentNumber || !kycData.documentExpiry) {
        showError(t("fill.required"));
        return;
      }

      if (!kycData.idFront || !kycData.idBack) {
        showError(t("doc.instruction.1"));
        return;
      }
    }

    if (kycStep === 3 && !kycData.selfie) {
      showError(t("selfie.instruction.1"));
      return;
    }

    if (kycStep === 4) {
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
        firstName: kycData.firstName,
        lastName: kycData.lastName,
        dateOfBirth: kycData.dateOfBirth,
        email: kycData.email,
        phone: kycData.phone,
        documentType: kycData.documentType,
        documentNumber: kycData.documentNumber,
        documentExpiry: kycData.documentExpiry,
        walletAddress
      };

      // Prepare documents
      const documents = {
        id_front: kycData.idFront,
        id_back: kycData.idBack,
        selfie: kycData.selfie
      };

      try {
        if (!user) throw new Error('No user found');
        
        await saveKYCVerification(user.id, verificationData, documents);
        setKycStep(kycStep + 1);
      } catch (error: any) {
        showError(error.message || 'Failed to submit verification');
        return;
      }
    } else {
      setKycStep(kycStep + 1);
      if (kycStep < 4) {
        showSuccess(t("step.completed"));
      }
    }
  };

  const handleKycBack = () => {
    setKycStep(kycStep - 1);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: keyof typeof kycData) => {
    const file = event.target.files?.[0];
    if (file) {
      setKycData({ ...kycData, [type]: file });
      showSuccess(t("file.success"));
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
                <span className="text-xs hidden md:block text-center w-full">{t(label)}</span>
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

              {!kycData.idFront ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => document.getElementById('idFront')?.click()}
                >
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
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
              ) : (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium">{t("id.card.front")}</p>
                        <p className="text-sm text-gray-500">{kycData.idFront.name}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setKycData({ ...kycData, idFront: null })}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!kycData.idBack ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => document.getElementById('idBack')?.click()}
                >
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
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
              ) : (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium">{t("id.card.back")}</p>
                        <p className="text-sm text-gray-500">{kycData.idBack.name}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setKycData({ ...kycData, idBack: null })}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
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
                  showSuccess(t("file.success"));
                }}
                onClose={() => setShowCamera(false)}
              />
            )}

            {!kycData.selfie ? (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => setShowCamera(true)}
              >
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 font-medium">{t("take.selfie")}</p>
                <p className="text-sm text-gray-500 mt-1">{t("selfie.hint")}</p>
              </div>
            ) : (
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">{t("take.selfie")}</p>
                      <p className="text-sm text-gray-500">{kycData.selfie.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setKycData({ ...kycData, selfie: null })}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
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