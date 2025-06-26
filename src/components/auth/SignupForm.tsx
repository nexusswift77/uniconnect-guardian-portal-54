import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface SchoolOption {
  id: string;
  name: string;
  address: string;
}

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    schoolId: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  
  const { signUp } = useAuth();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoadingSchools(true);
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, address')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setSchools(data || []);
    } catch (err) {
      console.error('Error fetching schools:', err);
      setError('Failed to load schools. Please refresh the page.');
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    
    // Reset school selection if role changes away from lecturer/head_lecturer
    if (field === 'role' && !['lecturer', 'head_lecturer'].includes(value)) {
      setFormData(prev => ({ ...prev, schoolId: '' }));
    }
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.email.includes('@')) return 'Please enter a valid email';
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    if (!formData.role) return 'Please select a role';
    if (['lecturer', 'head_lecturer'].includes(formData.role) && !formData.schoolId) {
      return 'Please select a school';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

         try {
       await signUp(
         formData.email,
         formData.password,
         {
           firstName: formData.firstName,
           lastName: formData.lastName,
           role: formData.role as 'lecturer' | 'system_admin' | 'head_lecturer',
           schoolId: formData.schoolId || undefined
         }
       );
       // signUp will handle navigation on success
     } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
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
            <h1 className="text-3xl font-bold text-white mb-2">Join UniConnect</h1>
            <p className="text-gray-400">Create your admin account</p>
          </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-500/30 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-gray-300">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 rounded-2xl h-12"
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-gray-300">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 rounded-2xl h-12"
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 rounded-2xl h-12"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-300">Role</Label>
              <Select onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-2xl h-12">
                  <SelectValue placeholder="Select your role" className="text-gray-400" />
                </SelectTrigger>
                <SelectContent className="bg-charcoal border-white/10 rounded-2xl">
                  <SelectItem value="lecturer" className="text-white hover:bg-white/10">Lecturer</SelectItem>
                  <SelectItem value="system_admin" className="text-white hover:bg-white/10">Administrator</SelectItem>
                  <SelectItem value="head_lecturer" className="text-white hover:bg-white/10">Head of Department</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* School Selection - Only show for lecturers and head lecturers */}
            {['lecturer', 'head_lecturer'].includes(formData.role) && (
              <div className="space-y-2">
                <Label htmlFor="school" className="text-gray-300">School</Label>
                <Select onValueChange={(value) => handleInputChange('schoolId', value)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-2xl h-12">
                    <SelectValue placeholder={loadingSchools ? "Loading schools..." : "Select your school"} className="text-gray-400" />
                  </SelectTrigger>
                  <SelectContent className="bg-charcoal border-white/10 rounded-2xl max-h-60">
                    {loadingSchools ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span className="ml-2 text-white">Loading schools...</span>
                      </div>
                    ) : schools.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">
                        No active schools available
                      </div>
                    ) : (
                      schools.map((school) => (
                        <SelectItem key={school.id} value={school.id} className="text-white hover:bg-white/10">
                          <div>
                            <div className="font-medium">{school.name}</div>
                            <div className="text-sm text-gray-400">{school.address}</div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 mt-1">
                  Select the school where you will be working
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 rounded-2xl h-12 pr-12"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 rounded-2xl h-12 pr-12"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full glass-button h-12 text-white font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-sky-blue hover:text-sky-blue/80 font-medium"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}; 