import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAllEventsQuery } from "../api/eventApi";
import { EventCard } from "../components/EventCard";


const CATEGORIES = [
  { name: "Music", icon: "music_note" },
  { name: "Art", icon: "palette" },
  { name: "Workshop", icon: "developer_mode" },
  { name: "Seminar", icon: "co_present" },
  { name: "Conference", icon: "groups" },
  { name: "Comedy", icon: "theater_comedy" },
];

export const LandingPage = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch approved active events
  const { data, isLoading, error } = useGetAllEventsQuery({ limit: 8 });
  const events = data?.events || [];

  // Generate carousel slides from database, or fallback if empty
  const carouselEvents = events.length > 0 ? events.slice(0, 5) : [
    {
      _id: "default-timezone",
      title: "Timezone | MGF Mall - Gurugram",
      startDate: new Date().toISOString(),
      ticketPrice: 500,
      venue: { name: "Timezone MGF Metropolitan Mall", city: "Gurugram" },
      poster: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80"
    }
  ];

  // Carousel auto-play transition handler
  useEffect(() => {
    if (carouselEvents.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselEvents.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [carouselEvents.length]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselEvents.length) % carouselEvents.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselEvents.length);
  };

  const formatEventDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
    const day = date.toLocaleDateString(undefined, { day: "numeric" });
    const month = date.toLocaleDateString(undefined, { month: "short" });
    const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${weekday}, ${day} ${month} onwards, ${time}`;
  };

  const handleCategoryClick = (category) => {
    navigate(`/events?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="flex flex-col w-full bg-background">
      {/* Hero Carousel Section */}
      <section className="relative h-112.5 md:h-125 overflow-hidden bg-surface-container-lowest border-b border-outline-variant/20 flex items-center">
        {/* Blurred Poster backdrop */}
        <div className="absolute inset-0 z-0">
          {carouselEvents[currentSlide]?.poster ? (
            <img
              alt="backdrop"
              className="w-full h-full object-cover filter blur-sm opacity-45 scale-110"
              src={carouselEvents[currentSlide].poster}
            />
          ) : (
            <div className="w-full h-full bg-surface-container-low"></div>
          )}
          {/* Main linear gradient masking left side for readable text */}
          <div className="absolute inset-0 bg-linear-to-r from-[#131315] via-[#131315]/80 to-transparent"></div>
          {/* Secondary linear gradient to blend carousel border lines in dark mode, keeping the top visible */}
          <div className="absolute inset-0 bg-linear-to-b from-[#131315]/30 via-transparent to-[#131315]"></div>
        </div>

        {/* Navigation Chevrons */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-4 z-20 w-10 h-10 rounded-full bg-surface-container-high/40 hover:bg-surface-container-high/70 flex items-center justify-center text-on-surface transition-all active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>

        <button
          onClick={handleNextSlide}
          className="absolute right-4 z-20 w-10 h-10 rounded-full bg-surface-container-high/40 hover:bg-surface-container-high/70 flex items-center justify-center text-on-surface transition-all active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>

        {/* Slider viewport */}
        <div className="max-w-300 mx-auto w-full px-14 md:px-20 z-10 flex flex-col md:flex-row items-center justify-between gap-10">

          {/* Left Details */}
          <div className="grow max-w-2xl text-left space-y-5">
            <p className="text-[#f59e0b] text-xs md:text-sm font-bold uppercase tracking-widest">
              {formatEventDate(carouselEvents[currentSlide].startDate)}
            </p>
            <h2 className="text-3xl md:text-display-lg-mobile lg:text-display-lg font-black text-white leading-tight tracking-tight">
              {carouselEvents[currentSlide].title}
            </h2>
            <p className="text-on-surface-variant text-sm md:text-base font-semibold leading-relaxed">
              {carouselEvents[currentSlide].venue?.name || "Online"}, {carouselEvents[currentSlide].venue?.city}
            </p>
            <p className="text-on-surface font-extrabold text-sm md:text-lg">
              {carouselEvents[currentSlide].ticketPrice > 0 ? `₹${carouselEvents[currentSlide].ticketPrice.toLocaleString()} onwards` : "Free Entry"}
            </p>
            <div className="pt-3">
              <button
                onClick={() => navigate(carouselEvents[currentSlide]._id === "default-timezone" ? "/events" : `/events/${carouselEvents[currentSlide]._id}`)}
                className="bg-surface-container-low text-white px-10 py-3.5 rounded-xl font-bold border border-outline-variant/30 shadow-xl hover:bg-surface-bright active:scale-95 transition-all duration-300 cursor-pointer text-sm"
              >
                Book tickets
              </button>
            </div>
          </div>

          {/* Right Portrait Card Poster */}
          <div className="hidden md:block w-72 aspect-3/4 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-outline-variant/30 bg-surface-container">
            {carouselEvents[currentSlide].poster ? (
              <img
                alt={carouselEvents[currentSlide].title}
                className="w-full h-full object-cover"
                src={carouselEvents[currentSlide].poster}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-4xl">image</span>
              </div>
            )}
          </div>
        </div>

        {/* Indicators Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {carouselEvents.map((_, idx) => (
            <button
              key={idx}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentSlide === idx ? "bg-white w-6" : "bg-outline-variant/60 w-1.5"
              }`}
              onClick={() => setCurrentSlide(idx)}
            ></button>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-6 bg-surface-container-lowest border-y border-outline-variant/20">
        <div className="max-w-360 mx-auto">
          <h2 className="text-xl md:text-headline-md font-bold text-on-surface mb-8 tracking-tight">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                onClick={() => handleCategoryClick(cat.name)}
                className="p-6 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 flex flex-col items-center gap-4 cursor-pointer transition-all group duration-300 hover:-translate-y-1 shadow-sm"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all duration-300">
                  <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                </div>
                <span className="font-bold text-xs text-on-surface tracking-wide uppercase">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-360 mx-auto text-center">
          <div className="flex justify-between items-end mb-10 text-left">
            <div>
              <h2 className="text-xl md:text-headline-md font-bold text-on-surface mb-2 tracking-tight">Featured Events</h2>
              <p className="text-xs md:text-sm text-on-surface-variant">Top-rated experiences handpicked for you.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/20 h-100 animate-pulse">
                  <div className="h-48 bg-surface-container-high"></div>
                  <div className="p-6 space-y-4">
                    <div className="w-1/3 h-3 bg-surface-container-highest rounded"></div>
                    <div className="w-3/4 h-5 bg-surface-container-highest rounded"></div>
                    <div className="w-1/2 h-3 bg-surface-container-highest rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-12 bg-surface-container/20 rounded-xl border border-outline-variant/20">
              <span className="material-symbols-outlined text-4xl text-error opacity-75 mb-2">error</span>
              <p className="text-sm text-on-surface-variant">Failed to load events. Please try again later.</p>
            </div>
          ) : events.length === 0 ? (
            <div className="py-16 bg-surface-container/20 rounded-xl border border-outline-variant/20">
              <span className="material-symbols-outlined text-4xl text-outline opacity-60 mb-2">event_busy</span>
              <p className="text-sm text-on-surface-variant font-medium">No featured events available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12 text-left">
              {events.slice(0, 8).map((evt) => (
                <EventCard key={evt._id} event={evt} />
              ))}
            </div>
          )}

          <button
            onClick={() => navigate("/events")}
            className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-8 py-3.5 rounded-xl font-bold border border-outline-variant/40 flex items-center gap-2 mx-auto transition-all cursor-pointer text-xs"
          >
            Browse All Events <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
