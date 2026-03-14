import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';

type CertificatePdfInput = {
  studentName: string;
  courseTitle: string;
  instructorName: string;
  completionDate: string;
  verificationCode: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#f8fafc',
    fontSize: 12,
    color: '#0f172a',
  },
  container: {
    border: '2 solid #0f172a',
    borderRadius: 8,
    padding: 28,
    height: '100%',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoPlaceholder: {
    width: 140,
    height: 56,
    border: '1 solid #64748b',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    color: '#475569',
    fontSize: 9,
  },
  platformName: {
    fontSize: 11,
    color: '#334155',
    textAlign: 'right',
  },
  titleWrap: {
    alignItems: 'center',
    marginTop: 10,
  },
  heading: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#334155',
  },
  studentName: {
    marginTop: 18,
    fontSize: 30,
    fontWeight: 700,
    textAlign: 'center',
  },
  courseLine: {
    marginTop: 14,
    fontSize: 14,
    textAlign: 'center',
    color: '#1e293b',
  },
  courseTitle: {
    marginTop: 8,
    fontSize: 20,
    textAlign: 'center',
    fontWeight: 600,
  },
  footer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  detailBlock: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 12,
    color: '#0f172a',
  },
  verificationCode: {
    marginTop: 2,
    fontSize: 11,
    color: '#0f172a',
  },
});

const CertificateDocument = ({
  studentName,
  courseTitle,
  instructorName,
  completionDate,
  verificationCode,
}: CertificatePdfInput) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.container}>
        <View>
          <View style={styles.header}>
            <View style={styles.logoPlaceholder}>
              <Text>University Logo</Text>
              <Text>Placeholder</Text>
            </View>
            <Text style={styles.platformName}>Campus Learning Management Platform</Text>
          </View>

          <View style={styles.titleWrap}>
            <Text style={styles.heading}>Certificate of Completion</Text>
            <Text style={styles.subtitle}>This certifies that</Text>
          </View>

          <Text style={styles.studentName}>{studentName}</Text>

          <Text style={styles.courseLine}>has successfully completed the course</Text>
          <Text style={styles.courseTitle}>{courseTitle}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Instructor</Text>
            <Text style={styles.detailValue}>{instructorName}</Text>
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Completion Date</Text>
            <Text style={styles.detailValue}>{completionDate}</Text>
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Verification Code</Text>
            <Text style={styles.verificationCode}>{verificationCode}</Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

export const generateCertificatePdfBuffer = async (
  input: CertificatePdfInput,
): Promise<Buffer> => renderToBuffer(<CertificateDocument {...input} />);
