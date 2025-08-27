export const getCurrencySymbol = (country: string): string => {
  switch (country.toUpperCase()) {
    case 'INDIA':
      return '₹';
    case 'AMERICA':
      return '$';
    default:
      return '₹';
  }
};