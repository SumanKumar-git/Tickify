import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useGetEventByIdForOrganizerQuery, useUpdateEventMutation } from "../../events/api/eventApi";
import { EventForm } from "../../events/components/EventForm";

export const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useGetEventByIdForOrganizerQuery(id);
  const event = data?.event;

  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();

  const handleUpdate = async (formData) => {
    try {
      const res = await updateEvent({ id, formData }).unwrap();
      toast.success(res.message || "Event updated successfully");
      navigate("/organizer/events");
    } catch (err) {
      toast.error(err.data?.message || "Failed to update event");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-360 mx-auto px-6 py-10 w-full grow animate-pulse space-y-6">
        <div className="h-6 bg-surface-container w-1/4 rounded"></div>
        <div className="h-96 bg-surface-container rounded-2xl"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface-container border border-outline-variant/30 rounded-xl text-center shadow-xl">
        <span className="material-symbols-outlined text-4xl text-error mb-2">error</span>
        <h2 className="text-md font-bold text-on-surface">Event Not Found</h2>
        <p className="text-xs text-on-surface-variant mt-2">Could not retrieve details for this event.</p>
        <Link
          to="/organizer/events"
          className="mt-6 inline-block bg-primary text-on-primary text-xs font-bold px-6 py-2.5 rounded-lg active:scale-95 transition-all cursor-pointer"
        >
          Back to Event List
        </Link>
      </div>
    );
  }

  // Double guard: Approved events cannot be updated
  if (event.status === "approved") {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface-container border border-outline-variant/30 rounded-xl text-center shadow-xl space-y-4">
        <span className="material-symbols-outlined text-4xl text-secondary">info</span>
        <h2 className="text-md font-bold text-on-surface">Event Cannot Be Edited</h2>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          This event has already been <span className="text-secondary font-bold">approved</span>. Editing is disabled to preserve bookings. Please contact administration for alterations.
        </p>
        <Link
          to="/organizer/events"
          className="mt-6 inline-block bg-primary text-on-primary text-xs font-bold px-6 py-2.5 rounded-lg active:scale-95 transition-all cursor-pointer"
        >
          Back to Event List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-360 mx-auto px-6 py-10 w-full grow flex flex-col gap-6">
      <div>
        <h1 className="text-xl md:text-headline-md font-bold text-on-surface tracking-tight">Edit Event</h1>
        <p className="text-xs text-on-surface-variant mt-1">Make adjustments to your event listing. It will be reviewed by admins again.</p>
      </div>

      <div className="bg-surface-container-low p-6 md:p-8 rounded-2xl border border-outline-variant/30 shadow-xl">
        <EventForm initialValues={event} onSubmit={handleUpdate} isLoading={isUpdating} />
      </div>
    </div>
  );
};

export default EditEventPage;
