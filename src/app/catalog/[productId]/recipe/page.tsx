import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipe, RecipeEditor } from "@/modules/catalog";

export const dynamic = "force-dynamic";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const id = Number(productId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link href="/catalog" className="inline-flex h-9 items-center gap-1.5 rounded border border-brand-slate/30 bg-white px-3 text-sm font-semibold text-brand-deep hover:bg-brand-ice">
          ← Catalog
        </Link>
        <h1 className="text-xl font-bold text-brand">
          Recipe — {recipe.flavourName} {recipe.sizeMl}ml
        </h1>
        <p className="text-sm text-brand-slate">
          <span className="font-mono">{recipe.skuCode}</span> · per-bottle bill
          of materials
        </p>
      </div>
      <RecipeEditor
        productId={recipe.productId}
        lines={recipe.lines.map((l) => ({
          materialId: l.materialId,
          materialName: l.materialName,
          unit: l.unit,
          quantity: l.quantity.toString(),
          costLabel: l.lineCost ? `RM ${l.lineCost.toFixed(3)}` : "—",
        }))}
        materialOptions={recipe.materialOptions.map((m) => ({
          id: m.id,
          name: m.name,
          unit: m.unit,
        }))}
        unitCostLabel={
          recipe.unitCost ? `RM ${recipe.unitCost.toFixed(3)}` : null
        }
      />
    </div>
  );
}
