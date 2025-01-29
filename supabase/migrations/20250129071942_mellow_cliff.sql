/*
  # Verification System Schema

  1. New Tables
    - `kyc_verifications`
      - Stores individual verification data
      - Includes personal info, document references, and status
    - `kyb_verifications`
      - Stores business verification data
      - Includes company info, representative details, and status
    - `verification_documents`
      - Stores document metadata and references
      - Links to both KYC and KYB verifications
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure document access

  3. Changes
    - Initial schema creation
    - Set up verification status tracking
    - Document storage integration
*/

-- Create enum for verification status
CREATE TYPE verification_status AS ENUM (
  'pending',
  'in_review',
  'approved',
  'rejected'
);

-- Create enum for document types
CREATE TYPE document_type AS ENUM (
  'id_front',
  'id_back',
  'passport',
  'selfie',
  'registration',
  'articles',
  'financial',
  'ownership'
);

-- Create KYC verifications table
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  document_type text NOT NULL,
  document_number text NOT NULL,
  document_expiry date NOT NULL,
  wallet_address text NOT NULL,
  status verification_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create KYB verifications table
CREATE TABLE IF NOT EXISTS kyb_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  company_name text NOT NULL,
  registration_number text NOT NULL,
  vat_number text,
  incorporation_date date NOT NULL,
  company_type text NOT NULL,
  street_address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL,
  legal_rep_first_name text NOT NULL,
  legal_rep_last_name text NOT NULL,
  legal_rep_position text NOT NULL,
  legal_rep_email text NOT NULL,
  legal_rep_phone text NOT NULL,
  wallet_address text NOT NULL,
  status verification_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create verification documents table
CREATE TABLE IF NOT EXISTS verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_verification_id uuid REFERENCES kyc_verifications(id),
  kyb_verification_id uuid REFERENCES kyb_verifications(id),
  document_type document_type NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  CHECK (
    (kyc_verification_id IS NOT NULL AND kyb_verification_id IS NULL) OR
    (kyc_verification_id IS NULL AND kyb_verification_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyb_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for KYC verifications
CREATE POLICY "Users can view their own KYC verifications"
  ON kyc_verifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own KYC verifications"
  ON kyc_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for KYB verifications
CREATE POLICY "Users can view their own KYB verifications"
  ON kyb_verifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own KYB verifications"
  ON kyb_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for verification documents
CREATE POLICY "Users can view their own documents"
  ON verification_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM kyc_verifications kv
      WHERE kv.id = verification_documents.kyc_verification_id
      AND kv.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM kyb_verifications bv
      WHERE bv.id = verification_documents.kyb_verification_id
      AND bv.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own documents"
  ON verification_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kyc_verifications kv
      WHERE kv.id = verification_documents.kyc_verification_id
      AND kv.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM kyb_verifications bv
      WHERE bv.id = verification_documents.kyb_verification_id
      AND bv.user_id = auth.uid()
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_kyc_verifications_updated_at
  BEFORE UPDATE ON kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyb_verifications_updated_at
  BEFORE UPDATE ON kyb_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();