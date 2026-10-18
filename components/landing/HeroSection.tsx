import {
  CheckCircle2,
  CheckSquare,
  MessageCircle,
  Zap,
  Check,
  Clock,
} from "lucide-react";
import { motion } from "motion/react"
import { useLanguage } from "@/lib/language-context";
import { useState } from "react";

export default function HeroSection(){
      const { t, language } = useLanguage();
     const [mockChecks, setMockChecks] = useState<{ [key: string]: boolean }>({
        item1: true,
        item2: false,
        item3: false,
      });
    
      const toggleMock = (key: string) => {
        setMockChecks((prev) => ({ ...prev, [key]: !prev[key] }));
      };
    return(
        <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
                <div className="mx-auto mt-12 max-w-4xl">
                  <div className="relative rounded-2xl border border-[#D1CEC5] bg-[#FAF9F6] p-4 sm:p-8 shadow-xl">
                    {/* Top Notebook Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-[#3D5A73] rounded-t-2xl" />
        
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      {/* Left Column: Simulated LINE Bot Chat */}
                      <div className="md:col-span-5 rounded-2xl border border-[#D1CEC5]/80 bg-[#849EB5]/10 p-4 space-y-3 shadow-2xs">
                        <div className="flex items-center gap-2 pb-2.5 border-b border-[#D1CEC5]/60">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#06C755] text-white shadow-2xs">
                            <MessageCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#26343F]">JodJod LINE Bot</p>
                            <p className="text-[10px] text-[#2E7D32] flex items-center gap-1 font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32]" />
                              {t("landing_bot_status")}
                            </p>
                          </div>
                        </div>
        
                        {/* User sent message */}
                        <div className="flex justify-end">
                          <div className="rounded-2xl rounded-tr-xs bg-[#06C755] px-3.5 py-2 text-xs text-white shadow-2xs max-w-[85%] font-medium">
                            {language === "th" ? "ซื้อของ นมสด, ไข่ไก่ 1 แผง, ขนมปังโฮลวีต" : "Groceries: Milk, Eggs, Bread"}
                          </div>
                        </div>
        
                        {/* Bot reply */}
                        <div className="flex justify-start">
                          <div className="rounded-2xl rounded-tl-xs bg-white border border-[#D1CEC5]/70 px-3.5 py-2.5 text-xs text-[#26343F] shadow-2xs max-w-[85%]">
                            <p className="font-semibold text-[#3D5A73] mb-1">
                              {language === "th" ? "จดเช็คลิสต์เรียบร้อยครับ 📝" : "Checklist JodJod-ed successfully! 📝"}
                            </p>
                            <ul className="text-[11px] text-[#66737D] space-y-0.5 list-disc list-inside">
                              <li>{language === "th" ? "นมสด" : "Milk"}</li>
                              <li>{language === "th" ? "ไข่ไก่ 1 แผง" : "Eggs"}</li>
                              <li>{language === "th" ? "ขนมปังโฮลวีต" : "Bread"}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
        
                      {/* Center Column: Real-time Sync Badge */}
                      <div className="md:col-span-2 flex flex-col items-center justify-center py-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3D5A73] text-white shadow-md">
                          <Zap className="h-5 w-5" />
                        </div>
                        <span className="mt-2 text-[11px] font-bold text-[#3D5A73] tracking-wide text-center leading-tight">
                          {t("landing_sync_badge")}
                        </span>
                      </div>
        
                      {/* Right Column: Web App Note Card (Interactive Mock) */}
                      <div className="md:col-span-5 rounded-2xl border border-[#D1CEC5] bg-white p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between ">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`rounded-md bg-[#D8B968]/20 border border-[#D8B968]/40 px-2 py-0.5 text-[10px] font-bold text-[#8C6D1F] flex gap-1`}
                            >
                              <CheckSquare className="h-3 w-3" />
                              <span>{t("notecard_type_checklist")}</span>
                            </span>
                          </div>
                          <span className="text-[10px] text-[#66737D] flex gap-1">
                            <Clock className="h-3 w-3" /> 10:15
                          </span>
                        </div>
                        <div className="border-b border-[#D1CEC5]/40 pb-2">
                          <span className="text-[11px] font-semibold text-[#26343F]">{t("landing_mock_title")}</span>
                        </div>
                        
                        <div className="space-y-2 text-xs">
                          <div
                            onClick={() => toggleMock("item1")}
                            className="flex items-center gap-2 cursor-pointer group select-none py-0.5"
                          >
                            <div
                              className={`h-4 w-4 rounded-md border flex items-center justify-center transition-all ${
                                mockChecks.item1
                                  ? "bg-[#3D5A73] border-[#3D5A73] text-white"
                                  : "border-[#D1CEC5] bg-white group-hover:border-[#3D5A73]"
                              }`}
                            >
                              {mockChecks.item1 && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                            <span
                              className={`transition-all ${
                                mockChecks.item1
                                  ? "line-through text-[#66737D]/60"
                                  : "text-[#26343F] font-medium"
                              }`}
                            >
                              {language === "th" ? "นมสด" : "Milk"}
                            </span>
                          </div>
        
                          <div
                            onClick={() => toggleMock("item2")}
                            className="flex items-center gap-2 cursor-pointer group select-none py-0.5"
                          >
                            <div
                              className={`h-4 w-4 rounded-md border flex items-center justify-center transition-all ${
                                mockChecks.item2
                                  ? "bg-[#3D5A73] border-[#3D5A73] text-white"
                                  : "border-[#D1CEC5] bg-white group-hover:border-[#3D5A73]"
                              }`}
                            >
                              {mockChecks.item2 && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                            <span
                              className={`transition-all ${
                                mockChecks.item2
                                  ? "line-through text-[#66737D]/60"
                                  : "text-[#26343F] font-medium"
                              }`}
                            >
                              {language === "th" ? "ไข่ไก่ 1 แผง" : "Eggs"}
                            </span>
                          </div>
        
                          <div
                            onClick={() => toggleMock("item3")}
                            className="flex items-center gap-2 cursor-pointer group select-none py-0.5"
                          >
                            <div
                              className={`h-4 w-4 rounded-md border flex items-center justify-center transition-all ${
                                mockChecks.item3
                                  ? "bg-[#3D5A73] border-[#3D5A73] text-white"
                                  : "border-[#D1CEC5] bg-white group-hover:border-[#3D5A73]"
                              }`}
                            >
                              {mockChecks.item3 && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                            <span
                              className={`transition-all ${
                                mockChecks.item3
                                  ? "line-through text-[#66737D]/60"
                                  : "text-[#26343F] font-medium"
                              }`}
                            >
                              {language === "th" ? "ขนมปังโฮลวีต" : "Bread"}
                            </span>
                          </div>
                        </div>
        
                        <div className="pt-2 border-t border-[#D1CEC5]/40 flex items-center justify-between text-[11px] text-[#66737D]">
                          <span className="text-[10px]">{t("landing_mock_hint")}</span>
                          <span className="text-[#2E7D32] font-semibold flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="h-3 w-3" /> {t("landing_mock_connected")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </motion.div>
    )
}