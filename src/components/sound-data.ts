import soundRain from "@/assets/sound-rain.jpg";
import soundOcean from "@/assets/sound-ocean.jpg";
import soundForest from "@/assets/sound-forest.jpg";
import soundNight from "@/assets/sound-night.jpg";
import soundBirds from "@/assets/sound-birds.jpg";
import soundStream from "@/assets/sound-stream.jpg";
import soundFire from "@/assets/sound-fire.jpg";
import soundThunder from "@/assets/sound-thunder.jpg";
import soundWind from "@/assets/sound-wind.jpg";
import soundBowl from "@/assets/sound-bowl.jpg";
import soundWhiteNoise from "@/assets/sound-whitenoise.jpg";

export type Category = "nature" | "sleep" | "relax" | "weather";

export interface Sound {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  emoji: string;
  color: string;
  category: Category;
}

export const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: "nature", label: "Nature", emoji: "🌿" },
  { id: "sleep", label: "Sleep", emoji: "😴" },
  { id: "relax", label: "Relax", emoji: "🧘" },
  { id: "weather", label: "Weather", emoji: "⛅" },
];

export const SOUNDS: Sound[] = [
  // Nature
  { id: "forest", title: "Forest Walk", subtitle: "Birds & breeze", image: soundForest, emoji: "🌲", color: "hsl(142 45% 30%)", category: "nature" },
  { id: "ocean", title: "Ocean Waves", subtitle: "Peaceful shoreline", image: soundOcean, emoji: "🌊", color: "hsl(195 70% 35%)", category: "nature" },
  { id: "birds", title: "Morning Birds", subtitle: "Cheerful birdsong", image: soundBirds, emoji: "🐦", color: "hsl(45 80% 35%)", category: "nature" },
  { id: "stream", title: "Gentle Stream", subtitle: "Bubbling water", image: soundStream, emoji: "💧", color: "hsl(200 50% 40%)", category: "nature" },
  // Sleep
  { id: "night", title: "Night Ambience", subtitle: "Crickets & stars", image: soundNight, emoji: "🌙", color: "hsl(245 40% 30%)", category: "sleep" },
  { id: "whitenoise", title: "White Noise", subtitle: "Soft static hum", image: soundWhiteNoise, emoji: "☁️", color: "hsl(210 20% 60%)", category: "sleep" },
  { id: "fire", title: "Campfire", subtitle: "Warm crackling", image: soundFire, emoji: "🔥", color: "hsl(20 90% 40%)", category: "sleep" },
  // Relax
  { id: "bowl", title: "Singing Bowl", subtitle: "Zen meditation", image: soundBowl, emoji: "🔔", color: "hsl(40 70% 40%)", category: "relax" },
  { id: "rain", title: "Gentle Rain", subtitle: "Soft pitter-patter", image: soundRain, emoji: "🌧", color: "hsl(210 60% 35%)", category: "relax" },
  // Weather
  { id: "thunder", title: "Thunderstorm", subtitle: "Rain & thunder", image: soundThunder, emoji: "⛈️", color: "hsl(270 40% 35%)", category: "weather" },
  { id: "wind", title: "Wind", subtitle: "Breezy gusts", image: soundWind, emoji: "💨", color: "hsl(35 60% 45%)", category: "weather" },
];
