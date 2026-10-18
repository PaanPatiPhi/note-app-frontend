"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import HeroSection from "@/components/landing/HeroSection"
import CTASection from "@/components/landing/CTASection";
import CoreFeatureSection from "@/components/landing/CoreFeatureSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import {
  BookOpen,
  Sparkles,
  ArrowRight,
} from "lucide-react";


export default function LandingPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, language } = useLanguage();
 
  return (
    <div className="min-h-screen flex flex-col bg-[#F0EFEB]">
      {/* Top Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl text-center">
          {/* Tag badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D1CEC5] bg-[#FAF9F6] px-4 py-1.5 text-xs font-semibold text-[#3D5A73] shadow-2xs mb-6">
            <Sparkles className="h-3.5 w-3.5 text-[#3D5A73]" />
            <span>{t("landing_badge")}</span>
          </div>

          {/* Main Title */}
          <h1 className="font-['Chonburi'] text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#3D5A73] leading-[1.25]">
            {t("landing_hero_title1")} <br className="hidden sm:inline" />
            <span className="text-[#26343F]">{t("landing_hero_title2")}</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-[#66737D] leading-relaxed">
            <strong className="font-semibold text-[#26343F]">JodJod {language === "th" ? "(จดจด)" : ""}</strong> {t("landing_hero_subtitle")}
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            {!isLoading && isAuthenticated ? (
              <>
                <Link
                  href="/notes"
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#3D5A73] px-6 py-3.5 text-sm font-semibold text-[#FAF9F6] shadow-md hover:bg-[#30475C] active:scale-98 transition-all cursor-pointer"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>{t("landing_cta_open")} {user?.display_name ? `(${user.display_name})` : ""}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/account"
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[#D1CEC5] bg-[#FAF9F6] px-5 py-3.5 text-sm font-medium text-[#26343F] hover:bg-[#E6E3DC]/60 shadow-2xs transition-all cursor-pointer"
                >
                  <span>{t("landing_cta_manage")}</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#3D5A73] px-7 py-3.5 text-sm font-semibold text-[#FAF9F6] shadow-md hover:bg-[#30475C] active:scale-98 transition-all cursor-pointer"
                >
                  <span>{t("landing_cta_start")}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[#D1CEC5] bg-[#FAF9F6] px-5 py-3.5 text-sm font-medium text-[#26343F] hover:bg-[#E6E3DC]/60 shadow-2xs transition-all cursor-pointer"
                >
                  <span>{t("landing_cta_how")}</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Hero Visual Mockup: LINE Bot Chat <---> Sync <---> Notebook Web App */}
        <HeroSection />
      </section>

      {/* 4 Core Features Section - Bento Papercraft */}
      <CoreFeatureSection />

      {/* How it works Section */}
      <HowItWorksSection />

      {/* CTA Banner Section */}
     <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
}