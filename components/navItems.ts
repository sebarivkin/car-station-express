import { BarChart3, Droplets, HandCoins, Home, KeyRound, Truck, Users, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const INICIO: NavItem = { href: "/", label: "Inicio", icon: Home };
export const DEUDAS: NavItem = { href: "/deudas", label: "Deudas", icon: HandCoins };
export const RESUMEN: NavItem = { href: "/dashboard", label: "Resumen", icon: BarChart3 };
export const ADELANTOS: NavItem = { href: "/empleados", label: "Adelantos", icon: Users };

export const PRINCIPALES: NavItem[] = [INICIO, DEUDAS, RESUMEN, ADELANTOS];

export const SECUNDARIOS: NavItem[] = [
  { href: "/articulos", label: "Artículos", icon: Droplets },
  { href: "/proveedores", label: "Proveedores", icon: Truck },
  { href: "/claves", label: "Claves", icon: KeyRound },
];

/** En el celular, Adelantos va dentro de "Más" para dejar lugar al botón Nuevo */
export const MAS_MOVIL: NavItem[] = [ADELANTOS, ...SECUNDARIOS];
