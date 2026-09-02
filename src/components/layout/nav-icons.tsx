/**
 * Outline icons for the app navigation, drawn at 24x24 with the same stroke
 * style as the rest of the UI. Each takes an optional className for sizing.
 */
type IconProps = { className?: string };

function OutlineIcon({
  className = "h-6 w-6",
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Storefront with awning: the app's "Ontdek" tab. */
export function StoreIcon(props: IconProps) {
  return (
    <OutlineIcon {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
      />
    </OutlineIcon>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <OutlineIcon {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </OutlineIcon>
  );
}

/** Cooking pot with lid: the app's "Koken" tab. */
export function PotIcon(props: IconProps) {
  return (
    <OutlineIcon {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 10.5h15v5.25A3.75 3.75 0 0 1 15.75 19.5h-7.5A3.75 3.75 0 0 1 4.5 15.75V10.5Zm-2.25 0h19.5M7.5 10.5V9a4.5 4.5 0 0 1 9 0v1.5M12 4.5V3"
      />
    </OutlineIcon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <OutlineIcon {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </OutlineIcon>
  );
}

/** Shopping basket: the app's "Mandje" tab. */
export function BasketIcon(props: IconProps) {
  return (
    <OutlineIcon {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    </OutlineIcon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <OutlineIcon {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </OutlineIcon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <OutlineIcon {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </OutlineIcon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <OutlineIcon {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </OutlineIcon>
  );
}
