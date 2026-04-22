import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { COMPANY_INFO } from '@/lib/companyInfo';

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#007DC5',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007DC5',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
    color: '#555',
  },
  value: {
    width: '60%',
    color: '#000',
  },
  badge: {
    backgroundColor: '#007DC5',
    color: '#fff',
    padding: '4 8',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
    borderTop: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
  note: {
    backgroundColor: '#fff9e6',
    padding: 8,
    marginBottom: 6,
    borderLeft: 3,
    borderLeftColor: '#ffa500',
  },
  noteAuthor: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  noteDate: {
    fontSize: 8,
    color: '#666',
    marginBottom: 4,
  },
  noteContent: {
    fontSize: 9,
    color: '#333',
  },
});

interface FinancingApplicationPDFProps {
  application: any;
  refNumber: string;
}

export function FinancingApplicationPDF({ application, refNumber }: FinancingApplicationPDFProps) {
  const formatCurrency = (value: number | undefined) => {
    return value ? `$${value.toLocaleString()}` : 'N/A';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const notesHistory = (application.notes_history || []) as Array<{
    id: string;
    content: string;
    created_at: string;
    author_name: string;
  }>;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
          <Text style={styles.subtitle}>{COMPANY_INFO.tagline}</Text>
          <Text style={styles.subtitle}>{COMPANY_INFO.address.full}</Text>
          <Text style={styles.subtitle}>
            {COMPANY_INFO.contact.phone} | {COMPANY_INFO.contact.email}
          </Text>
        </View>

        {/* Title and Reference */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <Text style={styles.title}>Financing Application</Text>
          <View>
            <Text style={styles.badge}>#{refNumber}</Text>
            <Text style={{ fontSize: 8, marginTop: 4, color: '#666' }}>
              Status: {application.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 9, color: '#666', marginBottom: 15 }}>
          Generated: {formatDate(new Date().toISOString())}
        </Text>

        {/* Purchase Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Motor Model:</Text>
            <Text style={styles.value}>{application.purchase_data?.motorModel || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Purchase Price:</Text>
            <Text style={styles.value}>{formatCurrency(application.purchase_data?.motorPrice)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Down Payment:</Text>
            <Text style={styles.value}>{formatCurrency(application.purchase_data?.downPayment)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount to Finance:</Text>
            <Text style={styles.value}>{formatCurrency(application.purchase_data?.amountToFinance)}</Text>
          </View>
        </View>

        {/* Applicant Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Applicant</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>
              {application.applicant_data?.firstName} {application.applicant_data?.lastName}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date of Birth:</Text>
            <Text style={styles.value}>{application.applicant_data?.dateOfBirth || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{application.applicant_data?.email || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{application.applicant_data?.primaryPhone || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>
              {application.applicant_data?.streetAddress}, {application.applicant_data?.city}, {application.applicant_data?.province} {application.applicant_data?.postalCode}
            </Text>
          </View>
        </View>

        {/* Employment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employment Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{application.employment_data?.status || 'N/A'}</Text>
          </View>
          {application.employment_data?.employerName && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Employer:</Text>
                <Text style={styles.value}>{application.employment_data.employerName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Job Title:</Text>
                <Text style={styles.value}>{application.employment_data.jobTitle || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Annual Income:</Text>
                <Text style={styles.value}>{formatCurrency(application.employment_data.annualIncome)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Financial Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Credit Score Estimate:</Text>
            <Text style={styles.value}>{application.financial_data?.creditScoreEstimate || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Housing Status:</Text>
            <Text style={styles.value}>{application.financial_data?.housingStatus || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Monthly Housing Payment:</Text>
            <Text style={styles.value}>{formatCurrency(application.financial_data?.monthlyHousingPayment)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Bank Name:</Text>
            <Text style={styles.value}>{application.financial_data?.bankName || 'N/A'}</Text>
          </View>
        </View>

        {/* Co-Applicant (if applicable) */}
        {application.co_applicant_data && Object.keys(application.co_applicant_data).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Co-Applicant</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>
                {application.co_applicant_data.firstName} {application.co_applicant_data.lastName}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Relationship:</Text>
              <Text style={styles.value}>{application.co_applicant_data.relationship || 'N/A'}</Text>
            </View>
          </View>
        )}

        {/* Admin Notes */}
        {notesHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Notes</Text>
            {notesHistory.map((note) => (
              <View key={note.id} style={styles.note}>
                <Text style={styles.noteAuthor}>{note.author_name}</Text>
                <Text style={styles.noteDate}>{formatDate(note.created_at)}</Text>
                <Text style={styles.noteContent}>{note.content}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>CONFIDENTIAL - For Internal Use Only</Text>
          <Text>© {new Date().getFullYear()} {COMPANY_INFO.name}. All rights reserved.</Text>
        </View>
      </Page>
    </Document>
  );
}
