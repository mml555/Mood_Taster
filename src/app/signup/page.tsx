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
            Optional. The quiz works fine without this. Saving just keeps
            your taste on every device.
          </p>
          <SignupForm />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
