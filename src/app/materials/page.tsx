import { listMaterials, MaterialsTable } from "@/modules/materials";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const materials = await listMaterials();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-brand-deep">Materials</h1>
        <p className="text-sm text-brand-slate">
          Current cost and reorder status for every raw material.
        </p>
      </div>
      <MaterialsTable materials={materials} />
    </div>
  );
}
