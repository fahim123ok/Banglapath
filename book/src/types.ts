export type FrameStyle = 
  | 'polaroid' 
  | 'vintage-tape' 
  | 'minimal' 
  | 'filmstrip' 
  | 'golden-border' 
  | 'rounded' 
  | 'stamp-border';

export type PhotoFilter = 
  | 'none' 
  | 'warm' 
  | 'sepia' 
  | 'bw' 
  | 'vintage' 
  | 'vivid' 
  | 'cool';

export type TapeStyle = 
  | 'washi-gold' 
  | 'washi-pink' 
  | 'washi-teal' 
  | 'kraft-tape' 
  | 'clear-tape' 
  | 'none';

export type PaperTexture = 
  | 'parchment' 
  | 'linen' 
  | 'kraft' 
  | 'vintage-floral' 
  | 'midnight' 
  | 'watercolor' 
  | 'grid';

export type FontFamily = 
  | 'Caveat' 
  | 'Playfair Display' 
  | 'Kalam' 
  | 'Dancing Script' 
  | 'Courier Prime' 
  | 'Cinzel' 
  | 'Outfit' 
  | 'Plus Jakarta Sans';

export type PageLayout = 
  | 'cover'
  | 'single-hero' 
  | 'polaroid-duo' 
  | 'triple-story' 
  | 'quad-scrapbook' 
  | 'journal-photo' 
  | 'back-cover';

export type StickerType = 
  | 'heart' 
  | 'star' 
  | 'camera' 
  | 'plane' 
  | 'flower' 
  | 'coffee' 
  | 'pin' 
  | 'stamp' 
  | 'sparkle' 
  | 'quote';

export interface PhotoItem {
  id: string;
  url: string;
  caption: string;
  date?: string;
  location?: string;
  frameStyle: FrameStyle;
  filter: PhotoFilter;
  rotation: number; // in degrees e.g. -4 to 4
  tapeStyle: TapeStyle;
}

export interface StickerItem {
  id: string;
  type: StickerType;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  rotation: number;
  scale: number;
}

export interface PageStyle {
  fontFamily: FontFamily;
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  titleColor: string;
  bodyColor: string;
  paperTexture: PaperTexture;
  titleAlignment: 'left' | 'center' | 'right';
  showPageNumber: boolean;
  ornamentStyle: 'none' | 'botanical' | 'vintage-flourish' | 'minimal-line';
}

export interface AlbumPage {
  id: string;
  pageNumber: number;
  title: string;
  subtitle?: string;
  journalNotes: string;
  layout: PageLayout;
  photos: PhotoItem[];
  stickers: StickerItem[];
  style: PageStyle;
}

export type CoverColor = 
  | 'leather-brown' 
  | 'burgundy' 
  | 'forest-green' 
  | 'navy-blue' 
  | 'velvet-black' 
  | 'vintage-cream';

export interface AlbumBook {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  coverColor: CoverColor;
  goldEmbossing: boolean;
  pages: AlbumPage[];
  updatedAt: string;
}
