import type { Vehiculo } from "@/lib/types";

const MARCAS = [
  "Chevrolet", "Citroën", "Fiat", "Ford", "Honda", "Hyundai", "Jeep", "Kia", "Mercedes-Benz",
  "Nissan", "Peugeot", "Renault", "Toyota", "Volkswagen", "Audi", "BMW", "Chery", "Dodge",
  "Mitsubishi", "RAM", "Suzuki", "BAIC", "DS", "Haval",
];

export default function VehiculoFields({ v }: { v?: Partial<Vehiculo> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="field">
        <span className="label">Patente *</span>
        <input
          name="patente"
          required
          defaultValue={v?.patente}
          placeholder="AB 123 CD"
          autoCapitalize="characters"
          className="input font-black tracking-wider uppercase"
        />
      </label>
      <label className="field">
        <span className="label">Año</span>
        <input
          name="anio"
          inputMode="numeric"
          defaultValue={v?.anio ?? ""}
          placeholder="2018"
          className="input tabular"
        />
      </label>
      <label className="field">
        <span className="label">Marca *</span>
        <input name="marca" required list="marcas" defaultValue={v?.marca} className="input" />
        <datalist id="marcas">
          {MARCAS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </label>
      <label className="field">
        <span className="label">Modelo *</span>
        <input name="modelo" required defaultValue={v?.modelo} placeholder="Gol Trend 1.6" className="input" />
      </label>
      <label className="field sm:col-span-2">
        <span className="label">Notas del vehículo</span>
        <input name="vehiculo_notas" defaultValue={v?.notas ?? ""} placeholder="Motor, versión, detalles…" className="input" />
      </label>
    </div>
  );
}
