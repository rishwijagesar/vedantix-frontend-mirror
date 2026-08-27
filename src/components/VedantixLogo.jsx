/**
 * VedantixLogo - Premium minimal logo component
 * 
 * The "V" mark: two clean angled lines forming a V,
 * with a thin horizontal bar across the middle — 
 * subtly evoking an open book / structured knowledge,
 * without being literal or ornamental.
 * 
 * Props:
 *   variant: "full" (icon + wordmark) | "icon" (icon only)
 *   size: "sm" | "md" | "lg" | number (height in px)
 *   theme: "dark" (default) | "light" | "white"
 */
/**
 * @param {{
 *   variant?: "full" | "icon",
 *   size?: "sm" | "md" | "lg" | number,
 *   theme?: "dark" | "light" | "white",
 *   className?: string,
 *   style?: import("react").CSSProperties,
 * }} props
 */
export default function VedantixLogo({
  variant = "full",
  size = "md",
  theme = "dark",
  className = "",
  style = {},
}) {
  const heights = { sm: 28, md: 36, lg: 48 };
  const h = typeof size === "number" ? size : (heights[size] || 36);

  const colors = {
    dark:  { mark: "#0f172a", iconStroke: "white", text: "#0f172a", accent: "#3b82f6" },
    light: { mark: "rgba(255,255,255,0.15)", iconStroke: "white", text: "#ffffff", accent: "#93c5fd" },
    white: { mark: "rgba(255,255,255,0.15)", iconStroke: "white", text: "#ffffff", accent: "#bfdbfe" },
  };
  const c = colors[theme] || colors.dark;

  if (variant === "icon") {
    return (
      <svg
        height={h}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
        aria-label="Vedantix"
      >
        {/* Outer rounded square */}
        <rect width="40" height="40" rx="10" fill={c.mark} />

        {/* V mark — left stroke */}
        <line
          x1="10" y1="11"
          x2="20" y2="29"
          stroke={c.iconStroke}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* V mark — right stroke */}
        <line
          x1="30" y1="11"
          x2="20" y2="29"
          stroke={c.iconStroke}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Subtle horizontal bar — book / knowledge reference */}
        <line
          x1="13.5" y1="19.5"
          x2="26.5" y2="19.5"
          stroke={c.accent}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>
    );
  }

  // Full: icon + wordmark
  const iconH = h;
  const iconW = iconH; // square

  return (
    <svg
      height={h}
      viewBox={`0 0 ${iconW + 8 + Math.round(h * 3.6)} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Vedantix"
    >
      {/* Icon block */}
      <rect width={iconW} height={iconH} rx={Math.round(iconH * 0.25)} fill={c.mark} />
      {/* V left */}
      <line
        x1={iconW * 0.25} y1={iconH * 0.275}
        x2={iconW * 0.5}  y2={iconH * 0.725}
        stroke={c.iconStroke}
        strokeWidth={iconH * 0.07}
        strokeLinecap="round"
      />
      {/* V right */}
      <line
        x1={iconW * 0.75} y1={iconH * 0.275}
        x2={iconW * 0.5}  y2={iconH * 0.725}
        stroke={c.iconStroke}
        strokeWidth={iconH * 0.07}
        strokeLinecap="round"
      />
      {/* Horizontal bar */}
      <line
        x1={iconW * 0.34} y1={iconH * 0.49}
        x2={iconW * 0.66} y2={iconH * 0.49}
        stroke={c.accent}
        strokeWidth={iconH * 0.05}
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Wordmark */}
      <text
        x={iconW + 10}
        y={iconH * 0.725}
        fontFamily="'Inter', system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize={Math.round(iconH * 0.56)}
        letterSpacing="-0.5"
        fill={c.text}
      >
        Vedantix
      </text>
    </svg>
  );
}
