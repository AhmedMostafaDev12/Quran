export type Reciter = 'ar.alafasy' | 'ar.minshawi' | 'ar.husary' | 'ar.abdulbasit';

export function getAyahAudioUrl(
  globalAyahNumber: number,
  reciter: Reciter = 'ar.alafasy',
  bitrate: 64 | 128 = 128
): string {
  return `https://cdn.islamic.network/quran/audio/${bitrate}/${reciter}/${globalAyahNumber}.mp3`;
}
