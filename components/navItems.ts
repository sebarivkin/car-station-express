import { BarChart3, Droplets, HandCoins, Search, Truck, Users, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const PRINCIPALES: NavItem[] = [
  { href: "/", label: "Buscar", icon: Search },
  { href: "/deudas", label: "Deudas", icon: HandCoins },
  { href: "/dashboard", label: "Resumen", icon: BarChart3 },
  { href: "/empleados", label: "Adelantos", icon: Users },
];

export const SECUNDARIOS: NavItem[] = [
  { href: "/articulos", label: "Artículos", icon: Droplets },
  { href: "/proveedores", label: "Proveedores", icon: Truck },
];
