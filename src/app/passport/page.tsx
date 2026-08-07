import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductBottomNav } from "@/components/ProductBottomNav";
import { PassportView } from "@/components/PassportView";

export const metadata = {
  title: "Food Passport",
};

export default function PassportPage() {
  return (
    <>
      <SiteHeader current="explore" />
      <main className="product-main product-main-with-nav">
        <PassportView />
      </main>
      <ProductBottomNav />
      <SiteFooter />
    </>
  );
}
