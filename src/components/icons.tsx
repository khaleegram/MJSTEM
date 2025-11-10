import { Library } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

export const Icons = {
  logo: (props: LucideProps) => <Library {...props} />,
  favicon: () => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="6" fill="#90EE90" />
      <path
        d="M8 23V9H10V23H8ZM12 23V9H14V23H12ZM16 23V9H18V23H16ZM22 7L19 9V23H21V12L24 10.5V23H26V9L22 7Z"
        fill="#101827"
      />
    </svg>
  )
};
