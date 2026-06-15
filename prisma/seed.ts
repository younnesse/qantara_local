import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.join(__dirname, "..", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing old data...');
  await prisma.review.deleteMany();
  await prisma.service.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.authorityCertificate.deleteMany();
  await prisma.regulatoryBody.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.autoEntrepreneurActivity.deleteMany();
  await prisma.professionalCategory.deleteMany();

  console.log('Seeding professional categories...');
  const regulatedCat = await prisma.professionalCategory.create({
    data: {
      name: "regulated_profession",
      nameFr: "Professions Libérales Réglementées",
      nameEn: "Regulated Liberal Professions",
      nameAr: "المهن الحرة المنظمة",
      description: "Professions à haut risque réglementées par un Ordre national ou Ministère.",
      icon: "Shield",
      color: "blue",
      order: 1
    }
  });

  const artisanCat = await prisma.professionalCategory.create({
    data: {
      name: "artisan",
      nameFr: "Artisans & Métiers Techniques",
      nameEn: "Artisans & Technical Trades",
      nameAr: "الحرفيين والمهن التقنية",
      description: "Professionnels techniques certifiés détenteurs de la carte CNAM.",
      icon: "Wrench",
      color: "amber",
      order: 2
    }
  });

  const autoEntCat = await prisma.professionalCategory.create({
    data: {
      name: "auto_entrepreneur",
      nameFr: "Auto-Entrepreneurs",
      nameEn: "Auto-Entrepreneurs",
      nameAr: "مقاولون ذاتيون",
      description: "Professionnels indépendants enregistrés auprès de l'ANAE.",
      icon: "Briefcase",
      color: "teal",
      order: 3
    }
  });

  console.log('Seeding regulatory bodies (Category 1)...');
  const bodiesData = [
    { code: "CNOM", name: "Conseil National de l'Ordre des Médecins", nameFr: "Conseil National de l'Ordre des Médecins", nameEn: "National Council of the Order of Physicians", nameAr: "المجلس الوطني لعمادة الأطباء", licenseLabel: "Numéro d'inscription au tableau" },
    { code: "CNOP", name: "Conseil National de l'Ordre des Pharmaciens", nameFr: "Conseil National de l'Ordre des Pharmaciens", nameEn: "National Council of the Order of Pharmacists", nameAr: "المجلس الوطني لعمادة الصيادلة", licenseLabel: "Numéro d'inscription au tableau" },
    { code: "CNOCD", name: "Conseil National de l'Ordre des Chirurgiens-Dentistes", nameFr: "Conseil National de l'Ordre des Chirurgiens-Dentistes", nameEn: "National Council of the Order of Dental Surgeons", nameAr: "المجلس الوطني لعمادة جراحي الأسنان", licenseLabel: "Numéro d'inscription au tableau" },
    { code: "CNOV", name: "Conseil National de l'Ordre des Vétérinaires", nameFr: "Conseil National de l'Ordre des Vétérinaires", nameEn: "National Council of the Order of Veterinarians", nameAr: "المجلس الوطني لعمادة الأطباء البطريين", licenseLabel: "Numéro d'inscription au tableau" },
    { code: "CNOA", name: "Conseil National de l'Ordre des Architectes", nameFr: "Conseil National de l'Ordre des Architectes", nameEn: "National Council of the Order of Architects", nameAr: "المجلس الوطني لعمادة المهندسين المعماريين", licenseLabel: "Numéro d'inscription au tableau" },
    { code: "OGEF", name: "Ordre des Géomètres-Experts Fonciers", nameFr: "Ordre des Géomètres-Experts Fonciers", nameEn: "Order of Land Surveyors", nameAr: "منظمة الهندسة الطبوغرافية والمسح العقاري", licenseLabel: "Numéro d'inscription au tableau" },
    { code: "ONEC", name: "Ordre National des Experts-Comptables", nameFr: "Ordre National des Experts-Comptables, Commissaires aux Comptes et Comptables Agréés", nameEn: "National Order of Chartered Accountants", nameAr: "المنظمة الوطنية للخبراء المحاسبين ومحافظي الحسابات", licenseLabel: "Numéro d'inscription" },
    { code: "UNBA", name: "Union Nationale des Barreaux d'Algérie", nameFr: "Union Nationale des Barreaux d'Algérie", nameEn: "National Union of Algerian Bars", nameAr: "الاتحاد الوطني لمنظمات المحامين", licenseLabel: "Numéro de carte professionnelle" },
    { code: "CH_NOT", name: "Chambre Nationale des Notaires", nameFr: "Chambre Nationale des Notaires", nameEn: "National Chamber of Notaries", nameAr: "الغرفة الوطنية للموثقين", licenseLabel: "Numéro d'agrément" },
    { code: "CH_HUI", name: "Chambre Nationale des Huissiers de Justice", nameFr: "Chambre Nationale des Huissiers de Justice", nameEn: "National Chamber of Judicial Officers", nameAr: "الغرفة الوطنية للمحضرين القضائيين", licenseLabel: "Numéro d'agrément" },
    { code: "CH_CP", name: "Chambre Nationale des Commissaires-Priseurs", nameFr: "Chambre Nationale des Commissaires-Priseurs", nameEn: "National Chamber of Auctioneers", nameAr: "الغرفة الوطنية لمثمني ومحققي المبيعات", licenseLabel: "Numéro d'agrément" }
  ];

  const bodies: Record<string, any> = {};
  for (const b of bodiesData) {
    bodies[b.code] = await prisma.regulatoryBody.create({
      data: { ...b, categoryId: regulatedCat.id }
    });
  }

  console.log('Seeding trades (Category 2)...');
  const tradesData = [
    { name: "ELECTRICIEN", nameFr: "Électricien", nameEn: "Electrician", nameAr: "كهربائي", cnamCode: "CNAM-ELE" },
    { name: "PLOMBIER", nameFr: "Plombier", nameEn: "Plumber", nameAr: "رصاص", cnamCode: "CNAM-PLOM" },
    { name: "MACON", nameFr: "Maçon", nameEn: "Mason", nameAr: "بناء", cnamCode: "CNAM-MAC" },
    { name: "CARRELEUR", nameFr: "Carreleur", nameEn: "Tiler", nameAr: "مبلط", cnamCode: "CNAM-CAR" },
    { name: "PEINTRE", nameFr: "Peintre en bâtiment", nameEn: "House Painter", nameAr: "دهان", cnamCode: "CNAM-PEI" },
    { name: "PLATRIER", nameFr: "Plâtrier", nameEn: "Plasterer", nameAr: "جباس", cnamCode: "CNAM-PLA" },
    { name: "ETANCHEUR", nameFr: "Étancheur", nameEn: "Waterproofer", nameAr: "عازل", cnamCode: "CNAM-ETA" },
    { name: "MENUISIER", nameFr: "Menuisier", nameEn: "Carpenter", nameAr: "نجار", cnamCode: "CNAM-MEN" },
    { name: "COIFFEUR", nameFr: "Coiffeur / Barbier", nameEn: "Hairdresser / Barber", nameAr: "حلاق", cnamCode: "CNAM-COI" },
    { name: "BOULANGER", nameFr: "Boulanger", nameEn: "Baker", nameAr: "خباز", cnamCode: "CNAM-BOU" },
    { name: "PATISSIER", nameFr: "Pâtissier", nameEn: "Pastry Chef", nameAr: "حلواني", cnamCode: "CNAM-PAT" },
    { name: "COUTURIER", nameFr: "Couturier", nameEn: "Tailor / Fashion Designer", nameAr: "خياط", cnamCode: "CNAM-COU" },
    { name: "REPARATEUR_ELEC", nameFr: "Réparateur électronique", nameEn: "Electronics Repairer", nameAr: "مصلح إلكترونيات", cnamCode: "CNAM-REP" },
    { name: "MECANICIEN_AUTO", nameFr: "Mécanicien automobile", nameEn: "Car Mechanic", nameAr: "ميكانيكي سيارات", cnamCode: "CNAM-MEC-AUTO" }
  ];

  const trades: Record<string, any> = {};
  for (const t of tradesData) {
    trades[t.name] = await prisma.trade.create({
      data: { ...t, categoryId: artisanCat.id }
    });
  }

  console.log('Seeding auto-entrepreneur activities (Category 3)...');
  const activitiesData = [
    { name: "WEB_DEV", nameFr: "Développement Web", nameEn: "Web Development", nameAr: "تطوير الويب", anaeCode: "ANAE-DEV-WEB" },
    { name: "MOBILE_DEV", nameFr: "Développement Mobile", nameEn: "Mobile Development", nameAr: "تطوير تطبيقات الهاتف", anaeCode: "ANAE-DEV-MOB" },
    { name: "UI_UX", nameFr: "Design UI/UX", nameEn: "UI/UX Design", nameAr: "تصميم واجهة وتجربة المستخدم", anaeCode: "ANAE-DES-UI" },
    { name: "GRAPHIC_DESIGN", nameFr: "Design Graphique", nameEn: "Graphic Design", nameAr: "تصميم جرافيكي", anaeCode: "ANAE-DES-GR" },
    { name: "CONSULTING_IT", nameFr: "Consulting Informatique", nameEn: "IT Consulting", nameAr: "استشارات تقنية المعلومات", anaeCode: "ANAE-CON-IT" },
    { name: "DIGITAL_MARKETING", nameFr: "Marketing Digital", nameEn: "Digital Marketing", nameAr: "التسويق الرقمي", anaeCode: "ANAE-MKT-DIG" },
    { name: "SEO", nameFr: "SEO / SEM", nameEn: "SEO / SEM", nameAr: "تحسين محركات البحث", anaeCode: "ANAE-MKT-SEO" },
    { name: "PHOTO", nameFr: "Photographie", nameEn: "Photography", nameAr: "التصوير الفوتوغرافي", anaeCode: "ANAE-MED-PH" },
    { name: "VIDEO", nameFr: "Vidéographie / Tournage", nameEn: "Videography", nameAr: "تصوير الفيديو", anaeCode: "ANAE-MED-VI" },
    { name: "CLEANING", nameFr: "Nettoyage / Entretien", nameEn: "Cleaning & Maintenance", nameAr: "خدمات التنظيف", anaeCode: "ANAE-SRV-CLE" },
    { name: "CATERING", nameFr: "Traiteur / Restauration", nameEn: "Catering", nameAr: "إطعام وتحضير الحفلات", anaeCode: "ANAE-FOD-CAT" },
    { name: "COACHING", nameFr: "Coaching & Formation", nameEn: "Coaching & Training", nameAr: "التدريب والتعليم", anaeCode: "ANAE-SRV-COA" }
  ];

  const activities: Record<string, any> = {};
  for (const a of activitiesData) {
    activities[a.name] = await prisma.autoEntrepreneurActivity.create({
      data: { ...a, categoryId: autoEntCat.id }
    });
  }

  console.log('Seeding admin account...');
  const adminPassword = await bcrypt.hash("admin", 10);
  await prisma.admin.create({
    data: {
      email: 'admin@qantara.com',
      name: 'System Administrator',
      password: adminPassword,
    }
  });

  console.log('Seeding authority certificates registry...');
  const certs = [
    // Category 1
    { certId: "12345/2020", holderName: "Amina Saidi", receivedDate: new Date("2020-05-15"), category: "regulated_profession" },
    { certId: "DOC-12345", holderName: "Amina Saidi", receivedDate: new Date("2020-05-15"), category: "regulated_profession" },
    { certId: "DOC-67890", holderName: "Dr. Karim Benali", receivedDate: new Date("2018-09-20"), category: "regulated_profession" },
    // Category 2
    { certId: "16-123456-20", holderName: "Karim Benali", receivedDate: new Date("2020-06-30"), category: "artisan" },
    { certId: "CNAM-PLOM-99", holderName: "Yacine Mansouri", receivedDate: new Date("2019-11-10"), category: "artisan" },
    { certId: "CNAM-MENU-88", holderName: "Farid Najar", receivedDate: new Date("2017-03-25"), category: "artisan" },
    { certId: "CNAM-MEC-77", holderName: "Tarek Boulahia", receivedDate: new Date("2022-01-12"), category: "artisan" },
    // Category 3
    { certId: "AE-123456-2024", holderName: "Sofiane Haddad", receivedDate: new Date("2024-01-15"), category: "auto_entrepreneur" },
    { certId: "ANAE-PHOTO-01", holderName: "Ryad Photographe", receivedDate: new Date("2023-04-01"), category: "auto_entrepreneur" },
    { certId: "ANAE-CAT-02", holderName: "Meriem Traiteur", receivedDate: new Date("2022-08-15"), category: "auto_entrepreneur" },
    { certId: "ANAE-COA-03", holderName: "Leila Kaddour", receivedDate: new Date("2021-02-10"), category: "auto_entrepreneur" },
  ];
  for (const cert of certs) {
    await prisma.authorityCertificate.create({ data: cert });
  }

  console.log('Seeding database with Algerian providers mapped to the new 3-category system...');
  const userPassword = await bcrypt.hash("password123", 10);

  // 1. Karim Benali (Artisan - Electrician)
  await prisma.provider.create({
    data: {
      email: 'karim.benali@example.dz',
      name: 'Karim Benali',
      password: userPassword,
      title: 'Électricien Bâtiment Certifié',
      category: 'artisan',
      professionalCategoryId: artisanCat.id,
      tradeId: trades["ELECTRICIEN"].id,
      cnamCardNumber: "16-123456-20",
      cnamCardStatus: "VERIFIED",
      certificateStatus: 'VALID',
      isProfileComplete: true,
      phoneNumber: '0555123456',
      location: 'Alger',
      rating: 4.8, reviewCount: 32,
      bio: "Électricien avec plus de 10 ans d'expérience à Alger. Intervention rapide et travail garanti.",
      profileImage: '/providers/dr-karim-benali.png',
      services: { create: [
        { name: 'Installation Électrique Générale', description: 'Installation complète pour nouveaux appartements ou rénovations.', price: 5000, duration: 180, category: 'artisan' },
        { name: "Dépannage d'urgence", description: 'Intervention rapide pour les courts-circuits et pannes de courant.', price: 2500, duration: 60, category: 'artisan' }
      ]}
    }
  });

  // 2. Amina Saidi (Professions Libérales - Médecin)
  await prisma.provider.create({
    data: {
      email: 'amina.saidi@example.dz',
      name: 'Amina Saidi',
      password: userPassword,
      title: 'Médecin Généraliste (CNOM)',
      category: 'regulated_profession',
      professionalCategoryId: regulatedCat.id,
      regulatoryBodyId: bodies["CNOM"].id,
      licenseNumber: "DOC-12345",
      licenseStatus: "VERIFIED",
      certificateStatus: 'VALID',
      isProfileComplete: true,
      phoneNumber: '0770987654',
      location: 'Constantine',
      rating: 4.9, reviewCount: 45,
      bio: 'Services de consultation médicale et suivi général de santé. Plus de 8 ans de pratique hospitalière.',
      profileImage: '/providers/dr-amina-hadjsaid.png',
      services: { create: [
        { name: 'Consultation Médicale Générale', description: 'Examen complet, prescription et conseils de santé.', price: 3000, duration: 30, category: 'regulated_profession' },
        { name: 'Suivi de Tension & Glycémie', description: 'Suivi régulier des maladies chroniques à domicile ou cabinet.', price: 1500, duration: 20, category: 'regulated_profession' }
      ]}
    }
  });

  // 3. Yacine Mansouri (Artisan - Plumber)
  await prisma.provider.create({
    data: {
      email: 'yacine.mansouri@example.dz',
      name: 'Yacine Mansouri',
      password: userPassword,
      title: 'Plombier Chauffagiste Certifié',
      category: 'artisan',
      professionalCategoryId: artisanCat.id,
      tradeId: trades["PLOMBIER"].id,
      cnamCardNumber: "CNAM-PLOM-99",
      cnamCardStatus: "VERIFIED",
      certificateStatus: 'VALID',
      isProfileComplete: true,
      phoneNumber: '0661234567',
      location: 'Oran',
      rating: 4.6, reviewCount: 28,
      bio: 'Spécialiste en plomberie et installation de chauffage central à Oran et ses environs.',
      profileImage: '/providers/dr-yacine-boumediene.png',
      services: { create: [
        { name: "Réparation de Fuites d'Eau", description: "Détection et réparation rapide de fuites sous évier, lavabo, etc.", price: 2000, duration: 90, category: 'artisan' },
        { name: 'Installation Chauffage Central', description: 'Installation complète de chaudières et radiateurs.', price: 45000, duration: 480, category: 'artisan' }
      ]}
    }
  });

  // 4. Sofiane Haddad (Auto-Entrepreneur - Web Dev)
  await prisma.provider.create({
    data: {
      email: 'sofiane.haddad@example.dz',
      name: 'Sofiane Haddad',
      password: userPassword,
      title: 'Développeur Full-Stack (ANAE)',
      category: 'auto_entrepreneur',
      professionalCategoryId: autoEntCat.id,
      autoEntrepreneurActivityId: activities["WEB_DEV"].id,
      anaeCardNumber: "AE-123456-2024",
      anaeCardStatus: "VERIFIED",
      certificateStatus: 'VALID',
      isProfileComplete: true,
      phoneNumber: '0552445566',
      location: 'Alger',
      rating: 5.0, reviewCount: 15,
      bio: "Création de sites web modernes et d'applications mobiles sur mesure pour votre entreprise.",
      profileImage: '/providers/sofiane-haddad.png',
      services: { create: [
        { name: 'Création de Site Vitrine', description: "Conception d'un site web professionnel de 5 pages avec SEO de base.", price: 35000, duration: 60, category: 'auto_entrepreneur' },
        { name: 'Boutique E-commerce', description: 'Boutique en ligne complète avec paiement intégré et gestion de stock.', price: 80000, duration: 120, category: 'auto_entrepreneur' }
      ]}
    }
  });

  // 5. Djamila Boualem (Professions Libérales - Avocat UNBA)
  await prisma.provider.create({
    data: {
      email: 'djamila.b@example.dz',
      name: 'Djamila Boualem',
      password: userPassword,
      title: 'Avocate à la Cour (UNBA)',
      category: 'regulated_profession',
      professionalCategoryId: regulatedCat.id,
      regulatoryBodyId: bodies["UNBA"].id,
      licenseNumber: "TRANS-99887",
      licenseStatus: "VERIFIED",
      certificateStatus: 'VALID',
      isProfileComplete: true,
      phoneNumber: '0772112233',
      location: 'Alger',
      rating: 4.9, reviewCount: 52,
      bio: 'Avocate agréée auprès de la cour, spécialisée en droit des affaires et conseil juridique aux entreprises.',
      profileImage: '/providers/djamila-boualem.png',
      services: { create: [
        { name: 'Consultation Juridique', description: 'Analyse de dossier, conseil juridique personnalisé d\'une heure.', price: 5000, duration: 60, category: 'regulated_profession' },
        { name: 'Rédaction de Contrat Commercial', description: 'Rédaction personnalisée et sécurisée de vos contrats.', price: 15000, duration: 120, category: 'regulated_profession' }
      ]}
    }
  });

  // 6. Tarek Boulahia (Artisan - Car Mechanic)
  await prisma.provider.create({
    data: {
      email: 'tarek.boulahia@example.dz',
      name: 'Tarek Boulahia',
      password: userPassword,
      title: 'Mécanicien Automobile Certifié CNAM',
      category: 'artisan',
      professionalCategoryId: artisanCat.id,
      tradeId: trades["MECANICIEN_AUTO"].id,
      cnamCardNumber: "CNAM-MEC-77",
      cnamCardStatus: "VERIFIED",
      certificateStatus: 'VALID',
      isProfileComplete: true,
      phoneNumber: '0655112233',
      location: 'Blida',
      rating: 4.7, reviewCount: 64,
      bio: 'Mécanicien spécialisé en diagnostic électronique et réparation moteur à Blida.',
      profileImage: '/providers/tarek-boulahia.png',
      services: { create: [
        { name: 'Diagnostic Scanner', description: 'Diagnostic électronique complet multimarques.', price: 2000, duration: 45, category: 'artisan' },
        { name: 'Vidange et Révision', description: 'Changement d\'huile, filtres et vérification des niveaux.', price: 4500, duration: 60, category: 'artisan' }
      ]}
    }
  });

  // 7. Leila Kaddour (Auto-Entrepreneur - Coaching & Formation)
  await prisma.provider.create({
    data: {
      email: 'leila.kaddour@example.dz',
      name: 'Leila Kaddour',
      password: userPassword,
      title: 'Formatrice en Sciences (ANAE)',
      category: 'auto_entrepreneur',
      professionalCategoryId: autoEntCat.id,
      autoEntrepreneurActivityId: activities["COACHING"].id,
      anaeCardNumber: "ANAE-COA-03",
      anaeCardStatus: "VERIFIED",
      certificateStatus: 'VALID',
      isProfileComplete: true,
      phoneNumber: '0773445566',
      location: 'Alger',
      rating: 5.0, reviewCount: 89,
      bio: 'Enseignante en mathématiques et physique pour les niveaux BEM et BAC. Méthodologie adaptée.',
      profileImage: '/providers/leila-kaddour.png',
      services: { create: [
        { name: 'Cours de Mathématiques (BAC)', description: 'Soutien intensif et préparation aux examens de fin d\'année.', price: 1500, duration: 120, category: 'auto_entrepreneur' },
        { name: 'Cours de Physique (BEM)', description: 'Explication des cours et résolution d\'exercices.', price: 1200, duration: 120, category: 'auto_entrepreneur' }
      ]}
    }
  });

  // 8. Ryad Photographe (Auto-Entrepreneur - Photography)
  await prisma.provider.create({
    data: {
      email: 'ryad.mahrez.photog@example.dz',
      name: 'Ryad Photographe',
      password: userPassword,
      title: 'Photographe & Vidéaste ANAE',
      category: 'auto_entrepreneur',
      professionalCategoryId: autoEntCat.id,
      autoEntrepreneurActivityId: activities["PHOTO"].id,
      anaeCardNumber: "ANAE-PHOTO-01",
      anaeCardStatus: "VERIFIED",
      certificateStatus: 'VALID',
      isProfileComplete: true,
      phoneNumber: '0554778899',
      location: 'Constantine',
      rating: 4.8, reviewCount: 41,
      bio: 'Photographe professionnel pour mariages, événements d\'entreprise et shooting en studio à Constantine.',
      profileImage: 'https://images.unsplash.com/photo-1554046920-90dcac824af6?w=400&q=80',
      services: { create: [
        { name: 'Couverture Mariage Complète', description: 'Photos illimitées + Vidéo 4K + Album imprimé.', price: 65000, duration: 480, category: 'auto_entrepreneur' },
        { name: 'Shooting Portrait', description: 'Séance photo d\'une heure en extérieur ou studio.', price: 8000, duration: 60, category: 'auto_entrepreneur' }
      ]}
    }
  });

  // 9. Farid Najar (Artisan - Carpenter)
  await prisma.provider.create({
    data: {
      email: 'farid.najar@example.dz',
      name: 'Farid Najar',
      password: userPassword,
      title: 'Menuisier Ébéniste Certifié CNAM',
      category: 'artisan',
      professionalCategoryId: artisanCat.id,
      tradeId: trades["MENUISIER"].id,
      cnamCardNumber: "CNAM-MENU-88",
      cnamCardStatus: "VERIFIED",
      certificateStatus: 'VALID',
      isProfileComplete: true,
      phoneNumber: '0662334455',
      location: 'Oran',
      rating: 4.5, reviewCount: 19,
      bio: 'Fabrication de meubles sur mesure, cuisines équipées et portes en bois massif. Qualité garantie.',
      profileImage: '/providers/farid-najar.png',
      services: { create: [
        { name: 'Installation de Cuisine Équipée', description: 'Montage et installation sur mesure de votre cuisine.', price: 25000, duration: 360, category: 'artisan' },
        { name: 'Réparation de Meubles', description: 'Restauration de meubles anciens ou endommagés.', price: 4000, duration: 120, category: 'artisan' }
      ]}
    }
  });

  // 10. Meriem Traiteur (Auto-Entrepreneur - Catering)
  await prisma.provider.create({
    data: {
      email: 'meriem.traiteur@example.dz',
      name: 'Meriem Traiteur',
      password: userPassword,
      title: 'Chef Cuisinière & Traiteur ANAE',
      category: 'auto_entrepreneur',
      professionalCategoryId: autoEntCat.id,
      autoEntrepreneurActivityId: activities["CATERING"].id,
      anaeCardNumber: "ANAE-CAT-02",
      anaeCardStatus: "VERIFIED",
      certificateStatus: 'VALID',
      isProfileComplete: true,
      phoneNumber: '0775667788',
      location: 'Alger',
      rating: 4.9, reviewCount: 73,
      bio: 'Traiteur spécialisé dans la gastronomie traditionnelle algérienne et moderne pour vos réceptions.',
      profileImage: '/providers/meriem-bouzid.png',
      services: { create: [
        { name: 'Menu Traditionnel (Pour 50 personnes)', description: 'Couscous, chorba, bourek et salades variées.', price: 45000, duration: 240, category: 'auto_entrepreneur' },
        { name: 'Gâteaux Orientaux (Sur commande)', description: 'Plateau de 100 pièces assorties (Baklawa, Makrout, etc.)', price: 6000, duration: 120, category: 'auto_entrepreneur' }
      ]}
    }
  });

  console.log('✅ Successfully seeded 10 Algerian providers mapped to the 3-category system!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
