export const StatsCard = ({
  title,
  value,
  icon,
  iconColor = "text-primary",
  valueColor = "text-on-surface",
  iconClass = "",
  className = "",
  children,
  extraHeader
}) => {
  return (
    <div className={`bg-surface-container p-6 rounded-xl border border-outline-variant/30 flex flex-col justify-between ${className}`}>
      <div className="flex justify-between items-start">
        <span className="text-outline text-[10px] uppercase font-bold tracking-widest">{title}</span>
        {extraHeader}
        {icon && (
          <span className={`material-symbols-outlined text-md ${iconColor} ${iconClass}`}>
            {icon}
          </span>
        )}
      </div>
      {children ? children : (
        <p className={`text-2xl font-black leading-none ${valueColor}`}>{value}</p>
      )}
    </div>
  );
};
