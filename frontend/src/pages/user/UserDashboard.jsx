import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Camera, Upload, ShieldCheck, Users, TrendingUp, TrendingDown,
  ArrowRight, ShoppingCart, CheckCircle2, X, AlertTriangle,
  AlertCircle, Info, Loader2, RefreshCw, ChevronRight,
  ImageIcon, Zap, Clock, History, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/* ── Constants ── */
const API_BASE       = 'http://localhost:5000/api';
const SEVERITY_CFG   = {
  none:     { label: 'Khỏe mạnh',     cls: 'bg-[#aeeecb]/20 text-[#2c694e] border-[#2c694e]/30' },
  medium:   { label: 'Cảnh báo',      cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  high:     { label: 'Nguy hiểm',     cls: 'bg-orange-50 text-[#904300] border-orange-200' },
  critical: { label: 'Rất nguy hiểm', cls: 'bg-red-50 text-[#ba1a1a] border-red-200' },
  unknown:  { label: 'Không rõ',      cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

/* ── Quality badge ── */
function QualityBadge({ score }) {
  const cfg = score >= 80 ? { label: 'Tốt',      cls: 'bg-green-100 text-green-700' }
            : score >= 55 ? { label: 'Trung bình', cls: 'bg-amber-100 text-amber-700' }
            :               { label: 'Kém',        cls: 'bg-red-100 text-red-700' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.cls}`}>
      <Zap className="w-3 h-3" /> Chất lượng ảnh: {cfg.label} ({score}/100)
    </span>
  );
}

/* ── Result Modal ── */
function ResultModal({ result, imagePreview, onClose, onNewScan }) {
  const disease   = result.result?.disease  || {};
  const conf      = result.result?.confidence || 0;
  const allProbs  = result.result?.all_probs || [];
  const sevCfg    = SEVERITY_CFG[disease.severity] || SEVERITY_CFG.unknown;
  const validation = result.validation || {};
  const benhInfo   = result.benh_info   || null;
  const products   = result.suggested_products || [];

  const LOAI_LABEL = {
    dac_tri:             '\u0110ặc trị',
    vi_sinh:             'Vi sinh',
    vi_sinh_moi_truong:  'Vi sinh MT',
    dinh_duong_de_khang: 'Dinh dưỡng',
  };
  const MUC_DICH_LABEL = {
    dieutri:  'Điều trị',
    phongbenh: 'Phòng bệnh',
    hotro:    'Hỗ trợ',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className={`px-6 py-5 rounded-t-3xl border-b flex justify-between items-start ${sevCfg.cls}`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Kết quả chẩn đoán AI</p>
            <h2 className="text-xl font-extrabold">{disease.name || 'Không xác định'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Ảnh + Confidence */}
          <div className="flex gap-4">
            {imagePreview && (
              <div className="w-32 h-32 rounded-2xl overflow-hidden border border-slate-200 shrink-0">
                <img src={imagePreview} alt="Ảnh chẩn đoán" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 space-y-3">
              {/* Độ tin cậy */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-semibold text-slate-600">Độ tin cậy</span>
                  <span className="text-2xl font-extrabold text-slate-800">{conf.toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${conf}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      disease.severity === 'none' ? 'bg-[#2c694e]'
                        : disease.severity === 'critical' ? 'bg-[#ba1a1a]'
                        : 'bg-amber-500'
                    }`}
                  />
                </div>
              </div>
              {/* Chất lượng ảnh */}
              {validation.details?.quality_score !== undefined && (
                <QualityBadge score={validation.details.quality_score} />
              )}
              {/* Severity tag */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${sevCfg.cls}`}>
                {disease.severity === 'none'
                  ? <CheckCircle2 className="w-4 h-4" />
                  : <AlertTriangle className="w-4 h-4" />}
                {sevCfg.label}
              </span>
            </div>
          </div>

          {/* Mô tả */}
          {disease.description && (
            <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed border border-slate-100">
              <p className="font-semibold text-slate-500 text-xs uppercase tracking-wider mb-1.5">Mô tả</p>
              {disease.description}
            </div>
          )}

          {/* Khuyến nghị */}
          {disease.recommendation && (
            <div className={`rounded-2xl p-4 border ${sevCfg.cls}`}>
              <p className="font-bold text-xs uppercase tracking-wider mb-2 opacity-60">Khuyến nghị xử lý</p>
              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {disease.recommendation}
              </pre>
            </div>
          )}

          {/* Triệu chứng (từ BENH) */}
          {benhInfo?.trieuchung?.length > 0 && (
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <p className="font-bold text-xs uppercase tracking-wider text-amber-700 mb-2">⚠️ Triệu chứng điển hình</p>
              <ul className="space-y-1">
                {benhInfo.trieuchung.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"/>{t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Thuốc gợi ý */}
          {products.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ShoppingCart className="w-3.5 h-3.5" /> Thuốc & sản phẩm gợi ý
              </p>
              <div className="space-y-3">
                {products.map(p => (
                  <div key={p.id} className="flex gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#0077b6]/30 transition-colors">
                    {/* Icon loại */}
                    <div className="w-10 h-10 rounded-xl bg-[#0077b6]/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-[#0077b6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-slate-800 leading-tight">{p.ten}</p>
                        <span className="text-sm font-extrabold text-[#0077b6] shrink-0">
                          {p.gia.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">{p.thuonghieu}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                          {LOAI_LABEL[p.loai] || p.loai}
                        </span>
                        {p.muc_dich.map(m => (
                          <span key={m} className="text-xs px-1.5 py-0.5 rounded bg-[#0077b6]/10 text-[#0077b6]">
                            {MUC_DICH_LABEL[m] || m}
                          </span>
                        ))}
                      </div>
                      {p.congdung?.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          {p.congdung.slice(0,2).join(' • ')}
                        </p>
                      )}
                      {p.lieudung?.xu_ly_benh && (
                        <p className="text-xs text-emerald-700 mt-1">
                          📈 Liều điều trị: {p.lieudung.xu_ly_benh}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/store"
                onClick={onClose}
                className="mt-3 w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-[#0077b6] bg-[#0077b6]/10 rounded-2xl hover:bg-[#0077b6]/20 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" /> Xem tất cả sản phẩm trong cửa hàng
              </Link>
            </div>
          )}

          {/* Phân phối xác suất */}
          {allProbs.length > 1 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Phân phối xác suất</p>
              <div className="space-y-2">
                {allProbs.map(p => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 w-44 truncate shrink-0">{p.name}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0077b6] rounded-full transition-all"
                        style={{ width: `${p.prob}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-12 text-right shrink-0">{p.prob}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onNewScan}
              className="flex-1 py-3 bg-[#0077b6] text-white font-bold rounded-2xl hover:bg-[#005d90] transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Chẩn đoán ảnh mới
            </button>
            <Link
              to="/consult-user"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <ChevronRight className="w-4 h-4" /> Tư vấn chuyên gia
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Diagnostic Upload ── */
function DiagnosticSection() {
  const [isDrag,      setIsDrag]      = useState(false);
  const [preview,     setPreview]     = useState(null);   // base64 preview
  const [file,        setFile]        = useState(null);
  const [status,      setStatus]      = useState('idle'); // idle|loading|success|error
  const [result,      setResult]      = useState(null);
  const [errorMsg,    setErrorMsg]    = useState('');
  const [validation,  setValidation]  = useState(null);  // AI validation info
  const [showResult,  setShowResult]  = useState(false);
  const fileInputRef = useRef(null);

  /* Đọc file → preview */
  const readFile = useCallback((f) => {
    if (!f) return;
    setFile(f);
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
    setValidation(null);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault(); setIsDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) readFile(f);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) readFile(f);
  };

  /* Gửi ảnh lên API */
  const handleSubmit = async () => {
    if (!file || status === 'loading') return;
    setStatus('loading');
    setErrorMsg('');
    setValidation(null);

    const token   = localStorage.getItem('token') || '';
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res  = await fetch(`${API_BASE}/diagnose`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });
      const data = await res.json();

      if (!res.ok) {
        /* 422: validation thất bại từ AI service */
        if (res.status === 422 && data.validation) {
          setValidation(data.validation);
          setStatus('error');
          setErrorMsg('Ảnh không đạt yêu cầu chất lượng. Xem chi tiết bên dưới.');
        } else {
          setStatus('error');
          setErrorMsg(data.message || 'Lỗi không xác định. Vui lòng thử lại.');
        }
        return;
      }

      setResult(data);
      setValidation(data.validation);
      setStatus('success');
      setShowResult(true);
    } catch {
      setStatus('error');
      setErrorMsg('Không kết nối được server. Vui lòng kiểm tra lại.');
    }
  };

  const handleReset = () => {
    setFile(null); setPreview(null); setStatus('idle');
    setResult(null); setErrorMsg(''); setValidation(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Render ── */
  return (
    <section className="py-24 px-6 bg-white">
      <AnimatePresence>
        {showResult && result && (
          <ResultModal
            result={result}
            imagePreview={preview}
            onClose={() => setShowResult(false)}
            onNewScan={() => { setShowResult(false); handleReset(); }}
          />
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0077b6]/10 text-[#0077b6] rounded-full text-xs font-bold uppercase tracking-wider">
            <Camera className="w-4 h-4" /> Chẩn đoán bằng AI
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900">Chẩn đoán thông minh</h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Tải ảnh tôm lên để AI phân tích và nhận diện bệnh chỉ trong vài giây.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-5">
          {/* ── Yêu cầu ảnh ── */}
          <div className="bg-[#f0f7ff] border border-[#0077b6]/20 rounded-2xl p-4">
            <p className="text-xs font-bold text-[#0077b6] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Info className="w-4 h-4" /> Yêu cầu ảnh đầu vào
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5 text-sm text-slate-600">
              {[
                '✅ Định dạng JPG hoặc PNG',
                '✅ Kích thước 50KB – 10MB',
                '✅ Độ phân giải ≥ 224×224px',
                '✅ Ảnh sắc nét, không mờ',
                '✅ Đủ ánh sáng, không quá tối/sáng',
                '✅ Ánh sáng đều, tránh đổ bóng',
              ].map(t => <p key={t}>{t}</p>)}
            </div>
          </div>

          {/* ── Drop zone ── */}
          {!preview ? (
            <div
              onDragOver={e => { e.preventDefault(); setIsDrag(true); }}
              onDragLeave={() => setIsDrag(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative p-14 border-2 border-dashed rounded-3xl transition-all cursor-pointer flex flex-col items-center gap-5
                ${isDrag
                  ? 'border-[#0077b6] bg-[#0077b6]/5 scale-[1.01]'
                  : 'border-slate-200 bg-slate-50 hover:border-[#0077b6]/50 hover:bg-slate-100'}`}
            >
              <input
                type="file" ref={fileInputRef} className="hidden"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileChange}
              />
              <div className="w-20 h-20 bg-[#0077b6]/10 rounded-3xl flex items-center justify-center text-[#0077b6]">
                <ImageIcon className="w-10 h-10" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-xl font-bold text-slate-800">Kéo thả hoặc nhấn để chọn ảnh</h3>
                <p className="text-slate-400 text-sm">Hỗ trợ JPG, PNG — Tối đa 10MB</p>
              </div>
              <button className="px-8 h-12 bg-[#0077b6] text-white font-bold rounded-2xl shadow-lg shadow-[#0077b6]/20 hover:bg-[#005d90] transition-colors text-sm">
                Chọn tệp ảnh
              </button>
            </div>
          ) : (
            /* ── Preview + actions ── */
            <div className="rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <div className="relative h-64 bg-slate-100">
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                <button
                  onClick={handleReset}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                {/* Quality overlay khi có kết quả validation */}
                {validation?.details?.quality_score !== undefined && (
                  <div className="absolute bottom-3 left-3">
                    <QualityBadge score={validation.details.quality_score} />
                  </div>
                )}
              </div>

              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-500 truncate">
                  <span className="font-semibold text-slate-700">{file?.name}</span>
                  {' · '}{file ? (file.size / 1024 < 1000
                    ? `${(file.size / 1024).toFixed(0)} KB`
                    : `${(file.size / 1024 / 1024).toFixed(1)} MB`) : ''}
                </p>

                {/* Warnings từ validation */}
                {validation?.warnings?.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                    {validation.warnings.map((w, i) => (
                      <p key={i} className="text-sm text-amber-700 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {w}
                      </p>
                    ))}
                  </div>
                )}

                {/* Errors */}
                {status === 'error' && errorMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
                    <p className="text-sm text-[#ba1a1a] font-semibold flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {errorMsg}
                    </p>
                    {validation?.errors?.map((e, i) => (
                      <p key={i} className="text-sm text-[#ba1a1a] pl-6">{e}</p>
                    ))}
                    {validation?.tips?.length > 0 && (
                      <div className="pt-1 pl-6 space-y-0.5">
                        <p className="text-xs font-bold text-[#ba1a1a] uppercase">Gợi ý:</p>
                        {validation.tips.map((t, i) => (
                          <p key={i} className="text-xs text-[#ba1a1a]">• {t}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Submit / Success */}
                {status === 'success' ? (
                  <button
                    onClick={() => setShowResult(true)}
                    className="w-full py-3.5 bg-[#2c694e] text-white font-bold rounded-2xl hover:bg-[#1e4f38] transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Xem kết quả chẩn đoán
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={status === 'loading'}
                    className="w-full py-3.5 bg-[#0077b6] text-white font-bold rounded-2xl hover:bg-[#005d90] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#0077b6]/20"
                  >
                    {status === 'loading' ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Đang phân tích AI...</>
                    ) : (
                      <><Camera className="w-5 h-5" /> Phân tích ngay</>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


function Hero() {
  return (
    <section className="relative min-h-[700px] flex items-center overflow-hidden bg-slate-900 border-b border-white/5">
      <div className="absolute inset-0 z-0">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJK6DQ0ULDCE9RIQ3-KszpZtksQaGglLAvBHT_3LvZ1X7OlU7PGium2S0F-M3rnJdoZhSYhs1iF8cjqx6Biz8qVqXHSiMTW5xDQ69epT8D9eQbO7wk_3Dgrv8ArndCpTkIvzUdMDK5CoQX3NMS9DWTfi5DYxvVh3dSrZGsVt795V4Kt50M97GEs88uG9TuS9etN-RQ86TveIRPlACcIfBXCKI8hze-VtV0gP7CFTpJLyZO-rhIoBTOLI0MvbWBIoSihHJBy1qCYA"
          alt="Shrimp pond"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/60 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-20">
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#2c694e]/20 text-[#aeeecb] border border-[#2c694e]/30 rounded-full text-xs font-bold tracking-wider">
            <CheckCircle2 className="w-4 h-4" /> KIỂM ĐỊNH BẰNG AI
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.1]">
            Giải Pháp AI <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0077b6] to-blue-400">
              Chẩn Đoán Bệnh Tôm
            </span> Tức Thì
          </h1>
          <p className="text-lg text-slate-300 max-w-lg leading-relaxed">
            Công nghệ phân tích hình ảnh tiên tiến giúp người nuôi tôm chẩn đoán bệnh chính xác đến 98% chỉ trong vài giây.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="h-14 px-8 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl shadow-xl shadow-amber-600/20 flex items-center gap-3 transition-all hover:scale-105">
              <Camera className="w-5 h-5" /> QUÉT BỆNH NGAY
            </button>
            <button className="h-14 px-8 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-2xl backdrop-blur-md transition-all">
              Tìm hiểu thêm
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2 }} className="hidden lg:flex justify-end">
          <div className="relative w-72 h-[520px] bg-slate-800 rounded-[48px] border-4 border-slate-700 overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20" />
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAeo6wqblkqghpzUlRwt0V5yKkK3Iy1r7tdggkcLyNfEG9ipBO50j8AtMFn5_YqKjHZJnp3MOA1lR9obw1vwruPfWkk9t1XDWREag06qE_p03iw4vCfyn4UOgrXfP8qo_k-z7f5gNEMZG6-owd2Y3_V2Ln4__w_fEalQdp_8jo7lhfVKPzKTIvCJp98g6wgheGmtF5Cc0NmieMKHNegkOE5_EAfA2vAu4TRBKv9a7ebvnBzfrBHP2YfX3vmFkZ6QPS9h1bpC2knQ"
              alt="AI Scanning"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 space-y-4">
              <div className="w-48 h-48 border-2 border-[#0077b6]/50 relative overflow-hidden rounded-3xl">
                <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} className="absolute left-0 w-full h-[2px] bg-[#0077b6] shadow-[0_0_15px_#0077b6]" />
                {[['top-0 left-0 border-t-4 border-l-4'], ['top-0 right-0 border-t-4 border-r-4'], ['bottom-0 left-0 border-b-4 border-l-4'], ['bottom-0 right-0 border-b-4 border-r-4']].map((c, i) => (
                  <div key={i} className={`absolute w-6 h-6 border-[#0077b6] ${c[0]}`} />
                ))}
              </div>
              <div className="text-white text-xs font-bold tracking-[0.2em] bg-black/60 px-4 py-1.5 rounded-full uppercase">
                Đang phân tích...
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


/* ── Nhật ký chẩn đoán (5 cái gần nhất) ── */
const SEVERITY_COLORS = {
  none:        { bg: 'bg-emerald-100', text: 'text-emerald-700',  dot: 'bg-emerald-500' },
  medium:      { bg: 'bg-amber-100',   text: 'text-amber-700',    dot: 'bg-amber-500'   },
  high:        { bg: 'bg-orange-100',  text: 'text-orange-700',   dot: 'bg-orange-500'  },
  critical:    { bg: 'bg-red-100',     text: 'text-red-700',      dot: 'bg-red-500'     },
  'Bình thường': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Cảnh báo':   { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
  'Nguy hiểm':  { bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-500'  },
  'Rất nguy hiểm': { bg: 'bg-red-100',  text: 'text-red-700',     dot: 'bg-red-500'     },
};

function DiagnosisHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const LIMIT = 6;

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res   = await fetch(
        `${API_BASE}/diagnose/history?limit=${LIMIT}&page=${p}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data  = await res.json();
      if (res.ok) {
        setHistory(data.history || []);
        setTotal(data.total || 0);
        setPage(p);
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHistory(1); }, []);

  const MA_BENH_COLOR = {
    khoe_manh:  'bg-emerald-100 text-emerald-700',
    dom_trang:  'bg-red-100 text-red-700',
    mang_den:   'bg-slate-200 text-slate-700',
    dau_vang:   'bg-yellow-100 text-yellow-700',
    gan_tuy:    'bg-orange-100 text-orange-700',
    ruot_trang: 'bg-blue-100 text-blue-700',
  };

  if (!loading && history.length === 0) return null; // ẩn nếu chưa có lịch sử

  return (
    <section className="py-16 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <History className="w-4 h-4" /> Nhật ký chẩn đoán
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Lịch sử chẩn đoán của bạn</h2>
          </div>
          <button
            onClick={() => fetchHistory(1)}
            className="flex items-center gap-2 text-sm font-bold text-[#0077b6] hover:underline"
          >
            <RefreshCw className="w-4 h-4" /> Làm mới
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-200 animate-pulse">
                <div className="h-32 bg-slate-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-slate-200 rounded-full w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {history.map(item => {
              const sc = SEVERITY_COLORS[item.muc_do] || SEVERITY_COLORS.medium;
              const cc = MA_BENH_COLOR[item.ma_benh]  || 'bg-slate-100 text-slate-600';
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                >
                  {/* Ảnh */}
                  <div className="h-32 bg-slate-100 relative overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.ten_benh}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                    {/* Overlay confidence */}
                    <div className="absolute bottom-2 right-2">
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                        {item.do_chinh_xac.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-2 mb-2">
                      {item.ten_benh}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dot}`} />
                      <span className="text-[10px] text-slate-400 truncate">{item.muc_do}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      {item.gio} {item.ngay}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > LIMIT && !loading && (
          <div className="flex justify-center mt-8 gap-3">
            {page > 1 && (
              <button
                onClick={() => fetchHistory(page - 1)}
                className="px-4 py-2 text-sm font-bold border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              >
                ‹ Trước
              </button>
            )}
            <span className="px-4 py-2 text-sm text-slate-500">
              Trang {page} / {Math.ceil(total / LIMIT)}
            </span>
            {page * LIMIT < total && (
              <button
                onClick={() => fetchHistory(page + 1)}
                className="px-4 py-2 text-sm font-bold border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Sau ›
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Market Stats — fetch từ /api/shrimp-prices ── */
function MarketStats() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/shrimp-prices')
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const fmtVND = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
  const fmtTime = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    const diff = Math.round((Date.now() - d) / 60000);
    if (diff < 1)   return 'Vừa cập nhật';
    if (diff < 60)  return `${diff} phút trước`;
    if (diff < 1440) return `${Math.round(diff / 60)} giờ trước`;
    return d.toLocaleDateString('vi-VN');
  };

  const gia   = data?.gia   || [];
  const vung  = data?.vung  || 'ĐBSCL';
  const capNhat = fmtTime(data?.capnhat_luc);

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-bold">Giá tôm thị trường</h3>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                {capNhat ? `Cập nhật: ${capNhat} • ${vung}` : `Khu vực: ${vung}`}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold animate-pulse">
              <div className="w-1.5 h-1.5 bg-green-600 rounded-full" /> TRỰC TIẾP
            </div>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                {['Cỡ tôm', 'Tôm Sú', 'Tôm Thẻ', 'Xu hướng'].map(h => (
                  <th key={h} className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading
                ? /* Skeleton rows */
                  [1, 2, 3].map(i => (
                    <tr key={i} className="animate-pulse">
                      {[1, 2, 3, 4].map(j => (
                        <td key={j} className="py-5">
                          <div className="h-4 bg-slate-100 rounded-full w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : gia.length === 0
                ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 text-sm">
                        Chưa có dữ liệu giá. Admin vui lòng cập nhật.
                      </td>
                    </tr>
                  )
                : gia.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-5 font-bold text-slate-700">{row.co}</td>
                      <td className="py-5 text-[#0077b6] font-bold">{fmtVND(row.tom_su)}</td>
                      <td className="py-5 text-[#0077b6] font-bold">{fmtVND(row.tom_the)}</td>
                      <td className="py-5">
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          row.xu_huong > 0 ? 'text-green-600' : row.xu_huong < 0 ? 'text-red-500' : 'text-slate-400'
                        }`}>
                          {row.xu_huong > 0
                            ? <TrendingUp className="w-4 h-4" />
                            : row.xu_huong < 0
                            ? <TrendingDown className="w-4 h-4" />
                            : <span className="w-4 h-4 inline-block text-center">—</span>
                          }
                          {row.xu_huong !== 0 && (
                            <span>{row.xu_huong > 0 ? '+' : '-'}{Number(row.thay_doi || 0).toLocaleString('vi-VN')}</span>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="bg-[#2c694e] p-8 rounded-3xl h-1/2 flex flex-col justify-center text-white relative overflow-hidden group">
            <ShieldCheck className="w-12 h-12 mb-4 text-white/50 group-hover:scale-110 transition-transform" />
            <h4 className="text-xl font-bold mb-2">An Toàn & Bảo Mật</h4>
            <p className="text-white/70 text-sm leading-relaxed">Dữ liệu trang trại và lịch sử thăm khám của bạn được mã hóa hoàn toàn trên hệ thống đám mây.</p>
          </div>
          <div className="bg-[#0077b6] p-8 rounded-3xl h-1/2 flex flex-col justify-center text-white relative overflow-hidden group">
            <Users className="w-12 h-12 mb-4 text-white/50 group-hover:scale-110 transition-transform" />
            <h4 className="text-xl font-bold mb-2">Cộng Đồng 50,000+</h4>
            <p className="text-white/70 text-sm leading-relaxed">Mạng lưới người nuôi tôm thông minh tại Việt Nam, cùng chia sẻ giải pháp và kinh nghiệm hiệu quả.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Product Preview (fetch từ API /products/featured) ── */
function ProductPreview() {
  const { addToCart } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/products/featured')
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setFetching(false));
  }, []);

  // Skeleton placeholder trong khi lộad
  const skeletons = Array.from({ length: 4 });

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
        <div className="space-y-3">
          <h2 className="text-4xl font-bold text-slate-900">Cửa hàng thuốc thủy sản</h2>
          <p className="text-slate-500 text-lg">Sản phẩm đặc trị &amp; dinh dưỡng chất lượng cao được chuyên gia khuyên dùng.</p>
        </div>
        <Link to="/store" className="flex items-center gap-2 text-[#0077b6] font-bold hover:translate-x-2 transition-transform shrink-0">
          Xem tất cả sản phẩm <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {fetching
          /* Skeleton cards */
          ? skeletons.map((_, i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm animate-pulse">
                <div className="h-56 bg-slate-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded-full w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-full w-full" />
                  <div className="h-3 bg-slate-100 rounded-full w-2/3" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-6 bg-slate-200 rounded-full w-24" />
                    <div className="w-10 h-10 bg-slate-100 rounded-2xl" />
                  </div>
                </div>
              </div>
            ))
          /* Real product cards */
          : products.length === 0
          ? (
              <div className="col-span-4 text-center py-16 text-slate-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Chưa có sản phẩm nổi bật. Hãy thêm sản phẩm trong kho hàng.</p>
              </div>
            )
          : products.map(p => (
              <motion.div key={p.id} whileHover={{ y: -8 }} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                {/* ảnh */}
                <div className="h-56 relative bg-slate-50 p-6 overflow-hidden">
                  {p.image
                    ? <img src={p.image} alt={p.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center text-slate-300"><ShoppingCart className="w-16 h-16" /></div>
                  }
                  <div className="absolute top-4 left-4">
                    <span className={`${p.tagColor || 'bg-[#0077b6]'} text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest`}>
                      {p.categoryLabel || p.category}
                    </span>
                  </div>
                  {/* Badge bán chạy */}
                  {p.sold > 0 && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Đã bán {p.sold.toLocaleString('vi-VN')}
                      </span>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-5 space-y-3">
                  <div className="h-20">
                    <h4 className="text-base font-bold text-slate-800 mb-1 line-clamp-1">{p.name}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{p.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xl font-bold text-[#0077b6]">{p.priceLabel}</p>
                    <button
                      onClick={() => addToCart({
                        id:         p.id,
                        name:       p.name,
                        price:      p.price,
                        priceLabel: p.priceLabel,
                        image:      p.image,
                        unit:       p.unit || 'gói',
                        qty:        1,
                      })}
                      className="w-10 h-10 bg-slate-100 hover:bg-[#0077b6] hover:text-white rounded-2xl flex items-center justify-center transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
        }
      </div>
    </section>
  );
}

/* ── Main Page ── */
export default function UserDashboard() {
  return (
    <div>
      <Hero />
      <DiagnosticSection />
      <DiagnosisHistory />
      <MarketStats />
      <ProductPreview />
    </div>
  );
}
