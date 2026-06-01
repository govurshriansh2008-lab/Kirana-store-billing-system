export default function MetricCard({ title, value, icon: Icon, color = "text-primary", bgColor = "bg-primary/10" }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-5 hover:border-primary/30 transition-all duration-300 w-full">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col justify-between min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">{title}</p>
          <p className={`text-xl md:text-2xl font-bold mt-2 break-words ${color}`}>{value}</p>
        </div>
        {Icon && (
          <div className={`shrink-0 w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        )}
      </div>
    </div>
  );
}