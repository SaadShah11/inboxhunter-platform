'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Zap,
  Shield,
  BarChart3,
  Play,
  Check,
  Sparkles,
  Globe,
  Lock,
  Cpu,
  ChevronRight,
  Star,
} from 'lucide-react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 bg-mesh pointer-events-none" />
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5">
        <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-xl" />
        <div className="relative container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">InboxHunter</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="#features"
              className="hidden md:block text-sm text-gray-400 hover:text-white transition-colors"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="hidden md:block text-sm text-gray-400 hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-5xl">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm mb-8 ${
              mounted ? 'animate-in fade-in slide-in-from-bottom duration-500' : 'opacity-0'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Powered by GPT-4 Vision</span>
          </div>

          {/* Headline */}
          <h1
            className={`text-5xl md:text-7xl font-bold leading-tight mb-6 ${
              mounted ? 'animate-in fade-in slide-in-from-bottom duration-500 stagger-1' : 'opacity-0'
            }`}
          >
            Automate Email Signups
            <br />
            <span className="text-gradient">From Any Landing Page</span>
          </h1>

          {/* Subheadline */}
          <p
            className={`text-xl text-gray-400 max-w-2xl mx-auto mb-10 ${
              mounted ? 'animate-in fade-in slide-in-from-bottom duration-500 stagger-2' : 'opacity-0'
            }`}
          >
            InboxHunter uses AI vision to intelligently detect and fill signup forms on any website.
            No coding required. No selectors to maintain.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center ${
              mounted ? 'animate-in fade-in slide-in-from-bottom duration-500 stagger-3' : 'opacity-0'
            }`}
          >
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-lg font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-lg font-semibold hover:bg-white/10 transition-all"
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </Link>
          </div>

          {/* Trust indicators */}
          <div
            className={`mt-16 flex items-center justify-center gap-8 text-sm text-gray-500 ${
              mounted ? 'animate-in fade-in duration-500 stagger-4' : 'opacity-0'
            }`}
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              Cancel anytime
            </div>
          </div>
        </div>

        {/* Hero Image / Demo */}
        <div
          className={`mt-20 container mx-auto max-w-6xl ${
            mounted ? 'animate-in fade-in zoom-in-95 duration-700 stagger-5' : 'opacity-0'
          }`}
        >
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent z-10" />
            <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <p className="text-gray-400">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful features to automate your email list building workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Cpu className="w-6 h-6" />}
              title="AI-Powered Detection"
              description="GPT-4 Vision analyzes screenshots to find and fill forms. No hardcoded selectors."
              gradient="from-indigo-500 to-blue-500"
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Advanced Stealth"
              description="Bypass bot detection on ClickFunnels, GoHighLevel, Cloudflare, and more."
              gradient="from-emerald-500 to-teal-500"
            />
            <FeatureCard
              icon={<Globe className="w-6 h-6" />}
              title="Meta Ads Scraping"
              description="Extract landing page URLs directly from Meta Ads Library."
              gradient="from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={<Lock className="w-6 h-6" />}
              title="CAPTCHA Solving"
              description="Automatic reCAPTCHA and hCaptcha solving with 2Captcha integration."
              gradient="from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Real-time Analytics"
              description="Track signups, success rates, and agent performance live."
              gradient="from-orange-500 to-red-500"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Lightning Fast"
              description="Process hundreds of signups per hour with optimized automation."
              gradient="from-yellow-500 to-orange-500"
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative py-32 px-6 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-400">Get started in minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="01"
              title="Download Agent"
              description="Install the lightweight desktop agent on your computer. Available for Windows, macOS, and Linux."
            />
            <StepCard
              number="02"
              title="Connect & Configure"
              description="Register your agent with the platform and add your credentials for form filling."
            />
            <StepCard
              number="03"
              title="Start Automating"
              description="Scrape URLs from Meta Ads Library or add your own. Watch the agent work its magic."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-32 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-xl text-gray-400">Start free, upgrade when you need more</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard
              name="Starter"
              price="Free"
              period=""
              description="Perfect for getting started"
              features={[
                '50 signups/month',
                '1 connected agent',
                'Basic analytics',
                'Email support',
              ]}
              cta="Get Started"
              href="/signup"
            />
            <PricingCard
              name="Pro"
              price="$49"
              period="/month"
              description="For serious automation"
              features={[
                'Unlimited signups',
                '5 connected agents',
                'Meta Ads scraping',
                'Priority support',
                'Advanced analytics',
                'API access',
              ]}
              cta="Start Free Trial"
              href="/signup"
              popular
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            <div className="relative px-12 py-16 text-center">
              <h2 className="text-4xl font-bold mb-4">Ready to Automate?</h2>
              <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                Join thousands of marketers who are building their email lists on autopilot.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-white/5">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">InboxHunter</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/support" className="hover:text-white transition-colors">
                Support
              </Link>
            </div>
            <p className="text-sm text-gray-500">© 2024 InboxHunter. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all duration-300">
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="text-6xl font-bold text-gradient mb-4">{number}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  href,
  popular,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  popular?: boolean;
}) {
  return (
    <div
      className={`relative p-8 rounded-2xl ${
        popular
          ? 'bg-gradient-to-b from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/50'
          : 'bg-white/5 border border-white/10'
      }`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-sm font-semibold">
          Most Popular
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-1">{name}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
      <div className="mb-6">
        <span className="text-5xl font-bold">{price}</span>
        <span className="text-gray-400">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-gray-300">
            <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`block w-full py-3 rounded-xl text-center font-semibold transition-colors ${
          popular
            ? 'bg-white text-gray-900 hover:bg-gray-100'
            : 'bg-white/10 hover:bg-white/20'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
