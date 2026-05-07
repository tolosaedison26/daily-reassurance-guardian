// Card pair sets for Memory Match
// Each set provides enough pairs for standard (8 pairs) or easy (6 pairs) mode

export interface CardPair {
  key: string;
  label: string;
}

export const CARD_SETS: CardPair[][] = [
  // Set 1: Nature
  [
    { key: "sun", label: "Sun" },
    { key: "moon", label: "Moon" },
    { key: "star", label: "Star" },
    { key: "cloud", label: "Cloud" },
    { key: "rain", label: "Rain" },
    { key: "snow", label: "Snow" },
    { key: "tree", label: "Tree" },
    { key: "leaf", label: "Leaf" },
  ],
  // Set 2: Animals
  [
    { key: "cat", label: "Cat" },
    { key: "dog", label: "Dog" },
    { key: "bird", label: "Bird" },
    { key: "fish", label: "Fish" },
    { key: "frog", label: "Frog" },
    { key: "bear", label: "Bear" },
    { key: "duck", label: "Duck" },
    { key: "deer", label: "Deer" },
  ],
  // Set 3: Food
  [
    { key: "apple", label: "Apple" },
    { key: "bread", label: "Bread" },
    { key: "cake", label: "Cake" },
    { key: "grape", label: "Grape" },
    { key: "lemon", label: "Lemon" },
    { key: "peach", label: "Peach" },
    { key: "corn", label: "Corn" },
    { key: "plum", label: "Plum" },
  ],
  // Set 4: Home
  [
    { key: "chair", label: "Chair" },
    { key: "clock", label: "Clock" },
    { key: "lamp", label: "Lamp" },
    { key: "door", label: "Door" },
    { key: "table", label: "Table" },
    { key: "couch", label: "Couch" },
    { key: "shelf", label: "Shelf" },
    { key: "towel", label: "Towel" },
  ],
  // Set 5: Colors
  [
    { key: "red", label: "Red" },
    { key: "blue", label: "Blue" },
    { key: "green", label: "Green" },
    { key: "gold", label: "Gold" },
    { key: "pink", label: "Pink" },
    { key: "gray", label: "Gray" },
    { key: "brown", label: "Brown" },
    { key: "white", label: "White" },
  ],
];
