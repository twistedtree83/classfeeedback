import { useEffect, useState } from 'react';

export interface EducationalFact {
  id: number;
  fact: string;
  category: string;
  difficulty: 1 | 2 | 3; // 1 = elementary, 2 = middle school, 3 = high school
}

export const educationalFacts: EducationalFact[] = [
  {
    id: 1,
    fact: "The Great Wall of China is so long that it would take approximately 18 months to walk its entire length.",
    category: "History",
    difficulty: 2
  },
  {
    id: 2,
    fact: "A bolt of lightning is five times hotter than the surface of the sun.",
    category: "Science",
    difficulty: 1
  },
  {
    id: 3,
    fact: "The human brain can generate enough electricity to power a small light bulb.",
    category: "Science",
    difficulty: 2
  },
  {
    id: 4,
    fact: "The Eiffel Tower can be 15 cm taller during the summer when the metal expands due to heat.",
    category: "Science",
    difficulty: 2
  },
  {
    id: 5,
    fact: "There are more possible iterations of a game of chess than there are atoms in the observable universe.",
    category: "Mathematics",
    difficulty: 3
  },
  {
    id: 6,
    fact: "Octopuses have three hearts, nine brains, and blue blood.",
    category: "Biology",
    difficulty: 2
  },
  {
    id: 7,
    fact: "The shortest war in history was between Britain and Zanzibar in 1896, lasting only 38 minutes.",
    category: "History",
    difficulty: 2
  },
  {
    id: 8,
    fact: "The world's oldest known living tree is over 5,000 years old and is found in California.",
    category: "Nature",
    difficulty: 1
  },
  {
    id: 9,
    fact: "Honeybees can recognize human faces and remember them for their entire lives.",
    category: "Biology",
    difficulty: 2
  },
  {
    id: 10,
    fact: "A day on Venus is longer than a year on Venus because it rotates so slowly.",
    category: "Space",
    difficulty: 3
  },
  {
    id: 11,
    fact: "The tongue is the strongest muscle in the human body relative to its size.",
    category: "Biology",
    difficulty: 1
  },
  {
    id: 12,
    fact: "The first computer programmer was a woman named Ada Lovelace who lived in the 1800s.",
    category: "Technology",
    difficulty: 2
  },
  {
    id: 13,
    fact: "There are more stars in the universe than grains of sand on all the beaches on Earth.",
    category: "Space",
    difficulty: 1
  },
  {
    id: 14,
    fact: "The ancient Egyptians used to use honey as an ingredient in their embalming fluid.",
    category: "History",
    difficulty: 2
  },
  {
    id: 15,
    fact: "A group of flamingos is called a 'flamboyance.'",
    category: "Nature",
    difficulty: 1
  },
  {
    id: 16,
    fact: "The fingerprints of koalas are so similar to humans that they have been mistaken at crime scenes.",
    category: "Biology",
    difficulty: 2
  },
  {
    id: 17,
    fact: "The entire world's population could fit inside Los Angeles if everyone stood shoulder-to-shoulder.",
    category: "Geography",
    difficulty: 2
  },
  {
    id: 18,
    fact: "The Great Barrier Reef is the largest living structure on Earth and can be seen from space.",
    category: "Nature",
    difficulty: 2
  },
  {
    id: 19,
    fact: "The average person will spend six months of their life waiting for red lights to turn green.",
    category: "Miscellaneous",
    difficulty: 1
  },
  {
    id: 20,
    fact: "The speed of a computer mouse is measured in 'Mickeys.'",
    category: "Technology",
    difficulty: 2
  },
  {
    id: 21,
    fact: "The only letter that doesn't appear in the periodic table is the letter J.",
    category: "Science",
    difficulty: 2
  },
  {
    id: 22,
    fact: "The Hawaiian alphabet has only 12 letters: A, E, I, O, U, H, K, L, M, N, P, and W.",
    category: "Language",
    difficulty: 2
  },
  {
    id: 23,
    fact: "Polar bears' fur isn't actually white—it's transparent and reflects light, making it appear white.",
    category: "Nature",
    difficulty: 2
  },
  {
    id: 24,
    fact: "The first oranges weren't orange—they were green.",
    category: "Nature",
    difficulty: 1
  },
  {
    id: 25,
    fact: "The Statue of Liberty was originally designed for Egypt, not the United States.",
    category: "History",
    difficulty: 2
  },
  {
    id: 26,
    fact: "Your brain uses about 20% of the total oxygen and energy your body produces.",
    category: "Biology",
    difficulty: 2
  },
  {
    id: 27,
    fact: "If you could fold a piece of paper 42 times, the thickness would be enough to reach the moon.",
    category: "Mathematics",
    difficulty: 3
  },
  {
    id: 28,
    fact: "Bananas are berries, but strawberries aren't.",
    category: "Biology",
    difficulty: 2
  },
  {
    id: 29,
    fact: "Butterflies taste with their feet.",
    category: "Biology",
    difficulty: 1
  },
  {
    id: 30,
    fact: "A day on Mercury is twice as long as its year.",
    category: "Space",
    difficulty: 2
  },
  {
    id: 31,
    fact: "The only food that doesn't spoil is honey.",
    category: "Food",
    difficulty: 1
  },
  {
    id: 32,
    fact: "In Switzerland, it's illegal to own just one guinea pig because they're social animals and get lonely.",
    category: "Culture",
    difficulty: 1
  },
  {
    id: 33,
    fact: "The Earth's core is hotter than the surface of the sun.",
    category: "Science",
    difficulty: 2
  },
  {
    id: 34,
    fact: "The shortest commercial flight in the world takes just 90 seconds.",
    category: "Transportation",
    difficulty: 1
  },
  {
    id: 35,
    fact: "Dolphins have names for each other and will respond when called by their name.",
    category: "Biology",
    difficulty: 2
  },
  {
    id: 36,
    fact: "The first message sent over the internet was 'LO'—it was supposed to be 'LOGIN' but the system crashed.",
    category: "Technology",
    difficulty: 2
  },
  {
    id: 37,
    fact: "A group of owls is called a 'parliament.'",
    category: "Nature",
    difficulty: 1
  },
  {
    id: 38,
    fact: "The Great Pyramid of Giza was the tallest man-made structure for over 3,800 years.",
    category: "History",
    difficulty: 2
  },
  {
    id: 39,
    fact: "The average person will walk the equivalent of five times around the Earth in their lifetime.",
    category: "Miscellaneous",
    difficulty: 1
  },
  {
    id: 40,
    fact: "There are more trees on Earth than stars in the Milky Way galaxy.",
    category: "Nature",
    difficulty: 2
  },
  {
    id: 41,
    fact: "The total weight of all the ants on Earth is greater than the weight of all the humans.",
    category: "Biology",
    difficulty: 2
  },
  {
    id: 42,
    fact: "The word 'OK' is one of the most recognized terms in the world and has a fascinating origin from the 1830s.",
    category: "Language",
    difficulty: 1
  },
  {
    id: 43,
    fact: "The blue whale's heart is so big that a human child could swim through its arteries.",
    category: "Biology",
    difficulty: 2
  },
  {
    id: 44,
    fact: "One million seconds is about 11 days, while one billion seconds is about 31.7 years.",
    category: "Mathematics",
    difficulty: 2
  },
  {
    id: 45,
    fact: "The Spanish national anthem has no words.",
    category: "Culture",
    difficulty: 1
  },
  {
    id: 46,
    fact: "A hummingbird weighs less than a penny.",
    category: "Nature",
    difficulty: 1
  },
  {
    id: 47,
    fact: "The human eye can distinguish between approximately 10 million different colors.",
    category: "Biology",
    difficulty: 2
  },
  {
    id: 48,
    fact: "The world's oldest known musical instrument is a flute made from a vulture's wing bone, around 40,000 years ago.",
    category: "Art",
    difficulty: 2
  },
  {
    id: 49,
    fact: "The smell of fresh-cut grass is actually a plant distress call.",
    category: "Science",
    difficulty: 2
  },
  {
    id: 50,
    fact: "Astronauts cannot cry in space because tears don't fall in zero gravity.",
    category: "Space",
    difficulty: 1
  }
];

// Function to get a random fact
export const getRandomFact = (): EducationalFact => {
  const randomIndex = Math.floor(Math.random() * educationalFacts.length);
  return educationalFacts[randomIndex];
};

// Hook to get a new fact periodically
export function useRotatingFact(intervalMs: number = 15000) {
  const [fact, setFact] = useState(getRandomFact());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFact(getRandomFact());
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [intervalMs]);
  
  return fact;
}