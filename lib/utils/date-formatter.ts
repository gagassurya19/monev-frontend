/**
 * Date formatting utility functions
 */

/**
 * Format ISO date string to readable Indonesian format
 * @param dateString - ISO date string to format
 * @returns Formatted date string in DD/MM/YYYY HH:MM format
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Format ISO date string to readable Indonesian date only
 * @param dateString - ISO date string to format
 * @returns Formatted date string in DD/MM/YYYY format
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Format ISO date string to readable Indonesian time only
 * @param dateString - ISO date string to format
 * @returns Formatted time string in HH:MM format
 */
export function formatTime(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    return 'Invalid Time';
  }
}

/**
 * Format duration from seconds to human readable format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number | string): string {
  if (!seconds) return 'N/A';
  
  const sec = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
  if (isNaN(sec)) return 'Invalid Duration';
  
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const remainingSeconds = sec % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

/**
 * Relative time formatting (e.g., "2 hours ago")
 * @param dateString - ISO date string to format
 * @returns Relative time string
 */
export function formatRelativeTime(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);
    
    if (diffInMinutes < 1) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
    if (diffInDays < 7) return `${diffInDays} hari yang lalu`;
    
    return formatDateTime(dateString);
  } catch (error) {
    return 'Invalid Date';
  }
}
