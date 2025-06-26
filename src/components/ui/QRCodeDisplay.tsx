import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { generateAttendanceQR } from '@/utils/qrGenerator';
import { 
  QrCode, 
  RefreshCw, 
  Download, 
  Expand, 
  Clock, 
  Copy,
  Check 
} from 'lucide-react';

interface QRCodeDisplayProps {
  sessionId: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  isActive: boolean;
  expiresAt?: string;
  onRefresh?: () => void;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  sessionId,
  courseId,
  courseCode,
  courseName,
  isActive,
  expiresAt,
  onRefresh
}) => {
  const [qrDataURL, setQrDataURL] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isActive) {
      generateQR();
    }
  }, [sessionId, isActive]);

  useEffect(() => {
    if (expiresAt) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(expiresAt).getTime();
        const remaining = Math.max(0, expiry - now);
        setTimeLeft(remaining);

        if (remaining === 0) {
          generateQR(); // Auto-refresh when expired
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [expiresAt]);

  const generateQR = async () => {
    try {
      setLoading(true);
      const newExpiresAt = new Date(Date.now() + 5 * 60000).toISOString(); // 5 minutes from now
      
      const dataURL = await generateAttendanceQR({
        sessionId,
        courseId,
        courseCode,
        courseName,
        expiresAt: newExpiresAt
      });

      setQrDataURL(dataURL);
      onRefresh?.();
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (qrDataURL) {
      const link = document.createElement('a');
      link.download = `${courseCode}-attendance-qr.png`;
      link.href = qrDataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copySessionId = async () => {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy session ID:', error);
    }
  };

  const formatTimeLeft = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const openFullscreen = () => {
    if (qrDataURL) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${courseCode} - Attendance QR Code</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  background: #f5f5f5;
                  font-family: Arial, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                }
                .container {
                  background: white;
                  padding: 30px;
                  border-radius: 10px;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                  text-align: center;
                  max-width: 500px;
                }
                .qr-image {
                  max-width: 100%;
                  height: auto;
                  margin: 20px 0;
                }
                .course-info {
                  margin-bottom: 20px;
                }
                .course-name {
                  font-size: 24px;
                  font-weight: bold;
                  color: #333;
                  margin-bottom: 10px;
                }
                .course-code {
                  font-size: 18px;
                  color: #666;
                  margin-bottom: 10px;
                }
                .instructions {
                  color: #666;
                  font-size: 16px;
                  margin-top: 20px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="course-info">
                  <div class="course-name">${courseName}</div>
                  <div class="course-code">${courseCode}</div>
                </div>
                <img src="${qrDataURL}" alt="Attendance QR Code" class="qr-image" />
                <div class="instructions">
                  Scan this QR code with the T-Check app to mark your attendance
                </div>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  if (!isActive) {
    return (
      <div className="p-4 bg-gray-700 rounded-lg border border-gray-600 text-center">
        <QrCode className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-400">QR Code disabled</p>
      </div>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-600">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center space-x-2">
            <QrCode className="h-5 w-5 text-blue-400" />
            <span>Attendance QR Code</span>
          </CardTitle>
          {timeLeft > 0 && (
            <Badge variant="outline" className="border-green-400 text-green-300">
              <Clock className="h-3 w-3 mr-1" />
              {formatTimeLeft(timeLeft)}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* QR Code Display */}
        <div className="flex justify-center">
          {qrDataURL ? (
            <div className="bg-white p-4 rounded-lg">
              <img 
                src={qrDataURL} 
                alt="Attendance QR Code" 
                className="w-48 h-48 object-contain"
              />
            </div>
          ) : (
            <div className="w-48 h-48 bg-gray-700 rounded-lg flex items-center justify-center">
              {loading ? (
                <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
              ) : (
                <QrCode className="h-8 w-8 text-gray-400" />
              )}
            </div>
          )}
        </div>

        {/* Course Info */}
        <div className="text-center space-y-1">
          <p className="text-white font-medium">{courseName}</p>
          <p className="text-gray-400 text-sm">{courseCode}</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateQR}
            disabled={loading}
            className="border-blue-400 text-blue-300 hover:bg-blue-700/30"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={openFullscreen}
            disabled={!qrDataURL}
            className="border-green-400 text-green-300 hover:bg-green-700/30"
          >
            <Expand className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={downloadQR}
            disabled={!qrDataURL}
            className="border-purple-400 text-purple-300 hover:bg-purple-700/30"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={copySessionId}
            className="border-yellow-400 text-yellow-300 hover:bg-yellow-700/30"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-center text-xs text-gray-400 space-y-1">
                      <p>Students scan this code with the T-Check app</p>
          <p>QR code refreshes automatically every 5 minutes</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeDisplay; 