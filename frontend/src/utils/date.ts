const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function formatDate(input?: string | Date | null): string {
  if (!input) return "-";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "-";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(input?: string | Date | null): string {
  if (!input) return "-";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "-";
  const time = `${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${time}`;
}

export function timeAgo(input?: string | Date | null): string {
  if (!input) return "-";
  const d = new Date(input).getTime();
  const diff = Math.floor((Date.now() - d) / 1000);
  if (isNaN(d)) return "-";
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}h lalu`;
  return formatDate(input);
}
