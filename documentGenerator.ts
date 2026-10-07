import { Booking } from '../types';

// These are loaded from CDNs in index.html, so we declare them to TypeScript on the window object
declare global {
  interface Window {
    jspdf: any;
    // docx: any;
    // saveAs: any;
  }
}

/**
 * Waits for external libraries loaded via <script> tags to be available on the window object.
 * @param libraryNames Array of library names to wait for (e.g., ['jspdf', 'docx']).
 * @param timeout Time in milliseconds to wait before rejecting.
 * @returns A promise that resolves when all libraries are loaded, or rejects on timeout.
 */
const waitForLibraries = (
  libraryNames: (keyof Window)[],
  timeout = 5000
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      const allLoaded = libraryNames.every(name => window[name]);
      if (allLoaded) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        const missing = libraryNames.filter(name => !window[name]);
        reject(new Error(`Les bibliothèques suivantes n'ont pas pu être chargées: ${missing.join(', ')}`));
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
};


const formatBookingForDocument = (booking: Booking): { label: string, value: string }[] => {
  return [
    { label: "Commune", value: booking.commune },
    { label: "Nom de l'école", value: booking.schoolName },
    { label: "Nombre d'enfants", value: String(booking.studentCount) },
    { label: "Nombre d'adultes", value: String(booking.adultCount) },
    { label: "Date et heure de l'animation", value: `${new Date(booking.date.replace(/-/g, '/')).toLocaleDateString('fr-FR')} à ${booking.time}h` },
    { label: "Où et à quelle heure doit passer le bus", value: booking.busInfo },
  ];
};

const drawDashedLine = (
  doc: any,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dashLength = 2.5,
  gapLength = 2
) => {
  if (typeof doc.setLineDashPattern === 'function') {
    doc.setLineDashPattern([dashLength, gapLength], 0);
    doc.line(x1, y1, x2, y2);
    doc.setLineDashPattern([], 0);
  } else if (typeof doc.setLineDash === 'function') {
    doc.setLineDash([dashLength, gapLength], 0);
    doc.line(x1, y1, x2, y2);
    doc.setLineDash([], 0);
  } else {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.hypot(dx, dy);
    const step = dashLength + gapLength;
    const dashCount = Math.floor(distance / step);
    const unitX = distance > 0 ? dx / distance : 0;
    const unitY = distance > 0 ? dy / distance : 0;
    for (let i = 0; i <= dashCount; i++) {
      const sx = x1 + unitX * (i * step);
      const sy = y1 + unitY * (i * step);
      const ex = Math.min(Math.max(x1, x2), sx + unitX * dashLength);
      const ey = Math.min(Math.max(y1, y2), sy + unitY * dashLength);
      doc.line(sx, sy, ex, ey);
    }
  }
};

const getBookingDayAndMonth = (dateStr?: string): string => {
  if (!dateStr) return '';
  let d: Date | null = null;
  if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(dateStr)) {
    d = new Date(dateStr.replace(/-/g, '/'));
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    d = new Date(`${year}/${month}/${day}`);
  } else {
    d = new Date(dateStr.replace(/-/g, '/'));
  }
  if (d && !isNaN(d.getTime())) {
    const day = d.getDate();
    const month = d.toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase();
    return `${day} ${month}`;
  }
  return '';
};

const renderBusCard = (doc: any, booking: Booking, x0: number, y0: number) => {
  // Dimensions de la fiche à l'intérieur du quadrant (148.5mm x 105mm)
  const tableWidth = 132;
  const tableLeft = x0 + (148.5 - tableWidth) / 2; // 8.25mm de marge interne
  const col1Width = 46; // Colonne des libellés
  const col2Width = tableWidth - col1Width; // 86mm pour les valeurs
  const dividerX = tableLeft + col1Width;

  const tableTop = y0 + 18.5;
  const titleY = y0 + 13.5;
  const rowHeight = 9.5;
  const row6Height = 16.5;
  const totalTableHeight = (rowHeight * 5) + row6Height; // 64mm

  // Titre centré "Accueils classes"
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Accueils classes", tableLeft + (tableWidth / 2), titleY, { align: 'center' });

  // Date concernée par la réservation à droite du texte "Accueils classes" (ex : "10 NOVEMBRE")
  const dayAndMonth = getBookingDayAndMonth(booking.date);
  if (dayAndMonth) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(dayAndMonth, tableLeft + tableWidth, titleY, { align: 'right' });
  }

  // Bordures du tableau (noir net, 0.3mm)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(tableLeft, tableTop, tableWidth, totalTableHeight);

  // Séparateur vertical entre libellés et valeurs
  doc.line(dividerX, tableTop, dividerX, tableTop + totalTableHeight);

  // Lignes séparatrices horizontales
  for (let i = 1; i <= 5; i++) {
    const lineY = tableTop + (i * rowHeight);
    doc.line(tableLeft, lineY, tableLeft + tableWidth, lineY);
  }

  // Libellés (colonne gauche, texte centré)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);

  const labelCenterX = tableLeft + (col1Width / 2);

  // Ligne 1 : Commune
  doc.text("Commune", labelCenterX, tableTop + 6.2, { align: 'center' });

  // Ligne 2 : Nom de l'école
  doc.text("Nom de l'école", labelCenterX, tableTop + rowHeight + 6.2, { align: 'center' });

  // Ligne 3 : Nombre d'enfants
  doc.text("Nombre d'enfants", labelCenterX, tableTop + (rowHeight * 2) + 6.2, { align: 'center' });

  // Ligne 4 : Nombre d'adultes
  doc.text("Nombre d'adultes", labelCenterX, tableTop + (rowHeight * 3) + 6.2, { align: 'center' });

  // Ligne 5 : Date et heure
  doc.text("Date et heure", labelCenterX, tableTop + (rowHeight * 4) + 6.2, { align: 'center' });

  // Ligne 6 : Où et à quelle heure doit passer le bus ? (sur 2 lignes centrées)
  doc.setFontSize(9);
  const row6Top = tableTop + (rowHeight * 5);
  doc.text("Où et à quelle heure", labelCenterX, row6Top + 6.5, { align: 'center' });
  doc.text("doit passer le bus ?", labelCenterX, row6Top + 11.2, { align: 'center' });

  // Valeurs (colonne droite, alignées à gauche avec padding de 3.5mm)
  const valX = dividerX + 3.5;
  const maxValWidth = col2Width - 7; // 79mm

  // Valeur 1 : Commune
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  const communeLines = doc.splitTextToSize(booking.commune || '', maxValWidth);
  doc.text(communeLines[0] || '', valX, tableTop + 6.2);

  // Valeur 2 : Nom de l'école
  const schoolLines = doc.splitTextToSize(booking.schoolName || '', maxValWidth);
  if (schoolLines.length > 1) {
    doc.setFontSize(8.5);
    doc.text(schoolLines[0], valX, tableTop + rowHeight + 4.2);
    doc.text(schoolLines[1], valX, tableTop + rowHeight + 7.8);
  } else {
    doc.setFontSize(9.5);
    doc.text(schoolLines[0] || '', valX, tableTop + rowHeight + 6.2);
  }

  // Valeur 3 : Nombre d'enfants
  doc.setFontSize(9.5);
  const studentCountStr = (booking.studentCount !== undefined && booking.studentCount !== null) ? String(booking.studentCount) : '';
  doc.text(studentCountStr, valX, tableTop + (rowHeight * 2) + 6.2);

  // Valeur 4 : Nombre d'adultes
  const adultCountStr = (booking.adultCount !== undefined && booking.adultCount !== null) ? String(booking.adultCount) : '';
  doc.text(adultCountStr, valX, tableTop + (rowHeight * 3) + 6.2);

  // Valeur 5 : Date et heure
  let formattedDate = '';
  if (booking.date) {
    const d = new Date(booking.date.replace(/-/g, '/'));
    if (!isNaN(d.getTime())) {
      const dayName = d.toLocaleDateString('fr-FR', { weekday: 'long' });
      const capDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      formattedDate = `${capDay} ${d.toLocaleDateString('fr-FR')}`;
    } else {
      formattedDate = booking.date;
    }
  }
  const rawTime = booking.time !== undefined && booking.time !== null ? String(booking.time) : '';
  const timeStr = rawTime 
    ? (rawTime.includes('h') || rawTime.includes(':') ? rawTime : `${rawTime}h00`)
    : '';
  const dateTimeStr = timeStr ? `${formattedDate} à ${timeStr}` : formattedDate;
  doc.text(dateTimeStr, valX, tableTop + (rowHeight * 4) + 6.2);

  // Valeur 6 : Où et à quelle heure doit passer le bus ?
  const busInfoText = booking.busInfo?.trim() || '-';
  const busLines = doc.splitTextToSize(busInfoText, maxValWidth);

  if (busLines.length === 1) {
    doc.setFontSize(9.5);
    doc.text(busLines[0], valX, row6Top + 9.2);
  } else if (busLines.length === 2) {
    doc.setFontSize(9);
    doc.text(busLines[0], valX, row6Top + 6.8);
    doc.text(busLines[1], valX, row6Top + 11.5);
  } else if (busLines.length === 3) {
    doc.setFontSize(8.5);
    doc.text(busLines[0], valX, row6Top + 5.2);
    doc.text(busLines[1], valX, row6Top + 9.2);
    doc.text(busLines[2], valX, row6Top + 13.2);
  } else {
    doc.setFontSize(7.5);
    busLines.slice(0, 4).forEach((line: string, i: number) => {
      doc.text(line, valX, row6Top + 4.2 + (i * 3.6));
    });
  }
};

export const generateBusPdf = async (bookings: Booking[]): Promise<void> => {
  try {
    await waitForLibraries(['jspdf']);
    const { jsPDF } = window.jspdf;
    
    // Format A4 Paysage (297mm x 210mm)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const halfWidth = pageWidth / 2;   // 148.5mm
    const halfHeight = pageHeight / 2; // 105mm

    const CARDS_PER_PAGE = 4;
    const totalPages = Math.max(1, Math.ceil(bookings.length / CARDS_PER_PAGE));

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        doc.addPage('a4', 'landscape');
      }

      // Lignes séparatrices en pointillés pour le découpage des 4 fiches
      doc.setDrawColor(160, 160, 160);
      doc.setLineWidth(0.25);

      // Ligne médiane horizontale
      drawDashedLine(doc, 0, halfHeight, pageWidth, halfHeight, 3, 2);

      // Ligne médiane verticale
      drawDashedLine(doc, halfWidth, 0, halfWidth, pageHeight, 3, 2);

      // Rendu des 4 fiches de la page courante
      for (let indexOnPage = 0; indexOnPage < CARDS_PER_PAGE; indexOnPage++) {
        const bookingIndex = page * CARDS_PER_PAGE + indexOnPage;
        if (bookingIndex >= bookings.length) break;

        const booking = bookings[bookingIndex];

        // Détermination des coordonnées du quadrant
        // 0: Haut-Gauche, 1: Haut-Droite, 2: Bas-Gauche, 3: Bas-Droite
        const col = indexOnPage % 2;
        const row = Math.floor(indexOnPage / 2);

        const x0 = col * halfWidth;
        const y0 = row * halfHeight;

        renderBusCard(doc, booking, x0, y0);
      }
    }

    doc.save("fiches-bus.pdf");
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  }
};

/*
export const generateBusDocx = async (bookings: Booking[]): Promise<void> => {
  try {
    await waitForLibraries(['docx', 'saveAs']);
    const { Paragraph, TextRun, Document, Packer } = window.docx;

    const children: any[] = [];

    bookings.forEach((booking, index) => {
      const monthName = getMonthName(booking.date);
      
      // Title
      children.push(new Paragraph({
        children: [
          new TextRun({ text: "Fiche de commande de bus - ", size: 28 }), // 14pt
          new TextRun({ text: monthName, bold: true, size: 28 }),
        ],
        spacing: { after: 300, before: index > 0 ? 400 : 0 },
      }));

      const lines = formatBookingForDocument(booking);
      
      lines.forEach(line => {
        const parts = line.split(':');
        const label = parts[0] ? `${parts[0]}:` : '';
        const value = parts.slice(1).join(':').trim();

        children.push(new Paragraph({
          children: [
            new TextRun({ text: label, bold: true, size: 22 }), // 11pt
            new TextRun({ text: ` ${value}`, size: 22 }),
          ],
          spacing: { after: 120 },
        }));
      });

      // Separator, but not after the very last item
      if (index < bookings.length - 1) {
         children.push(new Paragraph({
            border: {
                bottom: {
                    color: "auto",
                    space: 1,
                    value: "single",
                    size: 6, // 3/4 pt
                },
            },
            spacing: { after: 200, before: 200 }
         }));
      }
    });

    const doc = new Document({
      sections: [{
        children: children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    window.saveAs(blob, "fiches-bus.docx");
  } catch (error) {
    console.error("DOCX Generation Error:", error);
    throw error; // Re-throw to be caught by the UI component
  }
};
*/
