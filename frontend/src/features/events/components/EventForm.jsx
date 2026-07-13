import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const CATEGORIES = ["Music", "Art", "Workshop", "Seminar", "Conference", "Comedy"];

// Event Form schema (startDate & endDate verified on submit)
const eventFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(120, "Title should not exceed 120 text characters"),
  description: z.string().min(1, "Description is required").max(500, "Description should not exceed 500 text characters"),
  category: z.enum(["Music", "Art", "Workshop", "Seminar", "Conference", "Comedy"], {
    errorMap: () => ({ message: "Invalid category selection" }),
  }),
  venue: z.object({
    name: z.string().trim().min(1, "Venue name is required").max(100),
    address: z.string().trim().min(1, "Address is required").max(200),
    city: z.string().trim().min(1, "City is required"),
    state: z.string().trim().min(1, "State is required"),
    country: z.string().trim().min(1, "Country is required"),
  }),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  totalSeats: z.coerce.number().min(1, "Seats must be at least 1"),
  ticketPrice: z.coerce.number().min(0, "Price can't be negative"),
});

export const EventForm = ({ initialValues, onSubmit, isLoading }) => {
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(initialValues?.poster || "");

  // Format date values to fit datetime-local input fields (YYYY-MM-DDThh:mm)
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const formattedInitialValues = initialValues
    ? {
        ...initialValues,
        startDate: formatDateTime(initialValues.startDate),
        endDate: formatDateTime(initialValues.endDate),
      }
    : undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: formattedInitialValues,
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPosterFile(file);
      setPosterPreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = (data) => {
    // Validate date limits client side
    if (new Date(data.startDate) < new Date() && !initialValues) {
      alert("Start date must be after current date");
      return;
    }
    if (new Date(data.endDate) < new Date(data.startDate)) {
      alert("End date must be after start date");
      return;
    }

    if (!posterPreview) {
      alert("Please upload a poster image");
      return;
    }

    // Submit back to parent using FormData
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("category", data.category);
    formData.append("totalSeats", data.totalSeats);
    formData.append("ticketPrice", data.ticketPrice);
    formData.append("startDate", new Date(data.startDate).toISOString());
    formData.append("endDate", new Date(data.endDate).toISOString());
    formData.append("venue", JSON.stringify(data.venue));

    if (posterFile) {
      formData.append("poster", posterFile);
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form: Fields */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface-variant">Event Title</label>
            <input
              type="text"
              {...register("title")}
              className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="e.g. Neon Nights Summer Fest"
            />
            {errors.title && <p className="text-[10px] text-error font-medium">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface-variant">Event Description</label>
            <textarea
              rows={4}
              {...register("description")}
              className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
              placeholder="Provide a summary detailing speakers, schedules, themes, etc."
            />
            {errors.description && <p className="text-[10px] text-error font-medium">{errors.description.message}</p>}
          </div>

          {/* Category & Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant">Category</label>
              <select
                {...register("category")}
                className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none cursor-pointer"
              >
                <option value="">Select Category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && <p className="text-[10px] text-error font-medium">{errors.category.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant">Total Seats</label>
              <input
                type="number"
                {...register("totalSeats")}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none"
                placeholder="100"
              />
              {errors.totalSeats && <p className="text-[10px] text-error font-medium">{errors.totalSeats.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant">Ticket Price (₹)</label>
              <input
                type="number"
                {...register("ticketPrice")}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none"
                placeholder="0 for Free Entry"
              />
              {errors.ticketPrice && <p className="text-[10px] text-error font-medium">{errors.ticketPrice.message}</p>}
            </div>
          </div>

          {/* Date pickers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant">Start Date & Time</label>
              <input
                type="datetime-local"
                {...register("startDate")}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none"
              />
              {errors.startDate && <p className="text-[10px] text-error font-medium">{errors.startDate.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant">End Date & Time</label>
              <input
                type="datetime-local"
                {...register("endDate")}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none"
              />
              {errors.endDate && <p className="text-[10px] text-error font-medium">{errors.endDate.message}</p>}
            </div>
          </div>

          {/* Venue Location details */}
          <div className="border-t border-outline-variant/15 pt-6 space-y-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Venue Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant">Venue Name</label>
                <input
                  type="text"
                  {...register("venue.name")}
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  placeholder="e.g. Silicon Convention Center"
                />
                {errors.venue?.name && <p className="text-[10px] text-error font-medium">{errors.venue.name.message}</p>}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant">Address Line</label>
                <input
                  type="text"
                  {...register("venue.address")}
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  placeholder="e.g. 45th tech corridor highway"
                />
                {errors.venue?.address && <p className="text-[10px] text-error font-medium">{errors.venue.address.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant">City</label>
                <input
                  type="text"
                  {...register("venue.city")}
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  placeholder="e.g. Bengaluru"
                />
                {errors.venue?.city && <p className="text-[10px] text-error font-medium">{errors.venue.city.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant">State</label>
                <input
                  type="text"
                  {...register("venue.state")}
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  placeholder="e.g. Karnataka"
                />
                {errors.venue?.state && <p className="text-[10px] text-error font-medium">{errors.venue.state.message}</p>}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant">Country</label>
                <input
                  type="text"
                  {...register("venue.country")}
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  placeholder="e.g. India"
                />
                {errors.venue?.country && <p className="text-[10px] text-error font-medium">{errors.venue.country.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Right Form: Image Poster Upload */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-on-surface-variant">Event Poster Image</label>
            <div className="w-full border border-dashed border-outline-variant/40 rounded-xl bg-surface-container p-4 flex flex-col items-center justify-center text-center space-y-4 min-h-75 relative overflow-hidden">
              {posterPreview ? (
                <>
                  <img alt="preview" className="absolute inset-0 w-full h-full object-cover opacity-80" src={posterPreview} />
                  <div className="absolute inset-0 bg-black/40 hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer">
                    <span className="text-white text-xs font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">upload</span>
                      Change Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Upload Banner Poster</p>
                    <p className="text-[10px] text-outline mt-1 leading-snug">Drag and drop or click to browse image</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center mt-6"
          >
            {isLoading ? "Saving Details..." : initialValues ? "Update Event" : "Create & Submit Event"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default EventForm;
