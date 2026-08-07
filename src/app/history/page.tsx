import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { HistoryList } from "@/components/HistoryList";

export const metadata = {
  title: "History",
};

export default function HistoryPage() {
  return (
    <>
      <SiteHeader current="history" />
      <main className="product-main">
        <HistoryList />
      </main>
      <SiteFooter />
    </>
  );
}
