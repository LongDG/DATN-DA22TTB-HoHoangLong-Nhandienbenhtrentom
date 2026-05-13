/**
 * StatCard - Reusable KPI statistic card
 * Props:
 *   icon     - Lucide icon component
 *   label    - Nhãn (string)
 *   value    - Giá trị hiển thị (string | number)
 *   badge    - Badge text (string)
 *   iconBg   - Tailwind bg color class (string)
 *   iconColor- Tailwind text color class (string)
 */
export default function StatCard({ icon: Icon, label, value, badge, iconBg, iconColor }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#e1e3e4]">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {badge && (
          <span className="flex items-center gap-1 text-[#2c694e] text-xs font-semibold">
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold text-[#707881] uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-3xl font-semibold text-[#191c1d]">{value}</h3>
    </div>
  );
}
