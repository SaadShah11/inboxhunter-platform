"use client";

import Link from "next/link";
import { ArrowRight, Bot, Zap, Shield, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">InboxHunter</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-muted-foreground hover:text-foreground transition"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm mb-6">
            <Zap className="h-4 w-4" />
            AI-Powered Automation
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Automate Email List Signups
            <br />
            From Any Landing Page
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            InboxHunter uses GPT-4 Vision to intelligently detect and fill signup forms 
            on any website. No coding required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary/90 transition"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-8 py-3 rounded-lg text-lg font-medium hover:bg-secondary/80 transition"
            >
              See Features
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Bot className="h-8 w-8" />}
              title="AI-Powered Detection"
              description="GPT-4 Vision analyzes screenshots to find and fill forms without any hardcoded selectors."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Stealth Mode"
              description="Advanced bot detection bypass for ClickFunnels, GoHighLevel, and more."
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Analytics Dashboard"
              description="Track signups, success rates, and performance metrics in real-time."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Automate?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Download the desktop agent, connect to your dashboard, and start 
            automating email list signups today.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary/90 transition"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <span className="font-semibold">InboxHunter</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 InboxHunter. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="bg-card border rounded-xl p-6 hover:shadow-lg transition">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

