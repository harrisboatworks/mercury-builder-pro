# Financing Application - Admin User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Accessing the Dashboard](#accessing-the-dashboard)
3. [Understanding Application Statuses](#understanding-application-statuses)
4. [Viewing Applications](#viewing-applications)
5. [Application Details](#application-details)
6. [Managing Applications](#managing-applications)
7. [Adding Admin Notes](#adding-admin-notes)
8. [Exporting to PDF](#exporting-to-pdf)
9. [Email Communication](#email-communication)
10. [Security Best Practices](#security-best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is the Financing Application Admin Dashboard?

The Admin Dashboard is a secure interface that allows authorized staff to view, manage, and process customer financing applications. It provides tools to:
- View all submitted applications
- Update application statuses
- Add internal notes
- Export applications to PDF
- Track application history
- Monitor pending applications

### Who Can Access?

Only users with **admin role** can access the dashboard. Regular users can only view their own applications.

---

## Accessing the Dashboard

### Step 1: Login

1. Navigate to the login page at `/login`
2. Enter your admin credentials (email and password)
3. Click "Sign In"

### Step 2: Navigate to Admin Section

1. Click on the **user menu** in the top-right corner
2. Select **"Admin"** from the dropdown menu
3. Choose **"Financing Applications"**

**Quick Link**: `/admin/financing-applications`

### Step 3: View the Dashboard

You'll see:
- **Pending Applications Badge** (real-time count in the navigation)
- **Application List** with filters and search
- **Status Overview** at the top

---

## Understanding Application Statuses

Applications move through different statuses during their lifecycle:

### Status Types

| Status | Badge Color | Description |
|--------|-------------|-------------|
| **Draft** | Gray | Application started but not submitted |
| **Pending** | Yellow | Submitted and awaiting review |
| **Under Review** | Blue | Currently being processed |
| **Approved** | Green | Credit application approved |
| **Declined** | Red | Credit application declined |
| **Withdrawn** | Orange | Customer withdrew application |
| **Expired** | Gray | Resume token expired (drafts only) |

### Status Workflow

```
Draft → Pending → Under Review → Approved/Declined
                              ↓
                          Withdrawn
```

---

## Viewing Applications

### Application List

The main dashboard shows all applications in a table format:

**Columns**:
- **Reference #**: Unique identifier (first 8 characters of ID)
- **Applicant**: Full name
- **Motor Model**: Requested motor
- **Amount**: Purchase price
- **Status**: Current status with colored badge
- **Submitted**: Date/time of submission
- **Actions**: Quick action buttons

### Filtering Applications

Use the **status tabs** at the top to filter:
- **All**: View all applications
- **Pending**: View only pending applications
- **Approved**: View approved applications
- **Declined**: View declined applications

### Searching Applications

Use the **search bar** to find applications by:
- Applicant name
- Email address
- Reference number
- Motor model

**Tip**: Search is case-insensitive and searches across multiple fields.

### Pending Count Badge

The **navigation menu** shows a live count of pending applications:
- Appears as a red badge on the "Financing" menu item
- Updates in real-time
- Click to jump directly to pending applications

---

## Application Details

Click on any application row or the "View" button to see full details.

### Application Detail Modal

The modal has **5 tabs**:

#### 1. Overview Tab

**Purchase Details**:
- Motor model and purchase price
- Down payment amount
- Trade-in value (if applicable)
- Loan amount (calculated)

**Applicant Information**:
- Full name, email, phone
- Date of birth
- Residential address
- Years at current address
- Residential status

**Employment Information**:
- Current employer and occupation
- Years employed
- Gross annual income
- Previous employment (if applicable)

#### 2. Financial Tab

**Income**:
- Primary employment income
- Other income sources and amounts
- Total monthly income

**Expenses**:
- Total monthly expenses
- Monthly housing costs

**Assets & Liabilities**:
- Total assets
- Total liabilities
- Existing loans (list)
- Net worth (calculated)

**Credit History**:
- Bankruptcy history (Yes/No)
- Bankruptcy details (if applicable)

#### 3. Co-Applicant Tab

Shows if the application has a co-applicant:
- Personal information
- Employment details
- Income information
- Relationship to primary applicant

If **no co-applicant**, this tab shows "No co-applicant on this application."

#### 4. References Tab

**Personal Reference**:
- Name and phone
- Relationship to applicant

**Professional Reference**:
- Name and phone
- Relationship to applicant

#### 5. Consents Tab

**Credit Check Consent**: ✓ Agreed
**Terms & Conditions**: ✓ Agreed

**Digital Signature**:
- Signature text
- Date and time signed
- IP address

---

## Managing Applications

### Updating Application Status

#### Option 1: From Application List
1. Click the **status badge** on any application
2. Select new status from dropdown
3. Status updates immediately

#### Option 2: From Application Detail Modal
1. Open application details
2. Click the **"Status"** dropdown at the top
3. Select new status
4. Click **"Update Status"** button

### Status Change Notifications

When you update a status:
- ✓ Success toast notification appears
- 📧 Email notification sent to applicant (for certain status changes)
- 📝 Status change logged in history
- 🕐 Timestamp recorded

### Bulk Actions (Future)

*Note: Bulk status updates are planned for a future release.*

---

## Adding Admin Notes

### What are Admin Notes?

Admin notes are internal comments visible only to admin users. Use them to:
- Document decisions
- Track communication
- Record follow-up actions
- Share insights with team members

### Adding a Note

1. Open application details
2. Scroll to **"Admin Notes"** section at the bottom
3. Type your note in the text area
4. Click **"Add Note"** button

### Notes Timeline

The **notes history** displays as a timeline:
- Most recent notes appear at the top
- Each note shows:
  - Admin user who added it
  - Date and time
  - Note content

### Auto-Save

Notes are automatically saved when you click "Add Note". No manual save required.

### Best Practices

✓ **Be Professional**: Notes may be audited or reviewed
✓ **Be Specific**: Include relevant details (dates, amounts, conversations)
✓ **Be Concise**: Keep notes short and actionable
✓ **Tag Actions**: Use keywords like "TODO:", "FOLLOW-UP:", "DECISION:"

**Example Good Note**:
```
FOLLOW-UP: Called applicant on 2025-01-11 to verify employment.
Spoke with employer - confirmed 3 years employment. Approved.
```

---

## Exporting to PDF

### When to Export

Export applications to PDF when you need to:
- Share with credit reviewers
- Print for physical files
- Archive completed applications
- Send to third-party lenders

### How to Export

1. Open application details
2. Click **"Export PDF"** button in the top-right
3. PDF generates in a few seconds
4. PDF opens in new tab for viewing/downloading

### PDF Contents

The exported PDF includes:
- Company branding and logo
- Application reference number
- All applicant information
- Financial details
- Co-applicant information (if applicable)
- References
- Digital signature
- Admin notes timeline

### PDF Format

- **Professional Layout**: Clean, printable design
- **Page Numbers**: Automatic pagination
- **Timestamps**: Generated date/time
- **Security**: Encrypted for sensitive data

---

## Email Communication

### Automatic Emails

The system automatically sends emails for:

#### 1. Application Submitted (to Applicant)
- **When**: Application is first submitted
- **Subject**: "Financing Application Received - [Reference #]"
- **Contains**: Confirmation, reference number, next steps

#### 2. Admin Notification (to Admin Team)
- **When**: Application is first submitted
- **Subject**: "New Financing Application - [Applicant Name]"
- **Contains**: Application summary, direct link to dashboard

#### 3. Status Updates (to Applicant) - *Future*
*Planned feature: Automatic emails when status changes to Approved/Declined*

### Manual Email Communication

For now, email communication with applicants should be done via your regular email client:
1. Copy applicant email from application details
2. Use your email client to compose message
3. Reference the application Reference #

**Tip**: Add notes in the admin notes section to log email communication.

---

## Security Best Practices

### Handling Sensitive Information

#### Social Insurance Numbers (SINs)

⚠️ **CRITICAL**: SINs are encrypted in the database and require special handling.

**Viewing SINs**:
- SINs are **NOT** visible in the admin dashboard by default
- Decryption requires database-level admin access
- All decryption attempts are audit logged

**Best Practices**:
- Only decrypt SINs when absolutely necessary
- Never copy/paste SINs into unsecured channels
- Follow PIPEDA guidelines for SIN handling

#### Personal Information

✓ **Do**:
- Access applications only when needed
- Close browser tabs when done
- Lock your computer when away
- Use secure networks (no public WiFi)

✗ **Don't**:
- Share admin credentials
- Take screenshots of sensitive data
- Email unencrypted application details
- Discuss applications in public spaces

### Data Retention

**Draft Applications**: Auto-deleted after 90 days of inactivity
**Submitted Applications**: Retained for 7 years (regulatory requirement)
**Declined Applications**: Retained for 2 years, then soft-deleted

### Audit Trail

All admin actions are logged:
- Application views
- Status changes
- Note additions
- PDF exports
- SIN decryption attempts (if enabled)

---

## Troubleshooting

### Common Issues

#### "No applications found"
- **Cause**: No applications match current filters
- **Solution**: Clear filters or change status tab

#### "Failed to load application"
- **Cause**: Database connection issue or RLS policy error
- **Solution**: Refresh page, check your admin role

#### "PDF export failed"
- **Cause**: Missing data or edge function error
- **Solution**: Check browser console, retry in a few seconds

#### "Cannot update status"
- **Cause**: Permission error or invalid status transition
- **Solution**: Verify your admin role, check status workflow

#### Pending count not updating
- **Cause**: Real-time subscription issue
- **Solution**: Refresh the page

### Getting Help

If you encounter issues not covered here:
1. Check the **Troubleshooting Guide**: `FINANCING_TROUBLESHOOTING.md`
2. Review **Technical Documentation**: `FINANCING_APPLICATION_TECHNICAL_DOCS.md`
3. Contact your system administrator
4. Report bugs to the development team

---

## Keyboard Shortcuts

*Planned for future release*

---

## Mobile Admin Access

The admin dashboard is fully responsive and works on mobile devices:

**Mobile Features**:
- Touch-friendly status dropdown
- Swipe to navigate tabs
- Responsive table (cards on small screens)
- Easy-to-tap buttons

**Tip**: For best experience on mobile, use landscape orientation when viewing detailed applications.

---

## Tips & Tricks

### Quick Actions

- **Fast Status Update**: Click status badge directly from list
- **Quick Search**: Use `Ctrl+F` (Windows) or `Cmd+F` (Mac) to search list
- **Open in New Tab**: Right-click "View" button to open in new tab

### Efficient Workflow

1. **Morning Routine**: Check pending count, review new applications
2. **Filter by Status**: Focus on one status at a time
3. **Add Notes**: Document decisions immediately while fresh
4. **Batch Processing**: Process similar applications together

### Organization

- Use consistent note formatting
- Add timestamps in notes manually if needed
- Reference other applications in notes (e.g., "Similar to REF-ABC123")

---

## Frequently Asked Questions (FAQ)

**Q: How long do draft applications stay in the system?**
A: Draft applications expire after 7 days if not submitted. After 90 days, they are automatically deleted.

**Q: Can I delete an application?**
A: No. Applications are soft-deleted for audit purposes. Contact a database administrator if deletion is absolutely necessary.

**Q: Can applicants see admin notes?**
A: No. Admin notes are internal and never visible to applicants.

**Q: What happens if I accidentally approve/decline an application?**
A: You can change the status back. All status changes are logged in the history.

**Q: How do I know if an email was sent successfully?**
A: Check the edge function logs (technical). In the future, email logs will be visible in the dashboard.

**Q: Can I export multiple applications at once?**
A: Not currently. This feature is planned for a future release.

**Q: Who gets the admin notification emails?**
A: The email address(es) configured in the `ADMIN_EMAIL` environment variable.

---

## Compliance Notes

### PIPEDA Compliance

When handling financing applications, you must comply with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA):

- ✓ Access personal information only when necessary
- ✓ Keep information secure and confidential
- ✓ Provide applicants with access to their information upon request
- ✓ Correct inaccurate information when notified
- ✓ Delete information when no longer needed (per retention policy)

For full compliance details, see: `FINANCING_COMPLIANCE.md`

---

## Training Resources

**Recommended Training Path**:
1. Read this guide thoroughly
2. Review 2-3 sample applications in test environment
3. Practice updating statuses in test environment
4. Export a PDF in test environment
5. Shadow an experienced admin for 1-2 sessions

**Time Required**: ~2 hours for initial training

---

*Last Updated: 2025-01-11*
*For technical support, contact your system administrator.*
