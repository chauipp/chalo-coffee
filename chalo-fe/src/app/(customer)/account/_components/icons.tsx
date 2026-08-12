import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const BaseIcon = ({ children, ...props }: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {children}
  </svg>
);

export const QrIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <rect x="3" y="3" width="6" height="6" rx="1" />
    <rect x="15" y="3" width="6" height="6" rx="1" />
    <rect x="3" y="15" width="6" height="6" rx="1" />
    <path d="M15 15h2v2h-2zM19 15h2M19 19h2v2M15 19v2" />
  </BaseIcon>
);

export const ArrowRightIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M5 12h14M14 7l5 5-5 5" />
  </BaseIcon>
);

export const MapPinIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </BaseIcon>
);

export const HistoryIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5M12 7v5l3 2" />
  </BaseIcon>
);

export const LogoutIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
    <path d="M14 8l4 4-4 4M18 12H9" />
  </BaseIcon>
);

export const XIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </BaseIcon>
);

export const CameraIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M14.5 5 13 3h-2L9.5 5H6a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3h-3.5Z" />
    <circle cx="12" cy="12.5" r="3.5" />
  </BaseIcon>
);

export const CoffeeIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V8Z" />
    <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M7 4c1 1 1 2 0 3M11 3c1 1.3 1 2.7 0 4" />
  </BaseIcon>
);

export const RefreshIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M20 6v5h-5M4 18v-5h5" />
    <path d="M6.1 9a7 7 0 0 1 11.8-2L20 11M4 13l2.1 4a7 7 0 0 0 11.8-2" />
  </BaseIcon>
);
