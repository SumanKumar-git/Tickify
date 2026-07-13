import { useState } from "react";
import { useGetMyPaymentsQuery } from "../api/paymentApi";

export const TransactionsPage = () => {
  const { data, isLoading, error } = useGetMyPaymentsQuery();
  const payments = data?.payments || [];

  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedPaymentId, setExpandedPaymentId] = useState(null);

  // Filter payments/refunds
  const filteredPayments = payments.filter((p) => {
    if (filterStatus === "all") return true;
    return p.paymentStatus === filterStatus;
  });

  const toggleExpand = (id) => {
    setExpandedPaymentId((prev) => (prev === id ? null : id));
  };

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case "success":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20";
      case "refunded":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20";
      case "failed":
        return "bg-error/10 text-error border-error/20";
      case "pending":
      default:
        return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 animate-pulse";
    }
  };

  const getStatusLabel = (status) => {
    if (status === "success") return "completed";
    return status;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 w-full grow animate-pulse space-y-6">
        <div className="h-6 bg-surface-container w-1/4 rounded"></div>
        <div className="h-44 bg-surface-container rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface-container border border-outline-variant/30 rounded-xl text-center shadow-xl">
        <span className="material-symbols-outlined text-4xl text-error mb-2">error_outline</span>
        <h2 className="text-md font-bold text-on-surface">Failed to load transactions</h2>
        <p className="text-xs text-on-surface-variant mt-2">
          Could not retrieve your transaction history. Please refresh the page.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 w-full grow flex flex-col gap-6">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-headline-md font-bold text-on-surface tracking-tight">Transactions</h1>
          <p className="text-xs text-on-surface-variant mt-1">View your billing statements, purchase receipts, and cancellation returns.</p>
        </div>

        {/* Filter Section */}
        {payments.length > 0 && (
          <div className="flex bg-surface-container p-1 rounded-xl border border-outline-variant/20 overflow-x-auto max-w-full">
            {["all", "success", "pending", "failed", "refunded"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  filterStatus === status
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        )}
      </div>

      {payments.length === 0 ? (
        <div className="py-20 bg-surface-container/20 border border-outline-variant/25 rounded-2xl text-center">
          <span className="material-symbols-outlined text-5xl text-outline opacity-40 mb-3">receipt_long</span>
          <p className="text-sm font-bold text-on-surface">No transactions recorded</p>
          <p className="text-xs text-on-surface-variant mt-1">
            Once you purchase tickets or cancel a booking, your payment records will list here.
          </p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="py-20 bg-surface-container/10 border border-outline-variant/20 rounded-2xl text-center">
          <span className="material-symbols-outlined text-5xl text-outline opacity-30 mb-3">receipt_long</span>
          <p className="text-sm font-bold text-on-surface">No transactions found</p>
          <p className="text-xs text-on-surface-variant mt-1">
            You don't have any transactions currently matching status "{getStatusLabel(filterStatus)}".
          </p>
        </div>
      ) : (
        <div className="bg-surface-container border border-outline-variant/30 rounded-2xl overflow-hidden shadow-lg space-y-px">
          {/* Table Head for md+ screens */}
          <div className="hidden md:grid grid-cols-12 bg-surface-container-high text-on-surface-variant font-bold text-[10px] uppercase tracking-wider p-4 border-b border-outline-variant/30">
            <div className="col-span-5">Event Detail</div>
            <div className="col-span-3">Billing Reference</div>
            <div className="col-span-2">Charge</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          {/* Transactions List */}
          <div className="divide-y divide-outline-variant/10">
            {filteredPayments.map((p) => {
              const event = p.booking?.event || {};
              const formattedDate = new Date(p.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              const isExpanded = expandedPaymentId === p._id;
              const isRefund = p.type === "refund";

              return (
                <div
                  key={p._id}
                  className={`hover:bg-surface-container-high/20 transition-all ${
                    isExpanded ? "bg-surface-container-high/30" : ""
                  }`}
                >
                  {/* Main row grid */}
                  <div
                    onClick={() => toggleExpand(p._id)}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-0 p-4 items-center cursor-pointer text-xs select-none"
                  >
                    {/* Column 1: Event Details */}
                    <div className="col-span-1 md:col-span-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-outline-variant/30 bg-surface-container-high relative">
                        {event.poster ? (
                          <img alt={event.title} className="w-full h-full object-cover" src={event.poster} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-outline">
                            <span className="material-symbols-outlined text-lg">image</span>
                          </div>
                        )}
                        {isRefund && (
                          <div className="absolute inset-0 bg-blue-600/25 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-sm font-bold">undo</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-on-surface truncate leading-snug">{event.title || "Deleted Event"}</p>
                        <p className="text-[10px] text-outline mt-0.5">{formattedDate}</p>
                      </div>
                    </div>

                    {/* Column 2: Reference */}
                    <div className="col-span-1 md:col-span-3">
                      <p className="font-mono text-[10px] text-on-surface-variant truncate">
                        #{p._id.toUpperCase()}
                      </p>
                      <p className="text-[9px] text-outline mt-0.5 uppercase tracking-wide font-medium">
                        {isRefund ? "Refund Payout" : (p.booking?.quantity ? `${p.booking.quantity} Ticket(s)` : "Booking Ref")}
                      </p>
                    </div>

                    {/* Column 3: Amount */}
                    <div className={`col-span-1 md:col-span-2 font-bold text-sm md:text-xs ${
                      isRefund ? "text-blue-600 dark:text-blue-400" : "text-on-surface"
                    }`}>
                      {isRefund ? `-₹${p.amount?.toLocaleString()}` : `₹${p.amount?.toLocaleString()}`}
                    </div>

                    {/* Column 4: Status / Expand action */}
                    <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end gap-3">
                      <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider shrink-0 ${getStatusBadgeStyles(p.paymentStatus)}`}>
                        {getStatusLabel(p.paymentStatus)}
                      </span>
                      <span className={`material-symbols-outlined text-[18px] text-outline transition-transform hidden md:inline-block ${
                        isExpanded ? "rotate-180" : ""
                      }`}>
                        keyboard_arrow_down
                      </span>
                    </div>
                  </div>

                  {/* Expanding details panel */}
                  {isExpanded && (
                    <div className="px-4 pb-5 pt-1 border-t border-outline-variant/5 bg-surface-container-low/40">
                      <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[11px] text-on-surface-variant">
                        <div>
                          <p className="text-[9px] text-outline uppercase font-bold tracking-wider mb-1.5">Gateway Info</p>
                          <p><span className="text-outline font-semibold">Payment Gateway:</span> <span className="uppercase">{p.paymentGateway || "N/A"}</span></p>
                          <p className="font-mono mt-1"><span className="text-outline font-semibold font-sans">Order ID:</span> {p.gatewayOrderId || "N/A"}</p>
                          <p className="font-mono mt-1"><span className="text-outline font-semibold font-sans">Payment ID:</span> {p.gatewayPaymentId || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-outline uppercase font-bold tracking-wider mb-1.5">
                            {isRefund ? "Refund Details" : "Charge Details"}
                          </p>
                          <p><span className="text-outline font-semibold">Method:</span> <span className="uppercase">{p.paymentMethod || "N/A"}</span></p>
                          {isRefund ? (
                            <p className="mt-1 font-medium"><span className="text-outline font-semibold">Reason:</span> {p.reason || "Attendee cancellation"}</p>
                          ) : (
                            <>
                              <p className="mt-1">
                                <span className="text-outline font-semibold">Gateway Fees:</span> ₹{((p.fee || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <p className="mt-1">
                                <span className="text-outline font-semibold">Gateway Taxes:</span> ₹{((p.tax || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </>
                          )}
                        </div>
                        <div>
                          <p className="text-[9px] text-outline uppercase font-bold tracking-wider mb-1.5">Settlement status</p>
                          <p><span className="text-outline font-semibold">{isRefund ? "Processed At:" : "Settlement Time:"}</span> {p.paidAt ? new Date(p.paidAt).toLocaleString() : "N/A"}</p>
                          <p className="mt-1"><span className="text-outline font-semibold">Currency:</span> <span className="uppercase">{p.currency || "INR"}</span></p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
