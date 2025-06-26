import QRCode from 'qrcode';

export interface AttendanceQRData {
  sessionId: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  timestamp: string;
  expiresAt: string;
}

export const generateAttendanceQR = async (sessionData: {
  sessionId: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  expiresAt?: string;
}): Promise<string> => {
  try {
    const qrData: AttendanceQRData = {
      sessionId: sessionData.sessionId,
      courseId: sessionData.courseId,
      courseCode: sessionData.courseCode,
      courseName: sessionData.courseName,
      timestamp: new Date().toISOString(),
      expiresAt: sessionData.expiresAt || new Date(Date.now() + 5 * 60000).toISOString(), // Default 5 minutes
    };

    // Convert to JSON string for QR code
    const qrDataString = JSON.stringify(qrData);

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrDataString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

export const generateAttendanceQRCanvas = async (
  sessionData: {
    sessionId: string;
    courseId: string;
    courseCode: string;
    courseName: string;
    expiresAt?: string;
  },
  canvas: HTMLCanvasElement
): Promise<void> => {
  try {
    const qrData: AttendanceQRData = {
      sessionId: sessionData.sessionId,
      courseId: sessionData.courseId,
      courseCode: sessionData.courseCode,
      courseName: sessionData.courseName,
      timestamp: new Date().toISOString(),
      expiresAt: sessionData.expiresAt || new Date(Date.now() + 5 * 60000).toISOString(),
    };

    const qrDataString = JSON.stringify(qrData);

    await QRCode.toCanvas(canvas, qrDataString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (error) {
    console.error('Error generating QR code to canvas:', error);
    throw new Error('Failed to generate QR code');
  }
};

export const isQRCodeExpired = (qrData: AttendanceQRData): boolean => {
  return new Date() > new Date(qrData.expiresAt);
};

export const parseAttendanceQR = (qrString: string): AttendanceQRData | null => {
  try {
    const data = JSON.parse(qrString) as AttendanceQRData;
    
    // Validate required fields
    if (!data.sessionId || !data.courseId || !data.courseCode || !data.timestamp) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return null;
  }
}; 