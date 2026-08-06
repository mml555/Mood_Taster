import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { DnaDashboard } from "@/components/DnaDashboard";

export const metadata = {
  title: "Taste DNA",
};

export default function DnaPage() {
  return (
    <>
      <SiteHeader current="dna" />
      <main className="product-main">
        <DnaDashboard />
      </main>
      <SiteFooter />
    </>
  );
}
