
/**
 * PDF Export Utility for Journal Entries
 * 
 * Generates a clean PDF with all journal entries including:
 * - Date and time
 * - Text content
 * - Photo references
 * - Voice memo references
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { getAllJournalEntries } from './database';

interface JournalEntry {
  id: string;
  content: string;
  photoUri?: string;
  audioUri?: string;
  affirmationText?: string;
  date: string;
  createdAt: string;
  isFavorite?: number;
}

/**
 * Format date to readable string
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
};

/**
 * Format time to readable string
 */
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return date.toLocaleTimeString('en-US', options);
};

/**
 * Escape HTML special characters
 */
const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

/**
 * Generate HTML content for the PDF
 */
const generatePdfHtml = (entries: JournalEntry[]): string => {
  const entriesHtml = entries
    .map((entry) => {
      const date = formatDate(entry.date);
      const time = formatTime(entry.createdAt);
      const content = escapeHtml(entry.content || 'No content');
      const hasPhoto = entry.photoUri ? true : false;
      const hasAudio = entry.audioUri ? true : false;
      const affirmation = entry.affirmationText
        ? `<div style="background: #EEF2FF; padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #4F46E5;">
             <p style="margin: 0; font-style: italic; color: #4F46E5; font-size: 14px;">
               "${escapeHtml(entry.affirmationText)}"
             </p>
           </div>`
        : '';

      return `
        <div style="page-break-inside: avoid; margin-bottom: 32px; padding: 20px; background: #FFFFFF; border-radius: 12px; border: 1px solid #E5E7EB;">
          <div style="border-bottom: 2px solid #4F46E5; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="margin: 0 0 4px 0; color: #1F2937; font-size: 20px; font-weight: 600;">
              ${date}
            </h2>
            <p style="margin: 0; color: #6B7280; font-size: 14px;">
              ${time}
            </p>
          </div>
          
          ${affirmation}
          
          <div style="margin-bottom: 16px; line-height: 1.6; color: #374151; font-size: 15px; white-space: pre-wrap;">
            ${content}
          </div>
          
          ${
            hasPhoto || hasAudio
              ? `<div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
                   ${
                     hasPhoto
                       ? `<div style="display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: #F3F4F6; border-radius: 6px;">
                            <span style="color: #4F46E5; font-size: 16px;">📷</span>
                            <span style="color: #6B7280; font-size: 13px;">Photo attached</span>
                          </div>`
                       : ''
                   }
                   ${
                     hasAudio
                       ? `<div style="display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: #F3F4F6; border-radius: 6px;">
                            <span style="color: #4F46E5; font-size: 16px;">🎤</span>
                            <span style="color: #6B7280; font-size: 13px;">Voice memo attached</span>
                          </div>`
                       : ''
                   }
                 </div>`
              : ''
          }
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Indigo Habits - Journal Export</title>
        <style>
          * {
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 40px 20px;
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%);
            color: #1F2937;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          
          .header {
            text-align: center;
            margin-bottom: 48px;
            padding: 32px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .header h1 {
            margin: 0 0 8px 0;
            color: #4F46E5;
            font-size: 32px;
            font-weight: 700;
          }
          
          .header p {
            margin: 0;
            color: #6B7280;
            font-size: 16px;
          }
          
          .stats {
            display: flex;
            justify-content: center;
            gap: 24px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
          }
          
          .stat {
            text-align: center;
          }
          
          .stat-value {
            display: block;
            font-size: 28px;
            font-weight: 700;
            color: #4F46E5;
            margin-bottom: 4px;
          }
          
          .stat-label {
            display: block;
            font-size: 13px;
            color: #6B7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .entries {
            margin-top: 32px;
          }
          
          .footer {
            text-align: center;
            margin-top: 48px;
            padding: 24px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            color: #6B7280;
            font-size: 14px;
          }
          
          @media print {
            body {
              background: white;
              padding: 20px;
            }
            
            .header, .footer {
              background: white;
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📖 My Journal</h1>
            <p>Indigo Habits - Personal Journal Export</p>
            <div class="stats">
              <div class="stat">
                <span class="stat-value">${entries.length}</span>
                <span class="stat-label">Total Entries</span>
              </div>
              <div class="stat">
                <span class="stat-value">${entries.filter((e) => e.photoUri).length}</span>
                <span class="stat-label">Photos</span>
              </div>
              <div class="stat">
                <span class="stat-value">${entries.filter((e) => e.audioUri).length}</span>
                <span class="stat-label">Voice Memos</span>
              </div>
            </div>
          </div>
          
          <div class="entries">
            ${entriesHtml || '<p style="text-align: center; color: #6B7280; padding: 40px;">No journal entries found.</p>'}
          </div>
          
          <div class="footer">
            <p>Generated on ${formatDate(new Date().toISOString())} at ${formatTime(new Date().toISOString())}</p>
            <p style="margin-top: 8px; font-size: 12px;">All data stored locally on your device • Indigo Habits v1.0.0</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Export all journal entries to PDF and share
 */
export const exportJournalsToPdf = async (): Promise<void> => {
  try {
    console.log('[PDF Export] Starting journal export...');

    // Get all journal entries from database
    const entries = (await getAllJournalEntries()) as JournalEntry[];
    console.log(`[PDF Export] Found ${entries.length} journal entries`);

    if (entries.length === 0) {
      throw new Error('No journal entries to export');
    }

    // Generate HTML content
    const html = generatePdfHtml(entries);

    // Generate PDF
    console.log('[PDF Export] Generating PDF...');
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    console.log('[PDF Export] PDF generated at:', uri);

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (!isAvailable) {
      console.error('[PDF Export] Sharing is not available on this device');
      throw new Error('Sharing is not available on this device');
    }

    // Share the PDF
    console.log('[PDF Export] Opening share dialog...');
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Export Journal Entries',
      UTI: 'com.adobe.pdf',
    });

    console.log('[PDF Export] Export completed successfully');
  } catch (error) {
    console.error('[PDF Export] Error exporting journals:', error);
    throw error;
  }
};

/**
 * Get a preview of what will be exported (for display purposes)
 */
export const getExportPreview = async (): Promise<{
  totalEntries: number;
  totalPhotos: number;
  totalAudioMemos: number;
  dateRange: { earliest: string; latest: string } | null;
}> => {
  try {
    const entries = (await getAllJournalEntries()) as JournalEntry[];

    if (entries.length === 0) {
      return {
        totalEntries: 0,
        totalPhotos: 0,
        totalAudioMemos: 0,
        dateRange: null,
      };
    }

    const totalPhotos = entries.filter((e) => e.photoUri).length;
    const totalAudioMemos = entries.filter((e) => e.audioUri).length;

    // Get date range
    const dates = entries.map((e) => new Date(e.date).getTime()).sort((a, b) => a - b);
    const earliest = new Date(dates[0]).toISOString();
    const latest = new Date(dates[dates.length - 1]).toISOString();

    return {
      totalEntries: entries.length,
      totalPhotos,
      totalAudioMemos,
      dateRange: { earliest, latest },
    };
  } catch (error) {
    console.error('[PDF Export] Error getting export preview:', error);
    return {
      totalEntries: 0,
      totalPhotos: 0,
      totalAudioMemos: 0,
      dateRange: null,
    };
  }
};
