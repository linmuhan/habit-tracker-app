declare module 'expo-location' {
  export interface LocationObject {
    coords: {
      latitude: number;
      longitude: number;
      altitude: number | null;
      accuracy: number | null;
      altitudeAccuracy: number | null;
      heading: number | null;
      speed: number | null;
    };
    timestamp: number;
  }

  export interface LocationGeocodedAddress {
    city: string | null;
    district: string | null;
    street: string | null;
    subregion: string | null;
    region: string | null;
    country: string | null;
    postalCode: string | null;
    name: string | null;
    isoCountryCode: string | null;
  }

  export enum Accuracy {
    Lowest = 1,
    Low = 2,
    Balanced = 3,
    High = 4,
    Highest = 5,
    BestForNavigation = 6,
  }

  export function requestForegroundPermissionsAsync(): Promise<{
    status: 'granted' | 'denied' | 'undetermined';
    granted: boolean;
  }>;

  export function getCurrentPositionAsync(options?: {
    accuracy?: Accuracy;
  }): Promise<LocationObject>;

  export function reverseGeocodeAsync(location: {
    latitude: number;
    longitude: number;
  }): Promise<LocationGeocodedAddress[]>;
}
