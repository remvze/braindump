export function formatDate(date: Date): string {
  return Intl.DateTimeFormat("en-US", {
    year: "2-digit",
    month: "short",
    day: "numeric",
  }).format(date);
}
