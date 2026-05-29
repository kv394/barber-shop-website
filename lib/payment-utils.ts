export function calculateDepositAmount(totalAmount: number, depositRule?: { type: 'PERCENTAGE' | 'FIXED' | 'FULL', value?: number }): number {
  if (!depositRule) return 0;
  
  if (depositRule.type === 'FULL') {
    return totalAmount;
  }
  
  if (depositRule.type === 'FIXED') {
    return depositRule.value || 0;
  }
  
  if (depositRule.type === 'PERCENTAGE') {
    return (totalAmount * (depositRule.value || 0)) / 100;
  }
  
  return 0;
}
