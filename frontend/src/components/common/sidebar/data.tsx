import { HomeIcon, TableIcon, UserIcon, WindowIcon, AlphabetIcon, PieChartIcon, CalendarIcon } from "./icon";

export function getNavData(t: (key: string) => string) {
  return [
    {
      label: t("nav.utama"),
      items: [
        { title: t("nav.dashboard"), icon: <HomeIcon />, url: "/dashboard", items: [] as unknown as { title: string; url: string }[], roles: ["owner", "super_admin"] as const },
        { title: t("nav.kostsaya"), icon: <TableIcon />, url: "/dashboard/kosts", items: [] as unknown as { title: string; url: string }[], roles: ["owner"] as const },
        { title: t("nav.bookings"), icon: <WindowIcon />, url: "/dashboard/bookings", items: [] as unknown as { title: string; url: string }[], roles: ["owner"] as const },
        { title: t("nav.kontrak"), icon: <AlphabetIcon />, url: "/dashboard/contracts", items: [] as unknown as { title: string; url: string }[], roles: ["owner"] as const },
        { title: "Tugas Survey", icon: <PieChartIcon />, url: "/dashboard/teknisi", items: [] as unknown as { title: string; url: string }[], roles: ["teknisi"] as const },
        { title: "Jadwal Survey", icon: <CalendarIcon />, url: "/dashboard/events", items: [] as unknown as { title: string; url: string }[], roles: ["owner", "teknisi", "super_admin"] as const },
      ],
    },
    {
      label: t("nav.admin"),
      items: [
        { title: t("nav.verifikasi"), icon: <PieChartIcon />, url: "/dashboard/verification", items: [] as unknown as { title: string; url: string }[], roles: ["super_admin"] as const },
        { title: t("nav.masterkost"), icon: <TableIcon />, url: "/dashboard/master-kost", items: [] as unknown as { title: string; url: string }[], roles: ["super_admin"] as const },
        { title: t("nav.users"), icon: <UserIcon />, url: "/dashboard/users", items: [] as unknown as { title: string; url: string }[], roles: ["super_admin"] as const },
      ],
    },
  ];
}
