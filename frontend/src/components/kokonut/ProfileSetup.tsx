"use client";

/**
 * Adapted from kokonutui ProfileSetup / Avatar Picker (@dorianbaffier, MIT).
 * Ported off shadcn Card/Input/Button (our primitives) — visual behavior
 * preserved: color-ring stage, cross-fade, thumbnail strip, username gate.
 * In poolr this is the personalized first-run setup.
 */

import Logo from "../Logo";
import { Check, ChevronRight, User2 } from "lucide-react";
import type { Variants } from "motion/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, useEffect } from "react";
import { Button, Card, CardContent, Input } from "../ui";
import { cn } from "../../lib/utils";

interface Avatar {
  id: number;
  svg: React.ReactNode;
  alt: string;
}

const AVATAR_RGB: Record<number, string> = {
  1: "255, 0, 91",
  2: "255, 125, 16",
  3: "10, 3, 16",
  4: "137, 252, 179",
};

function AvatarSvg({ bg, fg, mouth = "#000000", seed = 0 }: { bg: string; fg: string; mouth?: string; seed?: number }) {
  return (
    <svg aria-hidden="true" fill="none" height="40" viewBox="0 0 36 36" width="40" xmlns="http://www.w3.org/2000/svg">
      <rect fill={bg} height="36" width="36" />
      <rect
        fill={fg}
        height="36"
        rx="6"
        transform={seed % 2 ? "translate(5 -1) rotate(55 18 18) scale(1.1)" : "translate(9 -5) rotate(219 18 18) scale(1)"}
        width="36"
      />
      <g transform={`translate(${seed === 3 ? -3 : 4.5} ${seed === 3 ? 3.5 : -4}) rotate(${seed === 3 ? 7 : 9} 18 18)`}>
        <path d="M15 19c2 1 4 1 6 0" fill="none" stroke={mouth} strokeLinecap="round" />
        <rect fill={mouth} height="2" rx="1" width="1.5" x={seed === 3 ? 12 : 10} y="14" />
        <rect fill={mouth} height="2" rx="1" width="1.5" x={seed === 3 ? 22 : 24} y="14" />
      </g>
    </svg>
  );
}

export const avatars: Avatar[] = [
  { id: 1, svg: <AvatarSvg bg="#ff005b" fg="#ffb238" seed={0} />, alt: "Ember" },
  { id: 2, svg: <AvatarSvg bg="#ff7d10" fg="#0a0310" mouth="#FFFFFF" seed={1} />, alt: "Amber" },
  { id: 3, svg: <AvatarSvg bg="#0a0310" fg="#ff005b" mouth="#FFFFFF" seed={2} />, alt: "Ink" },
  { id: 4, svg: <AvatarSvg bg="#d8fcb3" fg="#89fcb3" seed={3} />, alt: "Sage" },
];

export interface ProfileData {
  username: string;
  avatarId: number;
}

interface ProfileSetupProps {
  onComplete?: (data: ProfileData) => void;
  className?: string;
}

const containerVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const thumbnailVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
};

export default function ProfileSetup({ onComplete, className }: ProfileSetupProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar>(avatars[0]);
  const [username, setUsername] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleAvatarSelect = (avatar: Avatar) => {
    if (avatar.id === selectedAvatar.id) return;
    setSelectedAvatar(avatar);
  };

  const handleSubmit = () => {
    if (username.trim() && onComplete) {
      onComplete({ username: username.trim(), avatarId: selectedAvatar.id });
    }
  };

  const isValid = username.trim().length >= 3 && agreedToTerms;
  const showError = username.trim().length > 0 && username.trim().length < 3;
  const rgb = AVATAR_RGB[selectedAvatar.id];

  const fade = shouldReduceMotion ? { duration: 0 } : undefined;

  return (
    <Card className={cn("relative mx-auto w-full max-w-[400px]", className)}>
      <CardContent className="p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-1 text-center">
            <Logo size={32} /><h2 className="font-semibold text-xl tracking-tight">Welcome to poolr</h2>
            <p className="text-[var(--color-text-muted)] text-sm">Choose your profile. Connect a shared Drive in Team workspace.</p>
          </div>

          {/* Avatar Stage */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-40 w-40">
              {/* Animated per-avatar color ring */}
              <motion.div
                animate={{ boxShadow: `0 0 0 2px rgba(${rgb}, 0.55), 0 6px 24px rgba(${rgb}, 0.18)` }}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-full"
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" }}
              />

              <div className="relative h-full w-full overflow-hidden rounded-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0 }}
                    key={selectedAvatar.id}
                    transition={fade ?? { duration: 0.2, ease: "easeOut" }}
                  >
                    <div className="scale-[4]">{selectedAvatar.svg}</div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.span
                animate={{ opacity: 1 }}
                className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.12em]"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key={selectedAvatar.id}
                transition={fade ?? { duration: 0.16, ease: "easeOut" }}
              >
                {selectedAvatar.alt}
              </motion.span>
            </AnimatePresence>

            {/* Thumbnail strip */}
            <motion.div
              animate="animate"
              className="flex gap-3"
              initial="initial"
              variants={containerVariants}
            >
              {avatars.map((avatar) => {
                const isSelected = selectedAvatar.id === avatar.id;
                return (
                  <motion.button
                    aria-label={`Select ${avatar.alt}`}
                    aria-pressed={isSelected}
                    className={cn(
                      "relative h-14 w-14 overflow-hidden rounded-xl border bg-[var(--color-surface-2)] transition-[opacity,box-shadow] duration-200 ease-out",
                      isSelected
                        ? "border-[var(--color-border-strong)] opacity-100 ring-2 ring-[var(--color-accent)]/70 ring-offset-2 ring-offset-[var(--color-bg)]"
                        : "border-[var(--color-border)] opacity-50 hover:opacity-100"
                    )}
                    key={avatar.id}
                    onClick={() => handleAvatarSelect(avatar)}
                    type="button"
                    variants={thumbnailVariants}
                    whileHover={shouldReduceMotion ? {} : { scale: 1.06 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.94 }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="scale-[2.3] transform">{avatar.svg}</div>
                    </div>
                    {isSelected && (
                      <div className="absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)]">
                        <Check aria-hidden="true" className="h-3 w-3 text-[var(--btn-fg)]" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          {/* Username field */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-medium text-sm" htmlFor="poolr-username">
                  Your name
                </label>
                <span
                  className={cn(
                    "text-xs tabular-nums transition-colors duration-200 ease-out",
                    username.length >= 18
                      ? "text-amber-500 dark:text-amber-400"
                      : "text-[var(--color-text-muted)]/50"
                  )}
                >
                  {username.length}/20
                </span>
              </div>

              <div className="relative">
                <Input
                  autoComplete="username"
                  className={cn(
                    "h-10 pl-9 text-sm",
                    showError && "border-[var(--color-exclude)]/50 focus-visible:border-[var(--color-exclude)]"
                  )}
                  id="poolr-username"
                  maxLength={20}
                  name="username"
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onKeyDown={(e) => e.key === "Enter" && isValid && handleSubmit()}
                  placeholder="your name…"
                  spellCheck={false}
                  type="text"
                  value={username}
                />
                <User2
                  aria-hidden="true"
                  className={cn(
                    "absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ease-out",
                    isFocused ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"
                  )}
                />
              </div>

              <AnimatePresence>
                {showError && (
                  <motion.p
                    animate={{ opacity: 1, y: 0 }}
                    className="ml-0.5 text-xs text-[var(--color-exclude)]"
                    exit={{ opacity: 0, y: -4 }}
                    initial={{ opacity: 0, y: -4 }}
                    role="alert"
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                    Name must be at least 3 characters
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
              />
              <label htmlFor="terms" className="text-[11px] text-[var(--color-text-muted)] leading-tight">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent("poolr:gopage", { detail: "legal" }));
                  }}
                  className="cursor-pointer border-none bg-transparent p-0 text-[var(--color-accent)] hover:underline inline"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent("poolr:gopage", { detail: "legal" }));
                  }}
                  className="cursor-pointer border-none bg-transparent p-0 text-[var(--color-accent)] hover:underline inline"
                >
                  Privacy Policy
                </button>
              </label>
            </div>
            <Button
              className="group h-10 w-full text-sm"
              disabled={!isValid}
              onClick={handleSubmit}
              type="button"
            >
              Get Started
              <ChevronRight
                aria-hidden="true"
                className="ml-1 h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
              />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
