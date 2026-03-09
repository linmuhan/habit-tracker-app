declare module 'expo-file-system' {
  export const cacheDirectory: string;
  export const documentDirectory: string;
  
  export function writeAsStringAsync(fileUri: string, contents: string, options?: any): Promise<void>;
  export function readAsStringAsync(fileUri: string, options?: any): Promise<string>;
  export function getInfoAsync(fileUri: string, options?: any): Promise<any>;
  export function deleteAsync(fileUri: string, options?: any): Promise<void>;
  export function copyAsync(options: { from: string; to: string }): Promise<void>;
  export function moveAsync(options: { from: string; to: string }): Promise<void>;
  export function makeDirectoryAsync(fileUri: string, options?: any): Promise<void>;
  export function readDirectoryAsync(fileUri: string): Promise<string[]>;
  export function downloadAsync(url: string, fileUri: string, options?: any): Promise<any>;
}
