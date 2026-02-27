/**
 * Data URI placeholders for images (used when /images/* assets are removed).
 * These provide neutral fallbacks so UI components render without broken images.
 */

/** Gray circle for avatars (40x40). */
export const PLACEHOLDER_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle fill='%23999' cx='20' cy='20' r='20'/%3E%3C/svg%3E";

/** Gray square for app/device icons (48x48). */
export const PLACEHOLDER_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect fill='%23999' width='48' height='48' rx='8'/%3E%3C/svg%3E";

/** Sun icon for light theme. */
export const PLACEHOLDER_THEME_LIGHT =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='80' viewBox='0 0 128 80'%3E%3Ccircle fill='%23f5a623' cx='64' cy='40' r='24'/%3E%3C/svg%3E";

/** Moon icon for dark theme. */
export const PLACEHOLDER_THEME_DARK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='80' viewBox='0 0 128 80'%3E%3Ccircle fill='%234a5568' cx='64' cy='40' r='24'/%3E%3C/svg%3E";
