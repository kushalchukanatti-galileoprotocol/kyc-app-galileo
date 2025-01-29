// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation
export const validatePhoneNumber = (phone: string): boolean => {
  const cleanedNumber = phone.replace(/[^\d+]/g, '');
  const numberWithoutPlus = cleanedNumber.replace(/^\+/, '');
  return numberWithoutPlus.length >= 10 && numberWithoutPlus.length <= 12;
};

// EVM address validation
export const validateEVMAddress = (address: string): boolean => {
  const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return evmAddressRegex.test(address);
};

// Age validation (18+)
export const validateAge = (birthDate: string): boolean => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age >= 18;
};

// Document validation
export const validateDocument = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Invalid file type. Please upload a PDF, JPG, or PNG file.' 
    };
  }
  
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: 'File size exceeds 10MB limit.' 
    };
  }
  
  return { isValid: true };
};

// Company registration number validation (basic format)
export const validateRegistrationNumber = (number: string): boolean => {
  // This is a basic validation that ensures:
  // - At least 5 characters
  // - Only alphanumeric characters and dashes
  // You may want to customize this based on your specific requirements
  const regNumberRegex = /^[A-Za-z0-9-]{5,}$/;
  return regNumberRegex.test(number);
};

// VAT number validation (basic format for EU VAT numbers)
export const validateVATNumber = (vatNumber: string, countryCode: string): boolean => {
  if (!vatNumber) return true; // VAT number is optional
  
  // Basic EU VAT number format validation
  const vatFormats: { [key: string]: RegExp } = {
    FR: /^FR[0-9A-Z]{2}[0-9]{9}$/,
    GB: /^GB[0-9]{9}$|^GB[0-9]{12}$|^GBGD[0-9]{3}$|^GBHA[0-9]{3}$/,
    DE: /^DE[0-9]{9}$/,
    IT: /^IT[0-9]{11}$/,
    ES: /^ES[A-Z0-9][0-9]{7}[A-Z0-9]$/,
    // Add more country formats as needed
  };

  const format = vatFormats[countryCode];
  if (!format) return true; // If country format is not defined, skip validation
  
  return format.test(vatNumber);
};

// Postal code validation by country
export const validatePostalCode = (postalCode: string, countryCode: string): boolean => {
  const postalCodeFormats: { [key: string]: RegExp } = {
    FR: /^[0-9]{5}$/,
    GB: /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i,
    DE: /^[0-9]{5}$/,
    IT: /^[0-9]{5}$/,
    ES: /^[0-9]{5}$/,
    US: /^[0-9]{5}(-[0-9]{4})?$/,
    // Add more country formats as needed
  };

  const format = postalCodeFormats[countryCode];
  if (!format) return true; // If country format is not defined, skip validation
  
  return format.test(postalCode);
};