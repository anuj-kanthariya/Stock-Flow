import { useEffect, useRef } from "react";

/**
 * Intersection Observer hook that adds the `revealed` class
 * to the ref element and all its `.lp-reveal` children when
 * they enter the viewport.
 */
export function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      el.classList.add("revealed");
      el.querySelectorAll(".lp-reveal").forEach((child) =>
        child.classList.add("revealed")
      );
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            // Also reveal children
            entry.target
              .querySelectorAll(".lp-reveal")
              .forEach((child) => child.classList.add("revealed"));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
