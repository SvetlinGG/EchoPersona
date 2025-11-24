export function generateRealAnswer(userText) {
  const text = userText.toLowerCase();
  
  if (text.includes('mental health') || (text.includes('improve') && text.includes('health'))) {
    return "Here are some simple ways to improve mental health: Take 10-minute walks daily, practice deep breathing for 5 minutes, get 7-8 hours of sleep, limit social media to 30 minutes per day, and talk to someone you trust when you're stressed.";
  }
  
  if (text.includes('stress') || text.includes('anxious') || text.includes('overwhelm')) {
    return "Try the 4-7-8 breathing technique: breathe in for 4 counts, hold for 7, exhale for 8. Also, write down 3 things you're grateful for today. Break big tasks into 15-minute chunks.";
  }
  
  if (text.includes('sleep') || text.includes('tired') || text.includes('energy')) {
    return "For better sleep: no screens 1 hour before bed, keep your room cool and dark, try reading or gentle stretching. Avoid caffeine after 2 PM and create a consistent bedtime routine.";
  }
  
  if (text.includes('exercise') || text.includes('fitness') || text.includes('workout')) {
    return "Start small: 10 push-ups, 20 jumping jacks, or a 15-minute walk. Try bodyweight exercises like squats and planks. The key is consistency over intensity - even 10 minutes daily makes a difference.";
  }
  
  if (text.includes('productivity') || text.includes('focus') || text.includes('work')) {
    return "Use the Pomodoro Technique: work for 25 minutes, then take a 5-minute break. Remove distractions, prioritize your top 3 tasks for the day, and tackle the hardest one first when your energy is highest.";
  }
  
  if (text.includes('advice') || text.includes('help') || text.includes('examples')) {
    return "Here are some practical examples: Start your day with 5 minutes of stretching, drink a glass of water when you wake up, take 3 deep breaths before stressful tasks, and end your day by writing down one thing that went well.";
  }
  
  return `Based on what you're asking about, here are some practical steps you can try. The key is to start small and be consistent.`;
}