import { useEffect, useRef } from "react";
import { animate } from "animejs";

export default function ScoreCounter({ value }) {
  const ref = useRef();

  useEffect(() => {
    const obj = { val: 0 };
    animate(obj, {
      val: value,
      round: 1,
      duration: 1400,
      ease: "outCubic",
      onUpdate: () => {
        ref.current.textContent = obj.val;
      },
    });
  }, [value]);

  return <span className="mono" ref={ref}>0</span>;
}