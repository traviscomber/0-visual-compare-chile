import { createAdminClient } from "@/lib/supabase/admin"
import { JuanProjectDocumentationResearchClient } from "@/components/app/juan-project-documentation-research-client"

type ProductRow = {
  product_key: string
  product_name: string
  title: string
  status: "researching" | "ready_for_review" | "accepted" | "rejected"
}

export async function JuanProjectDocumentationResearch({ userId }: { userId: string }) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("intelligence_product_evolution_recommendations")
    .select("product_key,product_name,title,status")
    .eq("user_id", userId)
    .neq("status", "rejected")
    .order("score", { ascending: false })

  const products = (error ? [] : data ?? []) as ProductRow[]
  if (!products.length) return null

  return <JuanProjectDocumentationResearchClient
    projects={products.map((product) => ({
      key: product.product_key,
      name: product.product_name,
      direction: product.title,
      status: product.status,
    }))}
  />
}
