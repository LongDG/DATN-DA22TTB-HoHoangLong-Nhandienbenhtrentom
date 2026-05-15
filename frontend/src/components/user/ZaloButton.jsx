export function ZaloButton() {
  return (
    <div className="fixed bottom-8 right-8 z-[100] group">
      <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white px-3 py-1.5 rounded-lg shadow-lg
                      opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none
                      text-sm font-semibold text-slate-700 border border-slate-100">
        Tư vấn kỹ thuật (Zalo)
      </div>
      <button className="w-14 h-14 bg-[#0068FF] rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center
                         text-white hover:scale-110 active:scale-95 transition-all border-2 border-white">
        <svg className="w-9 h-9 fill-current" viewBox="0 0 24 24">
          <path d="M2.23 11.233c0 4.19 3.42 7.585 7.64 7.585a7.714 7.714 0 0 0 3.32-.756l3.41 1.05a.49.49 0 0 0 .61-.59l-.95-3.41c.64-.99.98-2.14.98-3.32 0-4.19-3.42-7.584-7.64-7.584S2.23 7.042 2.23 11.233zM9.87 5.7c3.15 0 5.71 2.48 5.71 5.53s-2.56 5.53-5.71 5.53a5.833 5.833 0 0 1-2.61-.62l-2.61.81.75-2.67c-.64-.81-.97-1.78-.97-2.79 0-3.05 2.56-5.53 5.71-5.53h.27-.54z"/>
        </svg>
      </button>
    </div>
  );
}
