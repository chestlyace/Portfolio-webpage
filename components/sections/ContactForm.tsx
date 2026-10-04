'use client';

import { useState } from 'react';

// index.html:619-662 — the contact form, transcribed class-for-class: the
// `glass-panel … p-8 lg:p-10 shadow-2xl backdrop-blur-xl` form, the two-up
// `grid grid-cols-1 md:grid-cols-2 gap-6 mb-6` field row, the four ids
// (`name`, `email`, `subject`, `message`), the select's four options in
// source order, and the `type="button"` submit carrying `group`.
//
// index.html:898-914 — `sendToWhatsapp`, ported verbatim:
//   * `alert('Please fill in your name and message.')` — no "at least";
//   * `phoneNumber` is the **hardcoded** `"237676940247"`. The source never
//     reads `profile.whatsapp_number`, so neither does this component —
//     `usePortfolio()` is deliberately not imported;
//   * `text` keeps the `*…*` emphasis and the blank line (`%0A%0A`) after the
//     heading, and is not URL-encoded beyond the `%0A` the source writes;
//   * `window.open(url, '_blank').focus()` has **no optional chaining**: a
//     blocked popup throws a TypeError here exactly as it does today. Do not
//     "fix" it.
//
// Values are React state updated from `onChange`, but the inputs themselves
// are left uncontrolled on purpose: a controlled `<input value="">` makes
// React's server renderer emit a `value=""` attribute and a controlled
// `<select value>` emit `selected=""` on the matching option, neither of
// which exists in the source DOM (index.html:625-654 ships no `value`, and
// Chrome's post-JS dump has no `selected` anywhere — the first option is
// selected by implicit selectedness). Omitting the `value` props keeps the
// rendered DOM byte-equal to the source while the state still mirrors every
// keystroke; the source reads the values only on submit, so state and DOM
// cannot diverge through any user path.
//
// The button is `type="button"` with `onClick` and the `<form>` has no
// `onSubmit`: there is nothing to intercept, because nothing ever posts.
export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // The browser's implicit default for a select with no `selected` option is
  // the first one, so the state seed is that same first option's text.
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');

  function sendToWhatsapp() {
    if (!name || !message) {
      alert('Please fill in your name and message.');
      return;
    }

    const phoneNumber = "237676940247";
    const text = `*New Contact Form Submission* %0A%0A*Name:* ${name} %0A*Email:* ${email} %0A*Subject:* ${subject} %0A*Message:* ${message}`;

    const url = `https://wa.me/${phoneNumber}?text=${text}`;
    window.open(url, '_blank').focus();
  }

  return (
    <form className="glass-panel bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-3xl p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <label
            className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            htmlFor="name"
          >
            Your Name
          </label>
          <input
            className="w-full px-4 py-4 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-gray-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-600"
            id="name"
            placeholder="Call me ACE!"
            type="text"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            htmlFor="email"
          >
            Email Address
          </label>
          <input
            className="w-full px-4 py-4 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-gray-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-600"
            id="email"
            placeholder="ace@example.com"
            type="email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2 mb-6">
        <label
          className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          htmlFor="subject"
        >
          Subject
        </label>
        <select
          className="w-full px-4 py-4 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-gray-500 focus:border-transparent transition-all"
          id="subject"
          onChange={(e) => setSubject(e.target.value)}
        >
          <option>General Inquiry</option>
          <option>Web Development Project</option>
          <option>Photography Session</option>
          <option>Design Work</option>
        </select>
      </div>
      <div className="space-y-2 mb-8">
        <label
          className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          htmlFor="message"
        >
          Message
        </label>
        <textarea
          className="w-full px-4 py-4 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-gray-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-600 resize-none"
          id="message"
          placeholder="Tell me about your project..."
          rows={5}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <button
        className="w-full py-5 rounded-xl bg-background-dark text-white font-bold uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 dark:hover:text-black transition-all flex items-center justify-center space-x-3 group"
        type="button"
        onClick={sendToWhatsapp}
      >
        <span>Send Message</span>
        <span className="material-icons-outlined group-hover:translate-x-1 transition-transform">
          send
        </span>
      </button>
    </form>
  );
}
