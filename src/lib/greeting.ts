export function getGreeting(hour: number, displayName: string): string {
  const name = displayName.trim();
  const suffix = name ? ` يا ${name}` : "";
  if (hour < 5) return `سهرانة${suffix}؟ خدي بالك من نفسك`;
  if (hour < 12) return `صباح الخير${suffix}`;
  if (hour < 17) return `نهارك سعيد${suffix}`;
  if (hour < 21) return `مسا الخير${suffix}`;
  return `سهرة هادية${suffix}`;
}

export function getEncouragement(percentage: number, total: number): string {
  if (total === 0) return "ابدئي يومك بمهمة واحدة صغيرة، والباقي هييجي لوحده.";
  if (percentage === 100) return "كل المهام خلصت! استحقي راحة و فنجان قهوة ☕";
  if (percentage >= 75) return "قربتي تخلّصي، شوية كمان وخلاص.";
  if (percentage >= 50) return "نص الطريق خلص، إنتي ماشية حلو.";
  if (percentage > 0) return "بداية كويسة، خطوة ورا خطوة.";
  return "لسه في وقت، ابدئي بأسهل مهمة.";
}
