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
import { useNavigate } from "react-router-dom";

const stepIndicators = [
  { 
    id: 1, 
    icon: Building, 
    label: "company.info", 
    step: 1,
    tooltip: "company.info.tooltip" 
  },
  { 
    id: 2, 
    icon: Globe, 
    label: "company.address", 
    step: 2,
    tooltip: "company.address.tooltip"
  },
  { 
    id: 3, 
    icon: User, 
    label: "legal.representative", 
    step: 3,
    tooltip: "legal.representative.tooltip"
  },
  { 
    id: 4, 
    icon: Shield, 
    label: "documents.upload", 
    step: 4,
    tooltip: "documents.upload.tooltip"
  },
  { 
    id: 5, 
    icon: Check, 
    label: "verification.submitted", 
    step: 5,
    tooltip: "verification.submitted.tooltip"
  },
];

interface ValidationErrors {
  companyName?: string;
  registrationNumber?: string;
  vatNumber?: string;
  incorporationDate?: string;
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  legalRepFirstName?: string;
  legalRepLastName?: string;
  legalRepPosition?: string;
  legalRepEmail?: string;
  legalRepPhone?: string;
  registrationDoc?: string;
  articlesDoc?: string;
  financialDoc?: string;
  ownershipDoc?: string;
  walletAddress?: string;
}

export const BusinessVerificationForm = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kybStep, setKybStep] = useState(1);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [openTooltips, setOpenTooltips] = useState<Record<number, boolean>>({});
  
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

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  const validateCompanyInfo = () => {
    const newErrors: ValidationErrors = {};
    
    // Company name validation
    if (!kybData.companyName.trim()) {
      newErrors.companyName = t("error.required");
    } else if (kybData.companyName.length < 2) {
      newErrors.companyName = t("error.company.name.min");
    } else if (kybData.companyName.length > 100) {
      newErrors.companyName = t("error.company.name.max");
    }

    // Registration number validation
    if (!kybData.registrationNumber.trim()) {
      newErrors.registrationNumber = t("error.required");
    } else if (!/^[A-Za-z0-9-]{4,20}$/.test(kybData.registrationNumber)) {
      newErrors.registrationNumber = t("error.registration.format");
    }

    // VAT number validation (optional)
    if (kybData.vatNumber && !/^[A-Za-z0-9-]{4,20}$/.test(kybData.vatNumber)) {
      newErrors.vatNumber = t("error.vat.format");
    }

    // Incorporation date validation
    if (!kybData.incorporationDate) {
      newErrors.incorporationDate = t("error.required");
    } else {
      const date = new Date(kybData.incorporationDate);
      const today = new Date();
      if (date > today) {
        newErrors.incorporationDate = t("error.date.future");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCompanyAddress = () => {
    const newErrors: ValidationErrors = {};
    
    // Street address validation
    if (!kybData.streetAddress.trim()) {
      newErrors.streetAddress = t("error.required");
    } else if (kybData.streetAddress.length < 5) {
      newErrors.streetAddress = t("error.address.min");
    } else if (kybData.streetAddress.length > 100) {
      newErrors.streetAddress = t("error.address.max");
    }

    // City validation
    if (!kybData.city.trim()) {
      newErrors.city = t("error.required");
    } else if (kybData.city.length < 2) {
      newErrors.city = t("error.city.min");
    } else if (kybData.city.length > 50) {
      newErrors.city = t("error.city.max");
    }

    // Postal code validation
    if (!kybData.postalCode.trim()) {
      newErrors.postalCode = t("error.required");
    } else if (!/^[A-Za-z0-9-\s]{3,10}$/.test(kybData.postalCode)) {
      newErrors.postalCode = t("error.postal.format");
    }

    // Country validation
    if (!kybData.country) {
      newErrors.country = t("error.required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateLegalRepresentative = () => {
    const newErrors: ValidationErrors = {};
    
    // First name validation
    if (!kybData.legalRepFirstName.trim()) {
      newErrors.legalRepFirstName = t("error.required");
    } else if (kybData.legalRepFirstName.length < 2) {
      newErrors.legalRepFirstName = t("error.name.min");
    } else if (kybData.legalRepFirstName.length > 50) {
      newErrors.legalRepFirstName = t("error.name.max");
    }

    // Last name validation
    if (!kybData.legalRepLastName.trim()) {
      newErrors.legalRepLastName = t("error.required");
    } else if (kybData.legalRepLastName.length < 2) {
      newErrors.legalRepLastName = t("error.name.min");
    } else if (kybData.legalRepLastName.length > 50) {
      newErrors.legalRepLastName = t("error.name.max");
    }

    // Position validation
    if (!kybData.legalRepPosition.trim()) {
      newErrors.legalRepPosition = t("error.required");
    } else if (kybData.legalRepPosition.length < 2) {
      newErrors.legalRepPosition = t("error.position.min");
    } else if (kybData.legalRepPosition.length > 50) {
      newErrors.legalRepPosition = t("error.position.max");
    }

    // Email validation
    if (!kybData.legalRepEmail.trim()) {
      newErrors.legalRepEmail = t("error.required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kybData.legalRepEmail)) {
      newErrors.legalRepEmail = t("error.email.format");
    }

    // Phone validation
    if (!kybData.legalRepPhone.trim()) {
      newErrors.legalRepPhone = t("error.required");
    } else {
      const phoneDigits = kybData.legalRepPhone.replace(/\D/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 12) {
        newErrors.legalRepPhone = t("error.phone.length");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDocuments = () => {
    const newErrors: ValidationErrors = {};
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    // Registration document validation (required)
    if (!kybData.registrationDoc) {
      newErrors.registrationDoc = t("error.required");
    } else if (!allowedTypes.includes(kybData.registrationDoc.type)) {
      newErrors.registrationDoc = t("error.file.type");
    } else if (kybData.registrationDoc.size > maxSize) {
      newErrors.registrationDoc = t("error.file.size");
    }

    // Articles document validation (required)
    if (!kybData.articlesDoc) {
      newErrors.articlesDoc = t("error.required");
    } else if (!allowedTypes.includes(kybData.articlesDoc.type)) {
      newErrors.articlesDoc = t("error.file.type");
    } else if (kybData.articlesDoc.size > maxSize) {
      newErrors.articlesDoc = t("error.file.size");
    }

    // Financial document validation (optional)
    if (kybData.financialDoc) {
      if (!allowedTypes.includes(kybData.financialDoc.type)) {
        newErrors.financialDoc = t("error.file.type");
      } else if (kybData.financialDoc.size > maxSize) {
        newErrors.financialDoc = t("error.file.size");
      }
    }

    // Ownership document validation (optional)
    if (kybData.ownershipDoc) {
      if (!allowedTypes.includes(kybData.ownershipDoc.type)) {
        newErrors.ownershipDoc = t("error.file.type");
      } else if (kybData.ownershipDoc.size > maxSize) {
        newErrors.ownershipDoc = t("error.file.size");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateWalletAddress = () => {
    const newErrors: ValidationErrors = {};
    
    if (!walletAddress.trim()) {
      newErrors.walletAddress = t("error.required");
    } else if (!validateEVMAddress(walletAddress)) {
      newErrors.walletAddress = t("error.wallet.format");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleKybNext = async () => {
    if (kybStep === 1) {
      const isValid = validateCompanyInfo();
      if (!isValid) {
        // Mark all fields as touched to show errors
        setTouched({
          companyName: true,
          registrationNumber: true,
          vatNumber: true,
          incorporationDate: true,
          companyType: true,
        });
        showError(t("fill.required"));
        return;
      }
    }

    if (kybStep === 2) {
      const isValid = validateCompanyAddress();
      if (!isValid) {
        setTouched({
          streetAddress: true,
          city: true,
          postalCode: true,
          country: true,
        });
        showError(t("fill.required"));
        return;
      }
    }

    if (kybStep === 3) {
      const isValid = validateLegalRepresentative();
      if (!isValid) {
        setTouched({
          legalRepFirstName: true,
          legalRepLastName: true,
          legalRepPosition: true,
          legalRepEmail: true,
          legalRepPhone: true,
        });
        showError(t("fill.required"));
        return;
      }
    }

    if (kybStep === 4) {
      const isValid = validateDocuments();
      if (!isValid) {
        setTouched({
          registrationDoc: true,
          articlesDoc: true,
          financialDoc: true,
          ownershipDoc: true,
        });
        showError(t("doc.instruction.1"));
        return;
      }
    }

    if (kybStep === 5) {
      const isValid = validateWalletAddress();
      if (!isValid) {
        setTouched({
          walletAddress: true,
        });
        showError(t("wallet.instruction.1"));
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

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateCompanyInfo();
  };

  const handleTooltipClick = (stepId: number) => {
    setOpenTooltips(prev => ({ ...prev, [stepId]: true }));
    setTimeout(() => {
      setOpenTooltips(prev => ({ ...prev, [stepId]: false }));
    }, 2000);
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
            {stepIndicators.map(({ id, icon: Icon, label, step, tooltip }) => (
              <div 
                key={id}
                className={`flex flex-col items-center ${kybStep >= step ? 'text-primary' : 'text-gray-400'}`}
              >
                <Tooltip 
                  delayDuration={100}
                  open={openTooltips[id]}
                >
                  <TooltipTrigger asChild>
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 cursor-help
                        ${kybStep >= step ? 'bg-primary text-white' : 'bg-gray-200'}`}
                      onClick={() => handleTooltipClick(id)}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent 
                    className="bg-white text-black border border-gray-200 shadow-lg p-2"
                    sideOffset={5}
                  >
                    <p className="font-medium">{t(label)}</p>
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
              <div className="space-y-1">
                <Input
                  placeholder={t("company.name")}
                  value={kybData.companyName}
                  onChange={(e) => {
                    setKybData({ ...kybData, companyName: e.target.value });
                    if (touched.companyName) validateCompanyInfo();
                  }}
                  onBlur={() => handleBlur('companyName')}
                  disabled={isSubmitting}
                  required
                  className={touched.companyName && errors.companyName ? "border-red-500" : ""}
                />
                {touched.companyName && errors.companyName && (
                  <p className="text-sm text-red-500">{errors.companyName}</p>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  placeholder={t("registration.number")}
                  value={kybData.registrationNumber}
                  onChange={(e) => {
                    setKybData({ ...kybData, registrationNumber: e.target.value });
                    if (touched.registrationNumber) validateCompanyInfo();
                  }}
                  onBlur={() => handleBlur('registrationNumber')}
                  disabled={isSubmitting}
                  required
                  className={touched.registrationNumber && errors.registrationNumber ? "border-red-500" : ""}
                />
                {touched.registrationNumber && errors.registrationNumber && (
                  <p className="text-sm text-red-500">{errors.registrationNumber}</p>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  placeholder={t("vat.number")}
                  value={kybData.vatNumber}
                  onChange={(e) => {
                    setKybData({ ...kybData, vatNumber: e.target.value });
                    if (touched.vatNumber) validateCompanyInfo();
                  }}
                  onBlur={() => handleBlur('vatNumber')}
                  disabled={isSubmitting}
                  className={touched.vatNumber && errors.vatNumber ? "border-red-500" : ""}
                />
                {touched.vatNumber && errors.vatNumber && (
                  <p className="text-sm text-red-500">{errors.vatNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("incorporation.date")}</Label>
                <Input
                  type="date"
                  value={kybData.incorporationDate}
                  onChange={(e) => {
                    setKybData({ ...kybData, incorporationDate: e.target.value });
                    if (touched.incorporationDate) validateCompanyInfo();
                  }}
                  onBlur={() => handleBlur('incorporationDate')}
                  disabled={isSubmitting}
                  required
                  className={touched.incorporationDate && errors.incorporationDate ? "border-red-500" : ""}
                />
                {touched.incorporationDate && errors.incorporationDate && (
                  <p className="text-sm text-red-500">{errors.incorporationDate}</p>
                )}
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
              <div className="space-y-1">
                <Input
                  placeholder={t("street.address")}
                  value={kybData.streetAddress}
                  onChange={(e) => {
                    setKybData({ ...kybData, streetAddress: e.target.value });
                    if (touched.streetAddress) validateCompanyAddress();
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, streetAddress: true }));
                    validateCompanyAddress();
                  }}
                  disabled={isSubmitting}
                  required
                  className={touched.streetAddress && errors.streetAddress ? "border-red-500" : ""}
                />
                {touched.streetAddress && errors.streetAddress && (
                  <p className="text-sm text-red-500">{errors.streetAddress}</p>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  placeholder={t("city")}
                  value={kybData.city}
                  onChange={(e) => {
                    setKybData({ ...kybData, city: e.target.value });
                    if (touched.city) validateCompanyAddress();
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, city: true }));
                    validateCompanyAddress();
                  }}
                  disabled={isSubmitting}
                  required
                  className={touched.city && errors.city ? "border-red-500" : ""}
                />
                {touched.city && errors.city && (
                  <p className="text-sm text-red-500">{errors.city}</p>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  placeholder={t("postal.code")}
                  value={kybData.postalCode}
                  onChange={(e) => {
                    setKybData({ ...kybData, postalCode: e.target.value });
                    if (touched.postalCode) validateCompanyAddress();
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, postalCode: true }));
                    validateCompanyAddress();
                  }}
                  disabled={isSubmitting}
                  required
                  className={touched.postalCode && errors.postalCode ? "border-red-500" : ""}
                />
                {touched.postalCode && errors.postalCode && (
                  <p className="text-sm text-red-500">{errors.postalCode}</p>
                )}
              </div>

              <div className="space-y-1">
                <select
                  className={`w-full h-10 px-3 py-2 text-base bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    touched.country && errors.country ? "border-red-500" : ""
                  }`}
                  value={kybData.country}
                  onChange={(e) => {
                    setKybData({ ...kybData, country: e.target.value });
                    if (touched.country) validateCompanyAddress();
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, country: true }));
                    validateCompanyAddress();
                  }}
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
                {touched.country && errors.country && (
                  <p className="text-sm text-red-500">{errors.country}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {kybStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t("legal.representative")}</h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <Input
                  placeholder={t("first.name")}
                  value={kybData.legalRepFirstName}
                  onChange={(e) => {
                    setKybData({ ...kybData, legalRepFirstName: e.target.value });
                    if (touched.legalRepFirstName) validateLegalRepresentative();
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, legalRepFirstName: true }));
                    validateLegalRepresentative();
                  }}
                  disabled={isSubmitting}
                  required
                  className={touched.legalRepFirstName && errors.legalRepFirstName ? "border-red-500" : ""}
                />
                {touched.legalRepFirstName && errors.legalRepFirstName && (
                  <p className="text-sm text-red-500">{errors.legalRepFirstName}</p>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  placeholder={t("last.name")}
                  value={kybData.legalRepLastName}
                  onChange={(e) => {
                    setKybData({ ...kybData, legalRepLastName: e.target.value });
                    if (touched.legalRepLastName) validateLegalRepresentative();
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, legalRepLastName: true }));
                    validateLegalRepresentative();
                  }}
                  disabled={isSubmitting}
                  required
                  className={touched.legalRepLastName && errors.legalRepLastName ? "border-red-500" : ""}
                />
                {touched.legalRepLastName && errors.legalRepLastName && (
                  <p className="text-sm text-red-500">{errors.legalRepLastName}</p>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  placeholder={t("position")}
                  value={kybData.legalRepPosition}
                  onChange={(e) => {
                    setKybData({ ...kybData, legalRepPosition: e.target.value });
                    if (touched.legalRepPosition) validateLegalRepresentative();
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, legalRepPosition: true }));
                    validateLegalRepresentative();
                  }}
                  disabled={isSubmitting}
                  required
                  className={touched.legalRepPosition && errors.legalRepPosition ? "border-red-500" : ""}
                />
                {touched.legalRepPosition && errors.legalRepPosition && (
                  <p className="text-sm text-red-500">{errors.legalRepPosition}</p>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  type="email"
                  placeholder={t("business.email")}
                  value={kybData.legalRepEmail}
                  onChange={(e) => {
                    setKybData({ ...kybData, legalRepEmail: e.target.value });
                    if (touched.legalRepEmail) validateLegalRepresentative();
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, legalRepEmail: true }));
                    validateLegalRepresentative();
                  }}
                  disabled={isSubmitting}
                  required
                  className={touched.legalRepEmail && errors.legalRepEmail ? "border-red-500" : ""}
                />
                {touched.legalRepEmail && errors.legalRepEmail && (
                  <p className="text-sm text-red-500">{errors.legalRepEmail}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("phone.number")}</Label>
                <Input
                  type="tel"
                  placeholder="+33612345678"
                  value={kybData.legalRepPhone}
                  onChange={(e) => {
                    setKybData({ ...kybData, legalRepPhone: e.target.value });
                    if (touched.legalRepPhone) validateLegalRepresentative();
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, legalRepPhone: true }));
                    validateLegalRepresentative();
                  }}
                  disabled={isSubmitting}
                  required
                  className={touched.legalRepPhone && errors.legalRepPhone ? "border-red-500" : ""}
                />
                {touched.legalRepPhone && errors.legalRepPhone && (
                  <p className="text-sm text-red-500">{errors.legalRepPhone}</p>
                )}
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
                  onChange={(e) => {
                    setKybData({ ...kybData, registrationDoc: e.target.files?.[0] || null });
                    if (touched.registrationDoc) validateDocuments();
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, registrationDoc: true }));
                    validateDocuments();
                  }}
                  disabled={isSubmitting}
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  className={touched.registrationDoc && errors.registrationDoc ? "border-red-500" : ""}
                />
                {touched.registrationDoc && errors.registrationDoc && (
                  <p className="text-sm text-red-500">{errors.registrationDoc}</p>
                )}
                <p className="text-sm text-gray-500">{t("registration.doc.hint")}</p>
              </div>

              <div className="space-y-2">
                <Label>{t("articles.association")}</Label>
                <Input
                  type="file"
                  onChange={(e) => {
                    setKybData({ ...kybData, articlesDoc: e.target.files?.[0] || null });
                    if (touched.articlesDoc) validateDocuments();
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, articlesDoc: true }));
                    validateDocuments();
                  }}
                  disabled={isSubmitting}
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  className={touched.articlesDoc && errors.articlesDoc ? "border-red-500" : ""}
                />
                {touched.articlesDoc && errors.articlesDoc && (
                  <p className="text-sm text-red-500">{errors.articlesDoc}</p>
                )}
                <p className="text-sm text-gray-500">{t("articles.doc.hint")}</p>
              </div>

              <div className="space-y-2">
                <Label>{t("financial.statements")}</Label>
                <Input
                  type="file"
                  onChange={(e) => {
                    setKybData({ ...kybData, financialDoc: e.target.files?.[0] || null });
                    if (touched.financialDoc) validateDocuments();
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, financialDoc: true }));
                    validateDocuments();
                  }}
                  disabled={isSubmitting}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className={touched.financialDoc && errors.financialDoc ? "border-red-500" : ""}
                />
                {touched.financialDoc && errors.financialDoc && (
                  <p className="text-sm text-red-500">{errors.financialDoc}</p>
                )}
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
                onChange={(e) => {
                  setWalletAddress(e.target.value);
                  if (touched.walletAddress) validateWalletAddress();
                }}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, walletAddress: true }));
                  validateWalletAddress();
                }}
                className={`font-mono ${touched.walletAddress && errors.walletAddress ? "border-red-500" : ""}`}
                disabled={isSubmitting}
                required
              />
              {touched.walletAddress && errors.walletAddress && (
                <p className="text-sm text-red-500">{errors.walletAddress}</p>
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
              <p className="text-sm text-gray-600 break-all overflow-wrap-anywhere">
                {t("reward.address.label")} {walletAddress}
              </p>
            </div>
            <Button 
              onClick={() => navigate('/')}
              className="mt-6"
            >
              {t("done")}
            </Button>
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