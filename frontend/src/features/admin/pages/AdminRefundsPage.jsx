import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  useGetAllRefundsForAdminQuery,
  useGetRefundByIdQuery,
  useProcessRefundMutation
} from "../../refunds/api/refundApi";

export const AdminRefundsPage = () => {
  const { data, isLoading, error } = useGetAllRefundsForAdminQuery();
  const refunds = data?.refunds || [];

  const [processRefund, { isLoading: isProcessing }] = useProcessRefundMutation();

  const [selectedRefundId, setSelectedRefundId] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'pending', 'refunded'
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Detailed query for the selected refund panel
  const { data: detailData, isLoading: isLoadingDetail } = useGetRefundByIdQuery(selectedRefundId, {
    skip: !selectedRefundId,
  });
  const activeRefund = detailData?.refund;

  const handleProcessRefund = async (refundId) => {
    try {
      const res = await processRefund(refundId).unwrap();
      toast.success(res.message || "Refund processed and marked as completed");
    } catch (err) {
      toast.error(err.data?.message || "Failed to process refund");
    }
  };

  // Filter & Search
  const filteredRefunds = refunds.filter((ref) => {
    // 1. Status Filter
    if (filterStatus !== "all" && ref.refundStatus !== filterStatus) {
      return false;
    }
    // 2. Search query
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      ref._id.toLowerCase().includes(query) ||
      ref.user?.fullName?.toLowerCase().includes(query) ||
      ref.user?.email?.toLowerCase().includes(query) ||
      ref.booking?.event?.title?.toLowerCase().includes(query)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredRefunds.length / limit) || 1;
  const paginatedRefunds = filteredRefunds.slice((page - 1) * limit, page * limit);

  if (isLoading) {
    return (
      <div className="max-w-360 mx-auto px-6 py-10 w-full grow animate-pulse space-y-6">
        <div className="h-6 bg-surface-container w-1/4 rounded"></div>
        <div className="h-44 bg-surface-container rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface-container border border-outline-variant/30 rounded-xl text-center shadow-xl">
        <span className="material-symbols-outlined text-4xl text-error mb-2">error</span>
        <h2 className="text-md font-bold text-on-surface">Failed to load refunds</h2>
        <p className="text-xs text-on-surface-variant mt-2">Could not retrieve refund ledger entries.</p>
      </div>
    );
  }

  return (
    <div className="max-w-360 mx-auto p-6 lg:p-10 w-full grow flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-headline-md font-bold text-on-surface tracking-tight">Process Refunds</h1>
        <p className="text-xs text-on-surface-variant mt-1">
          Monitor cancellation ledger references and complete payment payouts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Refunds List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Controls Bar: Tabs and Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Status Tabs */}
            <div className="flex bg-surface-container-high p-1 rounded-xl border border-outline-variant/20 self-start">
              {["all", "pending", "refunded"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status);
                    setPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    filterStatus === status
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-outline-variant/40 bg-surface-container text-xs text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="Search refund ledger..."
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[16px] pointer-events-none flex items-center">
                search
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-high border-b border-outline-variant/30 text-on-surface-variant font-bold text-[10px] uppercase tracking-wider">
                    <th className="p-4">Refund ID / Event</th>
                    <th className="p-4">Guest</th>
                    <th className="p-4">Payout Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                  {paginatedRefunds.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-4xl opacity-30 mb-2 block">receipt_long</span>
                        No matching refund ledger entries found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRefunds.map((ref) => {
                      const isCompleted = ref.refundStatus === "refunded";
                      return (
                        <tr
                          key={ref._id}
                          onClick={() => setSelectedRefundId(ref._id)}
                          className={`hover:bg-surface-container-high/40 transition-colors cursor-pointer ${
                            selectedRefundId === ref._id ? "bg-surface-container-high/60" : ""
                          }`}
                        >
                          <td className="p-4">
                            <p className="font-mono text-[9px] text-outline font-semibold">#{ref._id.toUpperCase()}</p>
                            <p className="font-bold mt-0.5 truncate max-w-48 text-on-surface">
                              {ref.booking?.event?.title || "Deleted Event"}
                            </p>
                          </td>
                          <td className="p-4">
                            <p className="font-semibold">{ref.user?.fullName || "Guest"}</p>
                            <p className="text-[10px] text-outline mt-0.5">{ref.user?.email}</p>
                          </td>
                          <td className="p-4 font-bold text-on-surface">
                            ₹{ref.amount?.toLocaleString() || 0}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                              isCompleted
                                ? "bg-secondary-container/20 text-secondary border-secondary-container/30"
                                : "bg-surface-container-high text-on-surface border-outline-variant/40 animate-pulse"
                            }`}>
                              {ref.refundStatus}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button className="text-primary font-bold text-[10px] hover:underline">
                              Select
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-surface-container-high border-t border-outline-variant/30 p-4 flex justify-between items-center gap-4 text-xs font-semibold">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface hover:bg-surface-bright active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  Previous
                </button>
                <span className="text-on-surface-variant font-mono">
                  Page <span className="text-primary font-bold">{page}</span> of {totalPages}
                </span>
                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface hover:bg-surface-bright active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Next
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Refund Detail Panel */}
        <aside className="bg-surface-container p-6 rounded-2xl border border-outline-variant/30 shadow-xl space-y-6">
          {isLoadingDetail ? (
            <div className="h-64 bg-surface-container animate-pulse flex flex-col justify-center items-center text-xs text-on-surface-variant gap-2">
              <span className="material-symbols-outlined text-3xl text-outline animate-spin">sync</span>
              <span>Loading ledger breakdown...</span>
            </div>
          ) : activeRefund ? (
            <div className="space-y-6">
              <div className="pb-4 border-b border-outline-variant/20">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest font-display">Ledger Audit</h3>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-snug font-mono">
                  Ref ID: #{activeRefund._id.toUpperCase()}
                </p>
              </div>

              {/* Status Indicator */}
              <div className="p-4 bg-surface-container-low border border-outline-variant/25 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-outline font-semibold">Ledger Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                    activeRefund.refundStatus === "refunded"
                      ? "bg-secondary-container/20 text-secondary border-secondary-container/30"
                      : "bg-surface-container-high text-on-surface border-outline-variant/40 animate-pulse"
                  }`}>
                    {activeRefund.refundStatus}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-outline font-semibold">Payout Amount:</span>
                  <span className="font-extrabold text-sm text-on-surface">₹{activeRefund.amount?.toLocaleString()}</span>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="text-[11px] text-on-surface-variant space-y-3 border-b border-outline-variant/10 pb-4">
                <h4 className="font-bold text-on-surface uppercase text-[9px] tracking-wider text-primary">Booking Reference</h4>
                <p><span className="text-outline font-semibold">Event:</span> {activeRefund.booking?.event?.title || "Deleted Event"}</p>
                <p><span className="text-outline font-semibold">Quantity:</span> {activeRefund.booking?.quantity} seats</p>
                <p><span className="text-outline font-semibold">Amount Charged:</span> ₹{activeRefund.booking?.totalAmount}</p>

                <h4 className="font-bold text-on-surface uppercase text-[9px] tracking-wider text-primary mt-4">Guest Information</h4>
                <p><span className="text-outline font-semibold">Name:</span> {activeRefund.user?.fullName}</p>
                <p><span className="text-outline font-semibold">Email:</span> {activeRefund.user?.email}</p>

                <h4 className="font-bold text-on-surface uppercase text-[9px] tracking-wider text-primary mt-4">Payment Details</h4>
                <p><span className="text-outline font-semibold">Gateway:</span> <span className="uppercase">{activeRefund.payment?.paymentGateway || "N/A"}</span></p>
                <p className="font-mono"><span className="text-outline font-semibold font-sans">Gateway Order ID:</span> {activeRefund.payment?.gatewayOrderId || "N/A"}</p>
                <p className="font-mono"><span className="text-outline font-semibold font-sans">Gateway Payment ID:</span> {activeRefund.payment?.gatewayPaymentId || "N/A"}</p>
                <p><span className="text-outline font-semibold">Payment Method:</span> <span className="uppercase">{activeRefund.payment?.paymentMethod || "N/A"}</span></p>
                <p><span className="text-outline font-semibold">Fee & Tax:</span> ₹{((activeRefund.payment?.fee || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Fee) + ₹{((activeRefund.payment?.tax || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Tax)</p>
              </div>

              <div className="text-xs">
                <span className="text-outline font-semibold block mb-1">Cancellation Reason</span>
                <p className="text-on-surface leading-relaxed p-3 bg-surface-container-low rounded border border-outline-variant/10 font-medium">
                  {activeRefund.reason || "Booking cancelled by attendee."}
                </p>
              </div>

              {activeRefund.refundStatus === "pending" ? (
                <div className="flex justify-end pt-4 border-t border-outline-variant/10">
                  <button
                    onClick={() => handleProcessRefund(activeRefund._id)}
                    disabled={isProcessing}
                    className="w-full bg-primary text-on-primary text-xs font-bold py-3 rounded-lg shadow hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">price_check</span>
                    {isProcessing ? "Processing Return..." : "Mark as Payout Completed"}
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-secondary-container/10 border border-secondary-container/20 rounded-xl text-center text-[10px] text-secondary font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">done_all</span>
                  Payout completed
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-on-surface-variant text-xs leading-relaxed">
              <span className="material-symbols-outlined text-4xl opacity-30 mb-2 block">payments</span>
              Select a refund ledger reference from the list to audit breakdown details and complete payout returns.
            </div>
          )}
        </aside>

      </div>
    </div>
  );
};

export default AdminRefundsPage;
