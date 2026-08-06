import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SignupForm } from "@/components/SignupForm";

export const metadata = {
  title: "Create account",
};

export default function SignupPage() {
  return (
    <>
      <SiteHeader current="account" />
      <main className="product-main">
        <section className="auth" aria-labelledby="signup-title">
          <p className="eyebrow">Account</p>
          <h1 id="signup-title" className="dna-title">
            Create account
          </h1>
          <p className="dna-lede">
            Save your Taste DNA to your profile so it follows you across
            devices. Guests can still use the quiz with local storage only.
          </p>
          <SignupForm />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
