import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

interface GlowButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  icon?: ReactNode;
  /** light: pastel pink for dark backgrounds. deep: purple for light backgrounds. */
  tone?: "light" | "deep";
}

export default function GlowButton({
  children,
  icon,
  tone = "light",
  className = "",
  ...rest
}: GlowButtonProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={`btn-glow ${tone === "light" ? "btn-glow-light" : "btn-glow-deep"} ${className}`}
      {...rest}
    >
      <span className="relative z-10 flex items-center gap-2.5">
        {icon}
        {children}
      </span>
    </motion.button>
  );
}
