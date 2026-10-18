// JodMascot คือภาพแทน "พี่จ๊อด" ชั่วคราว (เลขาใส่สูท) จนกว่าจะได้ไฟล์มาสคอตจริงแยกตามท่า
// pose ใช้เลือกท่า: ตอนนี้ต่างกันแค่ป้ายเล็กๆ ข้างตัว พอได้รูปจริงให้สลับเป็นไฟล์ตาม pose
export type JodPose = "wave" | "write" | "done" | "ask" | "rest";

const poseBadge: Record<JodPose, string> = {
  wave: "👋",
  write: "✍️",
  done: "👍",
  ask: "❓",
  rest: "☕",
};

export function JodMascot({ pose = "wave", size = 120, className = "" }: { pose?: JodPose; size?: number; className?: string }) {
  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size * 1.1 }} aria-label="พี่จ๊อด" role="img">
      <svg viewBox="0 0 120 132" width={size} height={size * 1.1}>
        {/* สูท */}
        <path d="M14 132 C16 104 34 92 60 92 C86 92 104 104 106 132 Z" fill="#3D5A73" />
        {/* เสื้อเชิ้ต */}
        <path d="M46 93 L60 120 L74 93 Z" fill="#F4EEE4" />
        {/* เนคไท */}
        <path d="M57 97 L63 97 L65 118 L60 124 L55 118 Z" fill="#26343F" />
        {/* ปกสูท */}
        <path d="M46 93 L56 112 L50 116 L40 97 Z" fill="#30475C" />
        <path d="M74 93 L64 112 L70 116 L80 97 Z" fill="#30475C" />
        {/* ผ้าเช็ดหน้าที่กระเป๋า */}
        <path d="M80 108 L90 108 L85 101 Z" fill="#E59AA5" />
        {/* คอ */}
        <rect x="53" y="76" width="14" height="18" rx="6" fill="#EBC9AD" />
        {/* หัว */}
        <circle cx="60" cy="54" r="27" fill="#F6DCC4" />
        {/* ผม */}
        <path d="M33 52 C31 30 46 20 62 21 C80 22 90 34 87 52 C82 42 72 37 58 38 C46 39 38 44 33 52 Z" fill="#2C3E55" />
        {/* แว่น */}
        <circle cx="49" cy="57" r="7.5" fill="none" stroke="#26343F" strokeWidth="1.8" />
        <circle cx="71" cy="57" r="7.5" fill="none" stroke="#26343F" strokeWidth="1.8" />
        <path d="M56.5 57 L63.5 57" stroke="#26343F" strokeWidth="1.8" />
        {/* ตา */}
        <circle cx="49" cy="58" r="2.2" fill="#26343F" />
        <circle cx="71" cy="58" r="2.2" fill="#26343F" />
        {/* แก้ม */}
        <ellipse cx="42" cy="68" rx="4.5" ry="2.6" fill="#E59AA5" opacity="0.55" />
        <ellipse cx="78" cy="68" rx="4.5" ry="2.6" fill="#E59AA5" opacity="0.55" />
        {/* ยิ้ม */}
        <path d="M53 70 Q60 76 67 70" fill="none" stroke="#26343F" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="absolute -right-1 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-base shadow-sm ring-1 ring-[#E6E3DC]">
        {poseBadge[pose]}
      </span>
    </div>
  );
}
