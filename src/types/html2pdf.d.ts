declare module 'html2pdf.js' {
  type Html2PdfOptions = {
    margin?: number | number[];
    filename?: string;
    image?: { type?: 'jpeg' | 'png' | 'webp'; quality?: number };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      backgroundColor?: string | null;
      logging?: boolean;
      windowWidth?: number;
    };
    pagebreak?: { mode?: Array<'css' | 'legacy' | 'avoid-all'> };
    jsPDF?: { unit?: 'pt' | 'mm' | 'cm' | 'in'; format?: string | string[]; orientation?: 'portrait' | 'landscape' };
  };

  interface Html2PdfInstance {
    set: (options: Html2PdfOptions) => Html2PdfInstance;
    from: (element: HTMLElement | string) => Html2PdfInstance;
    save: (filename?: string) => Promise<void> | void;
    toPdf: () => Html2PdfInstance;
    output: (type?: string, options?: unknown) => Promise<unknown> | unknown;
  }

  function html2pdf(): Html2PdfInstance;
  export default html2pdf;
}


