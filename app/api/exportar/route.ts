import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/auth";
import { hoy } from "@/lib/fechas";

// Respaldo completo en un Excel: una hoja por tabla
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: permitido } = await supabase.rpc("is_allowed");
  if (!user || !permitido) return new NextResponse("No autorizado", { status: 401 });

  type Row = Record<string, unknown>;
  const all = (tabla: string, select = "*", orden = "created_at") =>
    fetchAll<Row>((f, t) => supabase.from(tabla).select(select).order(orden).range(f, t));

  const [ops, clientes, vehiculos, serviceItems, repuestos, pagos, articulos, proveedores, adelantos] =
    await Promise.all([
      all("operaciones", "*", "fecha"),
      all("clientes"),
      all("vehiculos", "*, clientes(nombre)"),
      all("service_items", "*, services(fecha, vehiculos(patente))", "id"),
      all("trabajo_repuestos", "*, proveedores(nombre), trabajos(fecha, vehiculos(patente))", "id"),
      all("pagos", "*", "fecha"),
      all("articulos", "*", "nombre"),
      all("proveedores", "*", "nombre"),
      all("adelantos", "*, empleados(nombre)", "fecha"),
    ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Car Station Express";

  const hoja = (nombre: string, columnas: [string, string, number?][], filas: Row[], map: (r: Row) => Row) => {
    const ws = wb.addWorksheet(nombre);
    ws.columns = columnas.map(([header, key, width]) => ({ header, key, width: width ?? 16 }));
    ws.getRow(1).font = { bold: true };
    ws.views = [{ state: "frozen", ySplit: 1 }];
    for (const r of filas) ws.addRow(map(r));
  };
  const n = (v: unknown) => (v == null ? null : Number(v));
  const rel = (r: Row, k: string) => (r[k] as Row | null) ?? {};

  hoja(
    "Operaciones",
    [
      ["Fecha", "fecha", 12], ["Rubro", "tipo", 12], ["Patente", "patente", 11], ["Vehículo", "vehiculo", 22],
      ["Cliente", "cliente", 24], ["Descripción", "descripcion", 40], ["Km", "km", 10], ["Mano de obra", "mano_obra"],
      ["Total", "total"], ["Costo", "costo"], ["Utilidad", "utilidad"], ["Cobrado", "cobrado"], ["Saldo", "saldo"],
    ],
    ops,
    (r) => ({
      ...r,
      tipo: r.tipo === "service" ? "Lubricentro" : "Taller",
      vehiculo: `${r.marca} ${r.modelo}`,
      cliente: r.cliente_nombre,
      ...Object.fromEntries(["mano_obra", "total", "costo", "utilidad", "cobrado", "saldo"].map((k) => [k, n(r[k])])),
    })
  );
  hoja("Clientes", [["Nombre", "nombre", 28], ["Teléfono", "telefono"], ["Notas", "notas", 40]], clientes, (r) => r);
  hoja(
    "Vehículos",
    [["Patente", "patente", 11], ["Marca", "marca"], ["Modelo", "modelo", 22], ["Año", "anio", 8], ["Dueño", "dueno", 28], ["Notas", "notas", 30]],
    vehiculos,
    (r) => ({ ...r, dueno: rel(r, "clientes").nombre })
  );
  hoja(
    "Artículos usados",
    [["Fecha", "fecha", 12], ["Patente", "patente", 11], ["Artículo", "descripcion", 36], ["Cantidad", "cantidad", 10], ["Costo unit.", "costo_unit"], ["Venta unit.", "precio_unit"]],
    serviceItems,
    (r) => ({
      ...r,
      fecha: rel(r, "services").fecha,
      patente: rel(rel(r, "services"), "vehiculos").patente,
      cantidad: n(r.cantidad), costo_unit: n(r.costo_unit), precio_unit: n(r.precio_unit),
    })
  );
  hoja(
    "Repuestos",
    [["Fecha", "fecha", 12], ["Patente", "patente", 11], ["Repuesto", "descripcion", 36], ["Proveedor", "proveedor", 22], ["Cantidad", "cantidad", 10], ["Costo unit.", "costo_unit"], ["Venta unit.", "precio_unit"]],
    repuestos,
    (r) => ({
      ...r,
      fecha: rel(r, "trabajos").fecha,
      patente: rel(rel(r, "trabajos"), "vehiculos").patente,
      proveedor: rel(r, "proveedores").nombre,
      cantidad: n(r.cantidad), costo_unit: n(r.costo_unit), precio_unit: n(r.precio_unit),
    })
  );
  hoja(
    "Cobros",
    [["Fecha", "fecha", 12], ["Monto", "monto"], ["Medio", "medio", 14], ["Rubro", "rubro", 12]],
    pagos,
    (r) => ({ ...r, monto: n(r.monto), rubro: r.service_id ? "Lubricentro" : "Taller" })
  );
  hoja(
    "Catálogo",
    [["Artículo", "nombre", 36], ["Categoría", "categoria", 18], ["Costo", "costo"], ["Venta", "precio"], ["Activo", "activo", 8]],
    articulos,
    (r) => ({ ...r, costo: n(r.costo), precio: n(r.precio), activo: r.activo ? "Sí" : "No" })
  );
  hoja("Proveedores", [["Nombre", "nombre", 28], ["Teléfono", "telefono"]], proveedores, (r) => r);
  hoja(
    "Adelantos",
    [["Fecha", "fecha", 12], ["Empleado", "empleado", 16], ["Monto", "monto"], ["Nota", "nota", 30]],
    adelantos,
    (r) => ({ ...r, empleado: rel(r, "empleados").nombre, monto: n(r.monto) })
  );

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="car-station-express-${hoy()}.xlsx"`,
    },
  });
}
