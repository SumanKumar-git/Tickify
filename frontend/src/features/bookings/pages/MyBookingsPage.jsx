import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useGetMyBookingsQuery, useCancelBookingMutation } from "../api/bookingApi";
import { BookingCard } from "../components/BookingCard";

export const MyBookingsPage = () => {
  const { data, isLoading, error } = useGetMyBookingsQuery();
  const bookings = data?.booking || [];

  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();

  const handleCancel = async (e, bookingId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await cancelBooking(bookingId).unwrap();
      toast.success("Booking cancelled successfully");
    } catch (err) {
      toast.error(err.data?.message || "Failed to cancel booking");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 w-full grow animate-pulse space-y-6">
        <div className="h-6 bg-surface-container w-1/4 rounded"></div>
        <div className="h-28 bg-surface-container rounded-xl"></div>
        <div className="h-28 bg-surface-container rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface-container border border-outline-variant/30 rounded-xl text-center shadow-xl">
        <span className="material-symbols-outlined text-4xl text-error mb-2">error_outline</span>
        <h2 className="text-md font-bold text-on-surface">Failed to load bookings</h2>
        <p className="text-xs text-on-surface-variant mt-2">
          Please check your connection and reload the page.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 w-full grow flex flex-col gap-6">
      <div>
        <h1 className="text-xl md:text-headline-md font-bold text-on-surface tracking-tight">My Bookings</h1>
        <p className="text-xs text-on-surface-variant mt-1">View your event seat reservations and ticket order history.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="py-20 bg-surface-container/20 border border-outline-variant/25 rounded-2xl text-center">
          <span className="material-symbols-outlined text-5xl text-outline opacity-40 mb-3">calendar_today</span>
          <p className="text-sm font-bold text-on-surface">No bookings made yet</p>
          <p className="text-xs text-on-surface-variant mt-1">
            You haven't reserved any tickets yet. Explore active events and book now!
          </p>
          <Link
            to="/"
            className="mt-6 inline-block bg-primary text-on-primary text-xs font-bold px-6 py-2.5 rounded-lg active:scale-95 transition-all cursor-pointer"
          >
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <BookingCard
              key={b._id}
              booking={b}
              onCancel={handleCancel}
              isCancelling={isCancelling}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
