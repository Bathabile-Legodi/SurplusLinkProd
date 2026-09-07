export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  
  let tone = "bg-secondary text-muted-foreground"; // default
  
  if (["claimed", "in progress"].includes(normalized)) {
    tone = "bg-warning/20 text-warning-foreground";
  } else if (["delivered", "completed", "success"].includes(normalized)) {
    tone = "bg-success/15 text-[color:var(--success)]";
  } else if (["cancelled", "expired", "failed"].includes(normalized)) {
    tone = "bg-destructive/15 text-destructive";
  } else if (["unclaimed", "pending"].includes(normalized)) {
    tone = "bg-blue-100 text-blue-700";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tone}`}
    >
      {status}
    </span>
  );
}
