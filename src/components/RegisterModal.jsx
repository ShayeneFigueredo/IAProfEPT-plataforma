import React, { useState } from 'react';
import { X, GraduationCap, Building2, BookOpen, Layers, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import Badge from './Badge';

const INSTITUICOES_RFEPCT = [
  'IFNMG - Instituto Federal do Norte de Minas Gerais',
  'IFMG - Instituto Federal de Minas Gerais',
  'IFSULDEMINAS - Instituto Federal do Sul de Minas',
  'IFTM - Instituto Federal do Triângulo Mineiro',
  'CEFET-MG - Centro Fed. de Educ. Tecnológica de Minas Gerais',
  'IFRJ - Instituto Federal do Rio de Janeiro',
  'CEFET-RJ - Centro Fed. de Educ. Tecnológica do Rio de Janeiro',
  'IFSP - Instituto Federal de São Paulo',
  'IFBA - Instituto Federal da Bahia',
  'IFCE - Instituto Federal do Ceará',
  'IFPE - Instituto Federal de Pernambuco',
  'IFPR - Instituto Federal do Paraná',
  'IFRS - Instituto Federal do Rio Grande do Sul',
  'Outra Instituição da Rede Federal (RFEPCT)'
];

const AREAS_MATEMATICA = [
  'Matemática no Ensino Médio Integrado',
  'Matemática Aplicada aos Cursos Técnicos',
  'Estatística e Probabilidade na EPT',
  'Cálculo e Álgebra em Cursos Tecnológicos',
  'Educação Matemática Crítica na EPT'
];

const CURSOS_TECNICOS_LISTA = [
  'Informática',
  'Agropecuária',
  'Eletrotécnica',
  'Mecânica',
  'Enfermagem',
  'Edificações',
  'Administração',
  'Meio Ambiente',
  'Química',
  'Logística',
  'Alimentos',
  'Automação Industrial'
];

/**
 * Modal de Cadastro Oficial de Professores da RFEPCT
 * Coleta vínculo institucional, área de atuação matemática e cursos atendidos.
 */
export default function RegisterModal({ isOpen, onClose, onRegisterSuccess }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [instituicao, setInstituicao] = useState(INSTITUICOES_RFEPCT[0]);
  const [campus, setCampus] = useState('');
  const [areaMatematica, setAreaMatematica] = useState(AREAS_MATEMATICA[0]);
  const [cursosSelecionados, setCursosSelecionados] = useState(['Informática', 'Agropecuária']);
  const [concordouTermos, setConcordouTermos] = useState(true);
  const [erro, setErro] = useState('');

  if (!isOpen) return null;

  const toggleCurso = (curso) => {
    if (cursosSelecionados.includes(curso)) {
      if (cursosSelecionados.length > 1) {
        setCursosSelecionados(cursosSelecionados.filter(c => c !== curso));
      }
    } else {
      setCursosSelecionados([...cursosSelecionados, curso]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nome.trim() || !email.trim() || !senha.trim() || !campus.trim()) {
      setErro('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    if (cursosSelecionados.length === 0) {
      setErro('Selecione ao menos 1 curso técnico atendido.');
      return;
    }

    // Extrai as iniciais do nome
    const nomesArray = nome.trim().split(' ');
    const iniciais = nomesArray.length > 1
      ? (nomesArray[0][0] + nomesArray[nomesArray.length - 1][0]).toUpperCase()
      : nome.substring(0, 2).toUpperCase();

    // Cria o novo perfil docente
    const novoUsuario = {
      nome: nome.trim(),
      email: email.trim(),
      instituicao: instituicao.split(' - ')[0],
      instituicaoCompleta: instituicao,
      campus: campus.trim(),
      cargo: `Docente de Matemática · ${instituicao.split(' - ')[0]} (${campus.trim()})`,
      areaMatematica: areaMatematica,
      cursosAtendidos: cursosSelecionados,
      iniciais: iniciais,
      foto: null,
      cadastradoEm: new Date().toISOString()
    };

    // Salva na lista de contas registradas localmente para permitir login futuro
    try {
      const contas = JSON.parse(localStorage.getItem('iaprofept_registered_accounts') || '[]');
      const filtradas = contas.filter(c => c.email.toLowerCase() !== novoUsuario.email.toLowerCase());
      filtradas.push(novoUsuario);
      localStorage.setItem('iaprofept_registered_accounts', JSON.stringify(filtradas));
    } catch (e) {}

    onRegisterSuccess(novoUsuario);
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Cabeçalho do Modal */}
        <div className="auth-modal-header">
          <div className="auth-modal-header-left">
            <div className="auth-modal-icon-box">
              <GraduationCap size={22} color="var(--primary-green)" />
            </div>
            <div>
              <h2 className="auth-modal-title">Cadastro de Docente da RFEPCT</h2>
              <span className="auth-modal-sub">
                Acolhimento à pesquisa de Doutorado em Educação Matemática (UFJF)
              </span>
            </div>
          </div>
          <button
            type="button"
            className="auth-modal-close-btn"
            onClick={onClose}
            aria-label="Fechar formulário de cadastro"
          >
            <X size={20} />
          </button>
        </div>

        {erro && (
          <div className="auth-error-banner" role="alert" style={{ margin: '1rem 1.5rem 0' }}>
            <span>{erro}</span>
          </div>
        )}

        {/* Formulário com Scroll Suave */}
        <form onSubmit={handleSubmit} className="auth-modal-body">
          
          {/* Seção 1: Identificação Básica */}
          <div className="auth-form-section">
            <span className="auth-section-tag">
              <GraduationCap size={14} /> 1. Identificação Básica
            </span>

            <div className="auth-grid-2col">
              <div className="auth-field-group">
                <label className="auth-label">Nome Completo *</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Ex: Prof. Samuel de Amorim"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field-group">
                <label className="auth-label">E-mail Institucional *</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="Ex: samuel.amorim@instituto.edu.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-label">Senha de Acesso *</label>
              <input
                type="password"
                className="auth-input"
                placeholder="Mínimo de 6 dígitos"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Seção 2: Vínculo Institucional na Rede Federal */}
          <div className="auth-form-section">
            <span className="auth-section-tag">
              <Building2 size={14} /> 2. Vínculo Institucional (RFEPCT)
            </span>

            <div className="auth-field-group">
              <label className="auth-label">Instituto Federal / CEFET *</label>
              <select
                className="auth-select"
                value={instituicao}
                onChange={(e) => setInstituicao(e.target.value)}
              >
                {INSTITUICOES_RFEPCT.map((inst, idx) => (
                  <option key={idx} value={inst}>{inst}</option>
                ))}
              </select>
            </div>

            <div className="auth-field-group">
              <label className="auth-label">Campus de Atuação *</label>
              <input
                type="text"
                className="auth-input"
                placeholder="Ex: Campus Januária, Campus São Paulo, Campus Juiz de Fora"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Seção 3: Atuação Pedagógica em Matemática & EPT */}
          <div className="auth-form-section">
            <span className="auth-section-tag">
              <BookOpen size={14} /> 3. Atuação em Matemática na EPT
            </span>

            <div className="auth-field-group">
              <label className="auth-label">Componente / Ênfase Curricular Principal</label>
              <select
                className="auth-select"
                value={areaMatematica}
                onChange={(e) => setAreaMatematica(e.target.value)}
              >
                {AREAS_MATEMATICA.map((area, idx) => (
                  <option key={idx} value={area}>{area}</option>
                ))}
              </select>
            </div>

            <div className="auth-field-group">
              <label className="auth-label">
                Cursos Técnicos Atendidos * (Clique para selecionar)
              </label>
              <div className="auth-tags-grid">
                {CURSOS_TECNICOS_LISTA.map((curso) => {
                  const isSelected = cursosSelecionados.includes(curso);
                  return (
                    <button
                      key={curso}
                      type="button"
                      className={`auth-tag-pill ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleCurso(curso)}
                    >
                      {isSelected && <Check size={13} strokeWidth={3} />}
                      <span>{curso}</span>
                    </button>
                  );
                })}
              </div>
              <small className="auth-help-hint">
                A IA utilizará esses cursos para parametrizar situações-problema autênticas no Laboratório.
              </small>
            </div>
          </div>

          {/* Termo de Compromisso Acadêmico */}
          <div className="auth-consent-box">
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                checked={concordouTermos}
                onChange={(e) => setConcordouTermos(e.target.checked)}
                required
              />
              <span>
                Concordo em participar da avaliação piloto e compreendo que todas as saídas de IA
                <strong> devem ser revisadas pela minha autoridade docente</strong> antes de qualquer uso em aula.
              </span>
            </label>
          </div>

          {/* Rodapé de Ações do Modal */}
          <div className="auth-modal-footer">
            <button
              type="button"
              className="btn-auth-cancel"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-auth-submit-modal"
              disabled={!concordouTermos}
            >
              <span>Concluir Cadastro & Conhecer a Plataforma</span>
              <ArrowRight size={18} />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
