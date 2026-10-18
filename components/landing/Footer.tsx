import { useLanguage } from "@/lib/language-context";

export default function Footer(){
    const { t } = useLanguage();
    return(
        <footer className="mt-auto border-t border-[#D1CEC5] bg-[#FAF9F6] py-6 px-4 sm:px-6 text-xs text-[#66737D]">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-['Chonburi'] font-bold text-sm text-[#3D5A73]">JodJod</span>
            <span className="text-[#9AA4AA]">•</span>
            <span>{t("landing_footer_slogan")}</span>
          </div>
          <p>© {new Date().getFullYear()} JodJod. {t("landing_footer_rights")}</p>
        </div>
      </footer>
    )
}