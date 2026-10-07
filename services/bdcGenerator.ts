import { 
  Document, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType, 
  BorderStyle, 
  ImageRun, 
  Packer, 
  VerticalAlign
} from 'docx';
import saveAs from 'file-saver';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { Booking, BdcTemplateConfig } from '../types';

export const DEFAULT_BDC_CONFIG: Required<BdcTemplateConfig> = {
  siret: "245 400 262 000 45",
  tvaNumber: "FR 92245400262",
  paymentTerms: "Règlement par virement bancaire à 30 jours.",
  marketTitle: "Marché public occasionnel routier des élèves par autocar avec chauffeur\nLot 1 – Transport vers la Médiathèque Intercommunale",
  carrierName: "TRANSARC SERVAGI",
  carrierAddress: "Zone Industrielle du Pulventeux\n54400 LONGWY",
  carrierPhone: "03.84.86.07.77",
  carrierEmail: "commercial@transarc.fr",
  imputation: "6247 MEDIA 313",
  billingAddress: "Agglomération du Grand Longwy\n2 rue de Lexy\nCS 11432 Réhon\n54414 LONGWY cedex\nTél. : 03.82.26.03.00\nFax. : 03.82.26.03.01",
  legalNotice: "LE PRÉSENT BON DE COMMANDE VAUT RÉSERVATION DU BUS",
  defaultScheduleInstructions: "… (consigne horaires)",
  defaultMeetingInstructions: "Rendez-vous devant l'école",
  vatRatePercent: 10,
  logoBase64: "",
  customDocxTemplateBase64: "",
  customDocxTemplateFileName: "",
  customDocxTemplateUpdatedAt: "",
};

/**
 * Formate la date du jour de génération du BDC en français : "6 octobre 2026"
 */
export const formatBdcGenerationDate = (date = new Date()): string => {
  const day = date.getDate();
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

/**
 * Nettoie le nom d'une commune en supprimant le code postal (ex: "LONGWY (54400)" -> "LONGWY")
 */
export const cleanCommuneName = (communeStr?: string): string => {
  if (!communeStr) return 'LONGWY';
  let clean = communeStr.trim();
  clean = clean.replace(/\s*[\(\[]?\b\d{5}\b[\)\]]?/g, '');
  clean = clean.replace(/[\(\)]/g, '').trim().toUpperCase();
  return clean || 'LONGWY';
};

/**
 * Formate l'horaire de début d'animation sans texte additionnel (ex: 9 -> "9h")
 */
export const formatBdcHoraires = (time?: number | string): string => {
  if (time === undefined || time === null || time === '') return '';
  const num = Number(time);
  if (isNaN(num)) return String(time).trim();
  return `${num}h`;
};

/**
 * Calcule et formate l'horaire de retour (+1h après le début, ex: 9 -> "10h", 14 -> "15h")
 */
export const formatBdcHorairesRetour = (time?: number | string): string => {
  if (time === undefined || time === null || time === '') return '';
  const num = Number(time);
  if (isNaN(num)) return '';
  return `${num + 1}h`;
};

/**
 * Nettoie la consigne de bus pour ne garder que la consigne elle-même (retire "Rendez-vous :")
 */
export const cleanRendezVous = (busInfo?: string): string => {
  if (!busInfo) return '';
  let clean = busInfo.trim();
  clean = clean.replace(/^(?:rendez-vous|rdv)\s*:\s*/i, '').trim();
  return clean;
};

/**
 * Calcule la référence BDC sous la forme : "26/27 HERSERANGE" (sans code postal)
 */
export const formatBdcReference = (booking: Booking, activeYear?: string): string => {
  let yearPrefix = '';
  if (activeYear && /^\d{4}-\d{4}$/.test(activeYear)) {
    const [y1, y2] = activeYear.split('-');
    yearPrefix = `${y1.slice(-2)}/${y2.slice(-2)}`;
  } else if (booking.date) {
    const d = new Date(booking.date.replace(/-/g, '/'));
    const y = d.getFullYear();
    const m = d.getMonth();
    // Année scolaire pivot
    const startY = m >= 8 ? y : y - 1;
    const endY = startY + 1;
    yearPrefix = `${String(startY).slice(-2)}/${String(endY).slice(-2)}`;
  } else {
    yearPrefix = '26/27';
  }

  const communeClean = cleanCommuneName(booking.commune);
  return `${yearPrefix} ${communeClean}`;
};

/**
 * Formate le nombre d'enfants et d'adultes : "20 enfants et 6 adultes"
 */
export const formatBdcChildrenAdults = (booking: Booking): string => {
  const children = Number(booking.studentCount) || 0;
  const adults = Number(booking.adultCount) || 0;
  const childLabel = children > 1 ? 'enfants' : 'enfant';
  const adultLabel = adults > 1 ? 'adultes' : 'adulte';
  return `${children} ${childLabel} et ${adults} ${adultLabel}`;
};

/**
 * Formate la date d'accueil : "Mardi 17 novembre"
 */
export const formatBdcDateAccueil = (dateStr?: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(/-/g, '/'));
  if (isNaN(d.getTime())) return dateStr;

  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
};

/**
 * Formate le prix TTC : "115.37 €" (avec un point et non une virgule pour les centimes)
 */
export const formatBdcPriceTtc = (busCost?: number): string => {
  const cost = Number(busCost) || 0;
  return `${cost.toFixed(2)} €`;
};

/**
 * Formate le prix HT (remise TVA 10%) : "104.88 €"
 */
export const formatBdcPriceHt = (busCost?: number, vatRatePercent = 10): string => {
  const cost = Number(busCost) || 0;
  const factor = 1 + vatRatePercent / 100;
  const costHt = cost / factor;
  return `${costHt.toFixed(2)} €`;
};

/**
 * Convertit un SVG ou une image en Uint8Array pour insertion dans Word
 */
export const getLogoPngBytes = async (customLogoBase64?: string): Promise<Uint8Array | null> => {
  try {
    if (customLogoBase64 && customLogoBase64.startsWith('data:image')) {
      const base64Data = customLogoBase64.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }

    // Sinon, on charge le logo SVG officiel depuis /logo-mediatheque.svg et on le rastérise sur un canvas
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = '/logo-mediatheque.svg';
    });

    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 190;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, 280, 190);
    const dataUrl = canvas.toDataURL('image/png');
    const base64Data = dataUrl.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.warn("Impossible de charger le logo pour le document Word:", err);
    return null;
  }
};

/**
 * Construit les éléments Docx pour une réservation (une page de BDC)
 */
const buildBdcSectionChildren = (
  booking: Booking,
  config: Required<BdcTemplateConfig>,
  activeYear?: string,
  logoBytes?: Uint8Array | null
): Paragraph[] => {
  const children: Paragraph[] = [];
  const currentDateStr = formatBdcGenerationDate();
  const refStr = formatBdcReference(booking, activeYear);
  const childrenAdultsStr = formatBdcChildrenAdults(booking);
  const dateAccueilStr = formatBdcDateAccueil(booking.date);
  const schoolStr = booking.schoolName || '';
  const priceTtcStr = formatBdcPriceTtc(booking.busCost);
  const priceHtStr = formatBdcPriceHt(booking.busCost, config.vatRatePercent);

  // 1. En-tête : Logo à gauche (si présent), Titre centré, Date & Réf à droite
  const headerCells: TableCell[] = [];

  // Cellule 1 : Logo
  const logoParagraphChildren: any[] = [];
  if (logoBytes) {
    logoParagraphChildren.push(
      new ImageRun({
        data: logoBytes,
        transformation: {
          width: 140,
          height: 95,
        },
        type: 'png',
      })
    );
  } else {
    logoParagraphChildren.push(
      new TextRun({
        text: "MÉDIATHÈQUE DU GRAND LONGWY",
        bold: true,
        size: 20,
        color: "2c2834",
      })
    );
  }

  headerCells.push(
    new TableCell({
      width: { size: 35, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.CENTER,
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      children: [new Paragraph({ children: logoParagraphChildren })],
    })
  );

  // Cellule 2 : Titre "BON DE COMMANDE"
  headerCells.push(
    new TableCell({
      width: { size: 35, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.CENTER,
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "BON DE COMMANDE",
              bold: true,
              size: 28, // 14 pt
              underline: {},
            }),
          ],
        }),
      ],
    })
  );

  // Cellule 3 : Date du jour et Référence
  headerCells.push(
    new TableCell({
      width: { size: 30, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.CENTER,
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: currentDateStr,
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 80 },
          children: [
            new TextRun({ text: "Réf. : ", size: 20 }),
            new TextRun({ text: refStr, bold: true, size: 20 }),
          ],
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [],
      spacing: { after: 150 },
    })
  );

  // Table pour l'en-tête à 3 colonnes
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells })],
  });

  // On injecte le tableau d'en-tête via un trick : les sections docx acceptent (Paragraph | Table)[]
  // Pour la signature de la fonction, on retourne les blocs docx.
  (children as any).push(headerTable);

  children.push(
    new Paragraph({
      children: [],
      spacing: { after: 200 },
    })
  );

  // 2. Mentions légales émetteur
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: "N° siret : ", size: 18 }),
        new TextRun({ text: config.siret, bold: true, size: 18 }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: "N° TVA intracommunautaire : ", size: 18 }),
        new TextRun({ text: config.tvaNumber, bold: true, size: 18 }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: config.paymentTerms, italics: true, size: 18 }),
      ],
    })
  );

  // 3. Marché public & Lot
  const marketLines = config.marketTitle.split('\n');
  marketLines.forEach((mLine, idx) => {
    children.push(
      new Paragraph({
        spacing: { after: idx === marketLines.length - 1 ? 250 : 60 },
        children: [
          new TextRun({
            text: mLine.trim(),
            bold: idx === 0,
            size: 20,
          }),
        ],
      })
    );
  });

  // 4. Destinataire (Transporteur)
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: config.carrierName, bold: true, size: 22 })],
    })
  );
  config.carrierAddress.split('\n').forEach(addrLine => {
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: addrLine.trim(), size: 20 })],
      })
    );
  });
  if (config.carrierPhone) {
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: `Tél. : ${config.carrierPhone}`, size: 20 })],
      })
    );
  }
  if (config.carrierEmail) {
    children.push(
      new Paragraph({
        spacing: { after: 250 },
        children: [new TextRun({ text: config.carrierEmail, size: 20 })],
      })
    );
  }

  // 5. Tableau des détails et du prix
  // Colonne Gauche : Détails transport (Aller-retour, enfants/adultes, date, école, consignes)
  // Colonne Droite : Tableau PRIX (Prix HT selon bordereau, Prix TTC)
  const leftDetailsParagraphs: Paragraph[] = [
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: "Transport aller-retour de :", bold: true, size: 20 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 140 },
      children: [
        new TextRun({ text: childrenAdultsStr, bold: true, size: 22 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: dateAccueilStr, bold: true, size: 22 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: schoolStr, bold: true, size: 22 }),
      ],
    }),
  ];

  // Horaires / consignes
  const scheduleText = booking.time ? `Animation à ${booking.time}h` : config.defaultScheduleInstructions;
  leftDetailsParagraphs.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: scheduleText, italics: true, size: 19 }),
      ],
    })
  );

  // Rendez-vous
  const meetingText = booking.busInfo ? `Rendez-vous : ${booking.busInfo}` : config.defaultMeetingInstructions;
  leftDetailsParagraphs.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: meetingText, bold: true, size: 20 }),
      ],
    })
  );

  // Mini-tableau du Prix (à droite)
  const priceTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            },
            shading: { fill: "f3f4f6" },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "PRIX", bold: true, size: 20 })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
            },
            children: [
              new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [
                  new TextRun({
                    text: "Prix H.T. selon le Bordereau de Prix Unitaires",
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 60, after: 60 },
                children: [
                  new TextRun({
                    text: priceHtStr,
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
            },
            children: [
              new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [
                  new TextRun({
                    text: "PRIX TTC",
                    bold: true,
                    size: 19,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 60, after: 60 },
                children: [
                  new TextRun({
                    text: priceTtcStr,
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const middleTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: leftDetailsParagraphs,
          }),
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [priceTable as any],
          }),
        ],
      }),
    ],
  });

  (children as any).push(middleTable);

  children.push(
    new Paragraph({
      children: [],
      spacing: { after: 250 },
    })
  );

  // 6. Imputation & Adresse de facturation
  children.push(
    new Paragraph({
      spacing: { after: 140 },
      children: [
        new TextRun({ text: "Imputation : ", bold: true, size: 20 }),
        new TextRun({ text: config.imputation, size: 20 }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: "Adresse de facturation :", bold: true, size: 20 }),
      ],
    })
  );

  config.billingAddress.split('\n').forEach(bLine => {
    children.push(
      new Paragraph({
        spacing: { after: 30 },
        children: [new TextRun({ text: bLine.trim(), size: 19 })],
      })
    );
  });

  children.push(
    new Paragraph({
      children: [],
      spacing: { after: 350 },
    })
  );

  // 7. Mention légale finale
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
      },
      children: [
        new TextRun({
          text: config.legalNotice,
          bold: true,
          size: 22,
        }),
      ],
    })
  );

  return children;
};

/**
 * Dictionnaire complet des variables injectables dans le template Word
 */
export const prepareBdcTemplateVariables = (
  booking: Booking,
  activeYear?: string,
  vatRatePercent = 10
): Record<string, string> => {
  const currentDate = formatBdcGenerationDate();
  const ref = formatBdcReference(booking, activeYear);
  const effectif = formatBdcChildrenAdults(booking);
  const dateAccueil = formatBdcDateAccueil(booking.date);
  const ecole = booking.schoolName || '';
  const prixHt = formatBdcPriceHt(booking.busCost, vatRatePercent);
  const prixTtc = formatBdcPriceTtc(booking.busCost);
  const horaires = formatBdcHoraires(booking.time);
  const horairesRetour = formatBdcHorairesRetour(booking.time);
  const rendezVous = cleanRendezVous(booking.busInfo);
  const communeClean = cleanCommuneName(booking.commune);

  return {
    // Variables officielles
    date_jour: currentDate,
    date_du_jour: currentDate,
    date_generation: currentDate,
    date_bdc: currentDate,

    reference: ref,
    ref: ref,

    nombre_participants: effectif,
    nombre_enfants_adultes: effectif,
    effectif: effectif,

    date_accueil: dateAccueil,
    date: dateAccueil,

    nom_ecole: ecole,
    ecole: ecole,

    prix_ht: prixHt,
    prix_bus_remise: prixHt,
    prix_remise: prixHt,

    prix_ttc: prixTtc,
    prix_bus: prixTtc,
    prix: prixTtc,

    horaires: horaires,
    horaire: horaires,
    heure_debut: horaires,

    horaires_retour: horairesRetour,
    horaire_retour: horairesRetour,
    heure_fin: horairesRetour,

    rendez_vous: rendezVous,
    rdv: rendezVous,
    consignes_bus: rendezVous,

    // Variables complémentaires utiles
    commune: communeClean,
    enseignant: booking.teacherName || '',
    nom_enseignant: booking.teacherName || '',
    animation: booking.animationTitle || '',
    titre_animation: booking.animationTitle || '',
    animateur: (booking as any).animator || '',
    nombre_eleves: String(booking.studentCount || 0),
    nombre_adultes: String(booking.adultCount || 0),
    telephone: booking.phoneNumber || '',
    email: booking.email || '',
    cycle: (booking as any).cycle || '',
    classe: booking.classLevel || '',
  };
};

/**
 * Génération depuis un template Word (.docx) téléversé par l'utilisateur
 */
export const generateFromCustomDocxTemplate = async (
  bookings: Booking[],
  templateBase64: string,
  activeYear?: string,
  vatRatePercent = 10
): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    const rawData = templateBase64.includes(',') ? templateBase64.split(',')[1] : templateBase64;
    const binaryStr = atob(rawData);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    if (bookings.length === 1) {
      const zip = new PizZip(bytes.buffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      const vars = prepareBdcTemplateVariables(bookings[0], activeYear, vatRatePercent);
      doc.render(vars);
      const outBlob = doc.getZip().generate({ 
        type: 'blob', 
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const dateFormatted = new Date().toISOString().split('T')[0];
      const refClean = formatBdcReference(bookings[0], activeYear).replace(/[\/\s]/g, '_');
      saveAs(outBlob, `BDC_Bus_${refClean}_${dateFormatted}.docx`);
      return { success: true, count: 1 };
    }

    // Plusieurs réservations : 1 page par réservation via saut de page Word
    const bodyContents: string[] = [];
    let baseZip: any = null;
    let sectPrPart = '';
    let preBodyPart = '';

    for (let i = 0; i < bookings.length; i++) {
      const zip = new PizZip(bytes.buffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      const vars = prepareBdcTemplateVariables(bookings[i], activeYear, vatRatePercent);
      doc.render(vars);
      const renderedZip = doc.getZip();

      if (i === 0) {
        baseZip = renderedZip;
      }

      const xml = renderedZip.file('word/document.xml')?.asText() || '';
      const bodyStartIdx = xml.indexOf('<w:body>') + '<w:body>'.length;
      const sectPrIdx = xml.lastIndexOf('<w:sectPr');

      if (bodyStartIdx !== -1 && sectPrIdx !== -1) {
        if (i === 0) {
          preBodyPart = xml.substring(0, bodyStartIdx);
          sectPrPart = xml.substring(sectPrIdx);
        }
        bodyContents.push(xml.substring(bodyStartIdx, sectPrIdx));
      }
    }

    if (bodyContents.length > 0 && baseZip) {
      const pageBreakXml = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      const mergedBody = bodyContents.join(pageBreakXml);
      const finalXml = preBodyPart + mergedBody + sectPrPart;
      baseZip.file('word/document.xml', finalXml);

      const outBlob = baseZip.generate({ 
        type: 'blob', 
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const dateFormatted = new Date().toISOString().split('T')[0];
      saveAs(outBlob, `Bons_de_commande_bus_${bookings.length}_reservations_${dateFormatted}.docx`);
      return { success: true, count: bookings.length };
    }

    throw new Error("Structure XML du document Word non reconnue.");
  } catch (error: any) {
    console.error("Erreur lors de la génération avec le modèle Word personnalisé :", error);
    return { 
      success: false, 
      count: 0, 
      error: error?.message || "Erreur lors du traitement du modèle Word." 
    };
  }
};

/**
 * Télécharge un modèle de départ Word (.docx) contenant les balises officielles
 */
export const downloadStarterDocxTemplate = async (
  templateConfig?: Partial<BdcTemplateConfig>
): Promise<void> => {
  const config = { ...DEFAULT_BDC_CONFIG, ...(templateConfig || {}) };
  const logoBytes = await getLogoPngBytes(config.logoBase64);

  // Échantillon fictif avec les balises textuelles directes
  const dummyBooking: any = {
    date: '2026-11-17',
    time: 9,
    schoolName: '{nom_ecole}',
    commune: '{commune}',
    studentCount: '{nombre_eleves}' as any,
    adultCount: '{nombre_adultes}' as any,
    busCost: 0,
    busInfo: '{rendez_vous}',
  };

  // On crée un document contenant les balises
  const children: any[] = [];

  // En-tête
  const headerCells: TableCell[] = [
    new TableCell({
      width: { size: 35, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.CENTER,
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      children: [
        logoBytes
          ? new Paragraph({
              children: [
                new ImageRun({
                  data: logoBytes,
                  transformation: { width: 140, height: 95 },
                  type: 'png',
                }),
              ],
            })
          : new Paragraph({
              children: [new TextRun({ text: "MÉDIATHÈQUE DU GRAND LONGWY", bold: true, size: 20 })],
            }),
      ],
    }),
    new TableCell({
      width: { size: 35, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.CENTER,
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "BON DE COMMANDE",
              bold: true,
              size: 28,
              underline: {},
            }),
          ],
        }),
      ],
    }),
    new TableCell({
      width: { size: 30, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.CENTER,
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "{date_jour}", size: 20 })],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 80 },
          children: [
            new TextRun({ text: "Réf. : ", size: 20 }),
            new TextRun({ text: "{reference}", bold: true, size: 20 }),
          ],
        }),
      ],
    }),
  ];

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: headerCells })],
    })
  );

  children.push(new Paragraph({ spacing: { after: 150 }, children: [] }));

  // Mentions légales
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: "N° siret : ", size: 18 }),
        new TextRun({ text: config.siret, bold: true, size: 18 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: "N° TVA intracommunautaire : ", size: 18 }),
        new TextRun({ text: config.tvaNumber, bold: true, size: 18 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: config.paymentTerms, italics: true, size: 18 }),
      ],
    })
  );

  // Marché & Transporteur
  config.marketTitle.split('\n').forEach((mLine, idx) => {
    children.push(
      new Paragraph({
        spacing: { after: idx === 0 ? 60 : 250 },
        children: [new TextRun({ text: mLine.trim(), bold: idx === 0, size: 20 })],
      })
    );
  });

  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: config.carrierName, bold: true, size: 22 })],
    })
  );
  config.carrierAddress.split('\n').forEach(addrLine => {
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: addrLine.trim(), size: 20 })],
      })
    );
  });
  if (config.carrierPhone) {
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: `Tél. : ${config.carrierPhone}`, size: 20 })],
      })
    );
  }
  if (config.carrierEmail) {
    children.push(
      new Paragraph({
        spacing: { after: 250 },
        children: [new TextRun({ text: config.carrierEmail, size: 20 })],
      })
    );
  }

  // Détails et Prix
  const leftDetails = [
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: "Transport aller-retour de :", bold: true, size: 20 })],
    }),
    new Paragraph({
      spacing: { after: 140 },
      children: [new TextRun({ text: "{nombre_participants}", bold: true, size: 22 })],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: "{date_accueil}", bold: true, size: 22 })],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: "{nom_ecole}", bold: true, size: 22 })],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: "Horaires : de ", size: 19 }),
        new TextRun({ text: "{horaires}", bold: true, size: 19 }),
        new TextRun({ text: " à ", size: 19 }),
        new TextRun({ text: "{horaires_retour}", bold: true, size: 19 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "Rendez-vous : ", bold: true, size: 20 }),
        new TextRun({ text: "{rendez_vous}", size: 20 }),
      ],
    }),
  ];

  const priceTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            },
            shading: { fill: "f3f4f6" },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "PRIX", bold: true, size: 20 })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
            },
            children: [
              new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [new TextRun({ text: "Prix H.T. selon le Bordereau de Prix Unitaires", size: 18 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 60, after: 60 },
                children: [new TextRun({ text: "{prix_ht}", bold: true, size: 20 })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
            },
            children: [
              new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [new TextRun({ text: "PRIX TTC", bold: true, size: 19 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 60, after: 60 },
                children: [new TextRun({ text: "{prix_ttc}", bold: true, size: 20 })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 55, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: leftDetails,
            }),
            new TableCell({
              width: { size: 45, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.TOP,
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [priceTable],
            }),
          ],
        }),
      ],
    })
  );

  children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  // Imputation & Facturation
  children.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: "Imputation : ", bold: true, size: 20 }),
        new TextRun({ text: config.imputation, size: 20 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: "Adresse de facturation :", bold: true, size: 20 })],
    })
  );

  config.billingAddress.split('\n').forEach(bLine => {
    children.push(
      new Paragraph({
        spacing: { after: 30 },
        children: [new TextRun({ text: bLine.trim(), size: 19 })],
      })
    );
  });

  children.push(new Paragraph({ spacing: { after: 300 }, children: [] }));

  // Mention finale
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
      },
      children: [
        new TextRun({
          text: config.legalNotice,
          bold: true,
          size: 22,
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 1080, right: 1080 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "Modele_de_depart_bon_de_commande_bus.docx");
};

/**
 * Génère le document Word (.docx) contenant un BDC par page pour les réservations sélectionnées
 */
export const generateBdcWordDocument = async (
  bookings: Booking[],
  templateConfig?: Partial<BdcTemplateConfig>,
  activeYear?: string
): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    const config: Required<BdcTemplateConfig> = {
      ...DEFAULT_BDC_CONFIG,
      ...(templateConfig || {}),
    };

    // Filtre sur les réservations qui nécessitent un bus
    const busBookings = bookings.filter(b => !b.noBusRequired);
    if (busBookings.length === 0) {
      return { 
        success: false, 
        count: 0, 
        error: "Aucune des réservations sélectionnées ne nécessite de transport par bus (option 'Pas de bus nécessaire' activée)." 
      };
    }

    // SI un modèle Word personnalisé .docx a été téléversé par l'utilisateur :
    if (config.customDocxTemplateBase64) {
      return await generateFromCustomDocxTemplate(
        busBookings,
        config.customDocxTemplateBase64,
        activeYear,
        config.vatRatePercent
      );
    }

    // Sinon, génération programmatique fidèle
    const logoBytes = await getLogoPngBytes(config.logoBase64);

    // Chaque réservation a sa propre section dans le document Word -> 1 BDC par page garanti !
    const sections = busBookings.map(booking => {
      const children = buildBdcSectionChildren(booking, config, activeYear, logoBytes);
      return {
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 inch (1.27 cm)
              bottom: 720,
              left: 1080,  // 0.75 inch (1.9 cm)
              right: 1080,
            },
          },
        },
        children: children as any,
      };
    });

    const doc = new Document({
      sections,
    });

    const blob = await Packer.toBlob(doc);
    const dateFormatted = new Date().toISOString().split('T')[0];
    const fileName = busBookings.length === 1
      ? `BDC_Bus_${formatBdcReference(busBookings[0], activeYear).replace(/[\/\s]/g, '_')}_${dateFormatted}.docx`
      : `Bons_de_commande_bus_${busBookings.length}_reservations_${dateFormatted}.docx`;

    saveAs(blob, fileName);

    return { success: true, count: busBookings.length };
  } catch (error: any) {
    console.error("Erreur lors de la génération du BDC Word :", error);
    return { success: false, count: 0, error: error?.message || "Erreur inconnue lors de la génération." };
  }
};
