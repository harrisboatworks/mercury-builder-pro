# Financing Application - PIPEDA Compliance Guide

## Overview

This document outlines how the Financing Application complies with Canada's **Personal Information Protection and Electronic Documents Act (PIPEDA)** and related privacy legislation.

---

## Table of Contents
1. [PIPEDA Principles](#pipeda-principles)
2. [Data Collection](#data-collection)
3. [Consent Management](#consent-management)
4. [Data Security](#data-security)
5. [Data Retention](#data-retention)
6. [Access & Correction Rights](#access--correction-rights)
7. [Accountability](#accountability)
8. [Third-Party Sharing](#third-party-sharing)
9. [Breach Response](#breach-response)
10. [Compliance Checklist](#compliance-checklist)

---

## PIPEDA Principles

### The 10 Fair Information Principles

#### 1. Accountability
**Requirement**: Organization is responsible for personal information under its control.

**Our Implementation**:
- Privacy Officer designated
- Staff trained on privacy practices
- Written privacy policies
- Documented procedures
- Audit trails for all data access

#### 2. Identifying Purposes
**Requirement**: Purposes for collection identified before or at time of collection.

**Our Implementation**:
- Clear purpose stated in application intro
- Specific use cases documented
- Users informed before data collection
- Purpose: Credit assessment for financing motor purchase

#### 3. Consent
**Requirement**: Knowledge and consent of individual required for collection, use, or disclosure.

**Our Implementation**:
- Explicit consent checkboxes
- Clear, plain language consent forms
- Separate consent for credit check
- Separate consent for terms & conditions
- Can withdraw consent (with consequences explained)
- Digital signature for legal binding

#### 4. Limiting Collection
**Requirement**: Limit collection to what is necessary for identified purposes.

**Our Implementation**:
- Only collect data necessary for credit assessment
- No "nice-to-have" fields
- Co-applicant is optional
- References limited to two
- No collection of race, religion, sexual orientation, or other protected characteristics

#### 5. Limiting Use, Disclosure, and Retention
**Requirement**: Personal information not used or disclosed for purposes other than those for which it was collected.

**Our Implementation**:
- Data used only for credit assessment
- No marketing without separate consent
- No selling to third parties
- Retention limited by policy (see Data Retention section)
- Data deleted when no longer needed

#### 6. Accuracy
**Requirement**: Personal information shall be as accurate, complete, and up-to-date as necessary.

**Our Implementation**:
- Validation at point of entry
- Users review before submission
- Ability to correct before submission
- Admin can update on behalf of user
- Employment verification process

#### 7. Safeguards
**Requirement**: Personal information protected by security safeguards appropriate to the sensitivity.

**Our Implementation**:
- AES-256 encryption for SIN
- TLS/SSL for all transmissions
- Row Level Security (RLS) policies
- Admin-only access controls
- Audit logging
- Regular security audits
- Secure data center (Canadian)

#### 8. Openness
**Requirement**: Organization shall make information about policies and practices available.

**Our Implementation**:
- Privacy policy published and accessible
- User guide explains data handling
- Contact information provided
- Annual privacy report available

#### 9. Individual Access
**Requirement**: Individual has right to access their personal information.

**Our Implementation**:
- Users can view own application anytime
- Request form for data access
- 30-day response time
- Free access (no fee)
- Explanation if access denied

#### 10. Challenging Compliance
**Requirement**: Individual able to challenge compliance with above principles.

**Our Implementation**:
- Complaint process documented
- Privacy Officer contact provided
- Investigation procedures
- Remedy procedures
- Escalation to Privacy Commissioner if needed

---

## Data Collection

### Personal Information Collected

#### Primary Applicant
- **Identity**: Full name, date of birth, SIN
- **Contact**: Email, phone, residential address
- **Employment**: Employer, occupation, income
- **Financial**: Assets, liabilities, existing loans, bankruptcy history
- **References**: Names and phone numbers

#### Co-Applicant (Optional)
- Same as primary applicant

#### Technical Data
- IP address (for fraud prevention)
- Browser type and version
- Device type
- Timestamp of actions

### Purpose of Collection

Each data element collected serves a specific purpose:

| Data Element | Purpose | Legal Basis |
|--------------|---------|-------------|
| SIN | Credit report retrieval | Consent |
| Income | Debt-to-income ratio calculation | Consent |
| Employment | Stability assessment | Consent |
| Assets/Liabilities | Net worth calculation | Consent |
| Bankruptcy History | Credit risk assessment | Consent |
| References | Verification | Consent |
| IP Address | Fraud prevention | Legitimate interest |

### Sensitive Information

**Specially Protected**:
- Social Insurance Number (SIN)
- Date of birth
- Financial details
- Credit history

**Extra Safeguards**:
- SIN encrypted with AES-256
- Admin-only decryption with audit logging
- Minimal staff access
- No display in logs or error messages

---

## Consent Management

### Obtaining Consent

#### Step 1: Information Provided
Before collecting data, users are informed:
- What data is collected
- Why it's collected
- How it will be used
- Who will have access
- How long it will be retained

#### Step 2: Explicit Consent
Users must check boxes to consent:
- ☑ "I authorize a credit check"
- ☑ "I agree to the terms and conditions"

**Language Used**: Clear, plain language (Grade 8 reading level)

#### Step 3: Digital Signature
Users provide digital signature:
- Type full legal name
- Timestamp recorded
- IP address recorded
- Legally binding

### Withdrawing Consent

Users can withdraw consent by:
1. Contacting us in writing
2. Requesting application deletion

**Consequences Explained**:
- Application cannot be processed without consent
- Financing cannot be provided
- Data will be deleted (per retention policy)

### Implied Consent

**We do NOT rely on implied consent** for sensitive data. All consent is explicit.

---

## Data Security

### Technical Safeguards

#### Encryption
- **In Transit**: TLS 1.3 encryption for all communications
- **At Rest**: AES-256 encryption for SIN data
- **Key Management**: Supabase pgsodium with secure key storage

#### Access Controls
- **Authentication**: Email/password + optional MFA
- **Authorization**: Role-Based Access Control (RBAC)
- **Row Level Security**: Database-level enforcement
- **Admin Access**: Requires specific admin role
- **SIN Access**: Admin-only with audit logging

#### Network Security
- **Firewall**: Supabase firewall protects database
- **DDoS Protection**: Cloudflare (if applicable)
- **Rate Limiting**: Prevents abuse
- **API Security**: Supabase auth + API keys

### Organizational Safeguards

#### Staff Training
- Annual privacy training required
- Specific training for financing staff
- Incident response training
- Regular refresher courses

#### Access Management
- Principle of least privilege
- Access reviews quarterly
- Termination of access upon role change
- Audit trail of all access

#### Physical Security
- Data hosted in secure Canadian data centers
- SOC 2 Type II certified (Supabase)
- 24/7 monitoring
- Disaster recovery plan

### Audit Logging

All sensitive actions logged:
- Application views
- Status changes
- SIN decryption attempts
- Admin notes additions
- Data exports
- Login attempts

**Log Retention**: 2 years

---

## Data Retention

### Retention Policy

| Data Type | Retention Period | Reason | Deletion Method |
|-----------|------------------|--------|-----------------|
| **Draft Applications** | 7 days (active) + 90 days (inactive) | Allow user to resume | Hard delete |
| **Submitted Applications** | 7 years | Regulatory requirement | Soft delete* |
| **Approved Applications** | 7 years after loan closure | Regulatory requirement | Soft delete* |
| **Declined Applications** | 2 years | Reapplication assessment | Soft delete* |
| **Audit Logs** | 2 years | Security/compliance | Hard delete |
| **SIN Audit Logs** | 7 years | Regulatory requirement | Hard delete |

\* Soft delete: Marked as deleted but retained in database for audit purposes

### Automated Cleanup

**Database Function**: `cleanup_old_data()`

Runs daily to:
- Delete expired draft applications
- Soft-delete applications past retention
- Delete old audit logs
- Archive old status history

### Manual Deletion Requests

Users can request deletion:
1. Submit written request
2. Verify identity
3. We respond within 30 days
4. Deletion completed per policy

**Exceptions**:
- Legal obligation to retain (e.g., active loan)
- Ongoing investigation
- Court order

---

## Access & Correction Rights

### Right to Access

Users can request:
- Copy of all personal information we hold
- How it's being used
- Who it's been disclosed to

**Process**:
1. Submit request via email/web form
2. Verify identity (government ID + security questions)
3. Respond within 30 days
4. Provide data in readable format

**Fee**: Free for first request, reasonable fee for subsequent

### Right to Correction

Users can request correction of:
- Inaccurate information
- Incomplete information
- Out-of-date information

**Process**:
1. Submit correction request
2. We investigate (5-10 business days)
3. Correct if accurate
4. If disagree, user can add statement to file

### Right to Deletion

Users can request deletion ("Right to be Forgotten"):
1. Submit deletion request
2. We assess (per retention policy)
3. Delete if no legal obligation to retain
4. Notify user within 30 days

---

## Accountability

### Privacy Officer

**Designated Privacy Officer**: [Name]
**Contact**: privacy@[company].com
**Phone**: [Phone Number]

**Responsibilities**:
- Oversee PIPEDA compliance
- Investigate privacy complaints
- Train staff on privacy
- Conduct privacy audits
- Report breaches to Privacy Commissioner

### Staff Responsibilities

**All Staff Must**:
- Protect personal information
- Report suspected breaches
- Follow privacy procedures
- Complete annual training

**Admin Staff Must Also**:
- Access data only when necessary
- Log reasons for accessing SINs
- Report unusual access patterns

### Third-Party Accountability

**Service Providers Must**:
- Sign Data Processing Agreement (DPA)
- Meet same security standards
- Report breaches within 24 hours
- Allow audits

**Current Service Providers**:
- **Supabase**: Database and auth hosting
- **Resend**: Email delivery
- **Vercel/Lovable**: Frontend hosting (if applicable)

---

## Third-Party Sharing

### When We Share Data

Personal information shared only for:
1. **Credit Check**: Shared with credit bureaus (Equifax, TransUnion)
2. **Lending Decision**: Shared with financing partner (if approved)
3. **Legal Requirement**: Shared with law enforcement if legally required
4. **Service Providers**: Shared with hosting providers (Supabase, Resend)

### What We Share

| Recipient | Data Shared | Purpose |
|-----------|-------------|---------|
| Credit Bureau | Name, DOB, SIN, address | Credit report |
| Financing Partner | Complete application | Loan decision |
| Email Provider (Resend) | Email, name | Send confirmation |
| Hosting (Supabase) | All application data | Database storage |

### Contractual Protections

All third parties must:
- Sign Data Processing Agreement
- Meet PIPEDA standards
- Limit use to stated purpose
- Delete data when no longer needed
- Report breaches
- Allow audits

---

## Breach Response

### Breach Definition

A breach occurs when personal information is:
- Stolen or lost
- Accessed without authorization
- Used or disclosed improperly
- Modified without authorization

### Breach Response Plan

#### Phase 1: Containment (0-1 hour)
1. Identify breach
2. Contain breach (disable access, etc.)
3. Notify Privacy Officer immediately
4. Preserve evidence

#### Phase 2: Assessment (1-24 hours)
1. Determine what data was affected
2. Assess number of individuals affected
3. Evaluate risk of harm
4. Document findings

#### Phase 3: Notification (24-72 hours)

**If Real Risk of Significant Harm**:
- Notify Privacy Commissioner
- Notify affected individuals
- Notify law enforcement (if criminal)

**Notification Must Include**:
- What happened
- What data was affected
- What we're doing about it
- What individuals should do
- How to contact us

#### Phase 4: Remediation (Ongoing)
1. Fix vulnerability
2. Implement additional safeguards
3. Update policies/procedures
4. Train staff
5. Conduct post-mortem

#### Phase 5: Documentation (Within 30 days)
- Document all actions taken
- File report with Privacy Commissioner
- Update incident log
- Review and update breach response plan

### Breach Notification Template

**To Affected Individual**:
```
Subject: Important Security Notice - [Company Name]

Dear [Name],

We are writing to inform you of a security incident that may have affected your personal information.

What Happened:
[Description of breach]

What Information Was Affected:
[List of data elements]

What We're Doing:
[Actions taken to contain and remediate]

What You Should Do:
[Steps individual should take, e.g., monitor credit report]

How to Contact Us:
If you have questions, contact our Privacy Officer at:
Email: privacy@[company].com
Phone: [Phone Number]

We sincerely apologize for this incident and any concern it may cause.

Sincerely,
[Privacy Officer Name]
[Company Name]
```

---

## Compliance Checklist

### Quarterly Privacy Audit

- [ ] Review data collection practices
- [ ] Review consent forms (ensure still clear and accurate)
- [ ] Review retention schedules (delete per policy)
- [ ] Review access logs (check for unusual patterns)
- [ ] Review third-party agreements (ensure still in effect)
- [ ] Test breach response plan
- [ ] Review staff training completion
- [ ] Update privacy policy if needed

### Annual Privacy Review

- [ ] Comprehensive privacy impact assessment
- [ ] Review all PIPEDA principles compliance
- [ ] Audit all third-party relationships
- [ ] Review and update policies
- [ ] Full staff training refresh
- [ ] External security audit
- [ ] Privacy Commissioner filing (if required)
- [ ] Board reporting

### Ongoing Monitoring

**Daily**:
- Monitor audit logs for suspicious activity
- Run automated retention cleanup

**Weekly**:
- Review access requests
- Review correction requests
- Review deletion requests

**Monthly**:
- Privacy Officer report to management
- Review any privacy complaints
- Review incident log

---

## Contact & Complaints

### Privacy Officer Contact

**Email**: privacy@[company].com
**Phone**: [Phone Number]
**Mail**: [Physical Address]

### Filing a Complaint

**Internal Process**:
1. Submit complaint to Privacy Officer
2. Investigation (30 days)
3. Written response provided
4. Remedy offered if appropriate

**External Escalation**:

If not satisfied with our response, you can file a complaint with:

**Office of the Privacy Commissioner of Canada**
- Website: https://www.priv.gc.ca/
- Phone: 1-800-282-1376
- Email: info@priv.gc.ca

**Provincial Privacy Commissioner** (if applicable)

---

## Document History

| Version | Date | Changes | Approved By |
|---------|------|---------|-------------|
| 1.0 | 2025-01-11 | Initial release | [Privacy Officer] |

---

*This document is reviewed annually or when legislation changes.*
*Last Review: 2025-01-11*
*Next Review: 2026-01-11*
