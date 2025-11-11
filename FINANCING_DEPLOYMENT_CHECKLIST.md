# Financing Application - Deployment Checklist

## Pre-Deployment Checklist

### Environment Configuration

#### Supabase Secrets
- [ ] `RESEND_API_KEY` - Resend API key for email delivery
- [ ] `APP_URL` - Production application URL (e.g., https://yourdomain.com)
- [ ] `ADMIN_EMAIL` - Email address(es) for admin notifications (comma-separated if multiple)
- [ ] `SUPABASE_URL` - Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

#### Verify Environment Variables
```bash
# Run this in Supabase dashboard SQL editor to check:
SELECT name FROM secrets;
```

---

### Database Setup

#### Tables Created
- [ ] `financing_applications` - Main applications table
- [ ] `financing_application_status_history` - Status change audit trail
- [ ] `sin_audit_log` - SIN decryption audit log
- [ ] `user_roles` - Admin role management
- [ ] `profiles` - User profile information

#### Indexes Verified
- [ ] `idx_financing_applications_user_id`
- [ ] `idx_financing_applications_status`
- [ ] `idx_financing_applications_resume_token`
- [ ] `idx_financing_applications_email`

#### RLS Policies Enabled
- [ ] Users can view own applications
- [ ] Users can insert own applications
- [ ] Users can update own draft applications
- [ ] Admins can view all applications
- [ ] Admins can update all applications
- [ ] Status history is readable by authorized users only

#### Database Functions Deployed
- [ ] `get_sin_encryption_key()` - Returns encryption key ID
- [ ] `encrypt_sin(text)` - Encrypts SIN values
- [ ] `decrypt_sin(text)` - Decrypts SIN values (admin only)
- [ ] `log_financing_status_change()` - Trigger function for status history
- [ ] `check_rate_limit()` - Rate limiting for edge functions
- [ ] `has_role()` - Check user roles

#### Triggers Active
- [ ] `log_financing_status_change` trigger on `financing_applications`
- [ ] `update_updated_at_column` trigger on `financing_applications`

---

### Edge Functions Deployment

#### Functions Deployed
- [ ] `send-financing-resume-email` - Resume link emails
- [ ] `send-financing-confirmation-email` - Confirmation emails

#### Function Configuration (`supabase/config.toml`)
```toml
[functions.send-financing-resume-email]
verify_jwt = false

[functions.send-financing-confirmation-email]
verify_jwt = false
```

#### Test Edge Functions
```bash
# Test resume email function
curl -X POST https://[project-ref].supabase.co/functions/v1/send-financing-resume-email \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "test-id",
    "email": "test@example.com",
    "applicantName": "Test User",
    "completedSteps": 3
  }'

# Test confirmation email function
curl -X POST https://[project-ref].supabase.co/functions/v1/send-financing-confirmation-email \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "test-id",
    "applicantEmail": "test@example.com",
    "applicantName": "Test User",
    "motorModel": "150 HP EXLPT",
    "purchasePrice": 25000,
    "submittedAt": "2025-01-11T12:00:00Z",
    "sendAdminNotification": false
  }'
```

---

### SIN Encryption Verification

#### pgsodium Extension Enabled
- [ ] pgsodium extension is installed
- [ ] Encryption key is created and stored
- [ ] Test encryption works:

```sql
-- Test encryption
SELECT encrypt_sin('123456789');
-- Should return base64 encoded string

-- Test decryption (admin only)
SELECT decrypt_sin('[encrypted_value_from_above]');
-- Should return '123-456-789'
```

#### Audit Logging Active
- [ ] `sin_audit_log` table exists
- [ ] Decrypt function logs all attempts
- [ ] Admin-only access enforced

---

### Email Configuration

#### Resend API Setup
- [ ] Resend account created
- [ ] Domain verified (for production)
- [ ] API key generated and added to secrets
- [ ] Test email sent successfully

#### Email Templates Tested
- [ ] Resume application email renders correctly
- [ ] Confirmation email (applicant) renders correctly
- [ ] Admin notification email renders correctly
- [ ] All links in emails work
- [ ] Emails display correctly on desktop and mobile

#### Email Deliverability
- [ ] SPF record configured
- [ ] DKIM record configured
- [ ] DMARC record configured (recommended)
- [ ] Test emails delivered to inbox (not spam)

---

### Admin Dashboard

#### Admin Role Setup
- [ ] At least one admin user created
- [ ] Admin role assigned in `user_roles` table

```sql
-- Create admin user role
INSERT INTO user_roles (user_id, role)
VALUES ('[admin-user-id]', 'admin'::app_role);
```

#### Dashboard Features Working
- [ ] Application list loads
- [ ] Status filters work
- [ ] Search functionality works
- [ ] Application details modal opens
- [ ] All tabs in detail modal display correctly
- [ ] Status updates work
- [ ] Admin notes save successfully
- [ ] PDF export generates correctly
- [ ] Pending count badge updates in real-time

---

### Security Verification

#### Run Supabase Linter
```bash
# In Supabase dashboard, run:
SELECT * FROM lint_security();
```

- [ ] Review all warnings
- [ ] Critical issues resolved
- [ ] Acceptable warnings documented

#### Security Tests

##### RLS Policy Testing
- [ ] Non-admin cannot view others' applications
- [ ] Non-admin cannot update others' applications
- [ ] Admin can view all applications
- [ ] Admin can update any application
- [ ] Status history is protected

##### Rate Limiting Tests
- [ ] Resume email rate limit works (10/15min)
- [ ] Confirmation email rate limit works (5/15min)
- [ ] Rate limit blocks excessive requests

##### Input Validation
- [ ] XSS protection on all inputs (test with `<script>alert('XSS')</script>`)
- [ ] SQL injection protection (test with `'; DROP TABLE--`)
- [ ] Zod validation enforced on all steps

##### Authentication Tests
- [ ] Unauthenticated users cannot save applications
- [ ] Unauthenticated users cannot submit applications
- [ ] Session timeout works correctly
- [ ] Auto-save respects authentication state

---

### Frontend Deployment

#### Build Production Bundle
```bash
npm run build
# or
bun run build
```

- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No console warnings in production build

#### Performance Checks
- [ ] Lighthouse score > 90 (Performance)
- [ ] Lighthouse score > 90 (Accessibility)
- [ ] Lighthouse score > 90 (Best Practices)
- [ ] Lighthouse score > 90 (SEO)

#### Browser Compatibility
- [ ] Chrome (latest) - Tested
- [ ] Firefox (latest) - Tested
- [ ] Safari (latest) - Tested
- [ ] Edge (latest) - Tested
- [ ] Mobile Safari (iOS) - Tested
- [ ] Mobile Chrome (Android) - Tested

---

### Mobile Responsiveness

#### Test All Steps on Mobile
- [ ] Step 1: Purchase Details - Responsive
- [ ] Step 2: Applicant Info - Responsive
- [ ] Step 3: Employment - Responsive
- [ ] Step 4: Financial - Responsive
- [ ] Step 5: Co-Applicant - Responsive
- [ ] Step 6: References - Responsive
- [ ] Step 7: Review & Submit - Responsive

#### Mobile Navigation
- [ ] Sticky bottom navigation works
- [ ] Back/Next buttons work
- [ ] Progress indicator visible
- [ ] Save button accessible

#### Mobile Forms
- [ ] All inputs touch-friendly (minimum 44x44px)
- [ ] Keyboard appropriate for input type (numeric, email, etc.)
- [ ] Dropdowns work on mobile
- [ ] Date pickers work on mobile
- [ ] No horizontal scrolling

---

### End-to-End Testing

#### Complete Application Flow
- [ ] Start new application from quote
- [ ] Complete Step 1 (Purchase Details)
- [ ] Complete Step 2 (Applicant Info)
- [ ] Complete Step 3 (Employment)
- [ ] Complete Step 4 (Financial)
- [ ] Skip Step 5 (Co-Applicant)
- [ ] Complete Step 6 (References)
- [ ] Review and submit Step 7
- [ ] Confirmation message displayed
- [ ] Confirmation email received
- [ ] Admin notification email received
- [ ] Application appears in admin dashboard

#### Save & Resume Flow
- [ ] Click "Save & Continue Later" on Step 3
- [ ] Enter email and save
- [ ] Resume email received
- [ ] Click resume link in email
- [ ] Application resumes at Step 3
- [ ] Complete remaining steps
- [ ] Submit successfully

#### Admin Dashboard Flow
- [ ] Admin logs in
- [ ] Views all applications
- [ ] Filters by status (Pending)
- [ ] Opens application details
- [ ] Reviews all tabs
- [ ] Updates status to "Under Review"
- [ ] Adds admin note
- [ ] Exports to PDF
- [ ] PDF opens and displays correctly
- [ ] Status history shows change

---

### Performance Benchmarks

#### Page Load Times (Target)
- [ ] Application page: < 2 seconds
- [ ] Admin dashboard: < 3 seconds
- [ ] Application detail modal: < 1 second

#### API Response Times (Target)
- [ ] Save application: < 500ms
- [ ] Submit application: < 1s
- [ ] Send email: < 2s
- [ ] Load dashboard: < 1s

#### Database Query Performance
- [ ] Application list query: < 200ms
- [ ] Application detail query: < 100ms
- [ ] Status update: < 100ms

---

### Monitoring & Logging

#### Supabase Monitoring
- [ ] Database connection pool configured
- [ ] Query performance dashboard reviewed
- [ ] Edge function logs accessible
- [ ] Error tracking enabled

#### Application Monitoring
- [ ] Sentry or error tracking tool configured (optional)
- [ ] Logging implemented for critical actions
- [ ] Admin actions logged
- [ ] Email send status logged

---

### Documentation

#### Documentation Complete
- [ ] `FINANCING_APPLICATION_TECHNICAL_DOCS.md` - Complete
- [ ] `FINANCING_APPLICATION_ADMIN_GUIDE.md` - Complete
- [ ] `FINANCING_APPLICATION_USER_GUIDE.md` - Complete
- [ ] `FINANCING_TROUBLESHOOTING.md` - Complete
- [ ] `FINANCING_COMPLIANCE.md` - Complete
- [ ] `FINANCING_PERFORMANCE.md` - Complete
- [ ] `PHASE_A_TESTING_REPORT.md` - Complete

#### Team Training
- [ ] Admin staff trained on dashboard
- [ ] Support staff trained on troubleshooting
- [ ] Legal/compliance reviewed documentation

---

### Compliance

#### PIPEDA Compliance
- [ ] Privacy policy updated
- [ ] Consent forms legally reviewed
- [ ] Data retention policy implemented
- [ ] Data access procedures documented
- [ ] Secure deletion procedures in place

#### Financial Compliance
- [ ] Credit check authorization documented
- [ ] Digital signature legally binding
- [ ] Record retention meets regulations (7 years)
- [ ] Audit trail complete

---

### Backup & Recovery

#### Database Backups
- [ ] Automatic daily backups enabled
- [ ] Backup retention policy configured (30 days)
- [ ] Test restore from backup
- [ ] Backup encryption enabled

#### Disaster Recovery
- [ ] Recovery Time Objective (RTO) documented
- [ ] Recovery Point Objective (RPO) documented
- [ ] Incident response plan in place

---

### Communication

#### Stakeholder Notification
- [ ] Admin team notified of launch
- [ ] Support team notified
- [ ] Marketing team notified (if applicable)
- [ ] Legal/compliance team notified

#### User Communication
- [ ] Help documentation published
- [ ] FAQ page updated
- [ ] Support channels ready

---

### Post-Deployment Monitoring

#### First 24 Hours
- [ ] Monitor error rates
- [ ] Check email delivery rates
- [ ] Review application submission rate
- [ ] Check database performance
- [ ] Monitor edge function logs

#### First Week
- [ ] Review user feedback
- [ ] Check admin dashboard usage
- [ ] Analyze performance metrics
- [ ] Review support tickets
- [ ] Conduct post-launch retrospective

---

## Launch Approval

### Sign-Off Required

- [ ] Technical Lead: _________________ Date: _________
- [ ] Security Officer: _________________ Date: _________
- [ ] Compliance Officer: _________________ Date: _________
- [ ] Product Manager: _________________ Date: _________

---

## Rollback Plan

### If Critical Issues Arise

1. **Identify Issue**: Clearly document the problem
2. **Assess Severity**: Determine if rollback is necessary
3. **Notify Stakeholders**: Alert relevant teams
4. **Execute Rollback**:
   - Revert frontend to previous version
   - Disable edge functions if needed
   - Update status page
5. **Communicate**: Inform users of temporary downtime
6. **Post-Mortem**: Document what went wrong and how to prevent

### Emergency Contacts

- **Technical Lead**: [Name] - [Phone]
- **Database Admin**: [Name] - [Phone]
- **DevOps**: [Name] - [Phone]

---

## Success Criteria

### Define Success (First Month)

- [ ] 95%+ application completion rate (started to submitted)
- [ ] < 1% error rate on submissions
- [ ] 99.9%+ email delivery rate
- [ ] Average application time < 20 minutes
- [ ] 100% admin dashboard uptime
- [ ] Zero security incidents
- [ ] Positive user feedback

---

*Deployment Date: _______________*
*Deployed By: _______________*
*Production URL: _______________*

**Notes**:
