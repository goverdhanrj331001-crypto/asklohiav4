export interface StudentProfile {
  name: string;
  status: 'Collegiate' | 'Non-Collegiate';
  level: 'Graduate' | 'Post Graduate';
  semester: string;
  phone?: string;
  idCardImage?: string; // base64 or URL
  lastUpdated: string;
}
