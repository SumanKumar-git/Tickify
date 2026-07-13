import { useGetAdminsForContactQuery } from "../../auth/api/authApi";

export const ContactPage = () => {
  const { data, isLoading, error } = useGetAdminsForContactQuery();
  const admins = data?.admins || [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 w-full grow flex flex-col gap-10">
      {/* Header Title Section */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
          Platform Administration
        </span>
        <h1 className="text-2xl md:text-headline-lg font-black text-on-surface tracking-tight leading-none">
          Contact Support Admins
        </h1>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Have queries about venue listings, event approvals, or refund status? Connect directly with our platform administrators.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse mt-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-44 bg-surface-container rounded-3xl"></div>
          ))}
        </div>
      ) : error || admins.length === 0 ? (
        <div className="max-w-md mx-auto py-16 px-6 bg-surface-container border border-outline-variant/30 rounded-3xl text-center space-y-4 shadow-xl mt-4">
          <span className="material-symbols-outlined text-5xl text-outline opacity-40">support_agent</span>
          <h2 className="text-md font-bold text-on-surface">No administrators listed</h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Please use our general support channel:
          </p>
          <a href="mailto:support@tickify.com" className="inline-block bg-primary text-on-primary text-xs font-bold px-6 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md">
            support@tickify.com
          </a>
        </div>
      ) : (
        <div className="flex flex-wrap gap-6 justify-center mt-4 w-full">
          {admins.map((adm) => (
            <div
              key={adm._id}
              className="bg-surface-container p-6 rounded-3xl border border-outline-variant/30 flex flex-col items-center justify-between hover:border-primary/40 hover:shadow-xl transition-all duration-300 text-center relative group w-full max-w-[320px]"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container-high flex items-center justify-center">
                  {adm.profilePhoto ? (
                    <img alt={adm.fullName} className="w-full h-full object-cover" src={adm.profilePhoto} />
                  ) : (
                    <span className="material-symbols-outlined text-3xl text-outline">account_circle</span>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-black text-on-surface leading-tight">
                    {adm.fullName}
                  </h3>
                  <p className="text-xs text-on-surface-variant font-mono mt-1">
                    {adm.email}
                  </p>
                  <span className="inline-block mt-2 bg-primary/10 border border-primary/20 text-primary text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Support Admin
                  </span>
                </div>
              </div>

              <div className="border-t border-outline-variant/10 pt-4 mt-6 w-full flex justify-center">
                <a
                  href={`mailto:${adm.email}`}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-surface-container-high hover:bg-primary hover:text-on-primary border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface transition-all cursor-pointer w-full"
                >
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  <span>Email Admin</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAQ block */}
      <div className="max-w-xl mx-auto w-full p-6 bg-primary/5 border border-primary/20 rounded-3xl space-y-3 mt-4 text-center">
        <div className="flex items-center justify-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
          <span className="material-symbols-outlined text-[16px]">info</span>
          <span>Need Quick Answers?</span>
        </div>
        <p className="text-[11px] text-on-surface-variant leading-relaxed">
          If your request relates to an active event listing, please mention the **Event ID** or **Order Number** in your email so our administrators can verify the details immediately.
        </p>
      </div>
    </div>
  );
};

export default ContactPage;
