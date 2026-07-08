import { AddMaterialDialog, listMaterials, MaterialsTable } from "@/modules/materials";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const materials = await listMaterials();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand">Materials</h1>
          <p className="text-sm text-brand-slate">
            Current cost and reorder status for every raw material.
          </p>
        </div>
        <AddMaterialDialog />
      </div>
      <MaterialsTable materials={materials} />
    </div>
  );
}
