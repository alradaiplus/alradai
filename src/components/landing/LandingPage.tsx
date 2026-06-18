'use client';

import { useState } from 'react';
import Link from 'next/link';

export function LandingPage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-700 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            AlRadai+
          </div>
          <div className="flex gap-4">
            <Link href="/app" className="px-4 py-2 rounded-lg hover:bg-slate-700 transition">
              App
            </Link>
            <Link href="/auth" className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Your AI-Powered <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Second Brain</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Capture thoughts, organize ideas, and let AI help you understand what matters most. All in one beautiful workspace.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/app" className="px-8 py-4 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 transition text-lg">
              Start Free
            </Link>
            <button className="px-8 py-4 border-2 border-slate-400 rounded-lg font-semibold hover:bg-slate-700 transition text-lg">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Powerful Features</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Voice & AI Chat */}
            <div className="bg-slate-700/50 p-8 rounded-lg border border-slate-600 hover:border-blue-500 transition">
              <div className="text-4xl mb-4">🎤</div>
              <h3 className="text-xl font-bold mb-3">Voice & AI Chat</h3>
              <p className="text-slate-300">
                Capture ideas with your voice. Chat with AI that understands your context and learns your preferences.
              </p>
            </div>

            {/* Feature 2: Smart Organization */}
            <div className="bg-slate-700/50 p-8 rounded-lg border border-slate-600 hover:border-blue-500 transition">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3">Smart Organization</h3>
              <p className="text-slate-300">
                Databases, tables, kanban boards, calendars. Multiple views of the same data, all synchronized.
              </p>
            </div>

            {/* Feature 3: Knowledge Graph */}
            <div className="bg-slate-700/50 p-8 rounded-lg border border-slate-600 hover:border-blue-500 transition">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-bold mb-3">Knowledge Graph</h3>
              <p className="text-slate-300">
                Wikilinks, backlinks, and visual connections. See how your ideas relate and discover new insights.
              </p>
            </div>

            {/* Feature 4: Habit Tracking */}
            <div className="bg-slate-700/50 p-8 rounded-lg border border-slate-600 hover:border-blue-500 transition">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-bold mb-3">Habit Tracker</h3>
              <p className="text-slate-300">
                Track daily habits, set goals, and visualize your progress with beautiful charts and analytics.
              </p>
            </div>

            {/* Feature 5: File Uploads */}
            <div className="bg-slate-700/50 p-8 rounded-lg border border-slate-600 hover:border-blue-500 transition">
              <div className="text-4xl mb-4">📁</div>
              <h3 className="text-xl font-bold mb-3">File Management</h3>
              <p className="text-slate-300">
                Upload images, PDFs, and documents. AI automatically extracts and indexes content for search.
              </p>
            </div>

            {/* Feature 6: Collaboration */}
            <div className="bg-slate-700/50 p-8 rounded-lg border border-slate-600 hover:border-blue-500 transition">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold mb-3">Collaboration</h3>
              <p className="text-slate-300">
                Share workspaces, assign roles, and collaborate in real-time with comments and mentions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          
          <div className="space-y-12">
            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg">1</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Capture Everything</h3>
                <p className="text-slate-300">
                  Use voice, text, or files. AlRadai+ captures your thoughts and automatically organizes them.
                </p>
              </div>
            </div>

            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg">2</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">AI Understands You</h3>
                <p className="text-slate-300">
                  Our AI learns your preferences through an intelligent interview. It asks questions to understand your goals and habits better.
                </p>
              </div>
            </div>

            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg">3</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Get Personalized Insights</h3>
                <p className="text-slate-300">
                  Receive AI-powered summaries, suggestions, and connections tailored to your unique context.
                </p>
              </div>
            </div>

            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg">4</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Track & Improve</h3>
                <p className="text-slate-300">
                  Monitor habits, set goals, and watch your progress. AI provides personalized recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Simple Pricing</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-slate-700/50 p-8 rounded-lg border border-slate-600">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-3xl font-bold text-blue-400 mb-6">$0<span className="text-lg text-slate-300">/month</span></p>
              <ul className="space-y-3 mb-8 text-slate-300">
                <li>✓ 100 API calls/day</li>
                <li>✓ 1 GB storage</li>
                <li>✓ Basic AI features</li>
                <li>✗ Collaboration</li>
              </ul>
              <button className="w-full px-6 py-3 border border-blue-400 rounded-lg hover:bg-blue-400/10 transition">
                Get Started
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-slate-700/50 p-8 rounded-lg border-2 border-blue-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 px-4 py-1 rounded-full text-sm font-bold">
                POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-3xl font-bold text-blue-400 mb-6">$50<span className="text-lg text-slate-300">/month</span></p>
              <ul className="space-y-3 mb-8 text-slate-300">
                <li>✓ 10,000 API calls/day</li>
                <li>✓ 100 GB storage</li>
                <li>✓ Advanced AI features</li>
                <li>✓ Collaboration (10 users)</li>
              </ul>
              <button className="w-full px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition font-semibold">
                Start Free Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-slate-700/50 p-8 rounded-lg border border-slate-600">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-3xl font-bold text-blue-400 mb-6">Custom</p>
              <ul className="space-y-3 mb-8 text-slate-300">
                <li>✓ Unlimited API calls</li>
                <li>✓ Unlimited storage</li>
                <li>✓ Custom AI models</li>
                <li>✓ Unlimited collaboration</li>
              </ul>
              <button className="w-full px-6 py-3 border border-blue-400 rounded-lg hover:bg-blue-400/10 transition">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Stay Updated</h2>
          <p className="text-slate-300 mb-8">
            Get the latest features and AI tips delivered to your inbox.
          </p>
          
          <form onSubmit={handleSubscribe} className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 outline-none transition"
              required
            />
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Subscribe
            </button>
          </form>
          
          {subscribed && (
            <p className="text-green-400 mt-4">✓ Thanks for subscribing!</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Follow</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition">Discord</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700 pt-8 text-center text-slate-400">
            <p>&copy; 2026 AlRadai+. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
