import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { useGetEventByIdForUserQuery } from "../api/eventApi";
import { useCreateBookingMutation } from "../../bookings/api/bookingApi";
import { selectCurrentUser, selectIsAuthenticated } from "../../auth/authSlice";

export const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  const [quantity, setQuantity] = useState(1);

  // Fetch event details
  const { data, isLoading, error } = useGetEventByIdForUserQuery(id);
  const event = data?.event;

  // Create booking mutation
  const [createBooking, { isLoading: isBooking }] = useCreateBookingMutation();

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(prev + 1, Math.min(event?.availableSeats || 10, 10)));
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  const handleBookTickets = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to book tickets");
      navigate("/auth", { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    if (user?._id === event?.organizer?._id) {
      toast.error("You cannot book tickets for your own event");
      return;
    }

    try {
      const res = await createBooking({ eventId: id, quantity }).unwrap();
      toast.success("Seats reserved! Initiating checkout...");
      navigate(`/bookings/${res.booking._id}`);
    } catch (err) {
      toast.error(err.data?.message || "Failed to book tickets");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 w-full grow animate-pulse">
        <div className="h-96 bg-surface-container rounded-2xl mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="h-8 bg-surface-container w-3/4 rounded"></div>
            <div className="h-4 bg-surface-container w-1/2 rounded"></div>
            <div className="h-24 bg-surface-container rounded"></div>
          </div>
          <div className="bg-surface-container h-48 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface-container border border-outline-variant/30 rounded-xl text-center shadow-xl">
        <span className="material-symbols-outlined text-4xl text-error mb-2">event_busy</span>
        <h2 className="text-md font-bold text-on-surface">Event Not Found</h2>
        <p className="text-xs text-on-surface-variant mt-2">
          {error?.data?.message || "This event could not be found or has not been approved."}
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

  const isSoldOut = event.availableSeats <= 0;
  const isOrganizer = user?._id === event.organizer?._id;
  const isPastEvent = new Date(event.startDate) <= new Date();

  return (
    <div className="max-w-300 mx-auto px-6 py-10 w-full grow flex flex-col gap-10">
      {/* Banner / Poster Hero (Split Layout styled like Homepage Carousel Slide) */}
      <section className="relative h-90 md:h-105 rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/20 bg-surface-container-low shrink-0 flex items-center">
        {/* Blurred Poster backdrop */}
        <div className="absolute inset-0 z-0">
          {event.poster ? (
            <img
              alt="backdrop"
              className="w-full h-full object-cover filter blur-sm opacity-45 scale-110"
              src={event.poster}
            />
          ) : (
            <div className="w-full h-full bg-[#1c1b1d]"></div>
          )}
          {/* Main linear gradient masking left side for readable text */}
          <div className="absolute inset-0 bg-linear-to-r from-[#131315] via-[#131315]/85 to-transparent"></div>
          {/* Secondary linear gradient to blend borders in dark mode */}
          <div className="absolute inset-0 bg-linear-to-b from-[#131315]/30 via-transparent to-[#131315]"></div>
        </div>

        {/* Inner Content - split details and poster */}
        <div className="w-full px-8 md:px-16 z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-10">
          
          {/* Left Details */}
          <div className="grow max-w-2xl text-left space-y-4">
            <p className="text-[#f59e0b] text-sm md:text-base font-bold uppercase tracking-widest">
              {new Date(event.startDate).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })} (IST) onwards
            </p>
            <h1 className="text-3xl md:text-display-lg font-black text-white leading-tight tracking-tight">
              {event.title}
            </h1>
            <p className="text-on-surface-variant text-base md:text-lg font-bold leading-relaxed">
              {event.venue?.name || "Online"}, {event.venue?.city}
            </p>
            <p className="text-on-surface font-extrabold text-sm md:text-lg">
              {event.ticketPrice > 0 ? `₹${event.ticketPrice.toLocaleString()} onwards` : "Free Entry"}
            </p>
            <div className="absolute top-4 left-4 bg-primary/25 border border-primary/45 backdrop-blur px-4 py-1 rounded-full text-xs font-bold text-primary uppercase z-20">
              {event.category}
            </div>
          </div>

          {/* Right Portrait Card Poster */}
          <div className="hidden md:block w-48 md:w-56 aspect-3/4 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-outline-variant/30 bg-[#201f22]">
            {event.poster ? (
              <img
                alt={event.title}
                className="w-full h-full object-cover"
                src={event.poster}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-4xl">image</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left Column: Info details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-on-surface-variant">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
              <div>
                <p className="text-[10px] text-outline uppercase font-semibold">Organized by</p>
                <p className="font-bold text-on-surface">{event.organizer?.fullName}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-outline-variant/15 pt-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary">About this event</h2>
            <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Location / Venue details */}
          <div className="border-t border-outline-variant/15 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[22px]">location_on</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">Venue Location</h4>
                <p className="text-sm text-on-surface-variant font-bold mt-1 leading-snug">{event.venue?.name}</p>
                <p className="text-xs text-outline mt-1 font-semibold leading-relaxed">
                  {event.venue?.address}, {event.venue?.city}, {event.venue?.state}, {event.venue?.country}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[22px]">calendar_month</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">Date & Time</h4>
                <p className="text-sm text-on-surface-variant font-medium mt-1.5 leading-normal">
                  <span className="font-bold text-primary">Starts:</span> {new Date(event.startDate).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })} (IST)
                </p>
                <p className="text-sm text-on-surface-variant font-medium mt-1.5 leading-normal">
                  <span className="font-bold text-primary">Ends:</span> {new Date(event.endDate).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })} (IST)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout triggers card */}
        <aside className="bg-surface-container p-6 rounded-2xl border border-outline-variant/30 shadow-xl space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-outline-variant/20">
            <div>
              <p className="text-[10px] text-outline font-semibold uppercase">Ticket Price</p>
              <p className="text-xl font-black text-on-surface mt-0.5">
                {event.ticketPrice > 0 ? `₹${event.ticketPrice.toLocaleString()}` : "Free Entry"}
              </p>
            </div>
            <span className={`text-[10px] border px-2.5 py-0.5 rounded-full font-bold uppercase ${
              isSoldOut
                ? "bg-error-container/20 text-error border-error-container/30 animate-pulse"
                : "bg-secondary-container/20 text-secondary border-secondary-container/30"
            }`}>
              {isSoldOut ? "Sold Out" : `${event.availableSeats} Seats Left`}
            </span>
          </div>

          {isOrganizer ? (
            <div className="p-4 bg-secondary-container/10 border border-secondary-container/30 rounded-xl text-center text-xs text-secondary font-medium">
              <span className="material-symbols-outlined text-lg mb-1 block">info</span>
              You are the organizer of this event. You can manage participants in your organizer dashboard.
            </div>
          ) : isPastEvent ? (
            <div className="p-4 bg-error-container/10 border border-error-container/30 rounded-xl text-center text-xs text-error font-medium">
              <span className="material-symbols-outlined text-lg mb-1 block">history</span>
              Booking is closed. This event has already started or completed.
            </div>
          ) : isSoldOut ? (
            <div className="p-4 bg-error-container/10 border border-error-container/30 rounded-xl text-center text-xs text-error font-medium">
              <span className="material-symbols-outlined text-lg mb-1 block">block</span>
              This event is fully booked. No tickets are available.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-on-surface-variant">Quantity</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-surface-container-highest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">remove</span>
                  </button>
                  <span className="text-xs font-bold text-on-surface min-w-4 text-center">{quantity}</span>
                  <button
                    onClick={handleIncrement}
                    disabled={quantity >= 10 || quantity >= event.availableSeats}
                    className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-surface-container-highest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-semibold border-t border-outline-variant/10 pt-4">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="text-on-surface font-extrabold">
                  {event.ticketPrice > 0 ? `₹${(event.ticketPrice * quantity).toLocaleString()}` : "Free"}
                </span>
              </div>

              <button
                onClick={handleBookTickets}
                disabled={isBooking}
                className="w-full py-3.5 bg-primary text-on-primary rounded-xl text-xs font-extrabold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                {isBooking ? "Reserving Seats..." : "Reserve Tickets"}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default EventDetailsPage;
