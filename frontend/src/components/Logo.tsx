export default function Logo({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="Poolr"><circle cx="10" cy="9" r="5.2" stroke="currentColor" strokeWidth="2.4"/><path d="M10 14.2V22" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg>;
}
