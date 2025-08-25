import { ButtonHTMLAttributes } from "react";

interface TButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function TButton({ className = "", children, ...props }: TButtonProps) {
  return (
    <button
      className={`px-4 py-3 rounded-xl text-sm font-medium shadow-sm active:scale-[0.99] transition-transform duration-100 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}