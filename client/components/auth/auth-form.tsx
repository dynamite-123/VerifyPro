'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FormContainer from './form-container';
import Input from '../ui/input';
import Button from '../ui/button';

// Types based on backend requirements
interface LoginFormData {
  email?: string;
  phoneNumber?: string;
  password: string;
}

interface RegisterFormData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
}

interface AuthFormProps {
  mode: 'login' | 'register';
}

const AuthForm: React.FC<AuthFormProps> = ({ mode }) => {
  const router = useRouter();
  const isLogin = mode === 'login';
  
  // Initialize form state based on mode
  const [formData, setFormData] = useState<LoginFormData | RegisterFormData>(
    isLogin 
      ? { email: '', password: '' } 
      : {
          name: '',
          email: '',
          phoneNumber: '',
          password: '',
        }
  );
  
  // Remove government ID options as they're no longer needed
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (isLogin) {
      // Login validation
      const loginData = formData as LoginFormData;
      
      if (!loginData.email && !loginData.phoneNumber) {
        newErrors.email = 'Email or phone number is required';
      }
      
      if (!loginData.password) {
        newErrors.password = 'Password is required';
      }
    } else {
      // Register validation
      const registerData = formData as RegisterFormData;
      
      if (!registerData.name) {
        newErrors.name = 'Name is required';
      }
      
      if (!registerData.email) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
        newErrors.email = 'Invalid email format';
      }
      
      if (!registerData.phoneNumber) {
        newErrors.phoneNumber = 'Phone number is required';
      }
      
      if (!registerData.password) {
        newErrors.password = 'Password is required';
      } else if (registerData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const endpoint = isLogin ? 'http://localhost:8000/api/v1/auth/login' : 'http://localhost:8000/api/v1/auth/register';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Successful login/register
        if (isLogin) {
          // Redirect to dashboard or home page after login
          router.push('/dashboard');
        } else {
          // Redirect to login page after registration
          router.push('/auth/login');
        }
      } else {
        // Handle API errors
        if (data.error) {
          setErrors({ form: data.error });
        }
      }
    } catch (error) {
      setErrors({ form: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormContainer 
      title={isLogin ? 'Sign in to your account' : 'Create a new account'}
      subtitle={isLogin 
        ? 'Enter your credentials to access your account'
        : 'Fill in your details to create an account'
      }
    >
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {errors.form && (
          <div className="p-3.5 bg-red-50 border border-red-100 text-red-500 rounded-lg text-xs font-normal">
            {errors.form}
          </div>
        )}
        
        {!isLogin && (
          <Input
            label="Name"
            name="name"
            type="text"
            required
            value={(formData as RegisterFormData).name}
            onChange={handleChange}
            error={errors.name}
          />
        )}
        
        <Input
          label="Email"
          name="email"
          type="email"
          required
          value={formData.email || ''}
          onChange={handleChange}
          error={errors.email}
        />
        
        {!isLogin && (
          <Input
            label="Phone Number"
            name="phoneNumber"
            type="tel"
            required
            value={(formData as RegisterFormData).phoneNumber}
            onChange={handleChange}
            error={errors.phoneNumber}
          />
        )}
        
        {isLogin && (
          <Input
            label="Phone Number (alternative to email)"
            name="phoneNumber"
            type="tel"
            value={(formData as LoginFormData).phoneNumber || ''}
            onChange={handleChange}
            error={errors.phoneNumber}
          />
        )}
        
        <Input
          label="Password"
          name="password"
          type="password"
          required
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />
        
        <div>
          <Button
            type="submit"
            fullWidth
            disabled={isLoading}
            className="mt-6"
          >
            {isLoading 
              ? 'Processing...' 
              : isLogin ? 'Sign In' : 'Create Account'
            }
          </Button>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 font-normal">
            {isLogin 
              ? "Don't have an account? " 
              : "Already have an account? "
            }
            <Link 
              href={isLogin ? '/auth/register' : '/auth/login'}
              className="font-medium text-gray-800 hover:text-gray-600 underline-offset-4 hover:underline transition-all"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </Link>
          </p>
        </div>
      </form>
    </FormContainer>
  );
};

export default AuthForm;
