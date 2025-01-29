import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Building, Briefcase, Factory, Database, Shield, Check, X, Info, User, Users, Globe, Clock3, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLanguage } from "@/contexts/LanguageContext";
import countryList from 'react-select-country-list';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define a static list of country codes with their calling codes
const COUNTRY_CODES = [
  { code: "+1", country: "United States", id: "US" },
  { code: "+44", country: "United Kingdom", id: "GB" },
  { code: "+33", country: "France", id: "FR" },
  { code: "+49", country: "Germany", id: "DE" },
  { code: "+39", country: "Italy", id: "IT" },
  { code: "+34", country: "Spain", id: "ES" },
  { code: "+31", country: "Netherlands", id: "NL" },
  { code: "+32", country: "Belgium", id: "BE" },
  { code: "+41", country: "Switzerland", id: "CH" },
  { code: "+46", country: "Sweden", id: "SE" },
  { code: "+47", country: "Norway", id: "NO" },
  { code: "+45", country: "Denmark", id: "DK" },
  { code: "+358", country: "Finland", id: "FI" },
  { code: "+43", country: "Austria", id: "AT" },
  { code: "+351", country: "Portugal", id: "PT" },
  { code: "+353", country: "Ireland", id: "IE" },
  { code: "+30", country: "Greece", id: "GR" },
  { code: "+48", country: "Poland", id: "PL" },
  { code: "+420", country: "Czech Republic", id: "CZ" },
  { code: "+36", country: "Hungary", id: "HU" },
].sort((a, b) => a.country.localeCompare(b.country));

const stepIndicators = [
  { icon: Building, label: "company", step: 1 },
  { icon: Globe, label: "address", step: 2 },
  { icon: User, label: "representative", step: 3 },
  { icon: Database, label: "documents", step: 4 },
  { icon: Shield, label: "wallet", step: 5 },
  { icon: Check, label: "confirmation", step: 6 },
];

export const BusinessVerificationForm = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [kybStep, setKybStep] = useState(1);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("+1");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneSearchQuery, setPhoneSearchQuery] = useState("");
  
  const countries = useMemo(() => countryList().getData(), []);

  const filteredCountryCodes = COUNTRY_CODES.filter(country =>
    country.country.toLowerCase().includes(phoneSearchQuery.toLowerCase()) ||
    country.code.includes(phoneSearchQuery)
  );

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
    legalRepEmail: "",
    legalRepPhone: "",
    registrationDoc: null as File | null,
    articlesDoc: null as File | null,
    financialDoc: null as File | null,
    ownershipDoc: null as File | null,
  });

  const validateEVMAddress = (address: string) => {
    const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return evmAddressRegex.test(address);
  };

  const validatePhoneNumber = (phone: string) => {
    const cleanedNumber = phone.replace(/[^\d+]/g, '');
    const numberWithoutPlus = cleanedNumber.replace(/^\+/, '');
    return numberWithoutPlus.length >= 10 && numberWithoutPlus.length <= 12;
  };

  const filteredCountries = countries.filter(country =>
    country.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountrySelect = (countryValue: string) => {
    setKybData({ ...kybData, country: countryValue });
    setIsCountryModalOpen(false);
  };

  const handlePhoneCodeSelect = (code: string) => {
    setSelectedCountryCode(code);
    setIsPhoneModalOpen(false);
  };

  const getCountryCodeDisplay = (code: string) => {
    const country = COUNTRY_CODES.find(c => c.code === code);
    return country ? `${country.country} (${code})` : code;
  };

  const getCountryName = (countryValue: string) => {
    return countries.find(country => country.value === countryValue)?.label || t("select.country");
  };

  const handleKybNext = () => {
    if (kybStep === 1) {
      if (!kybData.companyName || !kybData.registrationNumber || !kybData.incorporationDate || !kybData.companyType) {
        toast({
          title: t("missing.info"),
          description: t("fill.required"),
          variant: "destructive",
        });
        return;
      }
    }

    if (kybStep === 2) {
      if (!kybData.streetAddress || !kybData.city || !kybData.postalCode || !kybData.country) {
        toast({
          title: t("missing.info"),
          description: t("fill.required"),
          variant: "destructive",
        });
        return;
      }
    }

    if (kybStep === 3) {
      if (!kybData.legalRepFirstName || !kybData.legalRepLastName || !kybData.legalRepPosition || 
          !kybData.legalRepEmail || !kybData.legalRepPhone) {
        toast({
          title: t("missing.info"),
          description: t("fill.required"),
          variant: "destructive",
        });
        return;
      }

      if (!validatePhoneNumber(kybData.legalRepPhone)) {
        toast({
          title: t("invalid.phone"),
          description: t("phone.format"),
          variant: "destructive",
        });
        return;
      }
    }

    if (kybStep === 4) {
      if (!kybData.registrationDoc || !kybData.articlesDoc) {
        toast({
          title: t("missing.info"),
          description: t("doc.instruction.1"),
          variant: "destructive",
        });
        return;
      }
    }

    if (kybStep === 5) {
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

    setKybStep(kybStep + 1);
  };

  const handleKybBack = () => {
    setKybStep(kybStep - 1);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: keyof typeof kybData) => {
    const file = event.target.files?.[0];
    if (file) {
      setKybData({ ...kybData, [type]: file });
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
            className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500 ease-in-out"
            style={{ width: `${(kybStep / 6) * 100}%` }}
          ></div>
        </div>

        <div className="flex justify-between mb-8">
          {stepIndicators.map(({ icon: Icon, label, step }) => (
            <div 
              key={`step-${step}`}
              className={`flex flex-col items-center ${kybStep >= step ? 'text-blue-500' : 'text-gray-400'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${kybStep >= step ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs">{t(label)}</span>
            </div>
          ))}
        </div>

        {kybStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t("company.info")}</h2>
            <div className="space-y-3">
              <Input
                placeholder={t("company.name")}
                value={kybData.companyName}
                onChange={(e) => setKybData({ ...kybData, companyName: e.target.value })}
                required
              />
              <Input
                placeholder={t("registration.number")}
                value={kybData.registrationNumber}
                onChange={(e) => setKybData({ ...kybData, registrationNumber: e.target.value })}
                required
              />
              <Input
                placeholder={t("vat.number")}
                value={kybData.vatNumber}
                onChange={(e) => setKybData({ ...kybData, vatNumber: e.target.value })}
              />
              <div className="space-y-2">
                <Label>{t("incorporation.date")}</Label>
                <Input
                  type="date"
                  value={kybData.incorporationDate}
                  onChange={(e) => setKybData({ ...kybData, incorporationDate: e.target.value })}
                  required
                />
              </div>
              <RadioGroup
                value={kybData.companyType}
                onValueChange={(value) => setKybData({ ...kybData, companyType: value })}
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
            <Button onClick={handleKybNext} className="w-full">{t("next.step")}</Button>
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
                required
              />
              <Input
                placeholder={t("city")}
                value={kybData.city}
                onChange={(e) => setKybData({ ...kybData, city: e.target.value })}
                required
              />
              <Input
                placeholder={t("postal.code")}
                value={kybData.postalCode}
                onChange={(e) => setKybData({ ...kybData, postalCode: e.target.value })}
                required
              />
              <Dialog 
                open={isCountryModalOpen} 
                onOpenChange={setIsCountryModalOpen}
                modal={true}
                onPointerDownOutside={(e) => e.preventDefault()}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isCountryModalOpen}
                    className="w-full justify-between"
                  >
                    {getCountryName(kybData.country)}
                    <Globe className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DialogTrigger>
                <DialogContent 
                  className="sm:max-w-[425px]"
                  onPointerDownOutside={(e) => e.preventDefault()}
                  onEscapeKeyDown={(e) => e.preventDefault()}
                >
                  <DialogHeader>
                    <DialogTitle>{t("select.country")}</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center border rounded-md px-3 py-2 mb-2">
                    <Search className="h-4 w-4 opacity-50 mr-2" />
                    <Input
                      placeholder={t("search.country")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-0 p-0 focus-visible:ring-0"
                    />
                  </div>
                  <ScrollArea className="max-h-[300px]">
                    <div className="grid gap-1">
                      {filteredCountries.map((country) => (
                        <Button
                          key={country.value}
                          variant="ghost"
                          className="w-full justify-start font-normal"
                          onClick={() => handleCountrySelect(country.value)}
                        >
                          <span>{country.label}</span>
                          {kybData.country === country.value && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex gap-4">
              <Button onClick={handleKybBack} variant="outline" className="flex-1">{t("back")}</Button>
              <Button onClick={handleKybNext} className="flex-1">{t("next.step")}</Button>
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
                required
              />
              <Input
                placeholder={t("last.name")}
                value={kybData.legalRepLastName}
                onChange={(e) => setKybData({ ...kybData, legalRepLastName: e.target.value })}
                required
              />
              <Input
                placeholder={t("position")}
                value={kybData.legalRepPosition}
                onChange={(e) => setKybData({ ...kybData, legalRepPosition: e.target.value })}
                required
              />
              <Input
                type="email"
                placeholder={t("business.email")}
                value={kybData.legalRepEmail}
                onChange={(e) => setKybData({ ...kybData, legalRepEmail: e.target.value })}
                required
              />
              <div className="space-y-2">
                <Label>{t("phone.number")}</Label>
                <Input
                  type="tel"
                  placeholder="+33612345678"
                  value={kybData.legalRepPhone}
                  onChange={(e) => setKybData({ ...kybData, legalRepPhone: e.target.value })}
                  required
                  className="flex-1"
                />
                <p className="text-sm text-gray-500">
                  {t("phone.international.format")}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button onClick={handleKybBack} variant="outline" className="flex-1">{t("back")}</Button>
              <Button onClick={handleKybNext} className="flex-1">{t("next.step")}</Button>
            </div>
          </div>
        )}

        {kybStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t("required.documents")}</h2>
            
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
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => document.getElementById('registrationDoc')?.click()}
              >
                <Database className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 font-medium">{t("certificate.incorporation")}</p>
                <p className="text-sm text-gray-500 mt-1">{t("registration.doc.hint")}</p>
                <input
                  id="registrationDoc"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'registrationDoc')}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
              {kybData.registrationDoc && (
                <p className="text-sm text-green-600 flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  {t("document.uploaded")}: {kybData.registrationDoc.name}
                </p>
              )}

              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => document.getElementById('articlesDoc')?.click()}
              >
                <Database className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 font-medium">{t("articles.association")}</p>
                <p className="text-sm text-gray-500 mt-1">{t("articles.doc.hint")}</p>
                <input
                  id="articlesDoc"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'articlesDoc')}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
              {kybData.articlesDoc && (
                <p className="text-sm text-green-600 flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  {t("document.uploaded")}: {kybData.articlesDoc.name}
                </p>
              )}

              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => document.getElementById('financialDoc')?.click()}
              >
                <Database className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 font-medium">{t("financial.statements")}</p>
                <p className="text-sm text-gray-500 mt-1">{t("financial.doc.hint")}</p>
                <input
                  id="financialDoc"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'financialDoc')}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
              {kybData.financialDoc && (
                <p className="text-sm text-green-600 flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  {t("document.uploaded")}: {kybData.financialDoc.name}
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <Button onClick={handleKybBack} variant="outline" className="flex-1">{t("back")}</Button>
              <Button onClick={handleKybNext} className="flex-1">{t("next.step")}</Button>
            </div>
          </div>
        )}

        {kybStep === 5 && (
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
              <Button onClick={handleKybBack} variant="outline" className="flex-1">{t("back")}</Button>
              <Button onClick={handleKybNext} className="flex-1">{t("finalize")}</Button>
            </div>
          </div>
        )}

        {kybStep === 6 && (
          <div className="text-center space-y-4">
            <Check className="mx-auto h-16 w-16 text-green-500" />
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
      </div>
    </Card>
  );
};