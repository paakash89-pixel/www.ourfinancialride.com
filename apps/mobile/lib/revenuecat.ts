import Purchases from "react-native-purchases";

let configured = false;

const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

export const configureRevenueCat = async (appUserId: string): Promise<boolean> => {
  if (!apiKey) return false;
  if (configured) return true;

  await Purchases.configure({
    apiKey,
    appUserID: appUserId
  });
  configured = true;
  return true;
};

export const syncRevenueCatEntitlements = async (): Promise<{
  activeEntitlements: string[];
}> => {
  await Purchases.syncPurchases();
  const info = await Purchases.getCustomerInfo();
  const activeEntitlements = Object.keys(info.entitlements.active ?? {});
  return { activeEntitlements };
};
