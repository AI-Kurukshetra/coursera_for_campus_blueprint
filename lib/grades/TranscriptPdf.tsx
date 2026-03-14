import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';
import type { StudentTranscriptData } from '@/types/grade';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: 11,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#334155',
  },
  table: {
    border: '1 solid #cbd5e1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottom: '1 solid #e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  rowHeader: {
    backgroundColor: '#f1f5f9',
  },
  cellCourse: {
    width: '55%',
    paddingRight: 10,
  },
  cellScore: {
    width: '25%',
    textAlign: 'right',
    paddingRight: 10,
  },
  cellGrade: {
    width: '20%',
    textAlign: 'right',
  },
  footer: {
    marginTop: 18,
    fontSize: 10,
    color: '#475569',
  },
});

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const formatScore = (score: number | null): string => {
  if (score === null) {
    return 'N/A';
  }

  return `${score.toFixed(2)}%`;
};

const TranscriptDocument = ({ transcript }: { transcript: StudentTranscriptData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Academic Transcript</Text>
        <Text style={styles.subtitle}>Student: {transcript.student_name}</Text>
        <Text style={styles.subtitle}>Generated: {formatDate(transcript.generated_at)}</Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.row, styles.rowHeader]}>
          <Text style={styles.cellCourse}>Course</Text>
          <Text style={styles.cellScore}>Average Score</Text>
          <Text style={styles.cellGrade}>Letter Grade</Text>
        </View>

        {transcript.courses.length > 0 ? (
          transcript.courses.map((course) => (
            <View key={course.course_title} style={styles.row}>
              <Text style={styles.cellCourse}>{course.course_title}</Text>
              <Text style={styles.cellScore}>{formatScore(course.average_score)}</Text>
              <Text style={styles.cellGrade}>{course.letter_grade ?? 'N/A'}</Text>
            </View>
          ))
        ) : (
          <View style={styles.row}>
            <Text style={styles.cellCourse}>No enrolled courses found</Text>
            <Text style={styles.cellScore}>-</Text>
            <Text style={styles.cellGrade}>-</Text>
          </View>
        )}
      </View>

      <Text style={styles.footer}>Campus Learning Management Platform Transcript</Text>
    </Page>
  </Document>
);

export const generateTranscriptPdfBuffer = async (
  transcript: StudentTranscriptData,
): Promise<Buffer> => renderToBuffer(<TranscriptDocument transcript={transcript} />);
