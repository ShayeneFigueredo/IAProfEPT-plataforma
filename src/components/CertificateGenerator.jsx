import React, { useState } from 'react';
import { Download, CheckCircle, Award, Loader2, Sparkles } from 'lucide-react';
import { USER_DATA } from '../data/mockData';
import { useToast } from './ToastProvider';

export default function CertificateGenerator() {
  const toast = useToast();
  const [userName, setUserName] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('iaprofept_user'));
      return user?.nome || USER_DATA.nome;
    } catch (e) {
      return USER_DATA.nome;
    }
  });
  
  const [courseName, setCourseName] = useState('Letramento em Inteligência Artificial na Educação Matemática');
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!userName.trim()) {
      toast.warning('Por favor, informe o nome do aluno/professor.');
      return;
    }

    setGenerated(true);

    try {
      const res = await fetch('/api/formativo/certificados/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alunoNome: userName.trim(),
          cursoNome: courseName.trim(),
          cargaHoraria: '40 horas',
          dataConclusao: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const erroMsg = await res.text();
        throw new Error(`Falha na emissão (${res.status}): ${erroMsg}`);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const sanitizado = userName.trim().replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `Certificado_${sanitizado}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(
        `Certificado oficial em PDF gerado e baixado com sucesso para ${userName}!`,
        'Certificado Emitido com Sucesso'
      );
    } catch (err) {
      console.error('Erro na emissão do certificado:', err);
      toast.error(
        'Erro ao emitir o certificado em PDF via backend. Verifique o servidor e tente novamente.',
        'Falha na Emissão'
      );
    } finally {
      setGenerated(false);
    }
  };

  return (
    <div className="card-glass" style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Award size={24} className="text-accent" /> 
        Emissão de Certificados Formativos
      </h3>
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Configure os parâmetros para emissão automática de certificado dos professores que concluírem as trilhas e cursos no Ambiente Formativo.
      </p>

      <form onSubmit={handleGenerate} style={{ display: 'grid', gap: '1.5rem', maxWidth: '600px' }}>
        <div className="form-group">
          <label>Nome do Aluno/Professor</label>
          <input 
            type="text" 
            value={userName} 
            onChange={(e) => setUserName(e.target.value)} 
            required 
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} 
          />
        </div>
        <div className="form-group">
          <label>Curso Concluído</label>
          <select 
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
          >
            <option value="Letramento em Inteligência Artificial na Educação Matemática">Letramento em Inteligência Artificial na Educação Matemática</option>
            <option value="Fundamentos da Inteligência Artificial">Fundamentos da Inteligência Artificial</option>
            <option value="Ética e Pensamento Crítico no Uso de IA">Ética e Pensamento Crítico no Uso de IA</option>
            <option value="Possibilidades Didáticas com Ferramentas Generativas">Possibilidades Didáticas com Ferramentas Generativas</option>
          </select>
        </div>
        
        <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
          <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Pré-visualização do conteúdo:</h4>
          <p style={{ fontSize: '1.1rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>
            Certificamos que <strong>{userName}</strong> concluiu com êxito o curso de <strong>{courseName}</strong>, promovido pela plataforma IAprofEPT (PPGEM/UFJF).
          </p>
        </div>

        <button 
          type="submit" 
          className="btn-primary" 
          disabled={generated}
          style={{ justifyContent: 'center', gap: '0.5rem', padding: '1rem', fontSize: '1rem' }}
        >
          {generated ? (
            <><CheckCircle size={20} /> Gerando Certificado...</>
          ) : (
            <><Download size={20} /> Baixar Certificado Oficial PDF</>
          )}
        </button>
      </form>
    </div>
  );
}
