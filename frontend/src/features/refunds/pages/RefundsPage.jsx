import { useGetMyRefundsQuery } from "../api/refundApi";

export const RefundsPage = () => {
  const { data, isLoading, error } = useGetMyRefundsQuery();
  const refunds = data?.refunds || [];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 w-full grow animate-pulse space-y-6">
        <div className="h-6 bg-surface-container w-1/4 rounded"></div>
        <div className="h-24 bg-surface-container rounded-xl"></div>
        <div className="h-24 bg-surface-container rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface-container border border-outline-variant/30 rounded-xl text-center shadow-xl">
        <span className="material-symbols-outlined text-4xl text-error mb-2">error_outline</span>
        <h2 className="text-md font-bold text-on-surface">Failed to load refunds</h2>
        <p className="text-xs text-on-surface-variant mt-2">
          Could not retrieve refund ledger history. Please reload.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 w-full grow flex flex-col gap-6">
      <div>
        <h1 className="text-xl md:text-headline-md font-bold text-on-surface tracking-tight">Refund History</h1>
        <p className="text-xs text-on-surface-variant mt-1">Track processed refunds and pending transaction approvals.</p>
      </div>

      {refunds.length === 0 ? (
        <div className="py-20 bg-surface-container/20 border border-outline-variant/25 rounded-2xl text-center">
          <span className="material-symbols-outlined text-5xl text-outline opacity-40 mb-3">account_balance_wallet</span>
          <p className="text-sm font-bold text-on-surface">No refunds recorded</p>
          <p className="text-xs text-on-surface-variant mt-1">
            You don't have any refund entries. Cancelled ticket payments will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {refunds.map((r) => {
            const booking = r.booking || {};
            const event = booking.event || {};
            const isRefunded = r.refundStatus === "refunded";

            return (
              <div
                key={r._id}
                className="bg-surface-container p-5 rounded-xl border border-outline-variant/30 flex flex-col sm:flex-row justify-between items-center gap-4 hover:border-primary/20 transition-all duration-300"
              >
                <div className="space-y-1.5 text-center sm:text-left min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                      isRefunded
                        ? "bg-secondary-container/20 text-secondary border-secondary-container/30"
                        : "bg-surface-container-high text-on-surface border-outline-variant/40 animate-pulse"
                    }`}>
                      {r.refundStatus}
                    </span>
                    <span className="text-[9px] text-outline font-mono">REFUND #{r._id.slice(-6).toUpperCase()}</span>
                  </div>
                  <h3 className="text-sm font-bold text-on-surface truncate leading-tight">
                    {event.title || "Cancelled Booking Event"}
                  </h3>
                  <p className="text-[10px] text-on-surface-variant">
                    Reason: {r.reason || "Booking cancelled by participant."}
                  </p>
                </div>

                <div className="text-center sm:text-right shrink-0">
                  <p className="text-[8px] text-outline font-semibold uppercase">Refund Amount</p>
                  <p className="text-sm font-extrabold text-primary mt-0.5">₹{r.amount.toLocaleString()}</p>
                  {r.processedAt && (
                    <p className="text-[8px] text-outline mt-1">
                      Processed on {new Date(r.processedAt).toLocaleDateString(undefined, { dateStyle: "short" })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RefundsPage;
