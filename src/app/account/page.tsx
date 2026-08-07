import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { AccountPanel } from "@/components/AccountPanel";

export const metadata = {
  title: "Account",
};

export default function AccountPage() {
  return (
    <>
      <SiteHeader current="account" />
      <main className="product-main">
        <section className="auth" aria-labelledby="account-title">
          <p className="eyebrow">Account</p>
          <h1 id="account-title" className="dna-title">
            Your profile
          </h1>
          <p className="dna-lede">
            Signed-in Taste DNA and diet settings sync to your account. Sign out
            anytime; guest quiz still works on this device. Delete account from
            this page when you want cloud data gone.
          </p>
          <AccountPanel />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
