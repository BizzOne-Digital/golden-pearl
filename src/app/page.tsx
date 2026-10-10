import { StorePage } from "@/components/StorePage";
import { getMenuFromFile } from "@/lib/get-menu";

export default function Home() {
  const initialMenu = getMenuFromFile();
  return <StorePage initialMenu={initialMenu} />;
}
