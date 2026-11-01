/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Shield, Sparkles, Flame, CheckCircle, ArrowRight } from 'lucide-react';

interface OpeningAnimationProps {
  onComplete: () => void;
}

export const OpeningAnimation: React.FC<OpeningAnimationProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const telemetrySteps = [
    'Connecting to Copernicus Sentinel-2 & Landsat-9 TIRS...',
    'Calibrating Open-Meteo High-Resolution Forecast Grid...',
    'Loading Overpass OpenStreetMap Candidate Cooling Sites...',
    'Synthesizing NOAA Niño-3.4 Teleconnection Baseline...',
    'HeatShield Active • Decision Support Ready',
  ];

  useEffect(() => {
    // Progress interval (0 to 100 over ~1.8 seconds)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = prev + 3;
        if (next >= 85) setStepIndex(4);
        else if (next >= 65) setStepIndex(3);
        else if (next >= 40) setStepIndex(2);
        else if (next >= 15) setStepIndex(1);
        return next;
      });
    }, 45);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        const exitTimer = setTimeout(() => {
          onComplete();
        }, 600);
        return () => clearTimeout(exitTimer);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(onComplete, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070A0F] text-white transition-opacity duration-600 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background ambient lighting effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/20 via-cyan-500/10 to-amber-500/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-amber-600/10 rounded-full blur-[90px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-[100px]" />
      </div>

      {/* Skip Button (Top Right) */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 px-3.5 py-1.5 rounded-full bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-mono transition backdrop-blur-md flex items-center gap-1.5 shadow-lg z-20 cursor-pointer"
      >
        <span>Skip</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center max-w-md px-6 text-center">
        {/* Animated Emblem / Logo Wrapper */}
        <div className="relative mb-6">
          {/* Pulsing thermal heat deflection rings */}
          <div className="absolute inset-0 -m-4 rounded-full border border-amber-500/30 animate-ping opacity-40 duration-1000" />
          <div className="absolute inset-0 -m-8 rounded-full border border-blue-500/20 animate-pulse" />

          {/* Glowing Shield Emblem */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0E1726] to-[#070A0F] border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.35)] flex items-center justify-center p-2.5 overflow-hidden group">
            {/* Real Logo Image */}
            <img
              src="/logo.png"
              alt="HeatShield Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(56,189,248,0.7)] animate-in fade-in duration-700"
              onError={(e) => {
                // Fallback to SVG if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {/* Ambient inner reflection */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-cyan-400/5 to-transparent pointer-events-none" />
          </div>

          {/* Status Badge floating */}
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1 shadow-md backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ONLINE</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-sky-300 bg-clip-text text-transparent flex items-center justify-center gap-2">
          <span>HeatShield</span>
        </h1>

        {/* Tagline */}
        <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1.5 max-w-sm tracking-wide">
          Urban Heatwave Intelligence &amp; Hyperlocal Cooling Decision Platform
        </p>

        {/* Progress Bar */}
        <div className="w-full max-w-xs mt-7 space-y-2">
          <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-150 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Telemetry Step Indicator */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
            <span className="truncate max-w-[240px] text-left text-cyan-300/90 font-medium">
              {telemetrySteps[stepIndex]}
            </span>
            <span className="font-bold text-slate-300 shrink-0 ml-2">{Math.min(100, Math.round(progress))}%</span>
          </div>
        </div>

        {/* Mission statement footnote */}
        <div className="mt-8 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Planetary Earth Observation • Autonomous City Heat Action</span>
        </div>
      </div>
    </div>
  );
};
