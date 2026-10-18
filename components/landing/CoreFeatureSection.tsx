import {
  Shield,
  CheckSquare,
  Search,
  MessageCircle,
} from "lucide-react";
import { motion } from "motion/react"
import { useLanguage } from "@/lib/language-context";

export default function CoreFeatureSection(){
    const { t } = useLanguage();
    return(
              <section id="features" className="py-16 px-4 sm:px-6 bg-[#FAF9F6] border-y border-[#D1CEC5]">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
                <div className="mx-auto max-w-5xl">
                  <div className="text-center mb-12">
                    <h2 className="font-['Chonburi'] text-2xl sm:text-3xl font-bold text-[#3D5A73]">
                      {t("landing_features_title")}
                    </h2>
                    <p className="mt-2 text-sm text-[#66737D]">
                      {t("landing_features_subtitle")}
                    </p>
                  </div>
        
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Feature 1 */}
                    <div className="rounded-2xl border border-[#D1CEC5] bg-[#FAF9F6] p-5 shadow-2xs hover:border-[#3D5A73]/50 hover:shadow-sm transition-all group">
                      <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#3D5A73] text-white shadow-xs group-hover:scale-105 transition-transform">
                        <Shield className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-base text-[#26343F] mb-1.5">
                        {t("landing_f1_title")}
                      </h3>
                      <p className="text-xs text-[#66737D] leading-relaxed">
                        {t("landing_f1_desc")}
                      </p>
                    </div>
        
                    {/* Feature 2 */}
                    <div className="rounded-2xl border border-[#D1CEC5] bg-[#FAF9F6] p-5 shadow-2xs hover:border-[#06C755]/50 hover:shadow-sm transition-all group">
                      <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#06C755] text-white shadow-xs group-hover:scale-105 transition-transform">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-base text-[#26343F] mb-1.5">
                        {t("landing_f2_title")}
                      </h3>
                      <p className="text-xs text-[#66737D] leading-relaxed">
                        {t("landing_f2_desc")}
                      </p>
                    </div>
        
                    {/* Feature 3 */}
                    <div className="rounded-2xl border border-[#D1CEC5] bg-[#FAF9F6] p-5 shadow-2xs hover:border-[#3D5A73]/50 hover:shadow-sm transition-all group">
                      <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#3D5A73] text-white shadow-xs group-hover:scale-105 transition-transform">
                        <CheckSquare className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-base text-[#26343F] mb-1.5">
                        {t("landing_f3_title")}
                      </h3>
                      <p className="text-xs text-[#66737D] leading-relaxed">
                        {t("landing_f3_desc")}
                      </p>
                    </div>
        
                    {/* Feature 4 */}
                    <div className="rounded-2xl border border-[#D1CEC5] bg-[#FAF9F6] p-5 shadow-2xs hover:border-[#3D5A73]/50 hover:shadow-sm transition-all group">
                      <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#3D5A73] text-white shadow-xs group-hover:scale-105 transition-transform">
                        <Search className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-base text-[#26343F] mb-1.5">
                        {t("landing_f4_title")}
                      </h3>
                      <p className="text-xs text-[#66737D] leading-relaxed">
                        {t("landing_f4_desc")}
                      </p>
                    </div>
                  </div>
                </div>
                </motion.div>
              </section>
    )
}