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

const getMonthName = (dateString: string): string => {
    // Using .replace(/-/g, '/') is a good trick to avoid timezone issues where 'YYYY-MM-DD' might be interpreted as UTC midnight.
    const date = new Date(dateString.replace(/-/g, '/'));
    return date.toLocaleString('fr-FR', { month: 'long' }).toUpperCase();
};

export const generateBusPdf = async (bookings: Booking[]): Promise<void> => {
  try {
    await waitForLibraries(['jspdf']);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    
    // Divide the page into 3 blocks
    const blockHeight = (pageHeight - margin) / 3;

    bookings.forEach((booking, index) => {
      const pageIndex = Math.floor(index / 3);
      const indexOnPage = index % 3;

      if (indexOnPage === 0 && pageIndex > 0) {
        doc.addPage();
      }
      
      let y = margin + (indexOnPage * blockHeight);

      // Draw separator and add space if it's not the first block on the page
      if (indexOnPage > 0) {
          doc.setDrawColor(180, 180, 180);
          doc.line(margin, y - 5, pageWidth - margin, y - 5);
          y += 5;
      }

      const monthName = getMonthName(booking.date);

      // Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      const titleText = "Fiche de commande de bus - ";
      doc.text(titleText, margin, y);
      const titleWidth = doc.getTextWidth(titleText);
      doc.setFont('helvetica', 'bold');
      doc.text(monthName, margin + titleWidth, y);
      y += 14;
      
      // Content
      doc.setFontSize(11);
      const lines = formatBookingForDocument(booking);
      
      lines.forEach(({ label, value }) => {
          // Stop drawing if we exceed the block height for this entry
          if (y > margin + ((indexOnPage + 1) * blockHeight) - 10) return;
          
          const labelText = `${label} : `;
          doc.setFont('helvetica', 'bold');
          const labelWidth = doc.getTextWidth(labelText);

          const availableWidth = pageWidth - margin * 2 - labelWidth;
          const splitValue = doc.splitTextToSize(value, availableWidth);
          
          doc.text(labelText, margin, y);
          
          doc.setFont('helvetica', 'normal');
          doc.text(splitValue, margin + labelWidth, y);

          // Increment y position based on how many lines the value took up
          y += (splitValue.length * 5) + 4;
      });
    });

    doc.save("fiches-bus.pdf");
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error; // Re-throw to be caught by the UI component
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
