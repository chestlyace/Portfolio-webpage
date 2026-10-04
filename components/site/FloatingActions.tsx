'use client';

import ThemeToggle from '@/components/site/ThemeToggle';

// index.html:838-850 — the fixed bottom-right action stack, transcribed:
// container `fixed bottom-6 right-6 z-50 flex flex-col gap-4`, the WhatsApp
// anchor (`bg-[#25D366]` is a Tailwind arbitrary value — keep the brackets),
// and the theme toggle button between the anchor and the end of the column.
export default function FloatingActions() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
      <a
        href="https://wa.me/237676940247"
        target="_blank"
        rel="noopener noreferrer"
        className="p-3 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
        aria-label="Contact on WhatsApp"
      >
        <i className="fab fa-whatsapp text-2xl"></i>
      </a>
      <ThemeToggle />
    </div>
  );
}
