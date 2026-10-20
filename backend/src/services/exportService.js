import puppeteer from 'puppeteer';
import htmlToDocx from 'html-to-docx';
import { Buffer } from 'buffer';

const UFJF_LOGO = 'https://www.ufjf.br/institucional/files/2018/06/Logo-UFJF-formato-vertical-RGB.png';
const BANNER_ETICO = 'Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula.';

function buildHtmlContent(titulo, conteudo, cursoTecnico) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${titulo}</title>
      <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
      <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #064E3B;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .header img {
          max-height: 80px;
        }
        .header h1 {
          font-size: 18px;
          color: #064E3B;
          margin: 10px 0 5px 0;
        }
        .header h2 {
          font-size: 14px;
          color: #10B981;
          margin: 0;
        }
        .course-info {
          font-style: italic;
          margin-bottom: 20px;
          color: #0F172A;
          font-size: 14px;
        }
        .content {
          margin-bottom: 40px;
        }
        .footer {
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          background-color: #DC2626;
          color: #F8FAFC;
          text-align: center;
          padding: 10px;
          font-size: 12px;
          font-weight: bold;
          border-radius: 4px;
        }
        @media print {
          .footer {
            position: fixed;
            bottom: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>UNIVERSIDADE FEDERAL DE JUIZ DE FORA (UFJF)</h1>
        <h2>Programa de Pós-Graduação em Educação Matemática (PPGEM)</h2>
        <h2>Plataforma IAprofEPT</h2>
      </div>
      
      <div class="course-info">
        <strong>Atividade:</strong> ${titulo}<br>
        <strong>Curso Técnico:</strong> ${cursoTecnico || 'Não especificado'}
      </div>

      <div class="content">
        ${conteudo}
      </div>

      <div class="footer">
        ${BANNER_ETICO}
      </div>
    </body>
    </html>
  `;
}

export const exportService = {
  async generatePdf({ titulo, conteudo, cursoTecnico }) {
    const html = buildHtmlContent(titulo, conteudo, cursoTecnico);
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Evaluate MathJax rendering
    await page.evaluate(() => {
      if (window.MathJax) {
        return window.MathJax.typesetPromise();
      }
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '80px',
        left: '20px',
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width: 100%; text-align: center; background-color: #DC2626; color: #F8FAFC; padding: 10px; font-size: 10px; font-weight: bold; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact;">
          ${BANNER_ETICO}
        </div>
      `,
    });
    
    await browser.close();
    
    return pdfBuffer;
  },

  async generateDocx({ titulo, conteudo, cursoTecnico }) {
    const html = buildHtmlContent(titulo, conteudo, cursoTecnico);
    
    const docxBuffer = await htmlToDocx(html, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });
    
    return docxBuffer;
  }
};

