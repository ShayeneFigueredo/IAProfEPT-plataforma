import puppeteer from 'puppeteer';
import crypto from 'crypto';

const BANNER_ETICO =
  'Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula.';

/**
 * Serviço de Geração de Certificados Oficiais em PDF (Puppeteer)
 * Plataforma IAprofEPT — PPGEM / UFJF
 * Doutorando: Maycon Luiz Amaral Magalhães
 */
export class CertificatePdfService {
  /**
   * Constrói o HTML diagramado e estilizado do Certificado A4 em Orientação Paisagem
   */
  static buildCertificateHtml({
    alunoNome,
    cursoNome,
    cargaHoraria = '40 horas',
    dataConclusao = null,
    codigoAutenticacao = null,
  }) {
    const dataFormatada = dataConclusao
      ? new Date(dataConclusao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const codigo = codigoAutenticacao || `IAEPT-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString().slice(-4)}`;

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Certificado - ${alunoNome}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Georgia', serif;
          width: 297mm;
          height: 210mm;
          background: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0F172A;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .cert-container {
          width: 280mm;
          height: 195mm;
          background: #FFFFFF;
          border: 6px solid #064E3B;
          outline: 2px solid #10B981;
          outline-offset: -12px;
          padding: 30px 45px;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: inset 0 0 40px rgba(6, 78, 59, 0.05);
        }
        .cert-corner {
          position: absolute;
          width: 32px;
          height: 32px;
          border: 3px solid #10B981;
        }
        .corner-tl { top: 16px; left: 16px; border-right: none; border-bottom: none; }
        .corner-tr { top: 16px; right: 16px; border-left: none; border-bottom: none; }
        .corner-bl { bottom: 16px; left: 16px; border-right: none; border-top: none; }
        .corner-br { bottom: 16px; right: 16px; border-left: none; border-top: none; }

        .header {
          text-align: center;
          margin-bottom: 10px;
        }
        .inst-republica {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px;
          letter-spacing: 2px;
          color: #475569;
          font-weight: 700;
          text-transform: uppercase;
        }
        .inst-title {
          font-size: 17px;
          font-weight: 700;
          color: #064E3B;
          margin: 4px 0 2px;
          letter-spacing: 0.5px;
        }
        .inst-sub {
          font-size: 13px;
          color: #10B981;
          font-weight: 600;
        }
        .cert-main-title {
          font-size: 32px;
          color: #064E3B;
          font-weight: 900;
          letter-spacing: 4px;
          text-transform: uppercase;
          margin: 15px 0;
          text-align: center;
          border-bottom: 2px solid #064E3B;
          display: inline-block;
          padding-bottom: 4px;
        }
        .title-wrapper {
          text-align: center;
        }
        .cert-body {
          font-size: 16px;
          line-height: 1.8;
          text-align: justify;
          color: #1E293B;
          margin: 10px 0;
          padding: 0 15px;
        }
        .student-name {
          font-size: 24px;
          color: #064E3B;
          font-weight: 800;
          display: block;
          text-align: center;
          margin: 10px 0;
          font-style: italic;
          text-decoration: underline;
          text-decoration-color: #10B981;
        }
        .course-name {
          font-weight: 700;
          color: #0F172A;
        }
        .cert-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 15px;
          padding: 0 15px;
        }
        .signatures-grid {
          display: flex;
          justify-content: space-around;
          width: 100%;
          margin-top: 25px;
        }
        .sig-block {
          text-align: center;
          width: 250px;
        }
        .sig-line {
          border-top: 1.5px solid #334155;
          margin-bottom: 6px;
        }
        .sig-name {
          font-size: 12px;
          font-weight: 700;
          color: #0F172A;
        }
        .sig-role {
          font-size: 10.5px;
          color: #64748B;
        }
        .footer-banner {
          background: #DC2626;
          color: #FFFFFF;
          font-size: 9px;
          font-family: Arial, sans-serif;
          font-weight: 700;
          text-align: center;
          padding: 5px 12px;
          border-radius: 4px;
          margin-top: 10px;
          letter-spacing: 0.3px;
        }
        .auth-code {
          font-size: 10px;
          font-family: 'Courier New', monospace;
          color: #64748B;
          text-align: center;
          margin-top: 4px;
        }
      </style>
    </head>
    <body>
      <div class="cert-container">
        <div class="cert-corner corner-tl"></div>
        <div class="cert-corner corner-tr"></div>
        <div class="cert-corner corner-bl"></div>
        <div class="cert-corner corner-br"></div>

        <div class="header">
          <div class="inst-republica">República Federativa do Brasil</div>
          <div class="inst-title">UNIVERSIDADE FEDERAL DE JUIZ DE FORA — UFJF</div>
          <div class="inst-sub">Programa de Pós-Graduação em Educação Matemática (PPGEM) · Plataforma IAprofEPT</div>
        </div>

        <div class="title-wrapper">
          <h1 class="cert-main-title">Certificado</h1>
        </div>

        <div class="cert-body">
          Certificamos, para os devidos fins de comprovação acadêmica e profissional, que
          <span class="student-name">${alunoNome}</span>
          concluiu com êxito as atividades formativas do curso de
          <strong class="course-name">${cursoNome}</strong>,
          com carga horária estimada de <strong>${cargaHoraria}</strong>,
          promovido pela <strong>Plataforma IAprofEPT</strong> no âmbito da pesquisa de Doutorado em Educação Matemática da Universidade Federal de Juiz de Fora (UFJF), voltada ao letramento e apropriação crítica de Inteligência Artificial na Educação Profissional e Tecnológica (EPT).
        </div>

        <div class="signatures-grid">
          <div class="sig-block">
            <div class="sig-line"></div>
            <div class="sig-name">Prof. Me. Maycon Luiz Amaral Magalhães</div>
            <div class="sig-role">Autor / Doutorando em Educação Matemática (PPGEM/UFJF)</div>
          </div>
          <div class="sig-block">
            <div class="sig-line"></div>
            <div class="sig-name">Prof. Dr. Eduardo Barrére & Prof. Dr. Manuel Cabral</div>
            <div class="sig-role">Orientação e Coordenação Científica (UFJF / PPGEM)</div>
          </div>
        </div>

        <div class="cert-meta-row">
          <span style="font-size: 11px; color: #475569;">Juiz de Fora - MG, ${dataFormatada}.</span>
          <span class="auth-code">Autenticação: ${codigo} · Produto Educacional PTT4 (CAPES)</span>
        </div>

        <div class="footer-banner">
          AVISO ÉTICO: ${BANNER_ETICO}
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Gera buffer binário do PDF utilizando Puppeteer
   */
  static async generateCertificatePdf({
    alunoNome,
    cursoNome,
    cargaHoraria,
    dataConclusao,
    codigoAutenticacao,
  }) {
    const html = this.buildCertificateHtml({
      alunoNome,
      cursoNome,
      cargaHoraria,
      dataConclusao,
      codigoAutenticacao,
    });

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1122, height: 793, deviceScaleFactor: 2 });
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }
}

export default CertificatePdfService;
