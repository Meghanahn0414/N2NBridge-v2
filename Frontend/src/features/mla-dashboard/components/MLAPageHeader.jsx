import "../styles/mla-layout.css";

/**
 * MLAPageHeader
 *
 * Props:
 *   subtitle  {string}       — small grey line above the title
 *   title     {string}       — Newsreader large h1
 *   children  {ReactNode}    — right-side action buttons, tabs, etc.
 */
export default function MLAPageHeader({ subtitle, title, children }) {
  return (
    <header className="mla-topbar">
      <div className="mla-topbar-left">
        {subtitle && <p className="mla-topbar-subtitle">{subtitle}</p>}
        <h1 className="mla-topbar-title">{title}</h1>
      </div>
      {children && (
        <div className="mla-topbar-actions">{children}</div>
      )}
    </header>
  );
}
