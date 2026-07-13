import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useGetBookingByIdQuery, useCancelBookingMutation } from "../api/bookingApi";
import { useInitiatePaymentMutation, useVerifyPaymentMutation } from "../../payments/api/paymentApi";

export const CheckoutPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  // Load Razorpay script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Fetch Booking Details
  const { data, isLoading, error, refetch } = useGetBookingByIdQuery(bookingId);
  const booking = data?.booking;

  const [initiatePayment, { isLoading: isInitiating }] = useInitiatePaymentMutation();
  const [verifyPayment, { isLoading: isVerifying }] = useVerifyPaymentMutation();
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();

  const [timeLeft, setTimeLeft] = useState(null);

  // Reservation Countdown timer
  useEffect(() => {
    if (!booking || booking.bookingStatus !== "pending" || !booking.reservationExpiresAt) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(booking.reservationExpiresAt) - new Date();
      if (difference <= 0) {
        setTimeLeft(0);
        refetch(); // Refetch to show expired state
        return;
      }
      setTimeLeft(Math.floor(difference / 1000));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [booking, refetch]);

  const handlePayment = async () => {
    try {
      const initRes = await initiatePayment(bookingId).unwrap();
      const { keyId, orderId, amount, currency } = initRes.payment;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        order_id: orderId,
        name: "Tickify",
        description: `Ticket purchase for ${booking?.event?.title}`,
        handler: async (response) => {
          toast.loading("Verifying transaction...");
          try {
            const verifyPayload = {
              bookingId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            };
            const verifyRes = await verifyPayment(verifyPayload).unwrap();
            toast.dismiss();
            toast.success(verifyRes.message || "Payment successful! Tickets generated.");
            navigate(`/tickets`);
          } catch (verifyErr) {
            toast.dismiss();
            toast.error(verifyErr.data?.message || "Payment verification failed");
          }
        },
        prefill: {
          name: booking?.user?.fullName || "",
          email: booking?.user?.email || "",
        },
        theme: {
          color: "#8083ff",
        },
        modal: {
          ondismiss: () => {
            toast.error("Payment checkout closed");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      toast.error(err.data?.message || "Failed to initiate payment");
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      await cancelBooking(bookingId).unwrap();
      toast.success("Reservation cancelled successfully");
      navigate("/");
    } catch (err) {
      toast.error(err.data?.message || "Failed to cancel reservation");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 w-full grow animate-pulse space-y-6">
        <div className="h-6 bg-surface-container w-1/3 rounded"></div>
        <div className="h-44 bg-surface-container rounded-xl"></div>
        <div className="h-24 bg-surface-container rounded-xl"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface-container border border-outline-variant/30 rounded-xl text-center shadow-xl">
        <span className="material-symbols-outlined text-4xl text-error mb-2">error</span>
        <h2 className="text-md font-bold text-on-surface">Booking Not Found</h2>
        <p className="text-xs text-on-surface-variant mt-2">
          {error?.data?.message || "This booking reservation could not be retrieved or is invalid."}
        </p>
        <Link
          to="/"
          className="mt-6 inline-block bg-primary text-on-primary text-xs font-bold px-6 py-2.5 rounded-lg active:scale-95 transition-all cursor-pointer"
        >
          Back to Discover
        </Link>
      </div>
    );
  }

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 w-full grow flex flex-col gap-8">
      <div>
        <h1 className="text-xl md:text-headline-md font-bold text-on-surface tracking-tight">Booking Summary</h1>
        <p className="text-xs text-on-surface-variant mt-1">Review your tickets and complete the checkout payment.</p>
      </div>

      {/* Booking Details Card */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden shadow-xl">
        <div className="p-6 flex flex-col md:flex-row items-center gap-6 border-b border-outline-variant/15">
          <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden shrink-0 shadow bg-surface-container-high">
            {booking.event?.poster ? (
              <img alt="event poster" className="w-full h-full object-cover" src={booking.event.poster} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-3xl">image</span>
              </div>
            )}
          </div>
          <div className="grow text-center md:text-left space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              {booking.event?.category}
            </span>
            <h2 className="text-md font-bold text-on-surface leading-tight">{booking.event?.title}</h2>
            <div className="flex items-center justify-center md:justify-start gap-4 text-on-surface-variant text-[11px]">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                {new Date(booking.event?.startDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">location_on</span>
                {booking.event?.venue?.city}
              </span>
            </div>
          </div>
        </div>

        {/* Invoice breakdown */}
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center text-xs text-on-surface-variant">
            <span>Ticket Price</span>
            <span className="text-on-surface font-semibold">₹{booking.event?.ticketPrice?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-on-surface-variant">
            <span>Quantity</span>
            <span className="text-on-surface font-semibold">{booking.quantity}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold border-t border-outline-variant/15 pt-4">
            <span className="text-on-surface">Total Amount</span>
            <span className="text-primary text-sm font-extrabold">₹{booking.totalAmount?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Reservation Status & Actions Card */}
      <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="space-y-1">
          <p className="text-[10px] text-outline font-semibold uppercase">Booking Status</p>
          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border mt-1 ${
            booking.bookingStatus === "confirmed"
              ? "bg-secondary-container/20 text-secondary border-secondary-container/30"
              : booking.bookingStatus === "cancelled"
              ? "bg-error-container/20 text-error border-error-container/30"
              : "bg-surface-container-high text-on-surface border-outline-variant/40"
          }`}>
            {booking.bookingStatus === "pending" ? "Awaiting Payment" : booking.bookingStatus}
          </span>
        </div>

        {/* Dynamic Countdown for Pending Reservation */}
        {booking.bookingStatus === "pending" && timeLeft !== null && (
          <div className="text-center sm:text-right shrink-0">
            {timeLeft > 0 ? (
              <>
                <p className="text-[10px] text-outline font-semibold uppercase mb-1">Seats reserved for</p>
                <div className="flex items-center gap-1.5 text-primary font-mono font-bold text-sm bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-[16px]">timer</span>
                  <span>{formatTimer(timeLeft)}</span>
                </div>
              </>
            ) : (
              <div className="text-error font-semibold text-xs flex items-center gap-1.5 bg-error-container/10 border border-error-container/30 px-3 py-1.5 rounded-lg">
                <span className="material-symbols-outlined text-[16px]">hourglass_empty</span>
                <span>Reservation Expired</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Checkout CTA triggers */}
      {booking.bookingStatus === "pending" && (
        <div className="flex gap-4">
          <button
            onClick={handleCancelBooking}
            disabled={isCancelling || isVerifying || isInitiating}
            className="w-1/2 py-3 border border-outline-variant/40 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
          >
            Cancel Reservation
          </button>
          <button
            onClick={handlePayment}
            disabled={timeLeft === 0 || isCancelling || isVerifying || isInitiating}
            className="w-1/2 py-3 bg-primary text-on-primary rounded-xl text-xs font-extrabold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center"
          >
            {isInitiating ? "Initiating..." : isVerifying ? "Verifying..." : "Pay with Razorpay"}
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
