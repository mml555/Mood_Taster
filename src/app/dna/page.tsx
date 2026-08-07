import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductBottomNav } from "@/components/ProductBottomNav";
import { DnaDashboard } from "@/components/DnaDashboard";

export const metadata = {
  title: "Taste DNA",
};

export default function DnaPage() {
  return (
    <>
      <SiteHeader current="dna" />
      <main className="product-main product-main-with-nav">
        <DnaDashboard />
      </main>
      <ProductBottomNav current="dna" />
      <SiteFooter />
    </>
  );
}
