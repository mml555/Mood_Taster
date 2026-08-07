import { AccountPanel } from "@/components/AccountPanel";

export const metadata = {
  title: "Account",
};

export default function AccountPage() {
  return (
    <section className="auth" aria-labelledby="account-title">
      <p className="eyebrow">Profile</p>
      <h1 id="account-title" className="dna-title">
        Your profile
      </h1>
      <p className="dna-lede">
        Your taste is saved here. Sign out anytime, the quiz still works as a
        guest.
      </p>
      <AccountPanel />
    </section>
  );
}
