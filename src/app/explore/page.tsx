import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductBottomNav } from "@/components/ProductBottomNav";
import { ExploreDashboard } from "@/components/ExploreDashboard";

export const metadata = {
  title: "Explore",
};

export default function ExplorePage() {
  return (
    <>
      <SiteHeader current="explore" />
      <main className="product-main product-main-with-nav">
        <ExploreDashboard />
      </main>
      <ProductBottomNav />
      <SiteFooter />
    </>
  );
}
