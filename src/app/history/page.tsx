import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductBottomNav } from "@/components/ProductBottomNav";
import { HistoryList } from "@/components/HistoryList";

export const metadata = {
  title: "History",
};

export default function HistoryPage() {
  return (
    <>
      <SiteHeader current="history" />
      <main className="product-main product-main-with-nav">
        <HistoryList />
      </main>
      <ProductBottomNav />
      <SiteFooter />
    </>
  );
}
