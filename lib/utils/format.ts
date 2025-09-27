// Format ISO 8601 duration to human readable
export function formatDuration(duration: string | undefined): string {
  if (!duration) return '';
  
  // Handle already formatted times
  if (!duration.startsWith('P')) {
    return duration;
  }
  
  // Parse ISO 8601 duration (e.g., PT20M, PT1H30M)
  const regex = /P(?:T(?:(\d+)H)?(?:(\d+)M)?)?/;
  const match = duration.match(regex);
  
  if (!match) return duration;
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  
  return parts.join(' ') || duration;
}

// Convert decimal to fraction for common measurements
export function formatAmount(amount: string | number): string {
  if (typeof amount === 'string') {
    // Clean up the string first
    amount = amount.trim();
    
    // If it's already a string with fractions or units, return as-is
    if (amount.includes('/') || !amount.match(/^[\d.]+$/)) {
      return amount;
    }
  }
  
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  
  // Handle NaN or invalid numbers
  if (isNaN(num)) {
    return typeof amount === 'string' ? amount : '0';
  }
  
  // Common fractions used in cooking
  const fractions: Array<[number, string]> = [
    [0.125, '1/8'],
    [0.25, '1/4'],
    [0.333, '1/3'],
    [0.3333, '1/3'],
    [0.375, '3/8'],
    [0.5, '1/2'],
    [0.625, '5/8'],
    [0.666, '2/3'],
    [0.6666, '2/3'],
    [0.6667, '2/3'],
    [0.667, '2/3'],
    [0.75, '3/4'],
    [0.875, '7/8']
  ];
  
  // Check if it's a whole number
  if (Number.isInteger(num)) {
    return num.toString();
  }
  
  // Check for mixed numbers (e.g., 1.5 = 1 1/2)
  const wholePart = Math.floor(num);
  const decimalPart = num - wholePart;
  
  // Look for closest fraction match
  for (const [decimal, fraction] of fractions) {
    if (Math.abs(decimalPart - decimal) < 0.01) {
      return wholePart > 0 ? `${wholePart} ${fraction}` : fraction;
    }
  }
  
  // For very small decimals, round to 2 decimal places
  if (num < 1) {
    const rounded = Math.round(num * 100) / 100;
    if (rounded === 0) return '0';
    return rounded.toString();
  }
  
  // Round to 2 decimal places if no fraction match
  return num.toFixed(2).replace(/\.00$/, '');
}