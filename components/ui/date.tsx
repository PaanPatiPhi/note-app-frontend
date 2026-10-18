"use client";

import { addDays, subDays, format, isSameDay, isAfter, startOfDay } from "date-fns";

type Props = {
  value: Date;
  onChange: (date: Date) => void;
};

export default function DateNavigation({ value, onChange }: Props) {
  const today = startOfDay(new Date());

  const handlePrev = () => {
    onChange(subDays(value, 1));
  };

  const handleNext = () => {
    const nextDate = addDays(value, 1);
    if (isAfter(nextDate, today)) {
      return;
    }
    onChange(nextDate);
  };

  return (
    <div className="flex items-center gap-4 justify-center">
      <button
        onClick={handlePrev}
        className="rounded-md px-3 py-2 hover:bg-gray-100"
      >
        &lt;
      </button>

      <span className="min-w-[180px] text-center font-medium">
        {format(value, "MMMM d, yyyy")}
      </span>

      <button
        onClick={handleNext}
        disabled={isSameDay(value, today)}
        className="rounded-md px-3 py-2 disabled:cursor-not-allowed disabled:opacity-30 hover:bg-gray-100"
      >
        &gt;
      </button>
    </div>
  );
}