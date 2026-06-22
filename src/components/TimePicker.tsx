import React, { useEffect, useRef, useState } from "react";

type Props = {
  value?: string; // "HH:MM"
  onChange: (value: string) => void;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function TimePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState<number | null>(null);
  const [minute, setMinute] = useState<number | null>(null);
  const [step, setStep] = useState<"hour" | "minute">("hour");
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const clockRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  function getMinuteFromPoint(x: number, y: number, rect: DOMRect) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const angle = Math.atan2(dy, dx); // -PI..PI, 0 at +x
    // convert to degrees and rotate so 0 is at top
    let deg = (angle * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    // map deg to 12 ticks (30deg each)
    const index = Math.round(deg / 30) % 12;
    return (index * 5) % 60;
  }

  function getHourFromPoint(x: number, y: number, rect: DOMRect) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const angle = Math.atan2(dy, dx);
    let deg = (angle * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    // map deg to 24 slots (15deg each)
    const index = Math.round(deg / (360 / 24)) % 24;
    return index;
  }

  function handlePointer(e: PointerEvent) {
    const ref = clockRef.current;
    if (!ref) return;
    const rect = ref.getBoundingClientRect();
    if (step === "hour") {
      const hourHit = getHourFromPoint(e.clientX, e.clientY, rect);
      setHour(hourHit);
    } else {
      const minuteHit = getMinuteFromPoint(e.clientX, e.clientY, rect);
      setMinute(minuteHit);
    }
  }

  useEffect(() => {
    if (!value) {
      setHour(null);
      setMinute(null);
      setStep("hour");
      return;
    }
    const parts = value.split(":");
    setHour(Number(parts[0]));
    setMinute(Number(parts[1]));
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function commit(h: number, m: number) {
    const v = `${pad(h)}:${pad(m)}`;
    onChange(v);
    setOpen(false);
  }

  const display = hour !== null && minute !== null ? `${((hour + 11) % 12) + 1}:${pad(minute)} ${hour >= 12 ? "PM" : "AM"}` : "Set time";

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left rounded-md border border-input px-3 py-2 text-sm"
      >
        <span className="mr-2">{display}</span>
        <span className="text-muted-foreground">▾</span>
      </button>

      {/* Hidden native fallback for accessibility */}
      <input aria-hidden className="sr-only" type="time" value={value ?? ""} readOnly />

      {open ? (
        <div className="absolute z-50 mt-2 w-64 rounded-lg border bg-card p-3 shadow-lg">
          {step === "hour" ? (
            <>
              <div
                style={{ width: 240, height: 240, position: "relative", margin: "0 auto", touchAction: "none" }}
                ref={clockRef}
                onPointerDown={(e) => {
                  draggingRef.current = true;
                  (e.target as Element).setPointerCapture?.((e as any).pointerId);
                  handlePointer(e as unknown as PointerEvent);
                }}
                onPointerMove={(e) => {
                  if (!draggingRef.current) return;
                  handlePointer(e as unknown as PointerEvent);
                }}
                onPointerUp={(e) => {
                  draggingRef.current = false;
                  (e.target as Element).releasePointerCapture?.((e as any).pointerId);
                }}
              >
                <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, borderRadius: 9999, border: "1px solid var(--muted)" }} />

                {[...Array(24)].map((_, i) => {
                  const idx = i;
                  const angle = (idx / 24) * Math.PI * 2 - Math.PI / 2; // start at top
                  const size = 36;
                  const radius = 86;
                  const center = 120;
                  const left = Math.round(center + Math.cos(angle) * radius - size / 2);
                  const top = Math.round(center + Math.sin(angle) * radius - size / 2);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setHour(i);
                        setStep("minute");
                      }}
                      className={"absolute flex items-center justify-center rounded-full border text-xs"}
                      style={{
                        left: `${left}px`,
                        top: `${top}px`,
                        width: `${size}px`,
                        height: `${size}px`,
                        background: hour === i ? "var(--primary)" : "transparent",
                        color: hour === i ? "white" : "var(--muted-foreground)",
                        borderColor: hour === i ? "var(--primary)" : "var(--muted)"
                      }}
                    >
                      <span style={{ fontSize: 12 }}>{i}</span>
                    </button>
                  );
                })}

                <div style={{ position: "absolute", left: 120 - 34, top: 120 - 34, width: 68, height: 68, borderRadius: 9999, background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--muted)" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{hour !== null ? `${((hour + 11) % 12) + 1}${hour >= 12 ? " PM" : " AM"}` : "--"}</div>
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{minute !== null ? pad(minute) : "mm"}</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-1 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep("hour")}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Back
                </button>
                <div className="text-sm font-medium">Select minutes</div>
                <div />
              </div>
              <div
                style={{ width: 240, height: 240, position: "relative", margin: "0 auto", touchAction: "none" }}
                ref={clockRef}
                onPointerDown={(e) => {
                  draggingRef.current = true;
                  pointerIdRef.current = (e as any).pointerId;
                  (e.target as Element).setPointerCapture?.((e as any).pointerId);
                  handlePointer(e as unknown as PointerEvent);
                }}
                onPointerMove={(e) => {
                  if (!draggingRef.current) return;
                  handlePointer(e as unknown as PointerEvent);
                }}
                onPointerUp={(e) => {
                  draggingRef.current = false;
                  pointerIdRef.current = null;
                  (e.target as Element).releasePointerCapture?.((e as any).pointerId);
                }}
                onPointerCancel={() => {
                  draggingRef.current = false;
                  pointerIdRef.current = null;
                }}
              >
                {/* clock face background */}
                <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, borderRadius: 9999, border: "1px solid var(--muted)" }} />

                {/** radial minute ticks, rendered as positioned buttons for keyboard/tap accessibility **/}
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m, idx) => {
                  const angle = (idx / 12) * Math.PI * 2 - Math.PI / 2; // start at top
                  const size = 36;
                  const radius = 86;
                  const center = 120;
                  const left = Math.round(center + Math.cos(angle) * radius - size / 2);
                  const top = Math.round(center + Math.sin(angle) * radius - size / 2);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMinute(m)}
                      className={"absolute flex items-center justify-center rounded-full border text-xs"}
                      style={{
                        left: `${left}px`,
                        top: `${top}px`,
                        width: `${size}px`,
                        height: `${size}px`,
                        background: minute === m ? "var(--primary)" : "transparent",
                        color: minute === m ? "white" : "var(--muted-foreground)",
                        borderColor: minute === m ? "var(--primary)" : "var(--muted)"
                      }}
                    >
                      <span style={{ fontSize: 12 }}>{pad(m)}</span>
                    </button>
                  );
                })}

                {/* center indicator showing selected hour/minute */}
                <div style={{ position: "absolute", left: 120 - 34, top: 120 - 34, width: 68, height: 68, borderRadius: 9999, background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--muted)" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{hour !== null ? `${((hour + 11) % 12) + 1}${hour >= 12 ? " PM" : " AM"}` : "--"}</div>
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{minute !== null ? pad(minute) : "mm"}</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-1 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const h = hour ?? 0;
                    const m = minute ?? 0;
                    commit(h, m);
                  }}
                  className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground"
                >
                  Set
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
