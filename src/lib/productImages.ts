export interface ProductImagePreset {
  id: string;
  name: string;
  category: string;
  url: string;
  description: string;
  tags: string[];
}

export const PRODUCT_IMAGE_PRESETS: ProductImagePreset[] = [
  {
    id: 'modular-kitchen',
    name: 'Modular Kitchen (Modern Acrylic / Quartz)',
    category: 'Modular Kitchen',
    url: '/products/modular-kitchen.jpg',
    description: 'High-end Indian modular kitchen with matte charcoal & champagne gold cabinets, quartz counter, and warm profile lighting.',
    tags: ['kitchen', 'modular', 'island', 'acrylic', 'chimney', 'cooktop', 'counter', 'cabinets']
  },
  {
    id: 'wardrobe',
    name: 'Master Wardrobe (Tinted Glass & Walnut)',
    category: 'Wardrobe',
    url: '/products/wardrobe.jpg',
    description: 'Floor-to-ceiling 4-door wardrobe with fluted tinted glass, champagne aluminum frame, and vertical LED strip lights.',
    tags: ['wardrobe', 'cupboard', 'closet', 'sliding', 'walk-in', 'loft', 'storage', 'fluted glass']
  },
  {
    id: 'bed',
    name: 'King Bed (Upholstered Headboard & Acoustic Panels)',
    category: 'Beds',
    url: '/products/bed.jpg',
    description: 'Designer king bed with fluted velvet extended headboard, floating teak side tables, and integrated warm sconce lighting.',
    tags: ['bed', 'beds', 'cot', 'headboard', 'bedroom', 'mattress', 'king bed', 'queen bed']
  },
  {
    id: 'tv-unit',
    name: 'TV Entertainment Console (Statuario Marble & Louvers)',
    category: 'TV Units',
    url: '/products/tv-unit.jpg',
    description: 'Floating media console with Italian marble backdrop, fluted teak acoustic louvers, and warm halo cove lighting.',
    tags: ['tv', 'tv unit', 'tv units', 'entertainment', 'console', 'living room', 'louvers', 'panel']
  },
  {
    id: 'bar-counter',
    name: 'Residential Bar Counter (Backlit Onyx & Brass)',
    category: 'Bar Counter – Residential',
    url: '/products/bar-counter.jpg',
    description: 'Bespoke home bar counter with illuminated amber onyx stone front, overhead brass stemware rack, and mirrored shelving.',
    tags: ['bar', 'bar counter', 'counter', 'beverage', 'stools', 'stemware', 'wine', 'liquor']
  },
  {
    id: 'temple-space',
    name: 'Temple Space / Pooja Mandir (CNC Jaali & Teak)',
    category: 'Temple Space',
    url: '/products/temple-space.jpg',
    description: 'Traditional yet contemporary pooja mandir with backlit CNC cut floral Om jaali, brass hanging bells, and Makrana marble base.',
    tags: ['temple', 'mandir', 'pooja', 'puja', 'temple space', 'temple stand', 'jaali', 'prayer']
  },
  {
    id: 'crockery-unit',
    name: 'Crockery Unit (Fluted Glass & Quartz Counter)',
    category: 'Crockery Unit',
    url: '/products/crockery-unit.jpg',
    description: 'Modern dining room crockery showcase with warm internal lighting, fluted glass profile doors, and walnut storage drawers.',
    tags: ['crockery', 'crockery unit', 'dining', 'showcase', 'buffet', 'glass cabinet', 'dinnerware']
  },
  {
    id: 'pop-ceiling',
    name: 'POP False Ceiling (Warm Cove & Recessed Spots)',
    category: 'POP',
    url: '/products/pop-ceiling.jpg',
    description: 'Multi-tiered gypsum POP ceiling with warm amber perimeter cove lighting, magnetic track lights, and teak rafter accents.',
    tags: ['pop', 'ceiling', 'false ceiling', 'gypsum', 'cove', 'lighting', 'rafters', 'fall ceiling']
  },
  {
    id: 'bathroom-vanity',
    name: 'Bathroom Vanity (Double Basin & Backlit Mirror)',
    category: 'Plumbing',
    url: '/products/bathroom-vanity.jpg',
    description: 'Floating teak double vanity counter with white quartz undermount sinks, brass fixtures, and circular backlit LED mirror.',
    tags: ['bathroom', 'vanity', 'plumbing', 'washbasin', 'mirror', 'sink', 'toilet', 'sanitary']
  },
  {
    id: 'balcony-terrace',
    name: 'Terrace & Balcony Garden (Pergola & Vertical Wall)',
    category: 'Terrace Design',
    url: '/products/balcony-terrace.jpg',
    description: 'Urban luxury high-rise balcony with wooden composite deck, vertical green plant wall, metal pergola with fairy lights.',
    tags: ['terrace', 'balcony', 'landscape', 'garden', 'deck', 'pergola', 'turf', 'outdoor', 'residential landscape']
  },
  {
    id: 'partition-fabrication',
    name: 'Metal & Glass Partition (Fluted Room Divider)',
    category: 'Fabrication',
    url: '/products/partition-fabrication.jpg',
    description: 'Sleek black powder-coated metal fabrication partition with ribbed acoustic fluted glass dividing living and dining spaces.',
    tags: ['partition', 'fabrication', 'divider', 'grill', 'fluted glass', 'sliding door', 'railing', 'metal']
  },
  {
    id: 'marble-tiles',
    name: 'Marble Flooring & Tiling (Statuario & Brass Inlay)',
    category: 'Tiles / Granite / Marble',
    url: '/products/marble-tiles.jpg',
    description: 'Luxury Italian Statuario marble floor with geometric brass inlay borders and high-gloss mirror finish.',
    tags: ['tiles', 'tile', 'marble', 'granite', 'flooring', 'inlay', 'vitrified', 'stone']
  },
  {
    id: 'designer-paint',
    name: 'Designer Paint & Limewash (Venetian Texture Wall)',
    category: 'Paints',
    url: '/products/designer-paint.jpg',
    description: 'Terracotta and warm sand Venetian plaster texture accent wall with wall sconce grazing lighting.',
    tags: ['paints', 'paint', 'painting', 'texture', 'limewash', 'plaster', 'royale', 'emulsion', 'accent wall']
  }
];

/**
 * Intelligently resolve the most relevant professional Indian interior image
 * based on selected category, free-text type, and work specifications/description.
 */
export function resolveProductImage(
  categoryName?: string,
  type?: string,
  description?: string,
  customImageUrl?: string
): string {
  if (customImageUrl && customImageUrl.trim().length > 0) {
    return customImageUrl.trim();
  }

  const combined = `${categoryName || ''} ${type || ''} ${description || ''}`.toLowerCase();

  // Keyword-based priority checks
  if (combined.includes('pooja') || combined.includes('mandir') || combined.includes('temple')) {
    return '/products/temple-space.jpg';
  }
  if (combined.includes('crockery') || combined.includes('dinnerware') || combined.includes('buffet unit')) {
    return '/products/crockery-unit.jpg';
  }
  if (combined.includes('bar counter') || combined.includes('home bar') || (combined.includes('bar') && !combined.includes('wardrobe'))) {
    return '/products/bar-counter.jpg';
  }
  if (combined.includes('tv unit') || combined.includes('tv console') || combined.includes('entertainment unit') || combined.includes('media console')) {
    return '/products/tv-unit.jpg';
  }
  if (combined.includes('wardrobe') || combined.includes('cupboard') || combined.includes('closet') || combined.includes('walk-in')) {
    return '/products/wardrobe.jpg';
  }
  if (combined.includes('kitchen') || combined.includes('modular kitchen') || combined.includes('chimney') || combined.includes('countertop')) {
    return '/products/modular-kitchen.jpg';
  }
  if (combined.includes('bed') || combined.includes('cot') || combined.includes('headboard') || combined.includes('mattress')) {
    return '/products/bed.jpg';
  }
  if (combined.includes('pop') || combined.includes('false ceiling') || combined.includes('cove light') || combined.includes('gypsum')) {
    return '/products/pop-ceiling.jpg';
  }
  if (combined.includes('vanity') || combined.includes('bathroom') || combined.includes('plumbing') || combined.includes('washbasin')) {
    return '/products/bathroom-vanity.jpg';
  }
  if (combined.includes('terrace') || combined.includes('balcony') || combined.includes('landscape') || combined.includes('garden')) {
    return '/products/balcony-terrace.jpg';
  }
  if (combined.includes('partition') || combined.includes('fabrication') || combined.includes('fluted glass') || combined.includes('divider') || combined.includes('grill')) {
    return '/products/partition-fabrication.jpg';
  }
  if (combined.includes('marble') || combined.includes('granite') || combined.includes('tiles') || combined.includes('flooring')) {
    return '/products/marble-tiles.jpg';
  }
  if (combined.includes('paint') || combined.includes('texture') || combined.includes('royale') || combined.includes('limewash')) {
    return '/products/designer-paint.jpg';
  }

  // Fallback to Category Name matches
  const cat = (categoryName || '').trim().toLowerCase();
  if (cat.includes('kitchen')) return '/products/modular-kitchen.jpg';
  if (cat.includes('wardrobe')) return '/products/wardrobe.jpg';
  if (cat.includes('bed')) return '/products/bed.jpg';
  if (cat.includes('tv')) return '/products/tv-unit.jpg';
  if (cat.includes('bar')) return '/products/bar-counter.jpg';
  if (cat.includes('temple')) return '/products/temple-space.jpg';
  if (cat.includes('crockery')) return '/products/crockery-unit.jpg';
  if (cat.includes('pop') || cat.includes('ceiling')) return '/products/pop-ceiling.jpg';
  if (cat.includes('plumbing') || cat.includes('bath')) return '/products/bathroom-vanity.jpg';
  if (cat.includes('landscape') || cat.includes('terrace') || cat.includes('balcony')) return '/products/balcony-terrace.jpg';
  if (cat.includes('fabrication')) return '/products/partition-fabrication.jpg';
  if (cat.includes('tile') || cat.includes('granite') || cat.includes('marble')) return '/products/marble-tiles.jpg';
  if (cat.includes('paint')) return '/products/designer-paint.jpg';
  if (cat.includes('electrical')) return '/products/pop-ceiling.jpg';
  if (cat.includes('carpenter')) return '/products/wardrobe.jpg';

  return '/products/modular-kitchen.jpg';
}

/**
 * Helper to convert an image URL (relative or absolute) to a base64 Data URL.
 * Cached in memory for speed during PDF generation.
 */
const imageBase64Cache = new Map<string, string>();

export async function getBase64ImageFromUrl(imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('data:image/')) return imageUrl;

  if (imageBase64Cache.has(imageUrl)) {
    return imageBase64Cache.get(imageUrl)!;
  }

  try {
    if (typeof window === 'undefined') {
      return null;
    }

    const response = await fetch(imageUrl);
    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        imageBase64Cache.set(imageUrl, base64data);
        resolve(base64data);
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Failed to load image for base64:', imageUrl, err);
    return null;
  }
}
