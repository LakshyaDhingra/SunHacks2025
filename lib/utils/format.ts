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
  console.log("formatting", amount)

  let unit = '';
  let numericValue: number;

  if (typeof amount === 'string') {
    // Clean up the string first
    amount = amount.trim();

    // If it already contains fractions, return as-is
    if (amount.includes('/')) {
      return amount;
    }

    // Extract numeric part and unit using regex
    const match = amount.match(/^([\d.]+)\s*(.*)$/);
    if (match) {
      numericValue = parseFloat(match[1]);
      unit = match[2].trim();
    } else {
      // If no numeric part found, return original
      return amount;
    }
  } else {
    numericValue = amount;
  }

  // Handle NaN or invalid numbers
  if (isNaN(numericValue)) {
    return typeof amount === 'string' ? amount : '0';
  }

  console.log("moving with", numericValue)

  // Check if it's a whole number
  if (numericValue % 1 === 0) {
    console.log(numericValue, "whole")
    const result = numericValue.toString();
    return unit ? `${result} ${unit}` : result;
  }

  // Common fractions used in cooking (defined as numerator/denominator pairs)
  const fractions: Array<[number, number, string]> = [
    [1, 8, '1/8'],
    [1, 4, '1/4'],
    [1, 3, '1/3'],
    [3, 8, '3/8'],
    [1, 2, '1/2'],
    [5, 8, '5/8'],
    [2, 3, '2/3'],
    [3, 4, '3/4'],
    [7, 8, '7/8']
  ];

  // Check for mixed numbers (e.g., 1.5 = 1 1/2)
  const wholePart = Math.floor(numericValue);
  const decimalPart = numericValue - wholePart;

  // Look for closest fraction match
  for (const [numerator, denominator, display] of fractions) {
    const fractionValue = numerator / denominator;
    // Use a reasonable tolerance for floating point comparison
    if (Math.abs(decimalPart - fractionValue) < 0.01) {
      const result = wholePart > 0 ? `${wholePart} ${display}` : display;
      return unit ? `${result} ${unit}` : result;
    }
    // Also check the full number for cases where it's less than 1
    if (wholePart === 0 && Math.abs(numericValue - fractionValue) < 0.01) {
      return unit ? `${display} ${unit}` : display;
    }
  }

  // For very small decimals, round to 2 decimal places
  if (numericValue < 1) {
    const rounded = Math.round(numericValue * 100) / 100;
    if (rounded === 0) {
      return unit ? `0 ${unit}` : '0';
    }
    const result = rounded.toString();
    return unit ? `${result} ${unit}` : result;
  }

  // Round to 2 decimal places if no fraction match
  const result = numericValue.toFixed(2).replace(/\.00$/, '');
  return unit ? `${result} ${unit}` : result;
}

