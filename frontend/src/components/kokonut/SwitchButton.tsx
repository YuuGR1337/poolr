"use client";

/**
 * Adapted from kokonutui SwitchButton (@dorianbaffier, MIT).
 * Ported off next-themes → poolr's own ThemeProvider; Button from our
 * shadcn-lite primitives; style preserved (gradients, sheen, sun spin).
 *
 * v0.5.4: replaced all zinc-* hardcodes with poolr CSS tokens so the
 * toggle respects the active theme. Reduced animation complexity —
 * removed the sweep sheen and radial glow (excessive for a toggle).
 */

import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../ui";
import { cn } from "../../lib/utils";
import { useTheme } from "../../lib/theme";

interface SwitchButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "minimal";
  size?: "sm" | "default" | "lg";
  showLabel?: boolean;
}

export default function SwitchButton({
  className,
  variant = "minimal",
  size = "default",
  showLabel = true,
  ...props
}: SwitchButtonProps) {
  const { theme, toggleTheme } = useTheme();

  const variants = {
    minimal: [
      "rounded-lg",
      "bg-[var(--color-surface)]",
      "hover:bg-[var(--color-surface-2)]",
      "border border-[var(--color-border)]",
      "hover:border-[var(--color-border-strong)]",
      "shadow-sm",
      "hover:shadow-md",
      "transition-all duration-200 ease-out",
      "relative",
    ],
  };

  const sizes = {
    sm: "h-8 px-3 text-sm",
    default: "h-10 px-4",
    lg: "h-11 px-5",
  };

  return (
    <Button
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className={cn(
        "group relative",
        "transition-all duration-300 ease-out",
        "text-[var(--color-text-muted)]",
        "hover:text-[var(--color-text)]",
        variants[variant],
        sizes[size],
        className
      )}
      onClick={toggleTheme}
      {...props}
    >
      <div className={cn("flex items-center gap-2", "transition-all duration-300 ease-out")}>
        <motion.span
          key={theme}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="flex"
        >
          {theme === "dark" ? (
            <Moon
              className={cn(
                size === "sm" && "h-3.5 w-3.5",
                size === "default" && "h-4 w-4",
                size === "lg" && "h-5 w-5",
                "group-hover:scale-110",
                "transform-gpu text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]",
                "group-active:scale-95"
              )}
            />
          ) : (
            <Sun
              className={cn(
                size === "sm" && "h-3.5 w-3.5",
                size === "default" && "h-4 w-4",
                size === "lg" && "h-5 w-5",
                "group-hover:rotate-[360deg] group-hover:scale-110",
                "transform-gpu",
                "drop-shadow-[0_0_12px_rgba(252,211,77,0.3)]",
                "text-[var(--color-unsure)] group-hover:text-[var(--color-unsure)]",
                "group-active:scale-95"
              )}
            />
          )}
        </motion.span>
        {showLabel && (
          <span className={cn("relative font-medium capitalize", "transition-opacity duration-300 ease-out")}>
            <span className={cn("absolute inset-0", theme === "dark" ? "opacity-100" : "opacity-0", "transition-opacity duration-300 ease-out")}>
              Dark
            </span>
            <span className={cn("absolute inset-0", theme === "dark" ? "opacity-0" : "opacity-100", "transition-opacity duration-300 ease-out")}>
              Light
            </span>
            {/* keeps layout width stable while the two labels cross-fade */}
            <span className="opacity-0">Light</span>
          </span>
        )}
      </div>
    </Button>
  );
}
