import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Camera, CheckCircle, ArrowLeft, ArrowRight, Wallet, Clock3, User, Shield, Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { CameraCapture } from "./CameraCapture";
import { saveKYCVerification } from "@/lib/supabase";
import { validateEVMAddress, validateAge, validatePhoneNumber, validateEmail } from "@/lib/validations";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

const stepIndicators = [
  { id: 1, icon: User, label: "personal.info", step: 1 },
  { id: 2, icon: Shield, label: "id.verification", step: 2 },
  { id: 3, icon: Camera, label: "selfie.verification", step: 3 },
  { id: 4, icon: Wallet, label: "reward.address", step: 4 },
  { id: 5, icon: Check, label: "verification.submitted", step: 5 },
];

export const VerificationForm = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kycStep, setKycStep] = useState(1);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [showCamera, setShowCamera] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isDateValid, setIsDateValid] = useState(true);
  const [isWalletValid, setIsWalletValid] = useState(true);
  const [isPhoneValid, setIsPhoneValid] = useState(true);
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
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});
  const [formErrors, setFormErrors] = useState<{ [key: string]: boolean }>({});
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

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

  const handleFieldChange = (field: string, value: string) => {
    setKycData({ ...kycData, [field]: value });
    setTouchedFields({ ...touchedFields, [field]: true });
    
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: false });
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    handleFieldChange('dateOfBirth', date);
    setIsDateValid(validateAge(date));
  };

  const handleWalletChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setWalletAddress(address);
    setIsWalletValid(validateEVMAddress(address.trim()));
    setTouchedFields({ ...touchedFields, walletAddress: true });
    if (formErrors.walletAddress) {
      setFormErrors({ ...formErrors, walletAddress: false });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    handleFieldChange('phone', phone);
    setIsPhoneValid(validatePhoneNumber(phone));
  };

  const handleKycNext = async () => {
    if (kycStep === 1) {
      const requiredFields = {
        firstName: t("first.name"),
        lastName: t("last.name"),
        dateOfBirth: t("date.of.birth"),
        email: t("email"),
        phone: t("phone.number")
      };

      setTouchedFields(Object.keys(requiredFields).reduce((acc, field) => ({
        ...acc,
        [field]: true
      }), {}));

      const errors = Object.keys(requiredFields).reduce((acc, field) => ({
        ...acc,
        [field]: !kycData[field as keyof typeof kycData]
      }), {});

      setFormErrors(errors);

      const emptyFields = Object.entries(requiredFields)
        .filter(([key]) => !kycData[key as keyof typeof kycData])
        .map(([_, label]) => label);

      if (emptyFields.length > 0) {
        showError(
          `${t("required.fields")}: ${emptyFields.join(", ")}`
        );
        return;
      }

      if (!validateEmail(kycData.email)) {
        showError(t("email.format"));
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
      const requiredFields = {
        documentType: t("document.type"),
        documentNumber: t("doc.number"),
        documentExpiry: t("doc.expiry"),
        idFront: 'idFront',
        idBack: 'idBack'
      };

      setTouchedFields(Object.keys(requiredFields).reduce((acc, field) => ({
        ...acc,
        [field]: true
      }), {}));

      const errors = Object.keys(requiredFields).reduce((acc, field) => ({
        ...acc,
        [field]: field === 'idFront' 
          ? !kycData.idFront 
          : field === 'idBack'
          ? !kycData.idBack
          : !kycData[field as keyof typeof kycData]
      }), {});

      setFormErrors(errors);

      const emptyFields = Object.entries(requiredFields)
        .filter(([key]) => {
          if (key === 'idFront') return !kycData.idFront;
          if (key === 'idBack') return !kycData.idBack;
          return !kycData[key as keyof typeof kycData];
        })
        .map(([_, label]) => label);

      if (emptyFields.length > 0) {
        showError(
          `${t("required.fields")}: ${emptyFields.join(", ")}`
        );
        return;
      }
    }

    if (kycStep === 3) {
      setTouchedFields({ ...touchedFields, selfie: true });
      setFormErrors({ ...formErrors, selfie: !kycData.selfie });

      if (!kycData.selfie) {
        showError(t("selfie.instruction.1"));
        return;
      }
    }

    if (kycStep === 4) {
      setTouchedFields({ ...touchedFields, walletAddress: true });
      setFormErrors({ ...formErrors, walletAddress: !walletAddress.trim() });

      if (!walletAddress.trim()) {
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
        
        await saveKYCVerification(user.id, verificationData, documents);
        setUploadProgress(100);
        clearInterval(progressInterval);
        
        // Show success message and move to success screen
        showSuccess(t("verification.submitted"));
        setKycStep(5);
        setIsSubmitting(false);  // Reset submitting state
      } catch (error: any) {
        clearInterval(progressInterval);
        setIsSubmitting(false);
        setUploadProgress(0);
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

  const handleDone = () => {
    navigate('/');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: keyof typeof kycData) => {
    const file = event.target.files?.[0];
    if (file) {
      setKycData({ ...kycData, [type]: file });
      showSuccess(t("file.success"));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setKycData({ ...kycData, email: email });
    setIsEmailValid(validateEmail(email));
  };

  const handleIconClick = (stepId: number) => {
    setActiveTooltip(stepId);
    setTimeout(() => {
      setActiveTooltip(null);
    }, 2000);
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
            {stepIndicators.map(({ id, icon: Icon, label, step }) => (
              <div 
                key={id}
                className={`flex flex-col items-center ${kycStep >= step ? 'text-primary' : 'text-gray-400'}`}
              >
                <Tooltip open={activeTooltip === id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                        kycStep >= step ? 'bg-primary text-white' : 'bg-gray-200'
                      }`}
                      onClick={() => handleIconClick(id)}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent 
                    className="md:hidden bg-white text-black border border-gray-200 shadow-lg font-medium p-2 z-50"
                    side="bottom"
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
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("first.name")}</Label>
                <Input
                  id="firstName"
                  placeholder={t("first.name")}
                  value={kycData.firstName}
                  onChange={(e) => handleFieldChange('firstName', e.target.value)}
                  className={`${touchedFields.firstName && formErrors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
                {touchedFields.firstName && formErrors.firstName && (
                  <p className="text-sm text-red-500">{t("field.required")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">{t("last.name")}</Label>
                <Input
                  id="lastName"
                  placeholder={t("last.name")}
                  value={kycData.lastName}
                  onChange={(e) => handleFieldChange('lastName', e.target.value)}
                  className={`${touchedFields.lastName && formErrors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
                {touchedFields.lastName && formErrors.lastName && (
                  <p className="text-sm text-red-500">{t("field.required")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">{t("date.of.birth")}</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={kycData.dateOfBirth}
                  onChange={handleDateChange}
                  className={`${
                    (touchedFields.dateOfBirth && formErrors.dateOfBirth) || 
                    (!isDateValid && kycData.dateOfBirth) 
                      ? 'border-red-500 focus:ring-red-500' 
                      : ''
                  }`}
                  required
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                />
                {touchedFields.dateOfBirth && formErrors.dateOfBirth && (
                  <p className="text-sm text-red-500">{t("field.required")}</p>
                )}
                {!isDateValid && kycData.dateOfBirth && (
                  <p className="text-sm text-red-500">{t("age.requirement")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("email")}
                  value={kycData.email}
                  onChange={handleEmailChange}
                  className={`${(touchedFields.email && formErrors.email) || (!isEmailValid && kycData.email) ? 'border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
                {touchedFields.email && formErrors.email && (
                  <p className="text-sm text-red-500">{t("field.required")}</p>
                )}
                {!isEmailValid && kycData.email && (
                  <p className="text-sm text-red-500">{t("email.format")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("phone.number")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+33612345678"
                  value={kycData.phone}
                  onChange={handlePhoneChange}
                  className={`${
                    (touchedFields.phone && formErrors.phone) || 
                    (!isPhoneValid && kycData.phone) 
                      ? 'border-red-500 focus:ring-red-500' 
                      : ''
                  }`}
                  required
                />
                {touchedFields.phone && formErrors.phone && (
                  <p className="text-sm text-red-500">{t("field.required")}</p>
                )}
                {!isPhoneValid && kycData.phone && (
                  <p className="text-sm text-red-500">{t("phone.format")}</p>
                )}
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
                  onValueChange={(value) => handleFieldChange('documentType', value)}
                  className={`${touchedFields.documentType && formErrors.documentType ? 'border-red-500' : ''}`}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <RadioGroupItem value="id_card" id="id_card" className="peer sr-only" />
                      <Label
                        htmlFor="id_card"
                        className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary ${
                          touchedFields.documentType && formErrors.documentType ? 'border-red-500' : ''
                        }`}
                      >
                        <span>{t("id.card")}</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="passport" id="passport" className="peer sr-only" />
                      <Label
                        htmlFor="passport"
                        className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary ${
                          touchedFields.documentType && formErrors.documentType ? 'border-red-500' : ''
                        }`}
                      >
                        <span>{t("passport")}</span>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
                {touchedFields.documentType && formErrors.documentType && (
                  <p className="text-sm text-red-500">{t("field.required")}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="documentNumber">{t("doc.number")}</Label>
                  <Input
                    id="documentNumber"
                    placeholder={t("doc.number")}
                    value={kycData.documentNumber}
                    onChange={(e) => handleFieldChange('documentNumber', e.target.value)}
                    className={`${touchedFields.documentNumber && formErrors.documentNumber ? 'border-red-500 focus:ring-red-500' : ''}`}
                    required
                  />
                  {touchedFields.documentNumber && formErrors.documentNumber && (
                    <p className="text-sm text-red-500">{t("field.required")}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentExpiry">{t("doc.expiry")}</Label>
                  <Input
                    id="documentExpiry"
                    type="date"
                    value={kycData.documentExpiry}
                    onChange={(e) => handleFieldChange('documentExpiry', e.target.value)}
                    className={`${touchedFields.documentExpiry && formErrors.documentExpiry ? 'border-red-500 focus:ring-red-500' : ''}`}
                    required
                  />
                  {touchedFields.documentExpiry && formErrors.documentExpiry && (
                    <p className="text-sm text-red-500">{t("field.required")}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t("id.documents")}</Label>
                  {!kycData.idFront && touchedFields.idFront && (
                    <p className="text-sm text-red-500 mb-2">{t("doc.front.required")}</p>
                  )}
                  {!kycData.idBack && touchedFields.idBack && (
                    <p className="text-sm text-red-500 mb-2">{t("doc.back.required")}</p>
                  )}
                  
                  {!kycData.idFront ? (
                    <div 
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors ${
                        touchedFields.idFront && !kycData.idFront ? 'border-red-500' : 'border-gray-300'
                      }`}
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
                        onChange={(e) => {
                          handleFileUpload(e, 'idFront');
                          setTouchedFields({ ...touchedFields, idFront: true });
                        }}
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
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors ${
                        touchedFields.idBack && !kycData.idBack ? 'border-red-500' : 'border-gray-300'
                      }`}
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
                        onChange={(e) => {
                          handleFileUpload(e, 'idBack');
                          setTouchedFields({ ...touchedFields, idBack: true });
                        }}
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
              </div>
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
                  setTouchedFields({ ...touchedFields, selfie: true });
                  setFormErrors({ ...formErrors, selfie: false });
                  showSuccess(t("file.success"));
                }}
                onClose={() => setShowCamera(false)}
              />
            )}

            <div className="space-y-2">
              <Label>{t("selfie.photo")}</Label>
              {!kycData.selfie && touchedFields.selfie && (
                <p className="text-sm text-red-500 mb-2">{t("selfie.required")}</p>
              )}
              
              {!kycData.selfie ? (
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors ${
                    touchedFields.selfie && !kycData.selfie ? 'border-red-500' : 'border-gray-300'
                  }`}
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
                        onClick={() => {
                          setKycData({ ...kycData, selfie: null });
                          setFormErrors({ ...formErrors, selfie: true });
                        }}
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
                onChange={handleWalletChange}
                className={`font-mono ${
                  (touchedFields.walletAddress && formErrors.walletAddress) || 
                  (!isWalletValid && walletAddress.trim()) 
                    ? 'border-red-500 focus:ring-red-500' 
                    : ''
                }`}
                disabled={isSubmitting}
              />
              {touchedFields.walletAddress && formErrors.walletAddress && (
                <p className="text-sm text-red-500">{t("wallet.required")}</p>
              )}
              {!isWalletValid && walletAddress.trim() && (
                <p className="text-sm text-red-500">{t("wallet.instruction.2")}</p>
              )}
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

            <div className="flex gap-4">
              <Button 
                onClick={handleKycBack} 
                variant="outline" 
                className="flex-1 group"
                disabled={isSubmitting}
              >
                <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
                {t("back")}
              </Button>
              <Button 
                onClick={handleKycNext} 
                className="flex-1 group"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("submitting")}
                  </>
                ) : (
                  <>
                    {t("submit")}
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {kycStep === 5 && (
          <div className="space-y-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{t("verification.submitted")}</h2>
              <p className="text-gray-600">
                {t("verification.review.message")}
              </p>
            </div>
            <Button onClick={handleDone} className="w-full">
              {t("done")}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};