import { useEffect } from "react";

export default function useReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll(".reveal, .reveal-stagger, .zoom-frame, .headline-line");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);
}