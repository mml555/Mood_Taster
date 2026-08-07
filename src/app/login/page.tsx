import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LoginForm } from "@/components/LoginForm";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <>
      <SiteHeader current="account" />
      <main className="product-main">
        <section className="auth" aria-labelledby="login-title">
          <p className="eyebrow">Account</p>
          <h1 id="login-title" className="dna-title">
            Sign in
          </h1>
          <p className="dna-lede">
            Sign in to pick up right where you left off.
          </p>
          <LoginForm />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
