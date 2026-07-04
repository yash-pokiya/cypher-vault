import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  Cpu,
  KeyRound,
  Activity,
  CloudLightning,
  Fingerprint,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Server,
  Zap,
  Globe,
  ChevronRight,
  Star,
  Terminal,
  Layers,
  Check,
  ExternalLink,
  Smartphone,
  Laptop,
  AlertTriangle,
  Radio,
} from 'lucide-react';

const LOGO_URL =
  'https://res.cloudinary.com/dsncsvgfm/image/upload/v1783154773/Gemini_Generated_Image_u7z23gu7z23gu7z2-removebg-preview_ylpmqd.png';

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div
      style={{
        background: 'radial-gradient(circle at 50% 0%, #1e1245 0%, #0d091e 50%, #06040e 100%)',
        color: '#F3F4F6',
        minHeight: '100vh',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── Background Grid & Glowing Orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Subtle Cyber Grid */}
        <div
          style={{
            backgroundImage: `radial-gradient(rgba(94, 168, 255, 0.12) 1px, transparent 1px), linear-gradient(to right, rgba(42, 27, 93, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(42, 27, 93, 0.15) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
          className="absolute inset-0 opacity-40"
        />
        {/* Ambient Radial Lights */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(94, 168, 255, 0.18) 0%, rgba(42, 27, 93, 0.35) 50%, transparent 80%)',
            filter: 'blur(90px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '30%',
            right: '-10%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            left: '-10%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
      </div>

      {/* ── Header / Navbar ── */}
      <header
        style={{
          background: 'rgba(13, 9, 30, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
        className="sticky top-0 z-50 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-[#5EA8FF] to-[#7C3AED] rounded-full blur-sm opacity-60 group-hover:opacity-100 transition duration-300" />
              <img
                src={LOGO_URL}
                alt="CYPHER Logo"
                className="relative w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(94,168,255,0.5)]"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-wider text-white flex items-center gap-1.5">
                CYPHER
                <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded bg-[#5EA8FF]/20 text-[#5EA8FF] border border-[#5EA8FF]/30">
                  AI
                </span>
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-[#5EA8FF] transition-colors">
              Features
            </a>
            <a href="#dashboard" className="hover:text-[#5EA8FF] transition-colors">
              Dashboard
            </a>
            <a href="#stats" className="hover:text-[#5EA8FF] transition-colors">
              Metrics
            </a>
            <a href="#testimonials" className="hover:text-[#5EA8FF] transition-colors">
              Testimonials
            </a>
            <a href="#pricing" className="hover:text-[#5EA8FF] transition-colors">
              Pricing
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              style={{
                background: 'linear-gradient(135deg, #2A1B5D 0%, #4F46E5 50%, #5EA8FF 100%)',
                boxShadow: '0 0 20px rgba(94, 168, 255, 0.3)',
              }}
              className="relative group overflow-hidden rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_0_25px_rgba(94,168,255,0.5)] hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative z-10 pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Text Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            {/* Version Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-[#5EA8FF]/30 text-xs text-slate-300 backdrop-blur-md shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-[#5EA8FF] animate-pulse" />
              <span className="font-semibold text-white">CYPHER v3.0</span>
              <span className="text-slate-500">•</span>
              <span className="text-[#5EA8FF]">Next-Gen Zero-Knowledge Security</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Brand Logo & Name Badge */}
            <div className="flex items-center justify-center lg:justify-start gap-4 pt-2">
              <img
                src={LOGO_URL}
                alt="CYPHER Shield"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_0_25px_rgba(94,168,255,0.6)]"
              />
              <div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  CYPHER
                </h2>
                <p className="text-xs font-semibold text-[#5EA8FF] uppercase tracking-widest">
                  Autonomous Cyber Defense & Encrypted Vault
                </p>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
              Protect Everything.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5EA8FF] via-[#A78BFA] to-[#E0E7FF] drop-shadow-sm">
                Trust Nothing.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Secure your digital identity with AI-powered threat detection, encrypted cloud protection, password vaults, malware scanning, and real-time security monitoring.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                to="/register"
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #2A1B5D 50%, #5EA8FF 100%)',
                  boxShadow: '0 0 30px rgba(94, 168, 255, 0.4)',
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(94,168,255,0.6)]"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>

              <a
                href="#features"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-slate-200 text-base flex items-center justify-center gap-2 hover:bg-white/10 transition-all duration-300"
              >
                Learn More
              </a>
            </div>

            {/* Compliance & Trust Badges */}
            <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center lg:text-left">
              {[
                { label: 'ISO 27001', sub: 'Certified Standard' },
                { label: 'SOC 2 Type II', sub: 'Audited Security' },
                { label: 'Zero-Knowledge', sub: 'Client-Side Crypto' },
                { label: 'AES-256-GCM', sub: 'Military Grade' },
              ].map((badge, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-sm font-bold text-white flex items-center justify-center lg:justify-start gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#5EA8FF]" />
                    {badge.label}
                  </span>
                  <span className="text-[11px] text-slate-400">{badge.sub}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Holographic Cyber Shield Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
              {/* Outer Rotating Glowing Ring */}
              <div
                style={{
                  border: '1.5px dashed rgba(94, 168, 255, 0.3)',
                  animation: 'spin 30s linear infinite',
                }}
                className="absolute inset-0 rounded-full"
              />
              <div
                style={{
                  border: '1px solid rgba(124, 58, 237, 0.4)',
                  animation: 'spin 20s linear reverse infinite',
                }}
                className="absolute inset-6 rounded-full"
              />

              {/* Central Glass Shield Card */}
              <div
                style={{
                  background: 'rgba(20, 14, 45, 0.7)',
                  border: '1px solid rgba(94, 168, 255, 0.3)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 0 50px rgba(42, 27, 93, 0.8), inset 0 0 20px rgba(94, 168, 255, 0.2)',
                  borderRadius: '28px',
                }}
                className="relative z-10 w-4/5 aspect-square p-6 flex flex-col items-center justify-between overflow-hidden"
              >
                {/* Status Indicator */}
                <div className="w-full flex items-center justify-between border-b border-slate-700/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      AI SHIELD ONLINE
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">256-BIT AES</span>
                </div>

                {/* Big Glowing Logo Shield Center */}
                <div className="relative flex items-center justify-center my-auto">
                  <div className="absolute -inset-6 bg-[#5EA8FF]/20 rounded-full blur-xl animate-pulse" />
                  <img
                    src={LOGO_URL}
                    alt="Cyber Logo Shield"
                    className="relative w-32 h-32 object-contain drop-shadow-[0_0_35px_rgba(94,168,255,0.7)] hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Live Telemetry Bar */}
                <div className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Threat Radar Scan</span>
                    <span className="text-[#5EA8FF] font-mono font-bold">100% Safe</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#4F46E5] to-[#5EA8FF] h-full w-full animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Floating Orbiting Badges */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(94, 168, 255, 0.4)',
                  backdropFilter: 'blur(12px)',
                }}
                className="absolute top-4 left-0 z-20 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xl animate-bounce"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">0 Vulnerabilities</span>
              </div>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(124, 58, 237, 0.4)',
                  backdropFilter: 'blur(12px)',
                }}
                className="absolute bottom-6 right-0 z-20 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xl"
              >
                <Cpu className="w-4 h-4 text-[#5EA8FF]" />
                <span className="text-xs font-semibold text-white">AI Threat Blocked</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5EA8FF]/10 border border-[#5EA8FF]/30 text-xs font-semibold text-[#5EA8FF]">
            <Shield className="w-3.5 h-3.5" />
            Core Capabilities
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Comprehensive Cybersecurity Architecture
          </h2>
          <p className="text-base text-slate-400">
            Engineered from the ground up to protect your files, passwords, digital identity, and infrastructure against next-gen cyber threats.
          </p>
        </div>

        {/* 6 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: ShieldCheck,
              title: 'End-to-End Encryption',
              desc: 'Client-side zero-knowledge encryption powered by PBKDF2 & AES-256-GCM. Your keys never leave your device.',
              color: 'from-emerald-500/20 to-teal-500/5',
              accent: '#34D399',
            },
            {
              icon: Cpu,
              title: 'AI Threat Detection',
              desc: 'Real-time neural network monitoring scans incoming traffic, file mutations, and credentials for zero-day exploits.',
              color: 'from-blue-500/20 to-indigo-500/5',
              accent: '#5EA8FF',
            },
            {
              icon: KeyRound,
              title: 'Secure Password Vault',
              desc: 'Encrypted credential manager with master key derivation, automated strength auditing, and breach notifications.',
              color: 'from-purple-500/20 to-indigo-500/5',
              accent: '#A78BFA',
            },
            {
              icon: Activity,
              title: 'Real-Time Monitoring',
              desc: 'Live telemetry dashboard providing instant alerts on unauthorized access probes and session anomalies.',
              color: 'from-amber-500/20 to-orange-500/5',
              accent: '#F59E0B',
            },
            {
              icon: CloudLightning,
              title: 'Cloud Backup Protection',
              desc: 'High-availability encrypted cloud storage with automatic redundancy and immutable security snapshots.',
              color: 'from-sky-500/20 to-blue-500/5',
              accent: '#38BDF8',
            },
            {
              icon: Fingerprint,
              title: 'Multi-Factor Authentication',
              desc: 'Hardware security keys (FIDO2/WebAuthn), TOTP authenticator support, and adaptive biometric passkeys.',
              color: 'from-rose-500/20 to-pink-500/5',
              accent: '#FB7185',
            },
          ].map((feat, idx) => {
            const IconComponent = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                style={{
                  background: 'rgba(23, 15, 52, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '24px',
                }}
                className="group p-8 relative overflow-hidden transition-all duration-300 hover:border-[#5EA8FF]/50 hover:shadow-[0_10px_30px_rgba(42,27,93,0.5)] hover:-translate-y-1"
              >
                {/* Subtle Gradient Glow in card background */}
                <div
                  className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${feat.color} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`}
                />

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '16px',
                  }}
                  className="w-14 h-14 flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform"
                >
                  <IconComponent className="w-7 h-7" style={{ color: feat.accent }} />
                </div>

                <h3 className="text-xl font-bold text-white mb-3 relative z-10">
                  {feat.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed relative z-10">
                  {feat.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Security Dashboard Preview Section ── */}
      <section id="dashboard" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-semibold text-purple-400">
            <Terminal className="w-3.5 h-3.5" />
            Command Center
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Futuristic Security Dashboard
          </h2>
          <p className="text-base text-slate-400">
            Monitor threat vectors, encryption statuses, active devices, and real-time telemetry from a unified control panel.
          </p>
        </div>

        {/* Dashboard Frame Container */}
        <div
          style={{
            background: 'rgba(15, 10, 38, 0.85)',
            border: '1px solid rgba(94, 168, 255, 0.25)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(94, 168, 255, 0.15)',
            backdropFilter: 'blur(20px)',
          }}
          className="overflow-hidden p-4 sm:p-8"
        >
          {/* Top Window Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-400 ml-2">cypher-security-v3.0.4.local</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <Radio className="w-3 h-3 animate-pulse" />
                SYSTEM SECURE
              </span>
            </div>
          </div>

          {/* Grid Layout inside Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 4 cols: Security Score + Quick Metrics */}
            <div className="lg:col-span-4 space-y-6">
              {/* Security Score Gauge Card */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Overall Security Score
                </span>

                <div className="relative w-36 h-36 flex items-center justify-center my-2">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#scoreGradient)"
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset="20"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4F46E5" />
                        <stop offset="100%" stopColor="#5EA8FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white">98</span>
                    <span className="text-[10px] font-bold text-emerald-400">EXCELLENT</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-2">
                  Zero critical vulnerabilities detected in active audit scan.
                </p>
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                  <span className="text-[11px] text-slate-400 block mb-1">Active Devices</span>
                  <span className="text-xl font-bold text-white flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-[#5EA8FF]" />
                    4 Protected
                  </span>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                  <span className="text-[11px] text-slate-400 block mb-1">Threat Alerts</span>
                  <span className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    0 Active
                  </span>
                </div>
              </div>
            </div>

            {/* Right 8 cols: Live Activity Graph + Log Timeline */}
            <div className="lg:col-span-8 space-y-6">
              {/* Telemetry Traffic Graph */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Live Encryption & Telemetry Flow</h4>
                    <p className="text-xs text-slate-400">Real-time packet encryption throughput</p>
                  </div>
                  <span className="text-xs font-mono text-[#5EA8FF]">1.4 GB/s</span>
                </div>

                {/* Simulated Graph */}
                <div className="h-32 w-full relative flex items-end gap-1.5 pt-4">
                  {[40, 65, 30, 80, 95, 60, 45, 75, 90, 100, 70, 85, 55, 90, 65, 80, 95, 70, 60, 85].map(
                    (val, i) => (
                      <div key={i} className="flex-1 bg-slate-800 rounded-t h-full flex items-end">
                        <div
                          style={{ height: `${val}%` }}
                          className="w-full bg-gradient-to-t from-[#4F46E5] to-[#5EA8FF] rounded-t transition-all duration-500 hover:opacity-80"
                        />
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Recent Login & Audit Timeline */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
                <h4 className="text-sm font-bold text-white mb-4">Recent Audit & Security Logs</h4>
                <div className="space-y-3">
                  {[
                    { event: 'Master Key PBKDF2 Derived', status: 'Success', time: '2 mins ago', ip: '192.168.1.42' },
                    { event: 'Zero-Knowledge Vault Backup', status: 'Encrypted', time: '14 mins ago', ip: 'Cloud Node US-East' },
                    { event: 'Port Probe Intercepted', status: 'Blocked', time: '1 hr ago', ip: '45.142.214.9' },
                  ].map((log, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="w-3.5 h-3.5 text-[#5EA8FF]" />
                        <span className="font-semibold text-slate-200">{log.event}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-slate-400">{log.ip}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {log.status}
                        </span>
                        <span className="text-slate-500 text-[11px]">{log.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Statistics Section ── */}
      <section id="stats" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(42, 27, 93, 0.4) 0%, rgba(13, 9, 30, 0.7) 100%)',
            border: '1px solid rgba(94, 168, 255, 0.2)',
            borderRadius: '28px',
            backdropFilter: 'blur(16px)',
          }}
          className="p-8 sm:p-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {[
            { metric: '99.99%', label: 'Uptime SLA', sub: 'Guaranteed Reliability' },
            { metric: '50M+', label: 'Threats Blocked', sub: 'Daily Protection' },
            { metric: '1M+', label: 'Protected Devices', sub: 'Global Infrastructure' },
            { metric: '256-bit', label: 'AES Encryption', sub: 'Zero-Knowledge Spec' },
          ].map((stat, idx) => (
            <div key={idx} className="space-y-2">
              <span className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#5EA8FF] to-[#A78BFA] block">
                {stat.metric}
              </span>
              <span className="text-sm font-bold text-white block">{stat.label}</span>
              <span className="text-xs text-slate-400 block">{stat.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials Section ── */}
      <section id="testimonials" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
            <Star className="w-3.5 h-3.5" />
            Industry Trust
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Trusted by Security Leaders
          </h2>
          <p className="text-base text-slate-400">
            See how security architects, CTOs, and privacy advocates rely on CYPHER to safeguard their digital ecosystem.
          </p>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote:
                "CYPHER's zero-knowledge architecture gave our enterprise total peace of mind. Threat detection is lightyears ahead of legacy tools.",
              name: 'Dr. Aris Thorne',
              role: 'Chief Information Security Officer',
              org: 'Vanguard Cyber Systems',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            },
            {
              quote:
                'The seamless integration of AI threat monitoring and end-to-end encrypted vaults makes CYPHER indispensable for modern tech teams.',
              name: 'Elena Rostova',
              role: 'Lead Security Architect',
              org: 'Apex Research Labs',
              avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
            },
            {
              quote:
                "Security that doesn't slow us down. CYPHER delivers top-tier military encryption with the sleekest interface in cybersecurity.",
              name: 'Marcus Vance',
              role: 'Founder & Tech Director',
              org: 'Aether Cloud Networks',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
            },
          ].map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              style={{
                background: 'rgba(23, 15, 52, 0.55)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(16px)',
                borderRadius: '24px',
              }}
              className="p-8 flex flex-col justify-between relative overflow-hidden group hover:border-[#5EA8FF]/40 transition-colors"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-slate-300 italic leading-relaxed">"{t.quote}"</p>
              </div>

              <div className="flex items-center gap-4 pt-6 mt-6 border-t border-slate-800/80">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#5EA8FF]/40"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">{t.name}</h4>
                  <p className="text-xs text-slate-400">{t.role}</p>
                  <p className="text-[11px] font-semibold text-[#5EA8FF]">{t.org}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Pricing Section ── */}
      <section id="pricing" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-400">
            <Zap className="w-3.5 h-3.5" />
            Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Flexible Security Plans
          </h2>
          <p className="text-base text-slate-400">
            Choose the security tier that aligns with your privacy requirements. Upgrade or cancel anytime.
          </p>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Free Plan */}
          <div
            style={{
              background: 'rgba(23, 15, 52, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              borderRadius: '24px',
            }}
            className="p-8 flex flex-col justify-between hover:border-slate-600 transition-colors"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Free Starter</h3>
                <p className="text-xs text-slate-400 mt-1">Essential encryption for personal files</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-xs text-slate-400">/ forever</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                {['5 GB Encrypted Vault Storage', 'Client-Side AES-256 Encryption', 'Standard Password Manager', '1 Device Active Session'].map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/register"
              className="mt-8 w-full py-3.5 rounded-xl font-semibold text-xs text-center border border-slate-700 bg-slate-900/80 text-white hover:bg-slate-800 transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Plan — HIGHLIGHTED */}
          <div
            style={{
              background: 'linear-gradient(145deg, rgba(42, 27, 93, 0.9) 0%, rgba(20, 14, 45, 0.95) 100%)',
              border: '2px solid #5EA8FF',
              boxShadow: '0 0 40px rgba(94, 168, 255, 0.3)',
              borderRadius: '28px',
            }}
            className="p-8 flex flex-col justify-between relative overflow-hidden transform lg:-translate-y-2"
          >
            <div className="absolute top-0 right-0 bg-gradient-to-l from-[#5EA8FF] to-[#4F46E5] text-white text-[10px] font-black tracking-widest uppercase px-4 py-1.5 rounded-bl-xl shadow-md">
              MOST POPULAR
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                  Pro Security
                  <Sparkles className="w-4 h-4 text-[#5EA8FF]" />
                </h3>
                <p className="text-xs text-slate-300 mt-1">Complete AI threat protection & unlimited vault</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-white">$12</span>
                <span className="text-xs text-slate-300">/ month</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-200">
                {[
                  '100 GB Encrypted Vault Storage',
                  'AI Real-Time Threat Detection Radar',
                  'Unlimited Protected Devices',
                  'Password Breach Leak Auditing',
                  'Multi-Factor Hardware Key Support',
                  'Priority 24/7 Security Assistance',
                ].map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#5EA8FF]" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/register"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #5EA8FF 100%)',
                boxShadow: '0 0 25px rgba(94, 168, 255, 0.5)',
              }}
              className="mt-8 w-full py-4 rounded-xl font-bold text-xs text-center text-white transition-all duration-300 hover:scale-105"
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div
            style={{
              background: 'rgba(23, 15, 52, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              borderRadius: '24px',
            }}
            className="p-8 flex flex-col justify-between hover:border-slate-600 transition-colors"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Enterprise Shield</h3>
                <p className="text-xs text-slate-400 mt-1">Dedicated infrastructure & SOC2 compliance</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">$49</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-300">
                {[
                  'Unlimited Encrypted Storage',
                  'Custom Security Key Hardware Integration',
                  'SOC2 Type II Audit Compliance Export',
                  'Custom SAML / Single Sign-On (SSO)',
                  'Dedicated Security Account Manager',
                ].map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-purple-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/register"
              className="mt-8 w-full py-3.5 rounded-xl font-semibold text-xs text-center border border-slate-700 bg-slate-900/80 text-white hover:bg-slate-800 transition-colors"
            >
              Contact Enterprise Sales
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          background: '#06040e',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
        className="relative z-10 pt-16 pb-12 text-slate-400 text-xs"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-800/80">
            {/* Brand Info */}
            <div className="col-span-2 space-y-4 pr-4">
              <div className="flex items-center gap-3">
                <img src={LOGO_URL} alt="CYPHER Logo" className="w-8 h-8 object-contain" />
                <span className="text-xl font-black tracking-wider text-white">CYPHER</span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Protect Everything. Trust Nothing. Next-generation zero-knowledge security, AI threat detection, and encrypted cloud architecture.
              </p>
              <div className="flex items-center gap-4 text-slate-400 pt-2">
                <a href="#" className="hover:text-white transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="#" className="hover:text-white transition-colors" title="GitHub">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </a>
                <a href="#" className="hover:text-white transition-colors" title="Discord">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>
                <a href="#" className="hover:text-white transition-colors" title="LinkedIn">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-[11px]">Product</h4>
              <ul className="space-y-2.5">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link to="/gallery" className="hover:text-white transition-colors">Encrypted Vault</Link></li>
              </ul>
            </div>

            {/* Security Links */}
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-[11px]">Security</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="hover:text-white transition-colors">Zero-Knowledge Spec</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AES-256 Architecture</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance Reports</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Bug Bounty</a></li>
              </ul>
            </div>

            {/* Company & Privacy */}
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-[11px]">Privacy & Legal</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR Compliance</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Security Team</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-slate-500">
            <p>© 2026 CYPHER Inc. All rights reserved. Protect Everything. Trust Nothing.</p>
            <div className="flex items-center gap-6">
              <span>Status: <span className="text-emerald-400 font-semibold">100% Operational</span></span>
              <span>Encryption: <span className="text-[#5EA8FF] font-semibold">AES-256-GCM</span></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
