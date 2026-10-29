export type MedioPago = "efectivo" | "transferencia" | "tarjeta";
export type TipoOperacion = "service" | "taller";

export const MEDIOS: { value: MedioPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
];

export type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  notas: string | null;
};

export type Vehiculo = {
  id: string;
  cliente_id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number | null;
  notas: string | null;
};

export type VehiculoBusqueda = {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number | null;
  cliente_id: string;
  cliente_nombre: string;
  cliente_telefono: string | null;
  ultima_visita: string | null;
};

export type Articulo = {
  id: string;
  nombre: string;
  categoria: string | null;
  costo: number;
  precio: number;
  activo: boolean;
};

export type Operacion = {
  tipo: TipoOperacion;
  id: string;
  vehiculo_id: string;
  fecha: string;
  km: number | null;
  created_at: string;
  descripcion: string;
  total: number;
  costo: number;
  utilidad: number;
  mano_obra: number;
  repuestos_venta: number;
  repuestos_costo: number;
  cobrado: number;
  saldo: number;
  patente: string;
  marca: string;
  modelo: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_telefono: string | null;
};

export type Pago = {
  id: string;
  fecha: string;
  monto: number;
  medio: MedioPago;
};

export type Empleado = { id: string; nombre: string; activo: boolean };

export type Adelanto = {
  id: string;
  empleado_id: string;
  fecha: string;
  monto: number;
  nota: string | null;
};

// Supabase devuelve los numeric como string: los pasamos a number
const NUMERICOS = [
  "total", "costo", "utilidad", "mano_obra", "repuestos_venta", "repuestos_costo",
  "cobrado", "saldo", "precio", "monto", "cantidad", "costo_unit", "precio_unit",
];

export function numeros<T>(row: T): T {
  const r = { ...row } as Record<string, unknown>;
  for (const k of NUMERICOS) if (k in r && r[k] != null) r[k] = Number(r[k]);
  return r as T;
}

export type TipoItemPresupuesto = "mano_obra" | "repuesto";
export type EstadoPresupuesto = "pendiente" | "aceptado" | "rechazado";

export type ItemPresupuesto = {
  tipo: TipoItemPresupuesto;
  descripcion: string;
  cantidad: number;
  costo_unit: number;
  precio_unit: number;
};

export type Presupuesto = {
  id: string;
  numero: number;
  fecha: string;
  validez_dias: number;
  vehiculo_id: string | null;
  cliente_nombre: string;
  cliente_telefono: string | null;
  vehiculo_texto: string | null;
  patente: string | null;
  notas: string | null;
  estado: EstadoPresupuesto;
  trabajo_id: string | null;
  total: number;
  costo: number;
  mano_obra: number;
};

export type Negocio = {
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  email: string | null;
  pie_presupuesto: string | null;
};
