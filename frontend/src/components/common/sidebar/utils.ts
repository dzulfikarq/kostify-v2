import { getNavData } from "./data";

/**
 * Checks if the current pathname matches the target href, or if the pathname is a subpath of the target href.=
 */
export function isPathActive(href: string, pathname: string): boolean {
  if (!href) return false;

  if (href === "/") {
    return pathname === "/";
  }

  // Dashboard is the parent of all /dashboard/* — only exact match, otherwise it would always be active
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Find the nav group whose child URLs include the current pathname.
 * Returns the group's `title` (used as the Disclosure `id`) or null.
 */
export function findActiveGroupKey(pathname: string): string | null {
  for (const section of getNavData(() => "")) {
    for (const item of section.items) {
      if (item.items && (item.items as unknown as { url?: string }[]).length > 0) {
        const hasMatch = (item.items as unknown as { url?: string }[]).some((child) => child.url && isPathActive(child.url, pathname));
        if (hasMatch) return item.title;
      }
    }
  }
  return null;
}
