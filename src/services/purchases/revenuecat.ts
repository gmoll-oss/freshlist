import { Platform } from 'react-native';

const Purchases = Platform.OS !== 'web' ? require('react-native-purchases').default : null;

// Re-export the type for consumers (type-only import is safe on all platforms)
export type { PurchasesPackage } from 'react-native-purchases';

// Replace with your actual RevenueCat API keys
const REVENUECAT_IOS_KEY = 'YOUR_IOS_API_KEY';
const REVENUECAT_ANDROID_KEY = 'YOUR_ANDROID_API_KEY';

const ENTITLEMENT_ID = 'premium';

let initialized = false;

export async function initPurchases(userId?: string): Promise<void> {
  if (Platform.OS === 'web' || initialized) return;
  const key = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
  Purchases.configure({ apiKey: key, appUserID: userId ?? undefined });
  initialized = true;
}

export async function getOfferings(): Promise<any[]> {
  if (Platform.OS === 'web') return [];
  const offerings = await Purchases.getOfferings();
  if (!offerings.current) return [];
  return offerings.current.availablePackages;
}

export async function purchasePackage(pkg: any): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (e: any) {
    if (e.userCancelled) return false;
    throw e;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const info = await Purchases.restorePurchases();
  return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export async function checkPremium(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}

export async function identifyUser(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await Purchases.logIn(userId);
}
