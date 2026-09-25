import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

/** Keep picker images outside the OS cache before storing their URI in SQLite. */
export async function persistPickedImage(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    if (!uri.startsWith('blob:')) return uri;
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Unable to read the selected image.'));
      reader.onerror = () => reject(new Error('Unable to read the selected image.'));
      reader.readAsDataURL(blob);
    });
  }
  if (!FileSystem.documentDirectory) throw new Error('Photo storage is unavailable.');
  const directory = `${FileSystem.documentDirectory}images/`;
  if (uri.startsWith(directory)) return uri;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const extension = uri.split(/[?#]/)[0].match(/\.(jpg|jpeg|png|heic|heif|webp|gif)$/i)?.[1] || 'jpg';
  const destination = `${directory}${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  await FileSystem.copyAsync({ from: uri, to: destination });
  return destination;
}
