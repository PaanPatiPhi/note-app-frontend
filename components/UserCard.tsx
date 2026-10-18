import type { Profile } from "@/lib/types";
import { Sparkles } from "lucide-react";

export function UserCard({ profile, count }: { profile: Profile; count: number }) {
  return (
    <div className="relative flex flex-col w-full items-center border rounded-t-2xl border-gray-200 p-3 gap-1 shadow-md bg-white">
      <div className="flex items-center gap-2 w-full">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-2xl overflow-hidden">
            <img
              src={profile.picture}
              alt={profile.name}
              className="w-full h-full object-cover block"
            />
          </div>

          <p className="text-(--primary) font-semibold text-lg">
            {profile.name}
          </p>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-[#3D5A73]/10 px-2 py-0.5 text-[11px] font-semibold text-[#3D5A73] border border-[#3D5A73]/20">
          <Sparkles className="h-3 w-3" />
          {profile.tier === "premium" ? "จดแบบพรีเมียม" : "จดแบบฟรี"}
        </span>
      </div>
      <div className="flex justify-between w-full mt-1">
        <p className="text-xs text-gray-500">จดไปแล้ว {count} ครั้ง</p>
      </div>
      {/* Wave */}
      <div
        className="
          absolute
          left-0
          -bottom-2
          w-full
          h-4
          bg-white
          mask-[url('/wave.svg')]
          mask-repeat-x
          mask-size-[32px_16px]
          transform-[scaleY(-1)]
        "
      />
    </div>
  );
}