import { SignupForm } from "@/components/SignupForm";

export const metadata = {
  title: "Save your taste",
};

export default function SignupPage() {
  return (
    <section className="auth" aria-labelledby="signup-title">
      <p className="eyebrow">Account</p>
      <h1 id="signup-title" className="dna-title">
        Save your taste
      </h1>
      <p className="dna-lede">
        Optional. The quiz works fine without this. Saving just keeps your taste
        on every device.
      </p>
      <SignupForm />
    </section>
  );
}
