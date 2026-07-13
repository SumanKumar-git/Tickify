import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  useGetOrganizersForAdminQuery,
  useToggleOrganizerVerificationMutation,
  useDeleteOrganizerMutation,
} from "../../auth/api/authApi";

export const AdminOrganizersPage = () => {
  const { data, isLoading, error } = useGetOrganizersForAdminQuery();
  const organizers = data?.organizers || [];

  const [toggleVerify, { isLoading: isToggling }] = useToggleOrganizerVerificationMutation();
  const [deleteOrganizer, { isLoading: isDeleting }] = useDeleteOrganizerMutation();

  const [searchQuery, setSearchQuery] = useState("");

  const handleToggleVerify = async (id, name) => {
    try {
      const res = await toggleVerify(id).unwrap();
      toast.success(res.message || `Verification status updated for ${name}`);
    } catch (err) {
      toast.error(err.data?.message || "Failed to update verification status");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete organizer "${name}"? This will delete the organizer and all their events.`)) {
      return;
    }

    try {
      const res = await deleteOrganizer(id).unwrap();
      toast.success(res.message || `Organizer "${name}" deleted successfully`);
    } catch (err) {
      toast.error(err.data?.message || "Failed to delete organizer");
    }
  };

  const filteredOrganizers = organizers.filter((org) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      org.fullName.toLowerCase().includes(term) ||
      org.email.toLowerCase().includes(term)
    );
  });

  if (isLoading) {
    return (
      <div className="max-w-360 mx-auto px-6 py-10 w-full grow animate-pulse space-y-6">
        <div className="h-6 bg-surface-container w-1/4 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 bg-surface-container rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface-container border border-outline-variant/30 rounded-xl text-center shadow-xl">
        <span className="material-symbols-outlined text-4xl text-error mb-2">error</span>
        <h2 className="text-md font-bold text-on-surface">Failed to load organizers</h2>
        <p className="text-xs text-on-surface-variant mt-2">Could not retrieve organizer list.</p>
      </div>
    );
  }

  return (
    <div className="max-w-360 mx-auto px-6 py-10 w-full grow flex flex-col gap-6">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-headline-md font-bold text-on-surface tracking-tight">Manage Organizers</h1>
          <p className="text-xs text-on-surface-variant mt-1">Audit organizer profiles, toggle email verification, and manage accounts.</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-high text-on-surface text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
            placeholder="Search by name or email..."
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none flex items-center">
            search
          </span>
        </div>
      </div>

      {filteredOrganizers.length === 0 ? (
        <div className="py-20 bg-surface-container/20 border border-outline-variant/25 rounded-2xl text-center">
          <span className="material-symbols-outlined text-5xl text-outline opacity-40 mb-3">group</span>
          <p className="text-sm font-bold text-on-surface">No organizers found</p>
          <p className="text-xs text-on-surface-variant mt-1">
            {searchQuery ? "Try refining your search query." : "No organizers are registered on the platform."}
          </p>
        </div>
      ) : (
        /* Organizers Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizers.map((org) => {
            const dateJoined = new Date(org.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            return (
              <div
                key={org._id}
                className="bg-surface-container p-6 rounded-2xl border border-outline-variant/30 flex flex-col justify-between hover:border-primary/40 hover:shadow-lg transition-all duration-300 relative group"
              >
                <div>
                  {/* Top line with Avatar and Event Count */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-outline-variant/30 bg-surface-container-high flex items-center justify-center">
                      {org.profilePhoto ? (
                        <img alt={org.fullName} className="w-full h-full object-cover" src={org.profilePhoto} />
                      ) : (
                        <span className="material-symbols-outlined text-3xl text-outline">account_circle</span>
                      )}
                    </div>

                    <span className="bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {org.eventCount} {org.eventCount === 1 ? "Event" : "Events"}
                    </span>
                  </div>

                  {/* Profile Info */}
                  <div className="mt-4 space-y-1">
                    <h3 className="text-sm font-black text-on-surface leading-tight truncate" title={org.fullName}>
                      {org.fullName}
                    </h3>
                    <p className="text-xs text-on-surface-variant font-mono truncate" title={org.email}>
                      {org.email}
                    </p>
                    <p className="text-[10px] text-outline flex items-center gap-1 mt-2">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      Joined {dateJoined}
                    </p>
                  </div>
                </div>

                {/* Footer buttons on Card */}
                <div className="border-t border-outline-variant/10 pt-4 mt-6 flex items-center justify-between gap-4">
                  {/* Verification Toggle */}
                  <button
                    onClick={() => handleToggleVerify(org._id, org.fullName)}
                    disabled={isToggling}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      org.isEmailVerified
                        ? "bg-secondary-container/20 text-secondary border-secondary-container/30 hover:bg-secondary-container/35"
                        : "bg-surface-container-high text-on-surface border-outline-variant/40 hover:bg-surface-container-highest"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {org.isEmailVerified ? "verified" : "pending"}
                    </span>
                    {org.isEmailVerified ? "Verified" : "Unverified"}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(org._id, org.fullName)}
                    disabled={isDeleting}
                    className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-error hover:bg-error/10 transition-colors cursor-pointer"
                    title="Delete Organizer"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrganizersPage;
