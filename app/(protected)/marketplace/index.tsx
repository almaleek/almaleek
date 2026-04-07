import { Redirect } from "expo-router";

export default function MarketplaceIndex() {
  return <Redirect href="/(protected)/marketplace/(tabs)" />;
}

