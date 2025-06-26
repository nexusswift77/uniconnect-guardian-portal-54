import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

export const AuthWrapper: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false);

  const switchToLogin = () => setIsSignup(false);
  const switchToSignup = () => setIsSignup(true);

  if (isSignup) {
    return <SignupForm onSwitchToLogin={switchToLogin} />;
  }

  return <LoginForm onSwitchToSignup={switchToSignup} />;
}; 