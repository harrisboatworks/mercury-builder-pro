# Financing Application - Comprehensive Testing Plan

## 🎯 Testing Objectives
- Verify all 7 steps work correctly with proper validation
- Ensure save/resume flow functions properly
- Confirm SIN encryption is secure
- Test admin dashboard functionality
- Verify email delivery
- Check mobile responsiveness

---

## 📋 Test Environment Setup

### Prerequisites
- [ ] Test with clean browser (incognito/private mode)
- [ ] Test with authenticated user account
- [ ] Test email address you have access to
- [ ] Mobile device or browser dev tools for mobile testing
- [ ] Admin account for dashboard testing

### Test Data
```
Test Applicant:
- Name: John Test Doe
- Email: your-test-email@example.com
- Phone: (555) 123-4567
- SIN: 123-456-789
- DOB: January 1, 1990
- Address: 123 Test St, Toronto, ON, M5H 2N2

Test Motor:
- Model: Mercury 115HP FourStroke
- Price: $12,500
- Down Payment: $2,500
- Amount to Finance: $10,000
```

---

## 🧪 Critical Flow Testing

### Test 1: Complete Application Submission (Happy Path)
**Objective**: Verify full application flow from start to finish

#### Steps:
1. **Navigate to Application**
   - [ ] Go to quote summary page
   - [ ] Click "Apply for Financing" button
   - [ ] Verify redirect to `/financing/apply`
   - [ ] Verify motor details are pre-filled

2. **Step 1: Purchase Details**
   - [ ] Verify motor model is pre-filled
   - [ ] Verify motor price is pre-filled ($12,500)
   - [ ] Adjust down payment slider to $2,500
   - [ ] Add trade-in value: $1,000
   - [ ] Verify amount to finance calculates correctly ($9,000)
   - [ ] Verify monthly payment estimates display for 36/48/60 months
   - [ ] Click "Continue to Application"
   - [ ] Verify navigation to Step 2

3. **Step 2: Primary Applicant**
   - [ ] Fill in all required fields (name, email, phone, DOB, SIN, address)
   - [ ] Test SIN format validation (must be XXX-XXX-XXX or 9 digits)
   - [ ] Test email format validation
   - [ ] Test phone format (auto-formats to (XXX) XXX-XXXX)
   - [ ] Test postal code format (A1A 1A1)
   - [ ] Verify checkmarks appear for valid fields
   - [ ] Click "Continue"
   - [ ] Verify navigation to Step 3

4. **Step 3: Employment Information**
   - [ ] Select employment status: "Employed"
   - [ ] Fill employer name: "Test Company Inc."
   - [ ] Fill occupation: "Software Developer"
   - [ ] Fill employment duration: "5 years"
   - [ ] Fill employer phone: (555) 987-6543
   - [ ] Select "No" for additional income
   - [ ] Click "Continue"
   - [ ] Verify navigation to Step 4

5. **Step 4: Financial Information**
   - [ ] Fill annual income: $75,000
   - [ ] Fill monthly expenses: $2,500
   - [ ] Select housing status: "Own with mortgage"
   - [ ] Fill monthly housing cost: $1,800
   - [ ] Select "No" for bankruptcy history
   - [ ] Select credit score range: "680-739 (Good)"
   - [ ] Click "Continue"
   - [ ] Verify navigation to Step 5

6. **Step 5: Co-Applicant (Optional)**
   - [ ] Test "Skip this step" button
   - [ ] Verify navigation to Step 6
   - [ ] **Go back and test adding co-applicant:**
     - [ ] Toggle "Add Co-Applicant" to Yes
     - [ ] Fill all co-applicant fields (similar to Step 2)
     - [ ] Verify SIN encryption for co-applicant
     - [ ] Click "Continue"

7. **Step 6: References**
   - [ ] Fill Reference 1: Name, Relationship, Phone, Duration
   - [ ] Fill Reference 2: Name, Relationship, Phone, Duration
   - [ ] Test validation: same phone number for both references (should show error)
   - [ ] Change Reference 2 phone number
   - [ ] Click "Continue to Review"
   - [ ] Verify navigation to Step 7

8. **Step 7: Review & Submit**
   - [ ] Verify all sections are displayed in accordion (Purchase, Personal, Employment, Financial, Co-Applicant, References)
   - [ ] Click "Edit" button on each section and verify navigation back to that step
   - [ ] Return to Review & Submit
   - [ ] Check all consent checkboxes:
     - [ ] Credit check authorization
     - [ ] Accuracy confirmation
     - [ ] Terms and conditions
   - [ ] Fill digital signature (must match applicant full name exactly)
   - [ ] Verify date is auto-filled
   - [ ] Click "Submit Application"
   - [ ] **WATCH FOR:**
     - [ ] Loading spinner appears
     - [ ] Success toast appears
     - [ ] Redirect to `/financing/success`

9. **Verify Success Page**
   - [ ] Verify reference number is displayed
   - [ ] Verify submission date is correct
   - [ ] Verify confirmation message
   - [ ] Verify "Next Steps" section is visible

10. **Check Database**
    - [ ] Open Supabase dashboard → Database → Table Editor
    - [ ] Find your application in `financing_applications` table
    - [ ] Verify `status` is "submitted"
    - [ ] **CRITICAL**: Verify `applicant_sin_encrypted` is NOT readable (should be encrypted bytea)
    - [ ] Verify `applicant_data` contains applicant information
    - [ ] Verify `submitted_at` timestamp is correct

**Expected Result**: ✅ Application successfully submitted, data encrypted, user redirected to success page

**Pass/Fail**: ___________

---

### Test 2: Save & Resume Flow
**Objective**: Verify users can save progress and resume later

#### Part A: Save Application
1. **Start New Application**
   - [ ] Navigate to `/financing/apply`
   - [ ] Complete Steps 1-3 (Purchase, Applicant, Employment)
   - [ ] On Step 4, click "Save & Continue Later" button

2. **Save Dialog**
   - [ ] Verify dialog opens
   - [ ] Enter email address: your-test-email@example.com
   - [ ] Click "Send Resume Link"
   - [ ] **WATCH FOR:**
     - [ ] Success toast: "Resume link sent!"
     - [ ] Dialog closes

3. **Verify Auto-Save (Background)**
   - [ ] Fill a field in Step 4
   - [ ] Wait 2 seconds (debounced auto-save)
   - [ ] Check console logs for "Auto-saved application"
   - [ ] Verify no errors in console

4. **Check Database**
   - [ ] Open `financing_applications` table
   - [ ] Find your saved application (status: "draft")
   - [ ] Verify `resume_token` exists (UUID format)
   - [ ] Copy the `resume_token` for manual testing

5. **Check Email**
   - [ ] Open your email inbox
   - [ ] Look for email: "Continue Your Mercury Marine Financing Application"
   - [ ] Verify email contains:
     - [ ] Your name (if filled)
     - [ ] Progress percentage (e.g., "42% complete")
     - [ ] "Continue Application" button
     - [ ] Resume link is clickable

#### Part B: Resume Application
1. **Resume via Email Link**
   - [ ] Click "Continue Application" button in email
   - [ ] **WATCH FOR:**
     - [ ] Redirect to `/financing/resume?token=...`
     - [ ] Loading spinner appears
     - [ ] Success toast: "Application loaded successfully"
     - [ ] Redirect to `/financing/apply`

2. **Verify Data Persistence**
   - [ ] Verify Step 1 data is pre-filled (motor, price, down payment)
   - [ ] Verify Step 2 data is pre-filled (applicant info)
   - [ ] Verify Step 3 data is pre-filled (employment info)
   - [ ] Navigate to Step 4 (should be partially filled)
   - [ ] Complete Step 4 and continue to Step 5

3. **Complete and Submit**
   - [ ] Complete remaining steps (5-7)
   - [ ] Submit application
   - [ ] Verify success page

4. **Verify Token Expiration (After 30 Days)**
   - [ ] Manually test expired token (modify `created_at` in database to 31 days ago)
   - [ ] Try to resume with expired token
   - [ ] **EXPECTED**: Error message: "This resume link has expired"

**Expected Result**: ✅ Application saves automatically, resume link works, data persists

**Pass/Fail**: ___________

---

### Test 3: Admin Dashboard Functionality
**Objective**: Verify admin can view, filter, and manage applications

#### Prerequisites:
- [ ] Ensure you have admin access (check `user_roles` table in database)

#### Steps:
1. **Access Admin Dashboard**
   - [ ] Navigate to `/admin/financing-applications`
   - [ ] Verify page loads without errors
   - [ ] Verify table displays submitted applications

2. **Test Filters**
   - [ ] Test status filter: "All" → Shows all applications
   - [ ] Test status filter: "Submitted" → Shows only submitted
   - [ ] Test status filter: "In Review" → Shows only in review
   - [ ] Test search: Enter applicant email → Filters results
   - [ ] Test search: Enter applicant name → Filters results
   - [ ] Clear search → Shows all results

3. **Test Sorting**
   - [ ] Click "Submitted" column header → Sort by date (desc)
   - [ ] Click "Submitted" column header again → Sort by date (asc)
   - [ ] Click "Applicant" column header → Sort alphabetically

4. **View Application Details**
   - [ ] Click "View Details" button on an application
   - [ ] Verify modal opens
   - [ ] **Verify Tabs:**
     - [ ] "Application Details" tab shows applicant info
     - [ ] "Financial Info" tab shows employment/financial data
     - [ ] "Actions" tab shows status update form

5. **Test Status Update**
   - [ ] Go to "Actions" tab
   - [ ] Change status to "In Review"
   - [ ] Add admin note: "Reviewing credit history"
   - [ ] Click "Update Status"
   - [ ] **WATCH FOR:**
     - [ ] Success toast appears
     - [ ] Modal updates status badge
     - [ ] Status history section shows new entry
     - [ ] Table updates status (close modal to verify)

6. **Test Status History**
   - [ ] Verify "Status History" section displays:
     - [ ] Old status → New status
     - [ ] Admin note
     - [ ] Timestamp
     - [ ] Admin user name/email

7. **Test Email Applicant**
   - [ ] Click "Email Applicant" button
   - [ ] Verify default email client opens with pre-filled:
     - [ ] Recipient: applicant email
     - [ ] Subject: includes reference number

**Expected Result**: ✅ Admin can view, filter, update status, and contact applicants

**Pass/Fail**: ___________

---

### Test 4: SIN Encryption Security
**Objective**: Verify SIN data is encrypted and only accessible to admins

#### Part A: Database Verification
1. **Check Raw Database**
   - [ ] Open Supabase → SQL Editor
   - [ ] Run query:
   ```sql
   SELECT id, applicant_sin_encrypted, co_applicant_sin_encrypted 
   FROM financing_applications 
   WHERE status = 'submitted' 
   LIMIT 5;
   ```
   - [ ] **VERIFY**: SIN fields show as `\x...` (bytea/encrypted) NOT readable digits

2. **Test Encryption Function**
   - [ ] Run in SQL Editor:
   ```sql
   SELECT encrypt_sin('123456789');
   ```
   - [ ] **VERIFY**: Returns encrypted string (should be different each time due to nonce)

3. **Test Decryption Function (Admin Only)**
   - [ ] Get an encrypted SIN from the database
   - [ ] Run in SQL Editor:
   ```sql
   SELECT decrypt_sin('\x...');  -- Replace with actual encrypted value
   ```
   - [ ] **VERIFY**: Returns decrypted SIN in XXX-XXX-XXX format

#### Part B: Client-Side Testing
1. **Test Encryption on Submission**
   - [ ] Open browser DevTools → Console
   - [ ] Submit a test application with SIN: 987-654-321
   - [ ] **WATCH FOR**: Console log "✅ SIN encrypted successfully (pgsodium AES-256)"
   - [ ] **VERIFY**: No plaintext SIN appears in console or network requests

2. **Test Decryption (Admin View)**
   - [ ] Open admin dashboard
   - [ ] View application details
   - [ ] **IF ADMIN**: SIN should decrypt and display as XXX-XXX-XXX
   - [ ] **IF NOT ADMIN**: SIN should show as "[ENCRYPTED - ADMIN ONLY]"

3. **Test Unauthorized Access**
   - [ ] Try to call `decrypt_sin` function directly from browser console:
   ```javascript
   const { data, error } = await supabase.rpc('decrypt_sin', { 
     sin_encrypted: 'some_encrypted_value' 
   });
   console.log(data, error);
   ```
   - [ ] **EXPECTED**: Error message "Unauthorized: Only admins can decrypt SIN data"

**Expected Result**: ✅ SIN is encrypted in database, only admins can decrypt

**Pass/Fail**: ___________

---

### Test 5: Email Delivery
**Objective**: Verify all emails are sent and formatted correctly

#### Part A: Resume Email
1. **Send Resume Email**
   - [ ] Save application with email: your-test-email@example.com
   - [ ] Check inbox within 1-2 minutes
   - [ ] **Verify Email:**
     - [ ] Subject: "Continue Your Mercury Marine Financing Application"
     - [ ] From: Your configured sender
     - [ ] Greeting includes applicant name (if provided)
     - [ ] Progress bar displays correct percentage
     - [ ] "Continue Application" button is prominent
     - [ ] Link works and includes `?token=...` parameter

2. **Test Edge Function Logs**
   - [ ] Open Supabase → Edge Functions → `send-financing-resume-email` → Logs
   - [ ] Verify recent execution (within last few minutes)
   - [ ] Check for any errors
   - [ ] Verify log shows: "Resume email sent successfully"

#### Part B: Confirmation Email (Applicant)
1. **Submit Application**
   - [ ] Complete and submit an application
   - [ ] Check applicant email inbox within 1-2 minutes
   - [ ] **Verify Email:**
     - [ ] Subject: "Financing Application Received - Reference #..."
     - [ ] Greeting includes applicant name
     - [ ] Reference number is displayed prominently
     - [ ] Next steps section is clear
     - [ ] Contact information is provided
     - [ ] Professional formatting (Mercury Marine branding)

#### Part C: Admin Notification Email
1. **Check Admin Email**
   - [ ] Check admin/support email inbox (configured in edge function)
   - [ ] **Verify Email:**
     - [ ] Subject: "New Financing Application Received - #..."
     - [ ] Contains applicant summary (name, email, phone)
     - [ ] Contains motor information
     - [ ] Contains amount to finance
     - [ ] Link to admin dashboard works
     - [ ] Professional formatting

2. **Test Email Content**
   - [ ] Verify all dynamic data is correct (amounts, names, dates)
   - [ ] Verify no broken HTML or encoding issues
   - [ ] Test on multiple email clients (Gmail, Outlook, Apple Mail if possible)

**Expected Result**: ✅ All emails delivered with correct content and formatting

**Pass/Fail**: ___________

---

### Test 6: Mobile Responsiveness
**Objective**: Verify application works on mobile devices

#### Testing Method 1: Browser DevTools
1. **Setup**
   - [ ] Open Chrome/Edge DevTools (F12)
   - [ ] Click "Toggle device toolbar" (Ctrl+Shift+M)
   - [ ] Select "iPhone 12 Pro" or "Galaxy S20"

2. **Test Each Step on Mobile**
   - [ ] **Step 1 (Purchase Details):**
     - [ ] Down payment slider is usable on touch
     - [ ] Monthly payment cards stack vertically
     - [ ] All text is readable (no overflow)
   
   - [ ] **Step 2 (Applicant Info):**
     - [ ] Form fields are touch-friendly (min 44px height)
     - [ ] Keyboard types correctly (email keyboard for email, number for phone)
     - [ ] Date picker opens on tap
     - [ ] Address fields stack vertically
   
   - [ ] **Step 3-6 (Employment, Financial, Co-Applicant, References):**
     - [ ] Dropdowns open properly on touch
     - [ ] All inputs are accessible without horizontal scroll
     - [ ] Validation messages display correctly
   
   - [ ] **Step 7 (Review & Submit):**
     - [ ] Accordion sections expand/collapse on tap
     - [ ] Checkboxes are large enough to tap
     - [ ] Signature input works on mobile
     - [ ] Submit button is prominent

3. **Test Save Dialog on Mobile**
   - [ ] Click "Save & Continue Later"
   - [ ] Verify dialog is responsive (not cut off)
   - [ ] Verify keyboard doesn't cover input field
   - [ ] Verify button is tappable

4. **Test Admin Dashboard on Mobile**
   - [ ] Navigate to admin dashboard on mobile view
   - [ ] Verify table is scrollable or cards stack
   - [ ] Verify filters work on mobile
   - [ ] Verify detail modal is responsive
   - [ ] Verify tabs work on mobile

#### Testing Method 2: Real Device (Recommended)
1. **Access on Real Device**
   - [ ] Get your mobile phone (iOS or Android)
   - [ ] Navigate to your app's staging URL
   - [ ] Log in if required

2. **Complete Application on Mobile**
   - [ ] Go through all 7 steps
   - [ ] Test touch interactions
   - [ ] Test form inputs (especially autocomplete/autofill)
   - [ ] Test keyboard behavior
   - [ ] Submit application

3. **Check Responsiveness Issues**
   - [ ] Test in portrait and landscape orientations
   - [ ] Verify no text is cut off
   - [ ] Verify buttons are easily tappable
   - [ ] Verify scrolling is smooth
   - [ ] Test on iOS Safari AND Android Chrome (different behaviors)

**Expected Result**: ✅ All features work smoothly on mobile devices

**Pass/Fail**: ___________

---

## 🐛 Bug Tracking

### Critical Bugs (Must Fix Before Production)
| Bug # | Description | Steps to Reproduce | Status |
|-------|-------------|-------------------|--------|
| 1     |             |                   |        |
| 2     |             |                   |        |

### Medium Bugs (Should Fix)
| Bug # | Description | Steps to Reproduce | Status |
|-------|-------------|-------------------|--------|
| 1     |             |                   |        |
| 2     |             |                   |        |

### Minor Issues (Nice to Fix)
| Bug # | Description | Steps to Reproduce | Status |
|-------|-------------|-------------------|--------|
| 1     |             |                   |        |
| 2     |             |                   |        |

---

## ✅ Final Checklist

Before marking Phase A complete:
- [ ] All 6 critical tests completed
- [ ] All bugs documented with severity
- [ ] Critical bugs fixed or documented with workarounds
- [ ] Edge function logs reviewed (no errors)
- [ ] Database integrity verified (data encrypted, RLS working)
- [ ] Mobile testing completed on at least one real device
- [ ] Email delivery tested with real email addresses
- [ ] Admin dashboard tested with real applications
- [ ] Documentation updated with any discovered issues

---

## 📊 Test Summary

**Date Tested**: ___________  
**Tester**: ___________  
**Environment**: ___________

### Results:
- **Tests Passed**: ___ / 6
- **Critical Bugs Found**: ___
- **Medium Bugs Found**: ___
- **Minor Issues Found**: ___

### Overall Status:
- [ ] ✅ Ready for production
- [ ] ⚠️ Needs minor fixes
- [ ] ❌ Needs significant work

### Notes:
```
[Add any additional notes, observations, or recommendations here]
```

---

## 🔄 Next Steps After Testing

Based on test results:
1. **If all tests pass**: Proceed to Phase B (Admin Enhancements)
2. **If critical bugs found**: Fix immediately before proceeding
3. **If medium bugs found**: Document and prioritize for Phase C
4. **If minor issues found**: Add to backlog for future improvements

Good luck with testing! 🚀
