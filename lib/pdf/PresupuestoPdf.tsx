import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { fecha, fmtPatente, money, num } from "@/lib/format";
import { sumarDias } from "@/lib/fechas";
import type { ItemPresupuesto, Negocio, Presupuesto } from "@/lib/types";

// PDF para el cliente: nunca muestra costos ni ganancia
const ROJO = "#DF2419";
const TINTA = "#241F1B";
const GRIS = "#6C635A";
const LINEA = "#E7DFD4";
const FONDO = "#F7F3EE";

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 56, paddingHorizontal: 40, fontSize: 10, color: TINTA, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: 150, height: 101, objectFit: "contain" },
  negocio: { marginTop: 6, color: GRIS, gap: 2 },
  titulo: { fontSize: 20, fontFamily: "Helvetica-BoldOblique", color: ROJO, textAlign: "right" },
  numero: { fontSize: 12, fontFamily: "Helvetica-Bold", textAlign: "right", marginTop: 2 },
  meta: { textAlign: "right", color: GRIS, marginTop: 6, gap: 2 },
  banda: { height: 4, backgroundColor: ROJO, marginTop: 14, marginBottom: 16, borderRadius: 2 },
  cliente: { flexDirection: "row", backgroundColor: FONDO, borderRadius: 6, padding: 12, marginBottom: 18 },
  clienteCol: { flex: 1 },
  etiqueta: { fontSize: 8, color: GRIS, textTransform: "uppercase", marginBottom: 2, letterSpacing: 0.5 },
  dato: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  seccion: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 6, marginTop: 4 },
  thead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: TINTA, paddingBottom: 4, marginBottom: 2 },
  th: { fontSize: 8, fontFamily: "Helvetica-Bold", color: GRIS, textTransform: "uppercase" },
  fila: { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: LINEA },
  cDesc: { flex: 1, paddingRight: 8 },
  cCant: { width: 40, textAlign: "right" },
  cPrecio: { width: 80, textAlign: "right" },
  cSub: { width: 85, textAlign: "right" },
  subtotal: { flexDirection: "row", justifyContent: "flex-end", marginTop: 6, marginBottom: 14, color: GRIS },
  totalBox: { alignSelf: "flex-end", width: 230, marginTop: 4 },
  totalFila: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, color: GRIS },
  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: ROJO,
    color: "#FFFFFF",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  totalTexto: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  totalMonto: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  notas: { marginTop: 22, padding: 12, borderWidth: 1, borderColor: LINEA, borderRadius: 6, lineHeight: 1.45 },
  pie: { position: "absolute", bottom: 24, left: 40, right: 40, textAlign: "center", fontSize: 8, color: GRIS },
});

function Tabla({ titulo, items, conCantidad }: { titulo: string; items: ItemPresupuesto[]; conCantidad: boolean }) {
  const sub = items.reduce((acc, i) => acc + i.cantidad * i.precio_unit, 0);
  return (
    <View wrap={false}>
      <Text style={s.seccion}>{titulo}</Text>
      <View style={s.thead}>
        <Text style={[s.th, s.cDesc]}>Descripción</Text>
        {conCantidad && <Text style={[s.th, s.cCant]}>Cant.</Text>}
        {conCantidad && <Text style={[s.th, s.cPrecio]}>Precio unit.</Text>}
        <Text style={[s.th, s.cSub]}>Importe</Text>
      </View>
      {items.map((i, k) => (
        <View key={k} style={s.fila}>
          <Text style={s.cDesc}>{i.descripcion}</Text>
          {conCantidad && <Text style={s.cCant}>{num(i.cantidad)}</Text>}
          {conCantidad && <Text style={s.cPrecio}>{money(i.precio_unit)}</Text>}
          <Text style={s.cSub}>{money(i.cantidad * i.precio_unit)}</Text>
        </View>
      ))}
      <View style={s.subtotal}>
        <Text>Subtotal {titulo.toLowerCase()}: </Text>
        <Text style={{ fontFamily: "Helvetica-Bold", color: TINTA }}>{money(sub)}</Text>
      </View>
    </View>
  );
}

export default function PresupuestoPdf({
  p,
  items,
  negocio,
  logo,
}: {
  p: Presupuesto;
  items: ItemPresupuesto[];
  negocio: Negocio;
  logo: Buffer | null;
}) {
  const mo = items.filter((i) => i.tipo === "mano_obra");
  const rep = items.filter((i) => i.tipo === "repuesto");
  const totMo = mo.reduce((a, i) => a + i.cantidad * i.precio_unit, 0);
  const totRep = rep.reduce((a, i) => a + i.cantidad * i.precio_unit, 0);
  const contacto = [negocio.direccion, negocio.telefono, negocio.email].filter(Boolean);

  return (
    <Document title={`Presupuesto N° ${p.numero}`} author={negocio.nombre}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {logo ? <Image src={{ data: logo, format: "png" }} style={s.logo} /> : <Text style={s.titulo}>{negocio.nombre}</Text>}
            {contacto.length > 0 && (
              <View style={s.negocio}>
                {contacto.map((c) => (
                  <Text key={c}>{c}</Text>
                ))}
              </View>
            )}
          </View>
          <View>
            <Text style={s.titulo}>PRESUPUESTO</Text>
            <Text style={s.numero}>N° {String(p.numero).padStart(4, "0")}</Text>
            <View style={s.meta}>
              <Text>Fecha: {fecha(p.fecha)}</Text>
              <Text>Válido hasta: {fecha(sumarDias(p.fecha, p.validez_dias))}</Text>
            </View>
          </View>
        </View>

        <View style={s.banda} />

        <View style={s.cliente}>
          <View style={s.clienteCol}>
            <Text style={s.etiqueta}>Cliente</Text>
            <Text style={s.dato}>{p.cliente_nombre}</Text>
            {p.cliente_telefono && <Text style={{ color: GRIS, marginTop: 2 }}>{p.cliente_telefono}</Text>}
          </View>
          <View style={s.clienteCol}>
            <Text style={s.etiqueta}>Vehículo</Text>
            <Text style={s.dato}>{p.vehiculo_texto || "—"}</Text>
            {p.patente && <Text style={{ color: GRIS, marginTop: 2 }}>Patente {fmtPatente(p.patente)}</Text>}
          </View>
        </View>

        {mo.length > 0 && <Tabla titulo="Mano de obra" items={mo} conCantidad={false} />}
        {rep.length > 0 && <Tabla titulo="Repuestos" items={rep} conCantidad />}

        <View style={s.totalBox} wrap={false}>
          {mo.length > 0 && rep.length > 0 && (
            <>
              <View style={s.totalFila}>
                <Text>Mano de obra</Text>
                <Text>{money(totMo)}</Text>
              </View>
              <View style={s.totalFila}>
                <Text>Repuestos</Text>
                <Text>{money(totRep)}</Text>
              </View>
            </>
          )}
          <View style={s.total}>
            <Text style={s.totalTexto}>TOTAL</Text>
            <Text style={s.totalMonto}>{money(totMo + totRep)}</Text>
          </View>
        </View>

        {p.notas && (
          <View style={s.notas} wrap={false}>
            <Text style={s.etiqueta}>Observaciones</Text>
            <Text>{p.notas}</Text>
          </View>
        )}

        <Text style={s.pie} fixed>
          {negocio.pie_presupuesto ?? ""}
        </Text>
      </Page>
    </Document>
  );
}
