// Deterministic "demo" values derived from an id — same algorithm as the
// original HTML prototype, so the same store/product always shows the same
// rating and delivery estimate rather than a value that changes on reload.
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function demoRating(id: string): number {
  const h = hashStr(id);
  return Math.round((4.5 + (h % 5) / 10) * 10) / 10;
}

export function demoDelivery(id: string): string {
  const h = hashStr(id + "-d");
  const start = 30 + (h % 60);
  const end = start + 20 + (h % 20);
  return `${start}-${end} min`;
}

export function format12Hour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function storeHoursLabel(store: { openTime: string; closeTime: string }): string {
  if (!store.openTime || !store.closeTime) return "";
  return `${format12Hour(store.openTime)} - ${format12Hour(store.closeTime)}`;
}

// Buckets a list of timestamped records into "count per day" for the last
// N days (oldest first), for sparkline charts.
export function dailyBuckets<T>(records: T[], getTime: (r: T) => number, days: number): number[] {
  const now = Date.now();
  const buckets = new Array(days).fill(0);
  for (const r of records) {
    const diffDays = Math.floor((now - getTime(r)) / (24 * 3600 * 1000));
    if (diffDays >= 0 && diffDays < days) buckets[days - 1 - diffDays]++;
  }
  return buckets;
}

export const STATUS_COLORS: Record<string, string> = {
  ORDER_PLACED: "#FAC775",
  STORE_ACCEPTED: "#85B7EB",
  PREPARING_GIFT: "#AFA9EC",
  READY_FOR_PICKUP: "#5DCAA5",
  OUT_FOR_DELIVERY: "#D4537E",
  DELIVERED: "#97C459",
  REJECTED: "#F09595",
};

export const STATUS_BADGE_COLORS: Record<string, [string, string]> = {
  ORDER_PLACED: ["#FAEEDA", "#854F0B"],
  STORE_ACCEPTED: ["#E6F1FB", "#0C447C"],
  PREPARING_GIFT: ["#EEEDFE", "#3C3489"],
  READY_FOR_PICKUP: ["#E6F1FB", "#0C447C"],
  OUT_FOR_DELIVERY: ["#E6F1FB", "#185FA5"],
  DELIVERED: ["#EAF3DE", "#3B6D11"],
  REJECTED: ["#FCEBEB", "#A32D2D"],
};

export const STATUS_EXPLANATIONS: Record<string, string> = {
  ORDER_PLACED: "Waiting for the store to accept your order.",
  STORE_ACCEPTED: "The store has accepted and will begin preparing it soon.",
  PREPARING_GIFT: "Your gift is being prepared with care.",
  READY_FOR_PICKUP: "Your gift is ready and waiting for pickup.",
  OUT_FOR_DELIVERY: "Your gift is on its way!",
  DELIVERED: "Delivered! We hope it brought a smile.",
  REJECTED: "This order was rejected by the store.",
};

export const STATUS_LABELS: Record<string, string> = {
  ORDER_PLACED: "Order Placed",
  STORE_ACCEPTED: "Store Accepted",
  PREPARING_GIFT: "Preparing Gift",
  READY_FOR_PICKUP: "Ready for Pickup",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  REJECTED: "Rejected",
};
