'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, Mail, Lock, User, ArrowRight, Check, Github, Chrome } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await authApi.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setError(error);
        return;
      }

      if (data) {
        setAuth(data.user, data.token);
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'AI-powered form detection',
    '50 free signups per month',
    'Real-time analytics dashboard',
    'Meta Ads Library integration',
    'Cancel anytime',
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-2xl text-gray-900 dark:text-white">InboxHunter</span>
            </Link>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Create your account</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Chrome className="w-5 h-5" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Sign up with Google</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Github className="w-5 h-5" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Sign up with GitHub</span>
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-900 text-gray-500">or continue with email</span>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Full name"
              type="text"
              placeholder="John Doe"
              icon={<User className="w-5 h-5" />}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              icon={<Mail className="w-5 h-5" />}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5" />}
              hint="At least 8 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <Input
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5" />}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
              icon={!loading && <ArrowRight className="w-5 h-5" />}
              iconPosition="right"
            >
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-indigo-600 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-indigo-600 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-2xl">InboxHunter</span>
          </Link>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold leading-tight mb-4">
                Start automating
                <br />
                <span className="text-gradient">in minutes.</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-md">
                Everything you need to build your email list on autopilot.
              </p>
            </div>

            <div className="space-y-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-gray-500">© 2024 InboxHunter. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
