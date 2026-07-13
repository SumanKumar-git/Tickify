import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useCreateEventMutation } from "../../events/api/eventApi";
import { EventForm } from "../../events/components/EventForm";

export const CreateEventPage = () => {
  const navigate = useNavigate();
  const [createEvent, { isLoading }] = useCreateEventMutation();

  const handleCreate = async (formData) => {
    try {
      const res = await createEvent(formData).unwrap();
      toast.success(res.message || "Event created successfully and submitted for review");
      navigate("/organizer/events");
    } catch (err) {
      toast.error(err.data?.message || "Failed to create event");
    }
  };

  return (
    <div className="max-w-360 mx-auto px-6 py-10 w-full grow flex flex-col gap-6">
      <div>
        <h1 className="text-xl md:text-headline-md font-bold text-on-surface tracking-tight">Create New Event</h1>
        <p className="text-xs text-on-surface-variant mt-1">Submit your event details. Once reviewed by administrators, it will be published.</p>
      </div>

      <div className="bg-surface-container-low p-6 md:p-8 rounded-2xl border border-outline-variant/30 shadow-xl">
        <EventForm onSubmit={handleCreate} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default CreateEventPage;
