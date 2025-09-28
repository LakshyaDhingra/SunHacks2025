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



  console.log("moving with", num)
  // Check if it's a whole number
  // if (Number.isInteger(num)) {
  if (num % 1 === 0) {
    console.log(num, "whole")
    return num.toString();
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
  const wholePart = Math.floor(num);
  const decimalPart = num - wholePart;

  // Look for closest fraction match
  // Use the actual mathematical fraction to compare, not hardcoded decimals
  for (const [numerator, denominator, display] of fractions) {
    const fractionValue = numerator / denominator;
    // Use a reasonable tolerance for floating point comparison
    // This will catch any representation of the fraction (e.g., 0.666666... for 2/3)
    if (Math.abs(decimalPart - fractionValue) < 0.01) {
      return wholePart > 0 ? `${wholePart} ${display}` : display;
    }
    // Also check the full number for cases where it's less than 1
    if (wholePart === 0 && Math.abs(num - fractionValue) < 0.01) {
      return display;
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
