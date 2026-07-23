import { useState, useEffect } from 'react';

interface PickupData {
  address: string;
  contactName: string;
  phone: string;
  city: string;
  remarks: string;
}

interface DropoffData {
  address: string;
  contactName: string;
  phone: string;
  remarks: string;
}

interface ActiveDelivery {
  orderRef: string;
  status: string;
  lastLocation: string | null;
}

interface DispatchDashboardProps {
  /** Pre-filled pickup details. Defaults to a Johannesburg demo address. */
  pickup?: Partial<PickupData>;
  /** Pre-filled drop-off details. Defaults to a Johannesburg demo address. */
  dropoff?: Partial<DropoffData>;
  /** Custom order reference. Auto-generated if omitted. */
  orderRef?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_PICKUP:       { label: 'Pending Pickup',        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  DISPATCHED_TO_DRIVER: { label: 'Dispatched to Driver',  color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  DRIVER_EN_ROUTE:      { label: 'Driver En Route',       color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  PICKED_UP:            { label: 'Picked Up',             color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  DELIVERED:            { label: 'Delivered ✓',           color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500' },
  FAILED:               { label: 'Delivery Failed',       color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_LABELS[status] ?? {
    label: status,
    color: 'bg-secondary text-muted-foreground',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color}`}
    >
      {config.label}
    </span>
  );
}

export default function DispatchDashboard({
  pickup: pickupOverride,
  dropoff: dropoffOverride,
  orderRef: orderRefOverride,
}: DispatchDashboardProps = {}) {
  const [loading, setLoading] = useState(false);
  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Generate a stable order reference for this session
  const [orderRef] = useState<string>(
    orderRefOverride ?? `DONATION_${Math.floor(1000 + Math.random() * 9000)}`
  );

  const pickupData: PickupData = {
    address:     pickupOverride?.address     ?? 'Campus Square, Auckland Park, Johannesburg, 2092',
    contactName: pickupOverride?.contactName ?? 'Store Operations Manager',
    phone:       pickupOverride?.phone       ?? '0821234567',
    city:        pickupOverride?.city        ?? 'JHB',
    remarks:     pickupOverride?.remarks     ?? '5 banana boxes of surplus fresh produce at rear loading bay',
  };

  const dropoffData: DropoffData = {
    address:     dropoffOverride?.address     ?? '142 Kotze St, Hillbrow, Johannesburg, 2001',
    contactName: dropoffOverride?.contactName ?? 'Community Shelter Kitchen',
    phone:       dropoffOverride?.phone       ?? '0837654321',
    remarks:     dropoffOverride?.remarks     ?? 'Ring buzzer at side gate for offloading',
  };

  // 1. Trigger the delivery dispatch via the TanStack Start API route
  const handleDispatch = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/create-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickup: pickupData, dropoff: dropoffData, orderRef }),
      });

      const result = await response.json() as {
        error?: string;
        deliveryId?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? 'Failed to dispatch courier');
      }

      setActiveDelivery({
        orderRef,
        status: 'DISPATCHED_TO_DRIVER',
        lastLocation: null,
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // 2. Poll the status endpoint every 5 s to reflect webhook updates
  useEffect(() => {
    if (!activeDelivery) return;
    if (activeDelivery.status === 'DELIVERED' || activeDelivery.status === 'FAILED') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/delivery-status/${activeDelivery.orderRef}`);
        if (res.ok) {
          const liveData = await res.json() as {
            status: string;
            lastLocation: string | null;
          };
          setActiveDelivery((prev) =>
            prev ? { ...prev, status: liveData.status, lastLocation: liveData.lastLocation } : prev
          );
        }
      } catch (err) {
        console.error('Status poll failed:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeDelivery]);

  return (
    <div className="space-y-4">
      {/* Delivery summary card */}
      <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground space-y-1.5">
        <p>
          <span className="font-medium text-foreground">Pickup: </span>
          {pickupData.address}
        </p>
        <p>
          <span className="font-medium text-foreground">Payload: </span>
          {pickupData.remarks}
        </p>
        <p>
          <span className="font-medium text-foreground">Drop-off: </span>
          {dropoffData.address}
        </p>
        <p className="text-xs pt-1 text-muted-foreground/60">
          Order ref: <span className="font-mono">{orderRef}</span>
        </p>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {/* Pre-dispatch: confirm button */}
      {!activeDelivery && (
        <button
          id="dispatch-confirm-btn"
          onClick={handleDispatch}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Transmitting to Courier Network…
            </>
          ) : (
            'Confirm Surplus Pickup'
          )}
        </button>
      )}

      {/* Active delivery status card */}
      {activeDelivery && (
        <div className="rounded-xl border-2 border-primary/40 bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Delivery Active</h3>

          <div className="text-sm space-y-2 text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Order Reference: </span>
              <span className="font-mono">{activeDelivery.orderRef}</span>
            </p>

            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Live Street Status:</span>
              <StatusBadge status={activeDelivery.status} />
            </div>
            {activeDelivery.lastLocation && (
              <p>
                <span className="font-medium text-foreground">Driver Coordinates: </span>
                {activeDelivery.lastLocation}
              </p>
            )}
          </div>

          {/* Pulsing indicator while in-transit */}
          {activeDelivery.status !== 'DELIVERED' && activeDelivery.status !== 'FAILED' && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Polling for live updates every 5 s…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
