import type { ReactNode } from "react";

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface SectionNavProps {
  items: NavItem[];
  active: string;
}

/** Sticky pill menu that smooth-scrolls to each section of the page. */
export default function SectionNav({ items, active }: SectionNavProps) {
  const go = (id: string) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <nav aria-label="Sections" className="sticky top-3 z-30 mb-12 flex justify-center">
      <ul className="glass flex gap-1 rounded-full p-1 text-sm font-semibold text-plum">
        {items.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => go(it.id)}
              aria-current={active === it.id ? "true" : undefined}
              className={`inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-3.5 transition-colors sm:px-5 ${
                active === it.id ? "bg-white shadow" : "hover:bg-white/50"
              }`}
            >
              {it.icon}
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
