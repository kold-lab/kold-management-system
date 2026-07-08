import { listFlavours, CatalogTable, AddFlavourDialog } from "@/modules/catalog";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const flavours = await listFlavours();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand">Catalog</h1>
          <p className="text-sm text-brand-slate">
            Flavours and their SKUs — one per bottle size.
          </p>
        </div>
        <AddFlavourDialog />
      </div>
      <CatalogTable flavours={flavours} />
    </div>
  );
}
