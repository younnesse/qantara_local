export interface Provider {
  id: string
  name: string
  title: string
  category: string
  rating: number
  reviewCount: number
  image: string
  bio: string
  location?: string
  services: { name: string; price: number; duration: string }[]
  availability: string[]
  verified: boolean
}

export interface Review {
  id: string
  authorName: string
  authorImage: string
  rating: number
  date: string
  comment: string
}

export const ALGERIAN_WILAYAS = [
  "Adrar", "Aflou", "Aïn Defla", "Aïn Oussera", "Aïn Témouchent", "Alger", "Annaba", "Barika", "Batna", "Béchar",
  "Béjaïa", "Béni Abbès", "Bir El Ater", "Biskra", "Blida", "Bordj Baji Mokhtar", "Bordj Bou Arreridj", "Bou Saâda", "Bouira", "Boumerdès",
  "Chlef", "Constantine", "Djanet", "Djelfa", "El Abiodh Sidi Cheikh", "El Aricha", "El Bayadh", "El Kantara", "El M'Ghair", "El Meniaa",
  "El Oued", "El Tarf", "Ghardaïa", "Guelma", "Illizi", "In Guezzam", "In Salah", "Jijel", "Khenchela", "Ksar Chellala",
  "Ksar El Boukhari", "Laghouat", "M'Sila", "Mascara", "Médéa", "Messaad", "Mila", "Mostaganem", "Naâma", "Oran",
  "Ouargla", "Ouled Djellal", "Oum El Bouaghi", "Relizane", "Saïda", "Sétif", "Sidi Bel Abbès", "Skikda", "Souk Ahras", "Tamanrasset",
  "Tébessa", "Tiaret", "Timimoun", "Tindouf", "Tipaza", "Tissemsilt", "Tizi Ouzou", "Tlemcen", "Touggourt"
];

export const categories = [
  { id: "regulated_profession", name: "Professions Libérales", icon: "Shield" },
  { id: "artisan", name: "Artisans & Métiers Techniques", icon: "Wrench" },
  { id: "auto_entrepreneur", name: "Auto-Entrepreneurs", icon: "Briefcase" },
]
