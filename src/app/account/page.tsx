import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductBottomNav } from "@/components/ProductBottomNav";
import { AccountPanel } from "@/components/AccountPanel";

export const metadata = {
  title: "Account",
};

export default function AccountPage() {
  return (
    <>
      <SiteHeader current="account" />
      <main className="product-main product-main-with-nav">
        <section className="auth" aria-labelledby="account-title">
          <p className="eyebrow">Profile</p>
          <h1 id="account-title" className="dna-title">
            Your profile
          </h1>
          <p className="dna-lede">
            Your taste is saved here. Sign out anytime, the quiz still works
            as a guest.
          </p>
          <AccountPanel />
        </section>
      </main>
      <ProductBottomNav current="profile" />
      <SiteFooter />
    </>
  );
}
