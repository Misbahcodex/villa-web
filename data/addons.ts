/**
 * Rizq Luxurious Villa — Optional Guest Add-ons
 *
 * NOTE: All add-on services are REQUEST items subject to operational confirmation
 * by the villa manager. They are never guaranteed at time of booking.
 */

export interface AddonOption {
  id: string;
  name: string;
  description: string;
  priceAED: number;
  priceConfirmed: boolean;
  enabled: boolean;
  category: "transfer" | "stay-flexibility" | "amenity";
}

export const propertyAddons: AddonOption[] = [
  {
    id: "airport-shuttle",
    name: "Airport / Metro Shuttle Transfer",
    description: "Private direct transfer between Dubai International Airport (DXB) or nearest Metro station and Rizq Villa.",
    priceAED: 0,
    priceConfirmed: false, // Shows "Request, subject to confirmation"
    enabled: false,        // Disabled by default; no guarantee of shuttle
    category: "transfer",
  },
  {
    id: "early-checkin",
    name: "Early check-in request",
    description: "Subject to confirmation",
    priceAED: 60,
    priceConfirmed: false, // Shows "Price on request"
    enabled: true,
    category: "stay-flexibility",
  },
  {
    id: "late-checkout",
    name: "Late check-out request",
    description: "Subject to confirmation",
    priceAED: 60,
    priceConfirmed: false, // Shows "Price on request"
    enabled: true,
    category: "stay-flexibility",
  },
];

export function getAddonById(id: string): AddonOption | undefined {
  return propertyAddons.find((addon) => addon.id === id);
}
