import { motion } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CTASection(){
      const {isAuthenticated } = useAuth();
      const { t } = useLanguage();
    return( 
        <section className="py-14 px-4 sm:px-6 bg-[#3D5A73] text-white relative overflow-hidden">
                    <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
                <div className="mx-auto max-w-3xl text-center space-y-4 relative z-10">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
                    <Sparkles className="h-3.5 w-3.5 text-[#FAF9F6]" />
                    <span>{t("landing_cta_banner_badge")}</span>
                  </div>
        
                  <h2 className="font-['Chonburi'] text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                    {t("landing_cta_banner_title")}
                  </h2>
        
                  <p className="text-sm opacity-90 max-w-lg mx-auto leading-relaxed">
                    {t("landing_cta_banner_sub")}
                  </p>
        
                  <div className="pt-3">
                    <Link
                      href={isAuthenticated ? "/notes" : "/login"}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#FAF9F6] px-7 py-3.5 text-sm font-bold text-[#3D5A73] shadow-md hover:bg-white active:scale-98 transition-all cursor-pointer"
                    >
                      <span>{isAuthenticated ? t("landing_cta_banner_auth") : t("landing_cta_banner_guest")}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
                </motion.div>
              </section>
    )
}