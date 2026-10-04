'use client';

// index.html:844-849 (markup) and index.html:865-872 (handler) — the theme
// toggle button, transcribed.
//
// Both icon spans are rendered unconditionally: `dark:hidden` / `hidden
// dark:block` do the swapping in CSS, exactly as the source does. Rendering
// only one would change the DOM.
//
// No `type` attribute — the source has none and the button is not in a form;
// adding one would add a DOM attribute the source does not have.
//
// The handler ports index.html:865-872 verbatim: toggle `<html>`'s `dark`
// class, then write `localStorage.theme` as the string 'dark'/'light'.
// Nothing is read during render — no React state, no `localStorage.theme`
// access — which is what keeps the theme out of the render path and preserves
// the zero-flash behaviour of the init script at app/layout.tsx (the init
// half of index.html:851-864; do not touch it).
export default function ThemeToggle() {
  const handleToggle = () => {
    const html = document.documentElement;
    html.classList.toggle('dark');
    localStorage.theme = html.classList.contains('dark') ? 'dark' : 'light';
  };

  return (
    <button
      className="p-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg hover:scale-110 transition-transform"
      id="theme-toggle"
      aria-label="Toggle Dark Mode"
      onClick={handleToggle}
    >
      <span className="material-icons-outlined dark:hidden">dark_mode</span>
      <span className="material-icons-outlined hidden dark:block">light_mode</span>
    </button>
  );
}
