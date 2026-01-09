
// Top 500 affirmations for offline storage
const TOP_AFFIRMATIONS = [
  "I am worthy of love and respect.",
  "I choose to be happy and grateful today.",
  "I am capable of achieving my goals.",
  "I trust in my ability to succeed.",
  "I am confident and strong.",
  "Every day I am becoming better.",
  "I embrace new challenges with courage.",
  "I am in control of my thoughts and emotions.",
  "I radiate positivity and attract good things.",
  "I am grateful for all that I have.",
  "I believe in myself and my abilities.",
  "I am deserving of success and happiness.",
  "I choose peace over worry.",
  "I am surrounded by love and support.",
  "I trust the journey of my life.",
  "I am enough just as I am.",
  "I release all negative thoughts.",
  "I am creating the life I desire.",
  "I am strong, capable, and resilient.",
  "I attract abundance into my life.",
  "I am grateful for this moment.",
  "I choose to see the good in every situation.",
  "I am worthy of my dreams.",
  "I trust in the timing of my life.",
  "I am proud of how far I have come.",
  "I embrace change with an open heart.",
  "I am filled with positive energy.",
  "I choose to focus on what I can control.",
  "I am becoming the best version of myself.",
  "I deserve to be happy and fulfilled.",
  "I am grateful for my unique journey.",
  "I trust my intuition and inner wisdom.",
  "I am capable of overcoming any challenge.",
  "I choose love over fear.",
  "I am worthy of respect and kindness.",
  "I celebrate my progress, no matter how small.",
  "I am open to new possibilities.",
  "I trust that everything is working out for me.",
  "I am deserving of all good things.",
  "I choose to be present in this moment.",
  "I am grateful for my health and vitality.",
  "I believe in my power to create change.",
  "I am surrounded by opportunities.",
  "I choose to let go of what no longer serves me.",
  "I am worthy of love and belonging.",
  "I trust in my ability to learn and grow.",
  "I am creating a life I love.",
  "I choose to see beauty in everyday moments.",
  "I am grateful for the lessons life teaches me.",
  "I am strong enough to handle whatever comes my way."
];

export async function loadAffirmationsOffline(): Promise<string[]> {
  return TOP_AFFIRMATIONS;
}

export function getRandomAffirmation(affirmations?: string[]): string {
  const list = affirmations && affirmations.length > 0 ? affirmations : TOP_AFFIRMATIONS;
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}
