export const FACILITY = {
  name: "TurfStack Arena",
  id: 1,
};

export const BRANCHES = ["Gachibowli", "Madhapur"] as const;

export const SPORTS = ["Pickleball", "Cricket", "Volleyball", "Badminton"] as const;

export const SIDEBAR_ITEMS: Record<string, string[]> = {
  owner: ["Overview", "Schedule", "Bookings", "Courts", "Revenue", "Team", "Branches", "Settings"],
  manager: ["Overview", "Schedule", "Bookings", "Courts", "Revenue", "Settings"],
  staff: ["Schedule", "Bookings", "Walk-in Booking"],
  accountant: ["Revenue"],
  player: ["Book a Court", "My Bookings"],
};

export const COURTS = {
  gachibowli: ["Court A", "Court B", "Court C", "Court D"],
  madhapur: ["Court 1", "Court 2", "Court 3"],
};

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function futureDateISO(daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split("T")[0];
}
