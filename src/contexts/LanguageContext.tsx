import React, { createContext, useContext, useState } from "react";

type LanguageContextType = {
  language: "en" | "fr";
  setLanguage: (lang: "en" | "fr") => void;
  t: (key: string) => string;
};

type TranslationType = {
  [key: string]: string;
};

const translations: Record<"en" | "fr", TranslationType> = {
  en: {
    // Header
    "individual.verification": "Individual Verification",
    "business.verification": "Business Verification",
    
    // KYC Page
    "kyc.title": "Individual Verification (KYC)",
    "kyc.subtitle": "Complete your personal verification process securely and easily.",
    
    // KYB Page
    "kyb.title": "Business Verification (KYB)",
    "kyb.subtitle": "Complete your business verification process securely and efficiently.",
    
    // Company Info
    "company.info": "Company Information",
    "company.name": "Company Name",
    "registration.number": "Registration Number",
    "vat.number": "VAT Number (optional)",
    "incorporation.date": "Date of Incorporation",
    "llc": "LLC",
    "corporation": "Corporation",
    
    // Address
    "company.address": "Company Address",
    "street.address": "Street Address",
    "city": "City",
    "postal.code": "Postal Code",
    "select.country": "Select Country",
    "search.country": "Search country...",
    
    // Legal Representative
    "legal.representative": "Legal Representative",
    "position": "Position",
    "business.email": "Business Email",
    "phone.number": "Phone Number",
    "select.country.code": "Select Country Code",
    "search.country.or.code": "Search country or code...",
    "phone.format.hint": "Format: numbers only, no spaces (e.g., 2025550123)",
    "phone.international.format": "Enter phone number with country code (e.g., +33612345678)",
    
    // Documents
    "required.documents": "Required Documents",
    "document.guidelines": "Document Guidelines",
    "doc.instruction.1": "Documents must be clear and complete",
    "doc.instruction.2": "Accepted formats: PDF, JPG, PNG (max 10MB)",
    "doc.instruction.3": "Documents must be current and valid",
    "doc.instruction.4": "Non-English documents require certified translation",
    "certificate.incorporation": "Certificate of Incorporation",
    "registration.doc.hint": "Recent business registration document",
    "articles.association": "Articles of Association",
    "articles.doc.hint": "Current version of company bylaws",
    "financial.statements": "Financial Statements (optional)",
    "financial.doc.hint": "Latest balance sheet and income statement",
    "document.uploaded": "Document uploaded",
    
    // Wallet
    "wallet.instruction.1": "Please enter your wallet address to receive the registration reward.",
    "wallet.instruction.2": "Address must be a valid EVM address",
    "evm.address": "EVM Address",
    "wallet.format.hint": "Address must start with '0x' and contain 42 characters",
    "finalize": "Finalize",
    
    // Common
    "next.step": "Next Step",
    "back": "Back",
    "submit": "Submit",
    "missing.info": "Missing Information",
    "fill.required": "Please fill in all required fields.",
    "invalid.phone": "Invalid Phone Format",
    "invalid.address": "Invalid Address Format",
    "file.uploaded": "File Uploaded",
    "file.success": "Your document has been uploaded successfully.",
    
    // Confirmation
    "verification.submitted": "Verification Submitted",
    "review.message": "We will review your information and get back to you shortly.",
    "processing.time": "Estimated Processing Time",
    "processing.details": "Your verification typically takes 3-5 business days. You will receive an email once your verification is complete.",
    "reward.address.label": "Reward Address:",

    // Individual Verification Form
    "id.card.front": "Front of ID Card",
    "id.card.front.hint": "Ensure photo and information are clearly visible",
    "id.card.back": "Back of ID Card",
    "id.card.back.hint": "Signature and MRZ code must be clearly visible",
    "selfie.hint": "Photo must be recent and look like you",
    "doc.number": "Document Number",
    "doc.expiry": "Document Expiry Date",
    "personal.info": "Personal Information",
    "id.verification": "ID Verification",
    "selfie.verification": "Selfie Verification",
    "reward.address": "Reward Address",
    "first.name": "First Name",
    "last.name": "Last Name",
    "date.of.birth": "Date of Birth",
    "email": "Email Address",
    "selfie.instructions": "Selfie Instructions",
    "selfie.instruction.1": "Ensure you are in a well-lit area",
    "selfie.instruction.2": "Look directly at the camera",
    "selfie.instruction.3": "Your face should be centered and clearly visible",
    "selfie.instruction.4": "Don't wear sunglasses or hats",
    "selfie.instruction.5": "Avoid dark or cluttered backgrounds",
    "take.selfie": "Take a selfie for verification",
    "min.age": "Minimum Age Required",
    "age.requirement": "You must be at least 18 years old to continue."
  },
  fr: {
    // Header
    "individual.verification": "Vérification Individuelle",
    "business.verification": "Vérification Entreprise",
    
    // KYC Page
    "kyc.title": "Vérification Individuelle (KYC)",
    "kyc.subtitle": "Complétez votre processus de vérification personnelle de manière sécurisée et facile.",
    
    // KYB Page
    "kyb.title": "Vérification Entreprise (KYB)",
    "kyb.subtitle": "Complétez votre processus de vérification d'entreprise de manière sécurisée et efficace.",
    
    // Company Info
    "company.info": "Informations de l'entreprise",
    "company.name": "Nom de l'entreprise",
    "registration.number": "Numéro d'enregistrement",
    "vat.number": "Numéro de TVA (optionnel)",
    "incorporation.date": "Date de création",
    "llc": "SARL",
    "corporation": "SA",
    
    // Address
    "company.address": "Adresse de l'entreprise",
    "street.address": "Adresse",
    "city": "Ville",
    "postal.code": "Code postal",
    "select.country": "Sélectionner le pays",
    "search.country": "Rechercher un pays...",
    
    // Legal Representative
    "legal.representative": "Représentant légal",
    "position": "Fonction",
    "business.email": "Email professionnel",
    "phone.number": "Numéro de téléphone",
    "select.country.code": "Sélectionner l'indicatif",
    "search.country.or.code": "Rechercher pays ou indicatif...",
    "phone.format.hint": "Format : chiffres uniquement, sans espaces (ex: 0612345678)",
    "phone.international.format": "Entrez le numéro avec l'indicatif pays (ex: +33612345678)",
    
    // Documents
    "required.documents": "Documents requis",
    "document.guidelines": "Instructions pour les documents",
    "doc.instruction.1": "Les documents doivent être clairs et complets",
    "doc.instruction.2": "Formats acceptés : PDF, JPG, PNG (max 10MB)",
    "doc.instruction.3": "Les documents doivent être en cours de validité",
    "doc.instruction.4": "Les documents non francophones nécessitent une traduction certifiée",
    "certificate.incorporation": "Extrait Kbis",
    "registration.doc.hint": "Document d'enregistrement récent",
    "articles.association": "Statuts",
    "articles.doc.hint": "Version actuelle des statuts",
    "financial.statements": "États financiers (optionnel)",
    "financial.doc.hint": "Dernier bilan et compte de résultat",
    "document.uploaded": "Document téléchargé",
    
    // Wallet
    "wallet.instruction.1": "Veuillez saisir l'adresse du portefeuille pour recevoir la récompense.",
    "wallet.instruction.2": "L'adresse doit être une adresse EVM valide",
    "evm.address": "Adresse EVM",
    "wallet.format.hint": "L'adresse doit commencer par '0x' et contenir 42 caractères",
    "finalize": "Finaliser",
    
    // Common
    "next.step": "Étape suivante",
    "back": "Retour",
    "submit": "Soumettre",
    "missing.info": "Informations manquantes",
    "fill.required": "Veuillez remplir tous les champs obligatoires.",
    "invalid.phone": "Format de téléphone invalide",
    "invalid.address": "Format d'adresse invalide",
    "file.uploaded": "Fichier téléchargé",
    "file.success": "Votre document a été téléchargé avec succès.",
    
    // Confirmation
    "verification.submitted": "Vérification soumise",
    "review.message": "Nous examinerons vos informations et reviendrons vers vous rapidement.",
    "processing.time": "Délai de traitement estimé",
    "processing.details": "La vérification de votre dossier prend généralement entre 3 et 5 jours ouvrés. Vous recevrez un email dès que votre vérification sera terminée.",
    "reward.address.label": "Adresse de récompense :",

    // Individual Verification Form
    "id.card.front": "Recto de la carte d'identité",
    "id.card.front.hint": "La photo et les informations doivent être clairement visibles",
    "id.card.back": "Verso de la carte d'identité",
    "id.card.back.hint": "La signature et le code MRZ doivent être clairement visibles",
    "selfie.hint": "La photo doit être récente et vous ressembler",
    "doc.number": "Numéro du document",
    "doc.expiry": "Date d'expiration",
    "personal.info": "Informations personnelles",
    "id.verification": "Vérification d'identité",
    "selfie.verification": "Vérification des selfies",
    "reward.address": "Adresse de récompense",
    "first.name": "Prénom",
    "last.name": "Nom",
    "date.of.birth": "Date de naissance",
    "email": "Adresse email",
    "selfie.instructions": "Instructions pour le selfie",
    "selfie.instruction.1": "Assurez-vous d'être dans un endroit bien éclairé",
    "selfie.instruction.2": "Regardez directement vers la caméra",
    "selfie.instruction.3": "Votre visage doit être centré et clairement visible",
    "selfie.instruction.4": "Ne portez pas de lunettes de soleil ou de chapeau",
    "selfie.instruction.5": "Évitez les arrière-plans trop sombres ou encombrés",
    "take.selfie": "Prenez un selfie pour la vérification",
    "min.age": "Âge minimum requis",
    "age.requirement": "Vous devez avoir au moins 18 ans pour continuer."
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<"en" | "fr">("en");

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};