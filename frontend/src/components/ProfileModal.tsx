import { avatars } from "./kokonut/ProfileSetup";
import { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Input, Button } from './ui';
import type { ProfileData } from './kokonut/ProfileSetup';

interface Props {
  profile: ProfileData | null;
  onClose: () => void;
  onSave: (data: ProfileData) => void;
}

export default function ProfileModal({ profile, onClose, onSave }: Props) {
  const [username, setUsername] = useState(profile?.username || "");
  const [avatarId, setAvatarId] = useState(profile?.avatarId || 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-6 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-[16px] font-semibold">Profile</h2>
          <button className="btn-ghost" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4 px-6 py-4">
          <div>
            <label className="text-[10.5px] text-[var(--color-text-muted)]">Display Name</label>
            <Input value={username} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)} placeholder="Your name" />
          </div>

          <div>
            <label className="text-[10.5px] text-[var(--color-text-muted)]">Avatar</label>
            <div className="mt-2 flex gap-3">
              {avatars.map(avatar => {
                const isSelected = avatarId === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    className={`relative h-14 w-14 overflow-hidden rounded-xl border transition-all ${
                      isSelected
                        ? "border-[var(--color-border-strong)] opacity-100 ring-2 ring-[var(--color-accent)]/70 ring-offset-2 ring-offset-[var(--color-bg)]"
                        : "border-[var(--color-border)] opacity-50 hover:opacity-100"
                    }`}
                    onClick={() => setAvatarId(avatar.id)}
                    type="button"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="scale-[2.3] transform">{avatar.svg}</div>
                    </div>
                    {isSelected && (
                      <div className="absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)]">
                        <svg aria-hidden="true" className="h-3 w-3 text-[var(--btn-fg)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[5px] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-[11px] text-[var(--color-text-muted)]">
            <p>Your data stays on your device. Cloud sync coming soon.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-6 py-4">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <Button variant="default" onClick={() => onSave({ username, avatarId })}>Save</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
