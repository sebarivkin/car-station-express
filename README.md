# Car Station Express

Sistema de gestión del lubricentro y taller mecánico de Franco.

- **Clientes y vehículos**: un cliente puede tener varios autos. Buscador por dueño, marca, modelo o patente.
- **Lubricentro**: cada service registra los artículos usados con costo y precio de venta del día (sin stock).
- **Taller**: mano de obra manual + repuestos con costo, venta y proveedor opcional.
- **Historial por vehículo**: todo lo que se le hizo, con km, total y estado de cobro.
- **Cobros y deudas**: efectivo / transferencia / tarjeta, pagos parciales y saldo pendiente.
- **Adelantos de sueldo** de los empleados (Walter y Brian) por mes.
- **Resumen**: facturación, costo y utilidad por rubro y período, artículos más vendidos, cobros por medio.
- **Exportar a Excel** como respaldo.

Stack: Next.js 16 + Tailwind 4 + Supabase (Postgres, login Google, RLS) + Vercel. Modo claro y oscuro.

Puesta en marcha: ver [SETUP.md](SETUP.md).
