
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Monitor, Clock, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const QRGenerator: React.FC = () => {
  const [qrCode, setQrCode] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [sessionDuration, setSessionDuration] = useState<number>(15);
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      toast({
        title: "QR Code Expired",
        description: "Generate a new QR code for continued access",
        variant: "destructive",
      });
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, toast]);

  const generateQR = () => {
    const sessionId = `UC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setQrCode(sessionId);
    setTimeLeft(sessionDuration * 60);
    setIsActive(true);
    
    toast({
      title: "QR Code Generated",
      description: `Valid for ${sessionDuration} minutes`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="glass-card p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-2">QR Code Generator</h2>
          <p className="text-gray-400">Generate QR codes for student check-in fallback</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Session Duration (minutes)
            </label>
            <Input
              type="number"
              value={sessionDuration}
              onChange={(e) => setSessionDuration(Number(e.target.value))}
              className="bg-white/5 border-white/10 text-white rounded-2xl"
              min="5"
              max="180"
            />
          </div>
        </div>

        <Button
          onClick={generateQR}
          disabled={isActive}
          className="w-full glass-button h-12 mb-4"
        >
          <Monitor className="w-5 h-5 mr-2" />
          {isActive ? 'QR Code Active' : 'Generate QR Code'}
        </Button>

        {isActive && (
          <div className="text-center">
            <Badge className="status-online border rounded-xl mb-2">
              <Clock className="w-4 h-4 mr-1" />
              {formatTime(timeLeft)} remaining
            </Badge>
            <p className="text-sm text-gray-400">Session ID: {qrCode}</p>
          </div>
        )}
      </Card>

      <Card className="glass-card p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-4">QR Code Display</h3>
          
          {qrCode ? (
            <div className="bg-white p-8 rounded-3xl mb-4">
              <div className="w-48 h-48 mx-auto bg-black rounded-2xl flex items-center justify-center">
                <div className="text-white text-center">
                  <Monitor className="w-16 h-16 mx-auto mb-2" />
                  <p className="text-xs break-all">{qrCode}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-48 h-48 mx-auto bg-white/5 border-2 border-dashed border-white/20 rounded-3xl flex items-center justify-center mb-4">
              <div className="text-center text-gray-400">
                <Monitor className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Generate QR Code</p>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-400">
            Students can scan this QR code as a backup check-in method
          </p>
        </div>
      </Card>
    </div>
  );
};
