# Financing Application - Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Component Hierarchy](#component-hierarchy)
3. [Database Schema](#database-schema)
4. [Edge Functions](#edge-functions)
5. [SIN Encryption](#sin-encryption)
6. [Email System](#email-system)
7. [Authentication & Authorization](#authentication--authorization)
8. [Performance Optimization](#performance-optimization)

---

## Architecture Overview

The Financing Application is a multi-step form system built with React, TypeScript, and Supabase. It consists of 7 sequential steps that guide users through a complete credit application process.

### Key Design Principles
- **Progressive Enhancement**: Each step builds on the previous one
- **State Persistence**: Auto-save to localStorage and database
- **Security First**: SIN encryption, RLS policies, admin-only access
- **Mobile Responsive**: Optimized for all screen sizes
- **Real-time Validation**: Zod schemas for type-safe validation

### 7-Step Flow
1. **Purchase Details**: Motor selection and pricing
2. **Primary Applicant**: Personal information
3. **Employment Information**: Current and previous employment
4. **Financial Information**: Income, expenses, assets, liabilities
5. **Co-Applicant**: Optional second applicant
6. **References**: Personal and professional references
7. **Review & Submit**: Final review and digital signature

---

## Component Hierarchy

```
FinancingApplication (Page)
├── FinancingProvider (Context)
│   ├── State Management (useReducer)
│   ├── localStorage Auto-save
│   └── Database Auto-save
├── FormProgressIndicator
│   ├── Progress Bar
│   └── Step Counter
├── Step Components
│   ├── PurchaseDetailsStep
│   ├── ApplicantStep
│   ├── EmploymentStep
│   ├── FinancialStep
│   ├── CoApplicantStep
│   ├── ReferencesStep
│   └── ReviewSubmitStep
├── SaveForLaterDialog
└── LoadingOverlay
```

### Key Components

#### `FinancingProvider` (`src/contexts/FinancingContext.tsx`)
- Manages global state for the entire application
- Implements `useReducer` for predictable state updates
- Auto-saves to localStorage every 30 seconds
- Auto-saves to database every 60 seconds
- Provides helper functions: `isStepComplete()`, `canAccessStep()`, `saveToDatabase()`

#### Step Components (`src/components/financing/`)
- Each step is a self-contained component
- Uses React Hook Form for form management
- Implements Zod validation schemas
- Conditional field rendering based on answers
- Mobile-optimized navigation

#### `MobileFormNavigation` (`src/components/financing/MobileFormNavigation.tsx`)
- Sticky bottom navigation for mobile devices
- Back/Next buttons with step validation
- Progress indicator
- Auto-hides on desktop

---

## Database Schema

### `financing_applications` Table

```sql
CREATE TABLE financing_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Purchase Details
  motor_model TEXT,
  purchase_price NUMERIC(10, 2),
  down_payment NUMERIC(10, 2),
  trade_in_value NUMERIC(10, 2),
  
  -- Primary Applicant
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  sin_encrypted TEXT, -- Encrypted SIN
  address_street TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_province TEXT NOT NULL,
  address_postal_code TEXT NOT NULL,
  years_at_address INTEGER,
  residential_status TEXT,
  monthly_housing_cost NUMERIC(10, 2),
  
  -- Employment
  employment_status TEXT NOT NULL,
  employer_name TEXT,
  occupation TEXT,
  years_employed NUMERIC(4, 2),
  employer_phone TEXT,
  gross_annual_income NUMERIC(12, 2),
  previous_employer_name TEXT,
  previous_years_employed NUMERIC(4, 2),
  
  -- Financial
  other_income_source TEXT,
  other_income_amount NUMERIC(12, 2),
  total_monthly_expenses NUMERIC(10, 2),
  total_assets NUMERIC(12, 2),
  total_liabilities NUMERIC(12, 2),
  existing_loans JSONB,
  bankruptcy_history BOOLEAN DEFAULT false,
  bankruptcy_details TEXT,
  
  -- Co-Applicant (Optional)
  has_co_applicant BOOLEAN DEFAULT false,
  co_first_name TEXT,
  co_last_name TEXT,
  co_email TEXT,
  co_phone TEXT,
  co_date_of_birth DATE,
  co_sin_encrypted TEXT,
  co_relationship TEXT,
  co_employment_status TEXT,
  co_employer_name TEXT,
  co_gross_annual_income NUMERIC(12, 2),
  
  -- References
  personal_reference_name TEXT,
  personal_reference_phone TEXT,
  personal_reference_relationship TEXT,
  professional_reference_name TEXT,
  professional_reference_phone TEXT,
  professional_reference_relationship TEXT,
  
  -- Consent & Signature
  consent_credit_check BOOLEAN DEFAULT false,
  consent_terms BOOLEAN DEFAULT false,
  digital_signature TEXT,
  signature_date TIMESTAMPTZ,
  ip_address INET,
  
  -- Application Status
  status TEXT DEFAULT 'draft',
  current_step INTEGER DEFAULT 1,
  resume_token TEXT UNIQUE,
  resume_token_expires_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  
  -- Admin Fields
  admin_notes TEXT,
  notes_history JSONB DEFAULT '[]'::jsonb,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

### Indexes
```sql
CREATE INDEX idx_financing_applications_user_id ON financing_applications(user_id);
CREATE INDEX idx_financing_applications_status ON financing_applications(status);
CREATE INDEX idx_financing_applications_resume_token ON financing_applications(resume_token);
CREATE INDEX idx_financing_applications_email ON financing_applications(email);
```

### Row Level Security (RLS)

#### Policy: Users can view their own applications
```sql
CREATE POLICY "Users can view own applications"
ON financing_applications FOR SELECT
USING (auth.uid() = user_id);
```

#### Policy: Users can insert their own applications
```sql
CREATE POLICY "Users can insert own applications"
ON financing_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### Policy: Users can update their own draft applications
```sql
CREATE POLICY "Users can update own drafts"
ON financing_applications FOR UPDATE
USING (auth.uid() = user_id AND status = 'draft');
```

#### Policy: Admins can view all applications
```sql
CREATE POLICY "Admins view all"
ON financing_applications FOR SELECT
USING (has_role(auth.uid(), 'admin'));
```

#### Policy: Admins can update all applications
```sql
CREATE POLICY "Admins update all"
ON financing_applications FOR UPDATE
USING (has_role(auth.uid(), 'admin'));
```

### `financing_application_status_history` Table

```sql
CREATE TABLE financing_application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES financing_applications(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Edge Functions

### 1. `send-financing-resume-email`

**Purpose**: Sends a "resume your application" email to users who save their progress.

**Location**: `supabase/functions/send-financing-resume-email/index.ts`

**Input Payload**:
```typescript
{
  applicationId: string;
  email: string;
  applicantName?: string;
  completedSteps: number;
}
```

**Process**:
1. Validate request payload
2. Check rate limit (10 requests per 15 minutes per email)
3. Fetch `resume_token` from database
4. Generate resume URL with token
5. Send email via Resend API
6. Return success/error response

**Rate Limiting**: `check_rate_limit('email', 'send_resume_email', 10, 15)`

**Email Template**: Uses shared `createEmailTemplate()` helper

**Environment Variables**:
- `RESEND_API_KEY`
- `APP_URL`

---

### 2. `send-financing-confirmation-email`

**Purpose**: Sends confirmation emails to applicant and admin upon application submission.

**Location**: `supabase/functions/send-financing-confirmation-email/index.ts`

**Input Payload**:
```typescript
{
  applicationId: string;
  applicantEmail: string;
  applicantName: string;
  motorModel: string;
  purchasePrice: number;
  submittedAt: string;
  sendAdminNotification?: boolean;
}
```

**Process**:
1. Validate request payload
2. Check rate limit (5 requests per 15 minutes per email)
3. Generate reference number from application ID
4. Send confirmation email to applicant
5. Optionally send admin notification email
6. Return success/error response

**Rate Limiting**: `check_rate_limit('email', 'send_confirmation_email', 5, 15)`

**Environment Variables**:
- `RESEND_API_KEY`
- `ADMIN_EMAIL`
- `APP_URL`

---

## SIN Encryption

### Implementation

The Social Insurance Number (SIN) is encrypted using Supabase's pgsodium extension with AES-256 deterministic encryption.

### Database Functions

#### `get_sin_encryption_key()`
```sql
CREATE OR REPLACE FUNCTION public.get_sin_encryption_key()
RETURNS uuid AS $$
DECLARE
  key_id UUID;
BEGIN
  SELECT id INTO key_id
  FROM pgsodium.key
  WHERE name = 'sin-encryption-key'
  LIMIT 1;
  
  IF key_id IS NULL THEN
    INSERT INTO pgsodium.key (name, status, key_type, key_context)
    VALUES ('sin-encryption-key', 'valid', 'aead-det', 'public')
    RETURNING id INTO key_id;
  END IF;
  
  RETURN key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### `encrypt_sin(sin_plaintext TEXT)`
```sql
CREATE OR REPLACE FUNCTION public.encrypt_sin(sin_plaintext text)
RETURNS text AS $$
DECLARE
  key_id UUID;
  encrypted_value BYTEA;
BEGIN
  key_id := public.get_sin_encryption_key();
  
  encrypted_value := pgsodium.crypto_aead_det_encrypt(
    sin_plaintext::BYTEA,
    NULL,
    key_id
  );
  
  RETURN encode(encrypted_value, 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### `decrypt_sin(sin_encrypted TEXT)`
```sql
CREATE OR REPLACE FUNCTION public.decrypt_sin(sin_encrypted text)
RETURNS text AS $$
DECLARE
  key_id UUID;
  decrypted_value BYTEA;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Only admins can decrypt
  IF NOT public.has_role(current_user_id, 'admin'::app_role) THEN
    INSERT INTO public.sin_audit_log (user_id, action, created_at)
    VALUES (current_user_id, 'decrypt_denied', now());
    
    RAISE EXCEPTION 'Unauthorized: Only admins can decrypt SIN data';
  END IF;
  
  key_id := public.get_sin_encryption_key();
  
  decrypted_value := pgsodium.crypto_aead_det_decrypt(
    decode(sin_encrypted, 'base64'),
    NULL,
    key_id
  );
  
  INSERT INTO public.sin_audit_log (user_id, action, created_at)
  VALUES (current_user_id, 'decrypt_success', now());
  
  RETURN convert_from(decrypted_value, 'UTF8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Client-Side Usage

#### Encryption (in `src/lib/sinEncryption.ts`)
```typescript
import { supabase } from '@/integrations/supabase/client';

export async function encryptSIN(sin: string): Promise<string> {
  const cleanSIN = sin.replace(/\D/g, '');
  
  if (cleanSIN.length !== 9) {
    throw new Error('Invalid SIN format');
  }
  
  const { data, error } = await supabase.rpc('encrypt_sin', {
    sin_plaintext: cleanSIN
  });
  
  if (error) throw error;
  return data;
}
```

#### Decryption (Admin Only)
```typescript
export async function decryptSIN(encryptedSIN: string): Promise<string> {
  const { data, error } = await supabase.rpc('decrypt_sin', {
    sin_encrypted: encryptedSIN
  });
  
  if (error) throw error;
  
  // Format as XXX-XXX-XXX
  return data.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
}
```

### Audit Logging

All SIN decryption attempts are logged in the `sin_audit_log` table:

```sql
CREATE TABLE sin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'decrypt_attempt', 'decrypt_success', 'decrypt_denied'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Email System

### Architecture

The email system uses **Resend** API for transactional emails with shared template helpers.

### Email Template Helper (`supabase/functions/_shared/email-template.ts`)

```typescript
export function createEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                ${content}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
```

### Email Types

#### 1. Resume Application Email
- **Trigger**: User clicks "Save & Continue Later"
- **Recipient**: Applicant
- **Subject**: "Continue Your Financing Application"
- **Content**: Personalized resume link with progress indicator
- **Token Expiry**: 7 days

#### 2. Confirmation Email (Applicant)
- **Trigger**: Application submission
- **Recipient**: Applicant
- **Subject**: "Financing Application Received - [Reference #]"
- **Content**: Application summary, reference number, next steps
- **Includes**: Contact information, timeline expectations

#### 3. Admin Notification Email
- **Trigger**: Application submission
- **Recipient**: Admin/Sales team
- **Subject**: "New Financing Application - [Applicant Name]"
- **Content**: Application summary, applicant details, direct link to admin dashboard
- **Priority**: High

### Rate Limiting

All email edge functions implement rate limiting:
- **Resume Email**: 10 requests per 15 minutes per email
- **Confirmation Email**: 5 requests per 15 minutes per email

Rate limiting uses the `check_rate_limit()` database function.

---

## Authentication & Authorization

### User Authentication

- Uses Supabase Auth with email/password
- Google OAuth available
- Session management with automatic refresh
- Secure session storage

### Authorization Levels

#### 1. Anonymous Users
- Can view financing application form
- Cannot save progress without account
- Cannot submit application without account

#### 2. Authenticated Users
- Can create and save applications
- Can resume saved applications
- Can submit applications
- Can view their own applications

#### 3. Admin Users
- All authenticated user permissions
- Can view all applications
- Can update application status
- Can add admin notes
- Can decrypt SINs (with audit logging)
- Can export applications to PDF

### Role Management

Roles are managed in the `user_roles` table:

```sql
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role app_role NOT NULL
);

CREATE TYPE app_role AS ENUM ('user', 'admin');
```

Helper function to check roles:

```sql
CREATE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

## Performance Optimization

### Database Optimization

#### Indexes
- Primary indexes on all foreign keys
- Composite index on `(user_id, status)` for fast filtering
- Index on `resume_token` for quick lookups
- Index on `email` for admin searches

#### Query Optimization
- Use `.select()` with specific columns instead of `*`
- Implement pagination for admin dashboard (25 records per page)
- Use `.single()` for single record queries

### Frontend Optimization

#### Code Splitting
- Lazy load admin components
- Separate route chunks for each step
- Dynamic imports for large dependencies

#### State Management
- Debounced auto-save (30s localStorage, 60s database)
- Optimistic UI updates
- Minimal re-renders with React.memo

#### Form Performance
- Controlled components with debounced validation
- Zod schema validation (fast and type-safe)
- Conditional field rendering reduces DOM nodes

### Asset Optimization

#### Images
- WebP format for all images
- Lazy loading with `loading="lazy"`
- Responsive images with `srcset`

#### Fonts
- System font stack for body text
- Preload critical fonts
- Font subsetting for smaller file sizes

---

## Development Guidelines

### Adding a New Field

1. **Update Database Schema**: Add column to `financing_applications` table
2. **Update Zod Schema**: Add validation rule in `src/lib/financingValidation.ts`
3. **Update TypeScript Interfaces**: Add to `FinancingState` in `FinancingContext.tsx`
4. **Update Form Component**: Add input field to appropriate step component
5. **Update Review Component**: Add to `ReviewSubmitStep.tsx`
6. **Update PDF Export**: Add to `FinancingApplicationPDF.tsx`
7. **Test**: Validate, save, resume, submit, and view in admin dashboard

### Adding a New Step

1. **Create Step Component**: `src/components/financing/NewStep.tsx`
2. **Update Context**: Add to `currentStep` logic in `FinancingContext.tsx`
3. **Update Progress Indicator**: Add step to `FormProgressIndicator.tsx`
4. **Update Navigation**: Update step count in `FinancingApplication.tsx`
5. **Add Routing**: Update route logic if needed
6. **Test Navigation**: Ensure back/next buttons work correctly

### Security Checklist for New Features

- [ ] RLS policies updated
- [ ] Input validation with Zod
- [ ] XSS protection (sanitize inputs)
- [ ] CSRF protection (Supabase handles this)
- [ ] Rate limiting on edge functions
- [ ] Audit logging for sensitive operations
- [ ] Encrypt sensitive data (like SIN)
- [ ] Admin-only operations verified

---

## Testing Guidelines

### Unit Tests
- Zod validation schemas
- Utility functions (SIN formatting, encryption)
- Helper functions

### Integration Tests
- Form step navigation
- Auto-save functionality
- Resume application flow
- Email delivery

### E2E Tests
- Complete application submission
- Admin dashboard operations
- Mobile responsive behavior

### Security Tests
- RLS policy enforcement
- SIN encryption/decryption
- Admin access control
- Rate limiting

---

## Troubleshooting

### Common Issues

#### Auto-save not working
- Check browser localStorage quota
- Verify Supabase connection
- Check console for errors

#### Email not sending
- Verify RESEND_API_KEY is set
- Check rate limiting
- Verify recipient email format

#### SIN encryption failing
- Ensure pgsodium extension is enabled
- Verify encryption key exists
- Check function permissions

#### Admin dashboard not loading
- Verify user has admin role
- Check RLS policies
- Verify edge function deployment

---

## Future Enhancements

### Planned Features
- Multi-language support (French)
- PDF application upload
- Document verification integration
- Credit score integration
- Real-time collaboration for co-applicants
- Mobile app (React Native)
- E-signature integration (DocuSign)
- Analytics dashboard

### Technical Debt
- Migrate to React Query for data fetching
- Implement service worker for offline support
- Add comprehensive error boundaries
- Improve accessibility (ARIA labels)
- Add Storybook for component documentation

---

## Version History

- **v1.0.0** (Current): Initial release with 7-step form, SIN encryption, email notifications, and admin dashboard
- **v0.9.0**: Beta release for internal testing
- **v0.8.0**: Alpha release with core functionality

---

## Support & Contact

For technical support or questions about this implementation:
- **Developer Documentation**: This file
- **Admin Guide**: `FINANCING_APPLICATION_ADMIN_GUIDE.md`
- **User Guide**: `FINANCING_APPLICATION_USER_GUIDE.md`
- **Troubleshooting**: `FINANCING_TROUBLESHOOTING.md`

---

*Last Updated: 2025-01-11*
