import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to upload a file to Supabase Storage
export const uploadFile = async (
  file: File,
  bucket: string,
  path: string
): Promise<string | null> => {
  try {
    console.log(`Uploading file to ${bucket}/${path}`);

    // First check if the bucket exists
    const { data: bucketExists } = await supabase.storage.getBucket(bucket);
    
    if (!bucketExists) {
      console.log('Bucket does not exist, creating...');
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf']
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        throw createError;
      }
    }

    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    return data.path;
  } catch (error) {
    console.error('Error in uploadFile:', error);
    throw error; // Re-throw to handle in the calling function
  }
};

// Helper function to save KYC verification data
export const saveKYCVerification = async (
  userId: string,
  data: any,
  documents: { [key: string]: File | null }
) => {
  try {
    console.log('Starting KYC verification for user:', userId);

    // Start by creating the KYC verification record
    const { data: verification, error: verificationError } = await supabase
      .from('kyc_verifications')
      .insert([{
        user_id: userId,
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth,
        email: data.email,
        phone: data.phone,
        document_type: data.documentType,
        document_number: data.documentNumber,
        document_expiry: data.documentExpiry,
        wallet_address: data.walletAddress,
        status: 'pending'
      }])
      .select()
      .single();

    if (verificationError) {
      console.error('Error creating verification record:', verificationError);
      throw verificationError;
    }

    console.log('Created verification record:', verification.id);

    // Upload documents and create document records
    const documentUploads = Object.entries(documents).map(async ([type, file]) => {
      if (!file) {
        console.log(`No file provided for ${type}, skipping`);
        return null;
      }

      try {
        const path = `${userId}/${verification.id}/${type}/${file.name}`;
        console.log(`Uploading ${type} document:`, path);
        
        const filePath = await uploadFile(file, 'verifications', path);
        if (!filePath) {
          throw new Error(`Failed to upload ${type} document`);
        }

        console.log(`Successfully uploaded ${type} document:`, filePath);

        return supabase
          .from('verification_documents')
          .insert([{
            kyc_verification_id: verification.id,
            document_type: type,
            file_path: filePath,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type
          }]);
      } catch (error) {
        console.error(`Error uploading ${type} document:`, error);
        throw error;
      }
    });

    const uploadResults = await Promise.all(documentUploads.filter(Boolean));
    console.log('All documents uploaded successfully');

    return verification;
  } catch (error) {
    console.error('Error in saveKYCVerification:', error);
    throw error;
  }
};

// Helper function to save KYB verification data
export const saveKYBVerification = async (
  userId: string,
  data: any,
  documents: { [key: string]: File }
) => {
  try {
    // Start by creating the KYB verification record
    const { data: verification, error: verificationError } = await supabase
      .from('kyb_verifications')
      .insert([{
        user_id: userId,
        company_name: data.companyName,
        registration_number: data.registrationNumber,
        vat_number: data.vatNumber,
        incorporation_date: data.incorporationDate,
        company_type: data.companyType,
        street_address: data.streetAddress,
        city: data.city,
        postal_code: data.postalCode,
        country: data.country,
        legal_rep_first_name: data.legalRepFirstName,
        legal_rep_last_name: data.legalRepLastName,
        legal_rep_position: data.legalRepPosition,
        legal_rep_email: data.legalRepEmail,
        legal_rep_phone: data.legalRepPhone,
        wallet_address: data.walletAddress,
        status: 'pending'
      }])
      .select()
      .single();

    if (verificationError) throw verificationError;

    // Upload documents and create document records
    const documentUploads = Object.entries(documents).map(async ([type, file]) => {
      if (!file) return null;

      const path = `${userId}/${verification.id}/${type}/${file.name}`;
      const filePath = await uploadFile(file, 'verifications', path);

      if (!filePath) throw new Error(`Failed to upload ${type} document`);

      return supabase
        .from('verification_documents')
        .insert([{
          kyb_verification_id: verification.id,
          document_type: type,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type
        }]);
    });

    await Promise.all(documentUploads.filter(Boolean));

    return verification;
  } catch (error) {
    console.error('Error saving KYB verification:', error);
    throw error;
  }
};