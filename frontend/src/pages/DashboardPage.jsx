import { motion } from 'motion/react';
import { LogOut, Fish, Activity, AlertTriangle, BarChart3 } from 'lucide-react';

const FEATURE_CARDS = [
  {
    icon: Fish,
    title: 'Chẩn đoán bệnh tôm',
    desc: 'Upload ảnh tôm để AI phân tích và đưa ra chẩn đoán chính xác',
    color: '#005d90',
  },
  {
    icon: Activity,
    title: 'Theo dõi ao nuôi',
    desc: 'Giám sát các chỉ số môi trường nước theo thời gian thực',
    color: '#2c694e',
  },
  {
    icon: AlertTriangle,
    title: 'Cảnh báo sớm',
    desc: 'Nhận thông báo khi phát hiện dấu hiệu bất thường trong ao',
    color: '#f97316',
  },
  {
    icon: BarChart3,
    title: 'Báo cáo & Thống kê',
    desc: 'Xem lịch sử chẩn đoán và hiệu suất nuôi trồng của trang trại',
    color: '#0077b6',
  },
];

export default function DashboardPage({ user, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f8f9fa]">
      {/* Header */}
      <header className="h-20 flex items-center px-6 md:px-12 bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <span className="text-2xl font-black text-[#005d90] tracking-wider uppercase">
            AquaDiag
          </span>
          <div className="flex items-center gap-3">
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-9 h-9 rounded-full border-2 border-[#005d90]/20"
              referrerPolicy="no-referrer"
            />
            <span className="text-[#191c1d] font-semibold hidden md:block">{user.name}</span>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <LogOut size={16} />
              Đăng xuất
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 md:px-12 py-10">
        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 bg-gradient-to-r from-[#005d90] to-[#0077b6] rounded-2xl p-8 text-white shadow-lg"
        >
          <p className="text-blue-200 text-sm font-medium mb-1">Xin chào trở lại,</p>
          <h1 className="text-3xl font-bold mb-2">{user.name} 👋</h1>
          <p className="text-blue-100 text-sm">
            Chào mừng bạn đến với AquaDiag — hệ thống chẩn đoán bệnh tôm thông minh.
          </p>
          <p className="text-blue-200 text-xs mt-1">{user.email}</p>
        </motion.div>

        {/* Feature Cards */}
        <h2 className="text-lg font-bold text-[#191c1d] mb-5">Tính năng hệ thống</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURE_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${card.color}18` }}
              >
                <card.icon size={24} style={{ color: card.color }} />
              </div>
              <h3 className="font-bold text-[#191c1d] mb-2">{card.title}</h3>
              <p className="text-sm text-[#707881] mb-4 leading-relaxed">{card.desc}</p>
              <span
                className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: `${card.color}18`, color: card.color }}
              >
                Sắp ra mắt
              </span>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 px-6 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto text-center text-sm text-[#707881]">
          © 2026 AquaDiag Solutions. Professional Diagnostic Systems for Aquaculture.
        </div>
      </footer>
    </div>
  );
}
