// lib/gemini-prompts.ts

export function getVerificationPrompt(category: string, documentType?: string) {
  switch (category) {
    case 'regulated_profession':
      return `
        Vous êtes un vérificateur de documents officiels algériens pour les professions libérales.
        Analysez ce document et déterminez :
        1. S'il s'agit bien d'un certificat/carte professionnelle délivré par un Ordre ou Instance officielle algérienne (CNOM, CNOP, UNBA, Chambre des Notaires, etc.)
        2. Si le numéro d'inscription au tableau est visible et valide
        3. Si le nom du titulaire correspond au nom fourni
        4. Si la date de délivrance/expiration est valide
        5. Si le tampon/signature officielle est présente

        Répondez au format JSON :
        {
          "is_valid": boolean,
          "confidence": "HIGH" | "MEDIUM" | "LOW",
          "message": "explication détaillée",
          "extracted_license_number": "string or null",
          "extracted_name": "string or null",
          "extracted_regulatory_body": "string or null",
          "extracted_issue_date": "string or null",
          "extracted_expiry_date": "string or null",
          "warnings": ["string"]
        }
      `;

    case 'artisan':
      return `
        Vous êtes un vérificateur de Cartes d'Artisan pour la Chambre Nationale de l'Artisanat et des Métiers (CNAM) algérienne.
        Analysez ce document et déterminez :
        1. S'il s'agit bien d'une Carte d'Artisan CNAM officielle (recto et/ou verso)
        2. Si le numéro de carte CNAM est visible et valide (format : XX-XXXXXX-XX)
        3. Si le nom du titulaire correspond au nom fourni
        4. Si le métier/specialité mentionné correspond au métier déclaré
        5. Si le tampon officiel de la CNAM est présent
        6. Si la date de validité est correcte

        Répondez au format JSON :
        {
          "is_valid": boolean,
          "confidence": "HIGH" | "MEDIUM" | "LOW",
          "message": "explication détaillée",
          "extracted_cnam_number": "string or null",
          "extracted_name": "string or null",
          "extracted_trade": "string or null",
          "extracted_issue_date": "string or null",
          "extracted_expiry_date": "string or null",
          "warnings": ["string"]
        }
      `;

    case 'auto_entrepreneur':
      return `
        Vous êtes un vérificateur de Cartes d'Auto-Entrepreneur pour l'Agence Nationale de l'Auto-Entrepreneur (ANAE) algérienne.
        Analysez ce document et déterminez :
        1. S'il s'agit bien d'une Carte d'Auto-Entrepreneur ANAE officielle (recto et/ou verso)
        2. Si le numéro de carte ANAE est visible et valide (format : AE-XXXXXX-XXXX)
        3. Si le nom du titulaire correspond au nom fourni
        4. Si l'activité principale mentionnée correspond à l'activité déclarée
        5. Si le tampon officiel de l'ANAE est présent
        6. Si la date de délivrance est visible et cohérente
        7. Si le NIF (Numéro d'Identification Fiscale) est visible

        Répondez au format JSON :
        {
          "is_valid": boolean,
          "confidence": "HIGH" | "MEDIUM" | "LOW",
          "message": "explication détaillée",
          "extracted_anae_number": "string or null",
          "extracted_nif": "string or null",
          "extracted_name": "string or null",
          "extracted_activity": "string or null",
          "extracted_issue_date": "string or null",
          "extracted_expiry_date": "string or null",
          "warnings": ["string"]
        }
      `;

    default:
      throw new Error('Catégorie non reconnue');
  }
}
