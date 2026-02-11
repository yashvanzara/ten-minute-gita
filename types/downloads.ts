export interface DownloadedReading {
  snippetId: number;
  language: 'en' | 'hi';
  filePath: string;
  alignedJsonPath: string;
  fileSize: number;
  downloadedAt: string;
}

export interface ChapterDownloadInfo {
  chapterNumber: number;
  chapterTitle: string;
  totalReadings: number;
  downloadedReadings: number;
  totalSize: number;
  downloadedSize: number;
}

export interface DownloadState {
  downloads: Record<string, DownloadedReading>;
  activeDownloads: Record<string, number>;
  totalStorageUsed: number;
}
