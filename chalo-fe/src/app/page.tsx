import PublicLanding from "./_components/PublicLanding";
import { buildLandingMenu } from "./_components/landing-data";
import {
  getMenuCategoriesServer,
  getMenuProductsServer,
} from "@/services/menu/menu.server";

export default async function Home() {
  const [categories, products] = await Promise.all([
    getMenuCategoriesServer(),
    getMenuProductsServer(),
  ]);

  return <PublicLanding menu={buildLandingMenu(categories, products)} />;
}
