import { HomeIcon, TableIcon, UserIcon, WindowIcon, AlphabetIcon, PieChartIcon } from "./icon";

export const NAV_DATA = [
  {
    label: "UTAMA",
    items: [
      { title: "Dashboard", icon: <HomeIcon />, url: "/dashboard", items: [] as unknown as { title: string; url: string }[] },
      { title: "Kost Saya", icon: <TableIcon />, url: "/dashboard/kosts", items: [] as unknown as { title: string; url: string }[] },
      { title: "Bookings", icon: <WindowIcon />, url: "/dashboard/bookings", items: [] as unknown as { title: string; url: string }[] },
      { title: "Kontrak", icon: <AlphabetIcon />, url: "/dashboard/contracts", items: [] as unknown as { title: string; url: string }[] },
    ],
  },
  {
    label: "ADMIN",
    items: [
      { title: "Verifikasi", icon: <PieChartIcon />, url: "/dashboard/verification", items: [] as unknown as { title: string; url: string }[] },
      { title: "Users", icon: <UserIcon />, url: "/dashboard/users", items: [] as unknown as { title: string; url: string }[] },
    ],
  },
] as const;
