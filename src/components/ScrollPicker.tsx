import { useEffect, useState, useMemo, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

/* ─── Helpers ─── */

export function generateDates() {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function formatDateLabel(d: Date) {
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

/* ─── Scroll Column ─── */

function ScrollColumn({ items, selected, onChange, renderItem }: {
  items: number[] | Date[];
  selected: number;
  onChange: (idx: number) => void;
  renderItem: (item: any, isSelected: boolean) => string;
}) {
  const clamp = (v: number) => Math.max(0, Math.min(v, items.length - 1));
  const touchStartY = useRef<number | null>(null);
  const lastChanged = useRef<number>(0);
  const [isEngaged, setIsEngaged] = useState(false);

  // Lock page scroll without hiding scrollbar
  useEffect(() => {
    if (!isEngaged) return;
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("wheel", prevent, { passive: false });
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      document.removeEventListener("wheel", prevent);
      document.removeEventListener("touchmove", prevent);
    };
  }, [isEngaged]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsEngaged(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const dy = touchStartY.current - e.touches[0].clientY;
    const now = Date.now();
    if (Math.abs(dy) > 20 && now - lastChanged.current > 80) {
      onChange(clamp(selected + (dy > 0 ? 1 : -1)));
      touchStartY.current = e.touches[0].clientY;
      lastChanged.current = now;
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
    setIsEngaged(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      onChange(clamp(selected + 1));
    } else if (e.deltaY < 0) {
      onChange(clamp(selected - 1));
    }
  };

  return (
    <div
      className={`flex flex-col items-center gap-1 touch-none rounded-lg px-2 py-1 transition-all duration-200
        ${isEngaged
          ? "scale-110 bg-muted/60 shadow-md"
          : "hover:scale-105 hover:bg-muted/40"
        }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onMouseEnter={() => setIsEngaged(true)}
      onMouseLeave={() => setIsEngaged(false)}
    >
      <button
        type="button"
        onClick={() => onChange(clamp(selected - 1))}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        tabIndex={-1}
      >
        <ChevronUp className="h-4 w-4" />
      </button>

      <div className="flex flex-col items-center cursor-grab active:cursor-grabbing">
        <span className="text-xs text-muted-foreground/40 h-5 leading-5 select-none">
          {selected > 0 ? renderItem(items[selected - 1], false) : ""}
        </span>
        <span className="text-sm font-bold text-foreground h-7 leading-7 select-none">
          {renderItem(items[selected], true)}
        </span>
        <span className="text-xs text-muted-foreground/40 h-5 leading-5 select-none">
          {selected < items.length - 1 ? renderItem(items[selected + 1], false) : ""}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onChange(clamp(selected + 1))}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        tabIndex={-1}
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ─── Date-Only Picker ─── */

export function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const dates = useMemo(() => generateDates(), []);
  const todayIdx = 0;

  const parsed = useMemo(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const idx = dates.findIndex(dd => dd.toDateString() === d.toDateString());
        if (idx >= 0) return idx;
      }
    }
    return todayIdx;
  }, []);

  const [dateIdx, setDateIdx] = useState(parsed);

  useEffect(() => {
    onChange(toISODate(dates[dateIdx]));
  }, [dateIdx]);

  return (
    <div className="rounded-lg border bg-muted/30 p-3 flex justify-center">
      <ScrollColumn
        items={dates}
        selected={dateIdx}
        onChange={setDateIdx}
        renderItem={(d: Date) => formatDateLabel(d)}
      />
    </div>
  );
}

/* ─── Engaged Wrapper (pop-out + scroll lock for custom columns) ─── */

function EngagedWrapper({ children, onChange }: { children: React.ReactNode; onChange: (direction: number) => void }) {
  const [isEngaged, setIsEngaged] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const lastChanged = useRef<number>(0);

  useEffect(() => {
    if (!isEngaged) return;
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("wheel", prevent, { passive: false });
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      document.removeEventListener("wheel", prevent);
      document.removeEventListener("touchmove", prevent);
    };
  }, [isEngaged]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsEngaged(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const dy = touchStartY.current - e.touches[0].clientY;
    const now = Date.now();
    if (Math.abs(dy) > 20 && now - lastChanged.current > 80) {
      onChange(dy > 0 ? 1 : -1);
      touchStartY.current = e.touches[0].clientY;
      lastChanged.current = now;
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
    setIsEngaged(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) onChange(1);
    else if (e.deltaY < 0) onChange(-1);
  };

  return (
    <div
      className={`flex flex-col items-center gap-1 touch-none rounded-lg px-2 py-1 transition-all duration-200
        ${isEngaged
          ? "scale-110 bg-muted/60 shadow-md"
          : "hover:scale-105 hover:bg-muted/40"
        }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onMouseEnter={() => setIsEngaged(true)}
      onMouseLeave={() => setIsEngaged(false)}
    >
      {children}
    </div>
  );
}

/* ─── Date + Time Picker ─── */

function getNowParts() {
  const now = new Date();
  let h = now.getHours();
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  const m = Math.ceil(now.getMinutes() / 5) * 5;
  // If minutes rounded up to 60, bump hour
  if (m >= 60) {
    return { hour: h === 12 ? 1 : h + 1, minute: 0, period: (h === 11 ? (period === "AM" ? "PM" : "AM") : period) as "AM" | "PM" };
  }
  return { hour: h, minute: m, period };
}

function to24(hour12: number, period: "AM" | "PM") {
  let h = hour12;
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h;
}

export function DateTimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const dates = useMemo(() => generateDates(), []);
  const todayIdx = 0;
  const nowParts = useMemo(() => getNowParts(), []);

  const parsed = useMemo(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        let h = d.getHours();
        const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
        if (h > 12) h -= 12;
        if (h === 0) h = 12;
        const foundIdx = dates.findIndex(dd => dd.toDateString() === d.toDateString());
        return {
          dateIdx: foundIdx >= 0 ? foundIdx : todayIdx,
          hourIdx: HOURS.indexOf(h),
          minuteIdx: MINUTES.indexOf(Math.round(d.getMinutes() / 5) * 5),
          period,
        };
      }
    }
    // Default to current time
    return {
      dateIdx: todayIdx,
      hourIdx: HOURS.indexOf(nowParts.hour),
      minuteIdx: MINUTES.indexOf(nowParts.minute),
      period: nowParts.period,
    };
  }, []);

  const [dateIdx, setDateIdx] = useState(parsed.dateIdx >= 0 ? parsed.dateIdx : todayIdx);
  const [hourIdx, setHourIdx] = useState(parsed.hourIdx >= 0 ? parsed.hourIdx : 0);
  const [minuteIdx, setMinuteIdx] = useState(parsed.minuteIdx >= 0 ? parsed.minuteIdx : 0);
  const [period, setPeriod] = useState<"AM" | "PM">(parsed.period);

  const isToday = dateIdx === 0;
  const nowH24 = to24(nowParts.hour, nowParts.period);

  // Filter hours: on Today, only show hours >= current hour (in 24h), mapped back to 12h
  const availableHours = useMemo(() => {
    if (!isToday) return HOURS;
    return HOURS.filter(h => {
      const h24AM = h === 12 ? 0 : h;
      const h24PM = h === 12 ? 12 : h + 12;
      // Keep this hour if either AM or PM version is >= now
      return h24AM >= nowH24 || h24PM >= nowH24;
    });
  }, [isToday, nowH24]);

  // Filter periods: on Today, check if AM is still valid
  const canAM = useMemo(() => {
    if (!isToday) return true;
    // AM is valid if current time is still AM
    return nowParts.period === "AM";
  }, [isToday, nowParts.period]);

  // Filter minutes: on Today + same hour + same period, only show minutes >= current minute
  const selectedH24 = to24(HOURS[hourIdx] ?? nowParts.hour, period);
  const availableMinutes = useMemo(() => {
    if (!isToday) return MINUTES;
    if (selectedH24 > nowH24) return MINUTES;
    // Same hour as now — only future minutes
    return MINUTES.filter(m => m >= nowParts.minute);
  }, [isToday, selectedH24, nowH24, nowParts.minute]);

  // Clamp selections when constraints change
  useEffect(() => {
    if (isToday) {
      // Clamp period
      if (!canAM && period === "AM") {
        setPeriod("PM");
        return;
      }
      // Clamp hour
      const currentHour = HOURS[hourIdx];
      if (currentHour && !availableHours.includes(currentHour)) {
        setHourIdx(HOURS.indexOf(availableHours[0]));
        return;
      }
      // Clamp minute
      const currentMinute = MINUTES[minuteIdx];
      if (currentMinute !== undefined && !availableMinutes.includes(currentMinute)) {
        setMinuteIdx(MINUTES.indexOf(availableMinutes[0]));
      }
    }
  }, [isToday, canAM, period, hourIdx, minuteIdx, availableHours, availableMinutes]);

  // Emit value
  useEffect(() => {
    const d = dates[dateIdx];
    if (!d) return;
    const h24 = to24(HOURS[hourIdx] ?? nowParts.hour, period);
    const iso = `${toISODate(d)}T${String(h24).padStart(2, "0")}:${String(MINUTES[minuteIdx] ?? 0).padStart(2, "0")}`;
    onChange(iso);
  }, [dateIdx, hourIdx, minuteIdx, period]);

  // Handlers that respect constraints
  const setHourClamped = (idx: number) => {
    const clamped = Math.max(0, Math.min(idx, HOURS.length - 1));
    if (isToday && !availableHours.includes(HOURS[clamped])) return;
    setHourIdx(clamped);
  };

  const setMinuteClamped = (idx: number) => {
    const clamped = Math.max(0, Math.min(idx, MINUTES.length - 1));
    if (isToday && !availableMinutes.includes(MINUTES[clamped])) return;
    setMinuteIdx(clamped);
  };

  const togglePeriod = () => {
    const next = period === "AM" ? "PM" : "AM";
    if (isToday && next === "AM" && !canAM) return;
    setPeriod(next);
  };

  // Render helpers — dim unavailable items
  const renderHour = (h: number) => {
    return String(h);
  };
  const isHourDimmed = (h: number) => isToday && !availableHours.includes(h);

  const renderMinute = (m: number) => {
    return String(m).padStart(2, "0");
  };
  const isMinuteDimmed = (m: number) => isToday && !availableMinutes.includes(m);

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="grid grid-cols-4 gap-2 place-items-center">
        <ScrollColumn
          items={dates}
          selected={dateIdx}
          onChange={setDateIdx}
          renderItem={(d: Date) => formatDateLabel(d)}
        />
        {/* Hours */}
        <EngagedWrapper onChange={(dir) => setHourClamped(hourIdx + dir)}>
          <button type="button" onClick={() => setHourClamped(hourIdx - 1)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" tabIndex={-1}>
            <ChevronUp className="h-4 w-4" />
          </button>
          <div className="flex flex-col items-center cursor-grab active:cursor-grabbing">
            <span className={`text-xs h-5 leading-5 select-none ${hourIdx > 0 && !isHourDimmed(HOURS[hourIdx - 1]) ? "text-muted-foreground/40" : "text-transparent"}`}>
              {hourIdx > 0 ? renderHour(HOURS[hourIdx - 1]) : ""}
            </span>
            <span className="text-sm font-bold text-foreground h-7 leading-7 select-none">
              {renderHour(HOURS[hourIdx])}
            </span>
            <span className={`text-xs h-5 leading-5 select-none ${hourIdx < HOURS.length - 1 && !isHourDimmed(HOURS[hourIdx + 1]) ? "text-muted-foreground/40" : "text-transparent"}`}>
              {hourIdx < HOURS.length - 1 ? renderHour(HOURS[hourIdx + 1]) : ""}
            </span>
          </div>
          <button type="button" onClick={() => setHourClamped(hourIdx + 1)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" tabIndex={-1}>
            <ChevronDown className="h-4 w-4" />
          </button>
        </EngagedWrapper>
        {/* Minutes */}
        <EngagedWrapper onChange={(dir) => setMinuteClamped(minuteIdx + dir)}>
          <button type="button" onClick={() => setMinuteClamped(minuteIdx - 1)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" tabIndex={-1}>
            <ChevronUp className="h-4 w-4" />
          </button>
          <div className="flex flex-col items-center cursor-grab active:cursor-grabbing">
            <span className={`text-xs h-5 leading-5 select-none ${minuteIdx > 0 && !isMinuteDimmed(MINUTES[minuteIdx - 1]) ? "text-muted-foreground/40" : "text-transparent"}`}>
              {minuteIdx > 0 ? renderMinute(MINUTES[minuteIdx - 1]) : ""}
            </span>
            <span className="text-sm font-bold text-foreground h-7 leading-7 select-none">
              {renderMinute(MINUTES[minuteIdx])}
            </span>
            <span className={`text-xs h-5 leading-5 select-none ${minuteIdx < MINUTES.length - 1 && !isMinuteDimmed(MINUTES[minuteIdx + 1]) ? "text-muted-foreground/40" : "text-transparent"}`}>
              {minuteIdx < MINUTES.length - 1 ? renderMinute(MINUTES[minuteIdx + 1]) : ""}
            </span>
          </div>
          <button type="button" onClick={() => setMinuteClamped(minuteIdx + 1)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" tabIndex={-1}>
            <ChevronDown className="h-4 w-4" />
          </button>
        </EngagedWrapper>
        {/* AM/PM Toggle */}
        <EngagedWrapper onChange={() => togglePeriod()}>
          <button type="button" onClick={togglePeriod} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" tabIndex={-1}>
            <ChevronUp className="h-4 w-4" />
          </button>
          <div className="flex flex-col items-center cursor-grab active:cursor-grabbing">
            <span className={`text-xs h-5 leading-5 select-none ${canAM || period === "PM" ? "text-muted-foreground/40" : "text-transparent"}`}>
              {period === "AM" ? "" : "AM"}
            </span>
            <span className="text-sm font-bold text-foreground h-7 leading-7 select-none">{period}</span>
            <span className="text-xs text-muted-foreground/40 h-5 leading-5 select-none">
              {period === "PM" ? "" : "PM"}
            </span>
          </div>
          <button type="button" onClick={togglePeriod} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" tabIndex={-1}>
            <ChevronDown className="h-4 w-4" />
          </button>
        </EngagedWrapper>
      </div>
    </div>
  );
}

