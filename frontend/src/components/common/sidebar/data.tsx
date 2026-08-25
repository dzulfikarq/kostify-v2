import { HomeIcon, TableIcon, UserIcon, WindowIcon, AlphabetIcon, PieChartIcon } from "./icon";

export const NAV_DATA = [
  {
    label: "UTAMA",
    items: [
      { title: "Dashboard", icon: <HomeIcon />, url: "/dashboard", items: [] as unknown as { title: string; url: string }[], roles: ["owner", "super_admin"] as const },
      { title: "Kost Saya", icon: <TableIcon />, url: "/dashboard/kosts", items: [] as unknown as { title: string; url: string }[], roles: ["owner"] as const },
      { title: "Bookings", icon: <WindowIcon />, url: "/dashboard/bookings", items: [] as unknown as { title: string; url: string }[], roles: ["owner"] as const },
      { title: "Kontrak", icon: <AlphabetIcon />, url: "/dashboard/contracts", items: [] as unknown as { title: string; url: string }[], roles: ["owner"] as const },
    ],
  },
  {
    label: "ADMIN",
    items: [
      { title: "Verifikasi", icon: <PieChartIcon />, url: "/dashboard/verification", items: [] as unknown as { title: string; url: string }[], roles: ["super_admin"] as const },
      { title: "Users", icon: <UserIcon />, url: "/dashboard/users", items: [] as unknown as { title: string; url: string }[], roles: ["super_admin"] as const },
    ],
  },
] as const;
