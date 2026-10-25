// Every store the aggregator pulls from. Adding a store on a supported platform is one entry here.
// short: compact name for small cards; badge: the two-character monogram shown in store badges.
// imageCdn: serve images through WordPress's public image CDN (i0.wp.com), for stores whose own
// image host blocks hotlinking (Cloudflare challenge) or is unreliable.
export const STORES = [
  { id: "uge", name: "UGE", short: "UGE", badge: "UG", url: "https://uge-one.com", platform: "woocommerce" },
  { id: "ram", name: "RAM Electronics", short: "RAM", badge: "RA", url: "https://www.ram-e-shop.com", platform: "odoo" },
  { id: "makers", name: "Makers Electronics", short: "Makers", badge: "MK", url: "https://makerselectronics.com", platform: "woocommerce", imageCdn: true },
  { id: "free", name: "Free Electronic", short: "Free", badge: "FE", url: "https://free-electronic.com", platform: "woocommerce" },
  { id: "microohm", name: "Micro Ohm", short: "Micro Ohm", badge: "MΩ", url: "https://microohm-eg.com", platform: "woocommerce" },
  { id: "most", name: "Most Electronic", short: "Most", badge: "MS", url: "https://mostelectronic.com", platform: "woocommerce" },
  { id: "lancer3d", name: "Lancer3D", short: "Lancer3D", badge: "L3", url: "https://lancer3d.com", platform: "woocommerce" },
  { id: "ekostra", name: "Ekostra", short: "Ekostra", badge: "EK", url: "https://ekostra.com", platform: "woocommerce" },
  { id: "3duino", name: "3DUINO", short: "3DUINO", badge: "3D", url: "https://www.3duino.com", platform: "woocommerce" },
  { id: "electrohub", name: "ElectroHub", short: "ElectroHub", badge: "EH", url: "https://electrohub-eg.com", platform: "woocommerce", imageCdn: true },
];
