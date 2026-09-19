import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

export default function AnimatedHeadline({ text, style }) {
  const ref = useRef();

  useEffect(() => {
    const letters = ref.current.querySelectorAll("span");
    animate(letters, {
      opacity: [0, 1],
      translateY: [30, 0],
      filter: ["blur(8px)", "blur(0px)"],
      ease: "outExpo",
      duration: 900,
      delay: stagger(28),
    });
  }, [text]);

  return (
    <h1 ref={ref} style={style}>
      {text.split("").map((char, i) => (
        <span key={i} style={{ display: "inline-block" }}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </h1>
  );
}