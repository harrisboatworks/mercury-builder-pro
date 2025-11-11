# Financing Application - Troubleshooting Guide

## Table of Contents
1. [Email Issues](#email-issues)
2. [Application Saving Issues](#application-saving-issues)
3. [Resume Link Issues](#resume-link-issues)
4. [Validation Errors](#validation-errors)
5. [Admin Dashboard Issues](#admin-dashboard-issues)
6. [SIN Encryption Issues](#sin-encryption-issues)
7. [PDF Export Issues](#pdf-export-issues)
8. [Mobile Layout Issues](#mobile-layout-issues)
9. [Authentication Issues](#authentication-issues)
10. [Database Issues](#database-issues)
11. [Edge Function Issues](#edge-function-issues)
12. [Performance Issues](#performance-issues)

---

## Email Issues

### Problem: Confirmation Email Not Received

**Symptoms**:
- User submits application but doesn't receive confirmation email
- Admin notification email not received

**Possible Causes**:
1. Email in spam/junk folder
2. Invalid email address
3. Resend API rate limit exceeded
4. Edge function error
5. RESEND_API_KEY not configured

**Debugging Steps**:

1. **Check Spam Folder**
   - Ask user to check spam/junk folder
   - Add sender email to contacts

2. **Verify Email Address**
   ```sql
   -- Check the email address in database
   SELECT email, submitted_at FROM financing_applications 
   WHERE id = '[application-id]';
   ```

3. **Check Edge Function Logs**
   - Go to Supabase Dashboard → Edge Functions
   - Select `send-financing-confirmation-email`
   - View recent logs
   - Look for errors

4. **Verify Resend API Key**
   ```sql
   -- Check if secret exists
   SELECT name FROM secrets WHERE name = 'RESEND_API_KEY';
   ```

5. **Check Rate Limiting**
   ```sql
   -- Check recent email attempts
   SELECT * FROM security_audit_log 
   WHERE action = 'send_confirmation_email' 
   AND created_at > now() - interval '15 minutes'
   ORDER BY created_at DESC;
   ```

**Solutions**:

✅ **If email is valid but not delivered**:
- Manually resend using admin dashboard
- Check Resend dashboard for delivery status

✅ **If rate limit exceeded**:
- Wait 15 minutes and retry
- Increase rate limit in edge function

✅ **If API key missing**:
```bash
# Add secret in Supabase Dashboard → Settings → Vault
RESEND_API_KEY=your_actual_api_key
```

✅ **If edge function error**:
- Check function logs for stack trace
- Verify function is deployed
- Redeploy function if needed

---

### Problem: Resume Email Not Sending

**Symptoms**:
- User clicks "Save & Continue Later"
- No email received with resume link

**Debugging Steps**:

1. **Check Application Resume Token**
   ```sql
   SELECT id, email, resume_token, resume_token_expires_at 
   FROM financing_applications 
   WHERE email = '[user-email]' 
   ORDER BY created_at DESC LIMIT 1;
   ```

2. **Check Edge Function Logs**
   - Navigate to `send-financing-resume-email` function logs
   - Look for errors related to token generation

3. **Verify APP_URL Secret**
   ```sql
   SELECT name FROM secrets WHERE name = 'APP_URL';
   ```

**Solutions**:

✅ **If resume_token is NULL**:
```sql
-- Generate new token
UPDATE financing_applications 
SET 
  resume_token = gen_random_uuid()::text,
  resume_token_expires_at = now() + interval '7 days'
WHERE id = '[application-id]';
```

✅ **If APP_URL is missing**:
```bash
# Add in Supabase Dashboard → Settings → Vault
APP_URL=https://yourdomain.com
```

✅ **Manually generate resume link**:
```
https://yourdomain.com/financing/resume/[resume-token]
```

---

## Application Saving Issues

### Problem: Auto-Save Not Working

**Symptoms**:
- User's progress is lost when they refresh
- "Saving..." indicator never disappears
- Error messages in console

**Debugging Steps**:

1. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for JavaScript errors
   - Check Network tab for failed requests

2. **Verify User Authentication**
   ```javascript
   // Check in browser console
   localStorage.getItem('supabase.auth.token')
   ```

3. **Check RLS Policies**
   ```sql
   -- Verify user can insert/update
   SELECT * FROM financing_applications 
   WHERE user_id = auth.uid();
   ```

4. **Check Database Connection**
   - Supabase Dashboard → Database → Connection pooler
   - Verify database is online

**Solutions**:

✅ **If user is not authenticated**:
- Prompt user to sign in
- Applications require authentication to save

✅ **If localStorage is full**:
```javascript
// Clear old data in browser console
localStorage.removeItem('financing_application_draft');
```

✅ **If RLS policy error**:
```sql
-- Grant user proper access
INSERT INTO user_roles (user_id, role) 
VALUES ('[user-id]', 'user'::app_role)
ON CONFLICT (user_id) DO NOTHING;
```

✅ **If network error**:
- Check internet connection
- Retry after connection is restored
- Data should be in localStorage

---

### Problem: Data Lost After Refresh

**Symptoms**:
- User fills out form and refreshes
- All data is gone

**Debugging Steps**:

1. **Check localStorage**
   ```javascript
   // In browser console
   JSON.parse(localStorage.getItem('financing_application_draft'));
   ```

2. **Check Database**
   ```sql
   SELECT * FROM financing_applications 
   WHERE user_id = '[user-id]' 
   AND status = 'draft'
   ORDER BY updated_at DESC LIMIT 1;
   ```

3. **Check for JavaScript Errors**
   - Browser console for errors
   - Could be blocking state hydration

**Solutions**:

✅ **If data is in localStorage**:
- Reload page, data should restore
- Check FinancingContext hydration logic

✅ **If data is in database but not loading**:
```typescript
// Check useEffect in FinancingContext
useEffect(() => {
  // Ensure this is fetching on mount
  loadFromDatabase();
}, []);
```

✅ **If data is truly lost**:
- User must re-enter information
- Implement better error handling
- Add periodic backup reminders

---

## Resume Link Issues

### Problem: Resume Link Not Working

**Symptoms**:
- User clicks resume link in email
- "Application not found" or "Invalid token" error
- Redirects to homepage

**Debugging Steps**:

1. **Verify Token in URL**
   ```
   /financing/resume/[token-should-be-here]
   ```

2. **Check Token in Database**
   ```sql
   SELECT id, email, resume_token, resume_token_expires_at, status 
   FROM financing_applications 
   WHERE resume_token = '[token-from-url]';
   ```

3. **Check Token Expiration**
   ```sql
   SELECT 
     resume_token, 
     resume_token_expires_at, 
     CASE 
       WHEN resume_token_expires_at < now() THEN 'Expired'
       ELSE 'Valid'
     END as status
   FROM financing_applications 
   WHERE resume_token = '[token]';
   ```

**Solutions**:

✅ **If token is expired**:
```sql
-- Generate new token and send new email
UPDATE financing_applications 
SET 
  resume_token = gen_random_uuid()::text,
  resume_token_expires_at = now() + interval '7 days'
WHERE id = '[application-id]';
```
Then manually send new resume email.

✅ **If application was submitted**:
- Resume links don't work for submitted applications
- User should sign in to view submitted application

✅ **If token is missing from URL**:
- Email link was truncated
- Resend resume email
- Ensure email client doesn't break links

---

## Validation Errors

### Problem: Form Won't Submit - Validation Errors

**Symptoms**:
- Submit button doesn't work
- Red error messages appear
- Form highlights invalid fields

**Common Validation Errors**:

#### SIN Format Error
**Error**: "Invalid SIN format. Must be 9 digits."
**Solution**:
- Enter exactly 9 digits
- Remove hyphens (system adds them automatically)
- Example: `123456789` not `123-456-789`

#### Email Format Error
**Error**: "Invalid email address"
**Solution**:
- Ensure valid email format: `user@example.com`
- No spaces
- Include @ and domain

#### Phone Number Error
**Error**: "Invalid phone number"
**Solution**:
- Format: `(123) 456-7890` or `123-456-7890`
- Must be 10 digits (North American format)
- Include area code

#### Date of Birth Error
**Error**: "Must be 18 years or older"
**Solution**:
- Applicant must be at least 18 years old
- Double-check date format

#### Income Error
**Error**: "Gross annual income must be greater than 0"
**Solution**:
- Enter your total annual income before taxes
- Include all sources (salary, bonuses, commissions)

**Debugging Validation**:

1. **Check Zod Schema**
   ```typescript
   // In src/lib/financingValidation.ts
   // Find the specific schema for the failing step
   ```

2. **Check Browser Console**
   - Look for specific validation error messages
   - Will show which field is failing

3. **Test in Isolation**
   ```typescript
   // Test schema directly in browser console
   import { applicantSchema } from '@/lib/financingValidation';
   applicantSchema.parse({
     // your test data
   });
   ```

---

## Admin Dashboard Issues

### Problem: Admin Dashboard Not Loading

**Symptoms**:
- Blank page
- "Access Denied" error
- Infinite loading spinner

**Debugging Steps**:

1. **Verify Admin Role**
   ```sql
   SELECT user_id, role FROM user_roles 
   WHERE user_id = auth.uid();
   ```

2. **Check RLS Policies**
   ```sql
   -- Test policy manually
   SET role authenticated;
   SET request.jwt.claims TO '{"sub": "[user-id]", "role": "authenticated"}';
   
   SELECT * FROM financing_applications LIMIT 1;
   ```

3. **Check Browser Console**
   - Look for 403 Forbidden errors
   - Look for JavaScript errors

**Solutions**:

✅ **If user is not admin**:
```sql
-- Grant admin role
INSERT INTO user_roles (user_id, role) 
VALUES ('[user-id]', 'admin'::app_role)
ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::app_role;
```

✅ **If RLS policy error**:
```sql
-- Verify admin policy exists
SELECT * FROM pg_policies 
WHERE tablename = 'financing_applications' 
AND policyname LIKE '%admin%';
```

✅ **If JavaScript error**:
- Check edge function deployment
- Verify Supabase client configuration
- Clear browser cache

---

### Problem: Application Details Not Displaying

**Symptoms**:
- Can view list but can't open details
- Modal opens but shows no data
- Some tabs are empty

**Debugging Steps**:

1. **Check Application Data**
   ```sql
   SELECT * FROM financing_applications 
   WHERE id = '[application-id]';
   ```

2. **Check Browser Console**
   - Look for data fetching errors
   - Check Network tab for failed requests

3. **Verify Foreign Key Relationships**
   ```sql
   -- Check if user still exists
   SELECT a.id, a.user_id, u.id as user_exists 
   FROM financing_applications a 
   LEFT JOIN auth.users u ON a.user_id = u.id 
   WHERE a.id = '[application-id]';
   ```

**Solutions**:

✅ **If data is incomplete**:
- Some tabs may be empty for incomplete applications
- This is expected for draft applications

✅ **If user was deleted**:
- Data is orphaned
- Consider implementing soft delete for users

✅ **If JSONB fields corrupted**:
```sql
-- Check for invalid JSON
SELECT id, existing_loans 
FROM financing_applications 
WHERE existing_loans IS NOT NULL 
AND jsonb_typeof(existing_loans) != 'array';
```

---

### Problem: Pending Count Not Updating

**Symptoms**:
- Badge shows wrong number
- Badge doesn't update in real-time

**Debugging Steps**:

1. **Check Actual Count**
   ```sql
   SELECT COUNT(*) FROM financing_applications 
   WHERE status = 'pending';
   ```

2. **Check Real-time Subscription**
   - Look for WebSocket connection errors in console
   - Verify Supabase realtime is enabled

3. **Test Subscription**
   ```typescript
   // In browser console
   supabase
     .channel('financing-changes')
     .on('postgres_changes', {
       event: '*',
       schema: 'public',
       table: 'financing_applications',
       filter: 'status=eq.pending'
     }, console.log)
     .subscribe();
   ```

**Solutions**:

✅ **If realtime is disabled**:
- Enable in Supabase Dashboard → Database → Replication
- Add `financing_applications` to replicated tables

✅ **If subscription error**:
```typescript
// Check subscription status
const channel = supabase.channel('test');
console.log(channel.state); // Should be 'joined'
```

✅ **If count is wrong**:
- Refresh page
- Clear cache
- Count may be cached on CDN

---

## SIN Encryption Issues

### Problem: Cannot Encrypt SIN

**Symptoms**:
- Error when submitting application
- "SIN encryption failed" error

**Debugging Steps**:

1. **Check pgsodium Extension**
   ```sql
   SELECT extname, extversion FROM pg_extension 
   WHERE extname = 'pgsodium';
   ```

2. **Check Encryption Key**
   ```sql
   SELECT * FROM pgsodium.key 
   WHERE name = 'sin-encryption-key';
   ```

3. **Test Encryption Function**
   ```sql
   SELECT encrypt_sin('123456789');
   ```

**Solutions**:

✅ **If pgsodium not installed**:
```sql
-- Install extension
CREATE EXTENSION IF NOT EXISTS pgsodium;
```

✅ **If encryption key missing**:
```sql
-- Function should create it automatically
SELECT get_sin_encryption_key();
```

✅ **If function error**:
- Check function definition in database
- Redeploy migration
- Check function logs

---

### Problem: Cannot Decrypt SIN (Admin)

**Symptoms**:
- Admin tries to view SIN
- "Unauthorized" error
- Decryption fails

**Debugging Steps**:

1. **Verify Admin Role**
   ```sql
   SELECT has_role(auth.uid(), 'admin'::app_role);
   -- Should return true
   ```

2. **Check Audit Log**
   ```sql
   SELECT * FROM sin_audit_log 
   WHERE user_id = auth.uid() 
   ORDER BY created_at DESC LIMIT 10;
   ```

3. **Test Decryption**
   ```sql
   -- This should work for admins
   SELECT decrypt_sin('[encrypted-value]');
   ```

**Solutions**:

✅ **If not admin**:
```sql
-- Grant admin role
INSERT INTO user_roles (user_id, role) 
VALUES (auth.uid(), 'admin'::app_role);
```

✅ **If function error**:
- Check `decrypt_sin` function definition
- Verify security definer is set
- Check pgsodium key exists

✅ **If encryption key lost**:
- **CRITICAL**: This is a major issue
- Encrypted data cannot be recovered without key
- Contact database administrator immediately

---

## PDF Export Issues

### Problem: PDF Export Fails

**Symptoms**:
- "Export PDF" button doesn't work
- Error message appears
- PDF downloads but is blank/corrupted

**Debugging Steps**:

1. **Check Browser Console**
   - Look for JavaScript errors
   - Check if @react-pdf/renderer is loaded

2. **Test PDF Generation**
   ```typescript
   // In browser console
   import { PDFDownloadLink } from '@react-pdf/renderer';
   // Check if component exists
   ```

3. **Check Application Data**
   ```sql
   -- Ensure all required fields exist
   SELECT id, first_name, last_name, motor_model, purchase_price 
   FROM financing_applications 
   WHERE id = '[application-id]';
   ```

**Solutions**:

✅ **If @react-pdf/renderer error**:
- Check package is installed: `npm list @react-pdf/renderer`
- Reinstall if needed: `npm install @react-pdf/renderer`

✅ **If data is incomplete**:
- PDF may fail if required fields are NULL
- Add null checks in PDF component

✅ **If PDF is blank**:
- Check PDF component styling
- Verify fonts are loaded
- Test with minimal data first

✅ **Browser compatibility**:
- Some browsers block PDF generation
- Try different browser
- Try "Download" instead of "Open in new tab"

---

## Mobile Layout Issues

### Problem: Layout Broken on Mobile

**Symptoms**:
- Inputs too small
- Text overlaps
- Buttons not clickable
- Horizontal scrolling

**Debugging Steps**:

1. **Check Viewport Meta Tag**
   ```html
   <!-- In index.html -->
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   ```

2. **Test Responsive Design**
   - Open Chrome DevTools (F12)
   - Toggle device toolbar (Ctrl+Shift+M)
   - Test different screen sizes

3. **Check CSS Media Queries**
   ```css
   /* Verify mobile styles exist */
   @media (max-width: 768px) {
     /* Mobile styles */
   }
   ```

**Solutions**:

✅ **If viewport is missing**:
- Add viewport meta tag to index.html

✅ **If elements are too small**:
```css
/* Ensure touch targets are at least 44x44px */
.button {
  min-height: 44px;
  min-width: 44px;
}
```

✅ **If horizontal scroll**:
```css
/* Check for fixed widths */
body {
  overflow-x: hidden;
}
```

✅ **If inputs are zooming**:
```css
/* Prevent iOS zoom on focus */
input, select, textarea {
  font-size: 16px; /* Minimum to prevent zoom */
}
```

---

## Authentication Issues

### Problem: User Cannot Sign In

**Symptoms**:
- "Invalid credentials" error
- Infinite loading on login
- Session expires immediately

**Debugging Steps**:

1. **Check Supabase Auth Status**
   - Supabase Dashboard → Authentication
   - Verify service is running

2. **Test Authentication**
   ```typescript
   // In browser console
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'test@example.com',
     password: 'test123'
   });
   console.log(data, error);
   ```

3. **Check Email Confirmation**
   ```sql
   SELECT id, email, email_confirmed_at 
   FROM auth.users 
   WHERE email = '[user-email]';
   ```

**Solutions**:

✅ **If email not confirmed**:
```sql
-- Confirm email manually (testing only)
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = '[user-email]';
```

✅ **If password is wrong**:
- Use "Forgot Password" flow
- Reset password via Supabase Dashboard (admin only)

✅ **If session expires immediately**:
- Check browser cookies are enabled
- Check if localStorage is accessible
- Try incognito mode

✅ **If infinite loading**:
- Check network tab for failed requests
- Verify SUPABASE_URL and SUPABASE_ANON_KEY
- Check CORS configuration

---

## Database Issues

### Problem: Slow Query Performance

**Symptoms**:
- Application list takes long to load
- Dashboard feels sluggish
- Timeouts on large queries

**Debugging Steps**:

1. **Check Query Performance**
   ```sql
   -- Enable query timing
   EXPLAIN ANALYZE 
   SELECT * FROM financing_applications 
   WHERE status = 'pending' 
   ORDER BY created_at DESC 
   LIMIT 25;
   ```

2. **Check Indexes**
   ```sql
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'financing_applications';
   ```

3. **Check Database Size**
   ```sql
   SELECT pg_size_pretty(pg_database_size('postgres'));
   ```

**Solutions**:

✅ **If missing indexes**:
```sql
-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_financing_applications_status 
ON financing_applications(status);

CREATE INDEX IF NOT EXISTS idx_financing_applications_created_at 
ON financing_applications(created_at DESC);
```

✅ **If table is large**:
- Implement pagination
- Archive old applications
- Use materialized views

✅ **If connection pool exhausted**:
- Increase connection pool size in Supabase settings
- Optimize queries to use fewer connections
- Implement connection pooling in application

---

### Problem: RLS Policy Blocking Legitimate Access

**Symptoms**:
- "permission denied" errors
- User cannot access own data
- Admin cannot view applications

**Debugging Steps**:

1. **Check Current Policies**
   ```sql
   SELECT policyname, cmd, qual, with_check 
   FROM pg_policies 
   WHERE tablename = 'financing_applications';
   ```

2. **Test Policy Manually**
   ```sql
   -- Set role and test
   SET role authenticated;
   SET request.jwt.claims TO '{"sub": "[user-id]"}';
   
   SELECT * FROM financing_applications 
   WHERE user_id = '[user-id]';
   ```

3. **Check User Role**
   ```sql
   SELECT * FROM user_roles WHERE user_id = '[user-id]';
   ```

**Solutions**:

✅ **If user role missing**:
```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('[user-id]', 'user'::app_role);
```

✅ **If policy is too restrictive**:
```sql
-- Review and update policy
DROP POLICY IF EXISTS "old_policy_name" ON financing_applications;
CREATE POLICY "new_policy_name" ON financing_applications
FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
```

---

## Edge Function Issues

### Problem: Edge Function Not Responding

**Symptoms**:
- Email not sending
- Function times out
- 500 Internal Server Error

**Debugging Steps**:

1. **Check Function Deployment**
   - Supabase Dashboard → Edge Functions
   - Verify function is deployed and active

2. **Check Function Logs**
   - View recent invocations
   - Look for error stack traces

3. **Test Function Manually**
   ```bash
   curl -X POST https://[project-ref].supabase.co/functions/v1/[function-name] \
     -H "Authorization: Bearer [anon-key]" \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

**Solutions**:

✅ **If function not deployed**:
```bash
# Deploy from local
supabase functions deploy [function-name]
```

✅ **If function error**:
- Check logs for specific error
- Fix code and redeploy
- Test locally first

✅ **If timeout**:
- Optimize function code
- Reduce external API calls
- Implement caching

---

## Performance Issues

### Problem: Application Loads Slowly

**Symptoms**:
- Initial page load > 5 seconds
- Blank screen before content appears
- Large JavaScript bundle size

**Debugging Steps**:

1. **Run Lighthouse Audit**
   - Chrome DevTools → Lighthouse
   - Run performance audit
   - Review recommendations

2. **Check Bundle Size**
   ```bash
   npm run build
   # Check output for bundle sizes
   ```

3. **Check Network Waterfall**
   - DevTools → Network tab
   - Look for slow requests
   - Check for blocking resources

**Solutions**:

✅ **If bundle is too large**:
```typescript
// Implement code splitting
const AdminDashboard = lazy(() => import('./AdminDashboard'));
```

✅ **If images are large**:
- Compress images
- Use WebP format
- Implement lazy loading

✅ **If too many API calls**:
- Batch requests
- Implement caching
- Use React Query

✅ **If database is slow**:
- Add indexes
- Optimize queries
- Implement pagination

---

## Emergency Procedures

### Critical Production Issue

**If the application is down or critically broken**:

1. **Assess Severity**
   - Is it affecting all users or just some?
   - Is data at risk?
   - Is it a security issue?

2. **Immediate Actions**
   - Check status of Supabase project
   - Check edge function logs
   - Review recent deployments

3. **Communication**
   - Notify users (status page or email)
   - Alert admin team
   - Document the issue

4. **Rollback if Necessary**
   ```bash
   # Revert to previous deployment
   git revert [commit-hash]
   git push
   ```

5. **Post-Mortem**
   - Document what went wrong
   - Implement fixes
   - Update runbook

---

## Getting Additional Help

### Support Channels

1. **Technical Documentation**
   - `FINANCING_APPLICATION_TECHNICAL_DOCS.md`
   - `FINANCING_APPLICATION_ADMIN_GUIDE.md`

2. **Contact Development Team**
   - Email: dev@[company].com
   - Slack: #financing-app-support

3. **Supabase Support**
   - For database/infrastructure issues
   - https://supabase.com/support

4. **Escalation Path**
   - Level 1: This troubleshooting guide
   - Level 2: Technical lead
   - Level 3: Database administrator
   - Level 4: Supabase support

---

*Last Updated: 2025-01-11*
