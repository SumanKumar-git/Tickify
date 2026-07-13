import { useNavigate } from "react-router-dom";

export const UpcomingEventCard = ({ event }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/organizer/events/${event._id}`)}
      className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant/20 hover:border-primary/50 transition-all group cursor-pointer duration-300 bento-item"
    >
      <div className="h-32 bg-surface-container-high relative">
        {event.poster ? (
          <img alt={event.title} className="w-full h-full object-cover" src={event.poster} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline">
            <span className="material-symbols-outlined">image</span>
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h4 className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">
          {event.title}
        </h4>
        <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-medium">
          <span>{new Date(event.startDate).toLocaleDateString(undefined, { dateStyle: "short" })}</span>
          <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">
            {event.availableSeats} / {event.totalSeats} seats
          </span>
        </div>
      </div>
    </div>
  );
};
