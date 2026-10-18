import { motion } from "motion/react"
import { useLanguage } from "@/lib/language-context"

export default function HowItWorksSection(){
    const { t } = useLanguage();
    return(
        <section id="how-it-works" className="py-16 px-4 sm:px-6">
                    <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
                <div className="mx-auto max-w-4xl">
                  <div className="text-center mb-12">
                    <h2 className="font-['Chonburi'] text-2xl sm:text-3xl font-bold text-[#3D5A73]">
                      {t("landing_how_title")}
                    </h2>
                    <p className="mt-2 text-sm text-[#66737D]">
                      {t("landing_how_subtitle")}
                    </p>
                  </div>
        
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Step 1 */}
                    <div className="rounded-2xl border border-[#D1CEC5] bg-[#FAF9F6] p-6 shadow-xs relative">
                      <span className="absolute -top-3.5 left-6 rounded-full bg-[#3D5A73] px-3 py-0.5 text-xs font-bold text-white shadow-2xs">
                        {t("landing_step1_badge")}
                      </span>
                      <h3 className="text-base font-bold text-[#26343F] mt-2 mb-2">
                        {t("landing_step1_title")}
                      </h3>
                      <p className="text-xs text-[#66737D] leading-relaxed">
                        {t("landing_step1_desc")}
                      </p>
                    </div>
        
                    {/* Step 2 */}
                    <div className="rounded-2xl border border-[#D1CEC5] bg-[#FAF9F6] p-6 shadow-xs relative">
                      <span className="absolute -top-3.5 left-6 rounded-full bg-[#3D5A73] px-3 py-0.5 text-xs font-bold text-white shadow-2xs">
                        {t("landing_step2_badge")}
                      </span>
                      <h3 className="text-base font-bold text-[#26343F] mt-2 mb-2">
                        {t("landing_step2_title")}
                      </h3>
                      <p className="text-xs text-[#66737D] leading-relaxed">
                        {t("landing_step2_desc")}
                      </p>
                    </div>
        
                    {/* Step 3 */}
                    <div className="rounded-2xl border border-[#D1CEC5] bg-[#FAF9F6] p-6 shadow-xs relative">
                      <span className="absolute -top-3.5 left-6 rounded-full bg-[#06C755] px-3 py-0.5 text-xs font-bold text-white shadow-2xs">
                        {t("landing_step3_badge")}
                      </span>
                      <h3 className="text-base font-bold text-[#26343F] mt-2 mb-2">
                        {t("landing_step3_title")}
                      </h3>
                      <p className="text-xs text-[#66737D] leading-relaxed">
                        {t("landing_step3_desc")}
                      </p>
                    </div>
                  </div>
                </div>
                </motion.div>
              </section>
    )
}