import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SignupForm } from "@/components/SignupForm";

export const metadata = {
  title: "Save your taste",
};

export default function SignupPage() {
  return (
    <>
      <SiteHeader current="account" />
      <main className="product-main">
        <section className="auth" aria-labelledby="signup-title">
          <p className="eyebrow">Account</p>
          <h1 id="signup-title" className="dna-title">
            Save your taste
          </h1>
          <p className="dna-lede">
            Optional. The quiz works without this. A free profile keeps your
            Taste DNA, syncs it across devices, and lets you customize how
            matches learn from you.
          </p>
          <SignupForm />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
