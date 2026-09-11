export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  addressName?: string;
  isCustom?: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
  distanceMiles: number;
  address: string;
  phone?: string;
  website?: string;
  emergency: boolean;
  openingHours?: string;
  operator?: string;
  type: 'general' | 'specialized' | 'clinic' | 'urgent_care';
  imageUrl: string;
  rating: number;
  reviewCount: number;
  estimatedDriveMinutes: number;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  streetName?: string;
  modifier?: string;
  type?: string;
}

export interface RouteData {
  coordinates: [number, number][]; // [lat, lng] array
  distanceKm: number;
  distanceMiles: number;
  durationMinutes: number;
  summary: string;
  steps: RouteStep[];
  mode: 'driving' | 'walking' | 'cycling';
}

export interface HospitalFilter {
  onlyEmergency: boolean;
  maxDistanceKm: number;
  searchQuery: string;
  sortBy: 'distance' | 'rating';
}

// Album Book Types (Maintained for full project backward compatibility)
export type FontFamily = 'Plus Jakarta Sans' | 'Outfit' | 'Playfair Display' | 'Caveat' | 'Dancing Script' | 'Cinzel' | 'Courier Prime' | 'Kalam';
export type PaperTexture = 'clean' | 'vintage-parchment' | 'lined' | 'grid' | 'dot-grid' | 'kraft' | 'parchment' | 'linen' | 'vintage-floral' | 'watercolor' | 'midnight';
export type PageLayout = 'single-large' | 'dual-portrait' | 'triple-story' | 'quad-grid' | 'scrapbook-collage' | 'journal-left' | 'single-hero' | 'polaroid-duo' | 'quad-scrapbook' | 'journal-photo';
export type FrameStyle = 'polaroid' | 'classic-white' | 'vintage-film' | 'gold-embossed' | 'wooden' | 'torn-paper' | 'modern-borderless' | 'vintage-tape' | 'golden-border' | 'filmstrip' | 'stamp-border' | 'rounded' | 'minimal';
export type PhotoFilter = 'none' | 'sepia' | 'vintage' | 'warm-sunset' | 'black-white' | 'faded-dream' | 'high-contrast' | 'warm' | 'bw' | 'vivid' | 'cool';
export type TapeStyle = 'none' | 'washi-pink' | 'washi-gold' | 'kraft-tape' | 'corner-pins' | 'scotch-clear' | 'washi-teal' | 'clear-tape';
export type StickerType = 'heart' | 'star' | 'camera' | 'sparkles' | 'sparkle' | 'flower' | 'coffee' | 'plane' | 'pin' | 'stamp' | 'ribbon' | 'quote';
export type CoverColor = 'emerald' | 'crimson' | 'midnight-navy' | 'leather-brown' | 'rose-gold' | 'obsidian' | 'burgundy' | 'forest-green' | 'navy-blue' | 'velvet-black' | 'vintage-cream';

export interface PhotoItem {
  id: string;
  url: string;
  caption: string;
  date?: string;
  note?: string;
  location?: string;
  rotation?: number;
  frameStyle: FrameStyle;
  filter: PhotoFilter;
  tapeStyle: TapeStyle;
  scale?: number;
}

export interface StickerItem {
  id: string;
  type: StickerType;
  xPercent?: number;
  yPercent?: number;
  x?: number;
  y?: number;
  rotation: number;
  scale: number;
  color?: string;
}

export interface AlbumPage {
  id: string;
  pageNumber: number;
  title: string;
  subtitle?: string;
  fontFamily?: FontFamily;
  titleColor?: string;
  paperTexture?: PaperTexture;
  layout: PageLayout;
  photos: PhotoItem[];
  stickers: StickerItem[];
  journalText?: string;
  journalNotes?: string;
  style?: any;
  createdAt?: string;
}

export interface AlbumBook {
  id: string;
  title: string;
  author: string;
  subtitle: string;
  coverColor: CoverColor;
  coverTexture?: 'leather' | 'linen' | 'velvet' | 'matte';
  goldEmbossing?: boolean;
  pages: AlbumPage[];
  createdDate?: string;
  updatedAt?: string;
}
