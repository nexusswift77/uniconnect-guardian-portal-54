import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(email, password);
      toast({
        title: "Login Successful",
        description: "Welcome to UniConnect dashboard",
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="glass-card p-8 border-sky-blue/20">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-sky-blue/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-sky-blue">UC</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">UniConnect</h1>
            <p className="text-gray-400">Admin & Lecturer Dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 rounded-2xl h-12"
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 rounded-2xl h-12"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full glass-button h-12 text-white font-semibold"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Demo accounts: lecturer@uni.edu, admin@uni.edu, hod@uni.edu<br/>
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignup}
                className="text-sky-blue hover:text-sky-blue/80 font-medium"
              >
                Create one here
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
