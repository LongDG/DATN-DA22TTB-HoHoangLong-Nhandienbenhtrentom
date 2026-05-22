import { Dna as Biotech, ShieldCheck, Pill, Microscope, Truck, HeartPulse } from 'lucide-react';

/**
 * Layout dùng chung cho tất cả trang Auth (Login, Register, ForgotPassword, OTP)
 * Split-screen: left branding panel + right form panel (with decorative bg)
 */
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] relative flex-col overflow-hidden shrink-0">
        {/* Background Image */}
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDohbiZnibv7EXWO0xaU4EQsHl_ztHP8p1NUTmKT60Vo2rK60_wyQWnb8v2PEDr08Gcp5jFu02tRINNYM5fgYquE1IO70Qum8CSLFpeJMAJOaS28tMNx818In86E9qVPTi9qi-mfc-CYUk7osWjpgEIcA1yEOf3rGuBiShhCicmXbQKugQA3rVI8E3-3la9VsPzL6_i3IBNxCdSytnRjOoM6X9DU89GkLb1H22Y4fOYQs2RSsYRakRn_M5HGxSP7MyRccj1M5nILg"
          alt="Shrimp pond"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-primary/60 to-slate-900/90" />

        {/* Content on top of image */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-12 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
              <Biotech className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-wide">AquaDiag</span>
          </div>

          {/* Center tagline */}
          <div className="flex-1 flex flex-col justify-center space-y-5 py-8">
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight">
              Bảo vệ ao tôm
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-cyan-200">
                bằng trí tuệ nhân tạo
              </span>
            </h2>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm">
              Hệ thống chẩn đoán bệnh tôm sú bằng AI với độ chính xác lên đến 98%, 
              giúp người nuôi phát hiện sớm và xử lý kịp thời.
            </p>

            {/* Stats badges */}
            <div className="flex gap-3 pt-1">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-2.5">
                <p className="text-xl font-bold text-white">98%</p>
                <p className="text-[10px] text-white/60 font-medium">Độ chính xác</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-2.5">
                <p className="text-xl font-bold text-white">50K+</p>
                <p className="text-[10px] text-white/60 font-medium">Người dùng</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-2.5">
                <p className="text-xl font-bold text-white">24/7</p>
                <p className="text-[10px] text-white/60 font-medium">Hỗ trợ</p>
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-white/15 my-1" />

            {/* ── Medicine store promo ── */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-amber-400/20 rounded-lg flex items-center justify-center">
                  <Pill className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">Cửa hàng thuốc thủy sản</h4>
                  <p className="text-white/50 text-[11px]">Thuốc đặc trị & dinh dưỡng cho tôm</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-white/70 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Thuốc chính hãng</span>
                </div>
                <div className="flex items-center gap-2 text-white/70 text-xs">
                  <Microscope className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Tư vấn chuyên gia</span>
                </div>
                <div className="flex items-center gap-2 text-white/70 text-xs">
                  <Truck className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span>Giao hàng nhanh</span>
                </div>
                <div className="flex items-center gap-2 text-white/70 text-xs">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Đặc trị bệnh tôm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom copyright */}
          <p className="text-white/40 text-xs">
            © 2026 AquaDiag Solutions · Hệ thống chẩn đoán thủy sản chuyên nghiệp
          </p>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        {/* ── Decorative background elements ── */}
        {/* Large gradient blob top-right */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-primary/[0.07] via-sky-200/[0.1] to-transparent rounded-full blur-3xl pointer-events-none" />
        {/* Small accent blob bottom-left */}
        <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] bg-gradient-to-tr from-amber-200/[0.08] via-orange-100/[0.06] to-transparent rounded-full blur-3xl pointer-events-none" />
        {/* Subtle dot pattern overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #005d90 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Decorative thin line accents */}
        <div className="absolute top-0 right-0 w-[1px] h-48 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-20 w-[1px] h-32 bg-gradient-to-b from-sky-300/10 to-transparent pointer-events-none" />

        {/* Mobile header (only on small screens) */}
        <header className="lg:hidden relative z-10 flex items-center gap-3 px-6 py-5 bg-white/80 backdrop-blur-sm border-b border-slate-100">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
            <Biotech className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-bold text-slate-900">AquaDiag</span>
        </header>

        {/* Form area */}
        <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-10 lg:py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="relative z-10 py-4 px-6 text-center border-t border-slate-200/60">
          <p className="text-xs text-slate-400">
            © 2026 AquaDiag Solutions · 
            <a href="#" className="hover:text-slate-600 transition-colors ml-1">Chính sách bảo mật</a> · 
            <a href="#" className="hover:text-slate-600 transition-colors ml-1">Hỗ trợ</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
