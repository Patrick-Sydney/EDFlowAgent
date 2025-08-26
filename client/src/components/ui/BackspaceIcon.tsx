export default function BackspaceIcon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 6H9L3 12l6 6h13V6z" />
      <path d="M12 9l6 6M18 9l-6 6" />
    </svg>
  );
}