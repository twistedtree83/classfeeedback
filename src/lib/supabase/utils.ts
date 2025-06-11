export const generateRandomName = (): string => {
  const adjectives = [
    "Happy",
    "Clever",
    "Brave",
    "Kind",
    "Quick",
    "Wise",
    "Cool",
    "Bright",
    "Smart",
    "Bold",
    "Calm",
    "Swift",
    "True",
    "Strong",
    "Clear",
    "Warm",
    "Sharp",
    "Lucky",
    "Proud",
    "Loyal",
    "Free",
    "Fair",
    "Pure",
    "Noble",
  ];

  const animals = [
    "Lion",
    "Tiger",
    "Eagle",
    "Bear",
    "Wolf",
    "Fox",
    "Dolphin",
    "Hawk",
    "Panda",
    "Rabbit",
    "Deer",
    "Owl",
    "Whale",
    "Horse",
    "Falcon",
    "Turtle",
    "Penguin",
    "Leopard",
    "Elephant",
    "Cheetah",
    "Kangaroo",
    "Monkey",
    "Swan",
    "Zebra",
  ];

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  const randomNumber = Math.floor(Math.random() * 1000);

  return `${randomAdjective}${randomAnimal}${randomNumber}`;
};
