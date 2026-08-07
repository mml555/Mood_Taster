import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { FavoritesList } from "@/components/FavoritesList";

export const metadata = {
  title: "Favorites",
};

export default function FavoritesPage() {
  return (
    <>
      <SiteHeader current="favorites" />
      <main className="product-main">
        <FavoritesList />
      </main>
      <SiteFooter />
    </>
  );
}
