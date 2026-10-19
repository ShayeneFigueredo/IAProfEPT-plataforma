import { exportService } from '../services/exportService.js';

export const exportController = {
  async exportDocument(req, res, next) {
    try {
      const { titulo, conteudo, cursoTecnico, format } = req.body;
      
      if (!titulo || !conteudo || !format) {
        return res.status(400).json({
          error: 'Parâmetros ausentes: titulo, conteudo e format são obrigatórios.',
        });
      }

      if (format === 'pdf') {
        const pdfBuffer = await exportService.generatePdf({ titulo, conteudo, cursoTecnico });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="export_${Date.now()}.pdf"`);
        return res.send(pdfBuffer);
      } else if (format === 'docx') {
        const docxBuffer = await exportService.generateDocx({ titulo, conteudo, cursoTecnico });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="export_${Date.now()}.docx"`);
        return res.send(docxBuffer);
      } else {
        return res.status(400).json({ error: 'Formato inválido. Use "pdf" ou "docx".' });
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
      next(error);
    }
  }
};
