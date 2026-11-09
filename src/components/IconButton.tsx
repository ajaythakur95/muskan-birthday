import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

interface IconButtonProps extends Omit<HTMLMotionProps<"button">, "children" | "aria-label"> {
  /** Required: icon-only buttons need an accessible name. */
  label: string;
  children: ReactNode;
}

export default function IconButton({ label, children, className = "", ...rest }: IconButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      className={`glass inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-plum ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
