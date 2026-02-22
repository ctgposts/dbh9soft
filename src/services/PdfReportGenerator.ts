import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfOptions {
  filename?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  margin?: number;
}

export class PdfReportGenerator {
  /**
   * HTML উপাদান থেকে PDF তৈরি করুন
   */
  static async generateFromElement(
    element: HTMLElement,
    options: PdfOptions = {}
  ): Promise<void> {
    const {
      filename = 'report.pdf',
      orientation = 'portrait',
      format = 'a4',
      margin = 10,
    } = options;

    try {
      // HTML থেকে ক্যানভাস তৈরি করুন
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // ক্যানভাস থেকে PDF তৈরি করুন
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      // ইমেজ যোগ করুন
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      // মাল্টি-পেজ সাপোর্ট
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          imgData,
          'PNG',
          margin,
          position,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight - margin * 2;
      }

      // PDF ডাউনলোড করুন
      pdf.save(filename);
    } catch (error) {
      console.error('PDF জেনারেশন ব্যর্থ:', error);
      throw error;
    }
  }

  /**
   * টেক্সট এবং ডেটা থেকে সিম্পল PDF তৈরি করুন
   */
  static createSimplePdf(
    title: string,
    content: string,
    filename: string = 'report.pdf'
  ): void {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;

    // শিরোনাম যোগ করুন
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin, margin + 10);

    // কন্টেন্ট যোগ করুন
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(content, maxWidth);
    pdf.text(lines, margin, margin + 25);

    // ফুটার যোগ করুন
    const pageCount = (pdf as any).internal.pages.length - 1;
    const now = new Date().toLocaleDateString('bn-BD');
    pdf.setFontSize(9);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `তৈরিকরা হয়েছে: ${now}`,
      margin,
      pdf.internal.pageSize.getHeight() - margin
    );

    pdf.save(filename);
  }

  /**
   * টেবিল ডেটা থেকে PDF তৈরি করুন
   */
  static createTablePdf(
    title: string,
    columns: string[],
    data: (string | number)[][],
    filename: string = 'report.pdf'
  ): void {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const rowHeight = 10;
    const colWidth = (pageWidth - margin * 2) / columns.length;

    let yPosition = margin + 20;

    // শিরোনাম যোগ করুন
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin, margin + 10);

    // হেডার সারি
    pdf.setFontSize(10);
    pdf.setFillColor(100, 100, 100);
    pdf.setTextColor(255, 255, 255);
    columns.forEach((col, i) => {
      pdf.text(
        col,
        margin + colWidth * i + 2,
        yPosition,
        { align: 'left' }
      );
    });

    yPosition += rowHeight;

    // ডেটা সারিগুলি
    pdf.setTextColor(0, 0, 0);
    pdf.setFillColor(240, 240, 240);
    data.forEach((row, rowIndex) => {
      // পেজ ব্রেক চেক করুন
      if (yPosition + rowHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      // পটভূমি রঙ অদল-বদল করুন
      if (rowIndex % 2 === 0) {
        pdf.rect(
          margin,
          yPosition - rowHeight + 2,
          pageWidth - margin * 2,
          rowHeight,
          'F'
        );
      }

      row.forEach((cell, colIndex) => {
        pdf.text(
          String(cell),
          margin + colWidth * colIndex + 2,
          yPosition,
          { align: 'left' }
        );
      });

      yPosition += rowHeight;
    });

    // ফুটার
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    const now = new Date().toLocaleDateString('bn-BD');
    pdf.text(
      `পৃষ্ঠা ${(pdf as any).getNumberOfPages()} | তৈরিকরা: ${now}`,
      margin,
      pageHeight - margin
    );

    pdf.save(filename);
  }

  /**
   * স্ট্যাটিস্টিক্স রিপোর্ট PDF তৈরি করুন
   */
  static createStatsPdf(
    staffName: string,
    branchName: string,
    stats: {
      totalScans: number;
      totalUploads: number;
      totalImages: number;
      averageCompressionRatio: number;
      likedImages: number;
      approvedImages: number;
    },
    filename: string = 'stats-report.pdf'
  ): void {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // শিরোনাম
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('স্ট্যাটিসটিক্স রিপোর্ট', margin, yPosition);
    yPosition += 15;

    // স্টাফ তথ্য
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`স্টাফ: ${staffName}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`শাখা: ${branchName}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`তারিখ: ${new Date().toLocaleDateString('bn-BD')}`, margin, yPosition);
    yPosition += 15;

    // পরিসংখ্যান টেবিল
    const statsData = [
      ['মেট্রিক', 'মান'],
      ['মোট স্ক্যান', String(stats.totalScans)],
      ['মোট আপলোড', String(stats.totalUploads)],
      ['মোট ছবি', String(stats.totalImages)],
      ['গড় কম্প্রেশন', `${stats.averageCompressionRatio.toFixed(1)}%`],
      ['পছন্দ করা ছবি', String(stats.likedImages)],
      ['অনুমোদিত ছবি', String(stats.approvedImages)],
    ];

    const colWidth = (pageWidth - margin * 2) / 2;
    const rowHeight = 10;

    // হেডার
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(100, 150, 200);
    pdf.setTextColor(255, 255, 255);
    statsData[0].forEach((header, i) => {
      pdf.text(
        header,
        margin + colWidth * i + 5,
        yPosition,
        { align: 'left' }
      );
    });
    yPosition += rowHeight;

    // ডেটা
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    statsData.slice(1).forEach((row, rowIndex) => {
      if (rowIndex % 2 === 0) {
        pdf.setFillColor(240, 240, 240);
        pdf.rect(
          margin,
          yPosition - rowHeight + 2,
          pageWidth - margin * 2,
          rowHeight,
          'F'
        );
      }
      row.forEach((cell, colIndex) => {
        pdf.text(
          cell,
          margin + colWidth * colIndex + 5,
          yPosition,
          { align: 'left' }
        );
      });
      yPosition += rowHeight;
    });

    // ফুটার
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      'ডিজিটালভাবে উৎপন্ন',
      margin,
      pdf.internal.pageSize.getHeight() - 10
    );

    pdf.save(filename);
  }
}
