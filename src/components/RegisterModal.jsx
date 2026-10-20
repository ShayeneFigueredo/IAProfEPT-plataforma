import React, { useState } from 'react';
import { X, GraduationCap, Building2, BookOpen, Layers, Check, ArrowRight, ShieldCheck, MapPin, FileText, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import Badge from './Badge';
import { UFS_LISTA, INSTITUICOES_ORIGEM_LISTA, CURSOS_TECNICOS_EPT, TERMO_ETICO_COMPLETO } from '../data/instituicoesData';

const AREAS_MATEMATICA = [
  'Matemática no Ensino Médio Integrado',
  'Matemática Aplicada aos Cursos Técnicos',
  'Estatística e Probabilidade na EPT',
  'Cálculo e Álgebra em Cursos Tecnológicos',
  'Educação Matemática Crítica na EPT'
];

/**
 * Modal de Cadastro Parametrizado para Docentes da RFEPCT
 * Coleta: Nome Completo, E-mail, UF, Instituição de Origem (IF/CEFET/Colégio Técnico),
 * Campus, Cursos Técnicos em que leciona e Aceite do Termo Ético de Pesquisa.
 */
export default function RegisterModal({ isOpen, onClose, onRegisterSuccess }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [uf, setUf] = useState('MG');
  const [instituicao, setInstituicao] = useState('IFNMG - Instituto Federal do Norte de Minas Gerais');
  const [outraRede, setOutraRede] = useState('');
  const [campus, setCampus] = useState('');
  const [areaMatematica, setAreaMatematica] = useState(AREAS_MATEMATICA[0]);
  const [cursosSelecionados, setCursosSelecionados] = useState(['Informática', 'Agropecuária']);
  const [concordouTermos, setConcordouTermos] = useState(false);
  const [expandiuTermo, setExpandiuTermo] = useState(false);
  const [erro, setErro] = useState('');

  if (!isOpen) return null;

  // Filtra as instituições da UF selecionada para facilitar, mantendo opção de outras
  const instituicoesDaUf = INSTITUICOES_ORIGEM_LISTA.filter(i => i.uf === uf);
  const outrasInstituicoes = INSTITUICOES_ORIGEM_LISTA.filter(i => i.uf !== uf);

  const handleUfChange = (novaUf) => {
    setUf(novaUf);
    const primeiraDaUf = INSTITUICOES_ORIGEM_LISTA.find(i => i.uf === novaUf);
    if (primeiraDaUf) {
      setInstituicao(primeiraDaUf.nome);
    }
  };

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

    if (!nome.trim()) {
      setErro('Por favor, informe seu Nome Completo.');
      return;
    }
    if (!email.trim()) {
      setErro('Por favor, informe seu E-mail Institucional.');
      return;
    }
    if (!senha.trim()) {
      setErro('Por favor, defina uma senha de acesso.');
      return;
    }
    if (!campus.trim()) {
      setErro('Por favor, informe seu Campus de Lotação / Unidade.');
      return;
    }
    if (instituicao === 'Outra Instituição da Rede Federal (RFEPCT)' && !outraRede.trim()) {
      setErro('Por favor, informe o nome da sua Instituição da Rede Federal.');
      return;
    }
    if (cursosSelecionados.length === 0) {
      setErro('Selecione ao menos 1 curso técnico em que leciona.');
      return;
    }
    if (!concordouTermos) {
      setErro('É obrigatório o Aceite do Termo Ético de Pesquisa para participar.');
      return;
    }

    setErro('');

    // Extrai as iniciais do nome
    const nomesArray = nome.trim().split(' ');
    const iniciais = nomesArray.length > 1
      ? (nomesArray[0][0] + nomesArray[nomesArray.length - 1][0]).toUpperCase()
      : nome.substring(0, 2).toUpperCase();

    const siglaInst = instituicao === 'Outra Instituição da Rede Federal (RFEPCT)' 
      ? (outraRede.substring(0, 8).toUpperCase() + '...')
      : (instituicao.split(' - ')[0] || 'RFEPCT');

    // Cria o perfil do novo docente cadastrado
    const novoUsuario = {
      nome: nome.trim(),
      email: email.trim(),
      matricula: matricula.trim(),
      uf: uf,
      instituicao: siglaInst,
      instituicaoCompleta: instituicao === 'Outra Instituição da Rede Federal (RFEPCT)' ? outraRede.trim() : instituicao,
      outra_rede: instituicao === 'Outra Instituição da Rede Federal (RFEPCT)' ? outraRede.trim() : null,
      campus: campus.trim(),
      cargo: `Docente de Matemática · ${siglaInst} (${campus.trim()} - ${uf})`,
      areaMatematica: areaMatematica,
      cursosAtendidos: cursosSelecionados,
      termoAceito: true,
      iniciais: iniciais,
      foto: null,
      cadastradoEm: new Date().toISOString()
    };

    // Salva na lista de contas registradas localmente para permitir logins futuros
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
                Acolhimento à pesquisa de Doutorado em Educação Matemática (PPGEM / UFJF)
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
          <div className="auth-error-banner" role="alert" style={{ margin: '1rem 1.75rem 0' }}>
            <AlertCircle size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
            <span>{erro}</span>
          </div>
        )}

        {/* Formulário Parametrizado */}
        <form onSubmit={handleSubmit} className="auth-modal-body">
          
          {/* Seção 1: Identificação Básica */}
          <div className="auth-form-section">
            <span className="auth-section-tag">
              <GraduationCap size={14} /> 1. Identificação Docente
            </span>

            <div className="auth-field-group">
              <label className="auth-label">Nome Completo *</label>
              <input
                type="text"
                className="auth-input"
                placeholder="Ex: Profª. Maria Silva Santos"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="auth-grid-2col">
              <div className="auth-field-group">
                <label className="auth-label">E-mail Institucional *</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="Ex: maria.santos@instituto.edu.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Matrícula SIAPE (Opcional)</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Ex: 1982345"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-label">Senha de Acesso à Plataforma *</label>
              <input
                type="password"
                className="auth-input"
                placeholder="Defina sua senha (mínimo de 6 dígitos)"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Seção 2: Vínculo Institucional e Localização */}
          <div className="auth-form-section">
            <span className="auth-section-tag">
              <Building2 size={14} /> 2. Vínculo Institucional na Rede Federal
            </span>

            <div className="auth-grid-2col">
              <div className="auth-field-group">
                <label className="auth-label">UF (Estado da Instituição) *</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '0.85rem', color: 'var(--primary-green)', pointerEvents: 'none' }} />
                  <select
                    className="auth-select"
                    style={{ paddingLeft: '2.4rem' }}
                    value={uf}
                    onChange={(e) => handleUfChange(e.target.value)}
                    required
                  >
                    {UFS_LISTA.map((item) => (
                      <option key={item.sigla} value={item.sigla}>
                        {item.sigla} — {item.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Campus de Lotação / Unidade *</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Ex: Campus Januária, Campus Barbacena"
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-label">Instituição de Origem (IF / CEFET / Colégio Técnico) *</label>
              <select
                className="auth-select"
                value={instituicao}
                onChange={(e) => setInstituicao(e.target.value)}
                required
              >
                {instituicoesDaUf.length > 0 && (
                  <optgroup label={`Instituições em ${uf}`}>
                    {instituicoesDaUf.map((inst, idx) => (
                      <option key={`uf-${idx}`} value={inst.nome}>
                        [{inst.categoria}] {inst.nome}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Demais Instituições da Rede Federal (RFEPCT)">
                  {outrasInstituicoes.map((inst, idx) => (
                    <option key={`outra-${idx}`} value={inst.nome}>
                      [{inst.uf}] {inst.nome}
                    </option>
                  ))}
                </optgroup>
              </select>
              {instituicao === 'Outra Instituição da Rede Federal (RFEPCT)' && (
                <div style={{ marginTop: '0.75rem' }}>
                  <label className="auth-label">Qual a Instituição? *</label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Especifique o nome da sua Instituição da RFEPCT"
                    value={outraRede}
                    onChange={(e) => setOutraRede(e.target.value)}
                    required
                  />
                </div>
              )}
              <small className="auth-help-hint">
                Abrange Institutos Federais (IFs), Centros Federais (CEFETs) e Colégios Técnicos Vinculados.
              </small>
            </div>
          </div>

          {/* Seção 3: Cursos Técnicos em que leciona e Componente Curricular */}
          <div className="auth-form-section">
            <span className="auth-section-tag">
              <BookOpen size={14} /> 3. Cursos Técnicos em que leciona (EPT)
            </span>

            <div className="auth-field-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="auth-label">
                  Cursos Técnicos em que leciona *
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary-green)', fontWeight: 700 }}>
                  {cursosSelecionados.length} selecionado(s)
                </span>
              </div>
              <div className="auth-tags-grid">
                {CURSOS_TECNICOS_EPT.map((curso) => {
                  const isSelected = cursosSelecionados.includes(curso);
                  return (
                    <button
                      key={curso}
                      type="button"
                      className={`auth-tag-pill ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleCurso(curso)}
                      title={`Clique para selecionar ou remover ${curso}`}
                    >
                      {isSelected && <Check size={13} strokeWidth={3} />}
                      <span>{curso}</span>
                    </button>
                  );
                })}
              </div>
              <small className="auth-help-hint">
                A IA utilizará os cursos selecionados para ancorar os problemas de Matemática ao mundo do trabalho.
              </small>
            </div>

            <div className="auth-field-group">
              <label className="auth-label">Componente / Ênfase Curricular em Matemática</label>
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
          </div>

          {/* Seção 4: Aceite do Termo Ético de Pesquisa */}
          <div className="auth-form-section" style={{ background: '#F0FDF4', borderColor: 'var(--primary-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="auth-section-tag" style={{ color: 'var(--primary-green)' }}>
                <ShieldCheck size={16} /> 4. Aceite do Termo Ético de Pesquisa (PPGEM / UFJF)
              </span>
              <button
                type="button"
                onClick={() => setExpandiuTermo(!expandiuTermo)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-green)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                <FileText size={14} />
                <span>{expandiuTermo ? 'Ocultar Termo Completo' : 'Ler Termo na Íntegra (TCLE)'}</span>
                {expandiuTermo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {expandiuTermo && (
              <div
                style={{
                  background: 'white',
                  border: '1px solid var(--primary-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-main)',
                  lineHeight: '1.5',
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.88rem', color: 'var(--primary-green)' }}>
                  {TERMO_ETICO_COMPLETO.titulo}
                </h4>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <strong>{TERMO_ETICO_COMPLETO.programa}</strong><br />
                  Pesquisador: {TERMO_ETICO_COMPLETO.pesquisador} · {TERMO_ETICO_COMPLETO.orientacao}
                </p>
                <ul style={{ paddingLeft: '1.1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {TERMO_ETICO_COMPLETO.conteudo.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="auth-consent-box" style={{ background: 'white', borderColor: 'var(--primary-border)' }}>
              <label className="auth-checkbox-label" style={{ color: 'var(--text-main)' }}>
                <input
                  type="checkbox"
                  checked={concordouTermos}
                  onChange={(e) => setConcordouTermos(e.target.checked)}
                  required
                />
                <span style={{ fontSize: '0.82rem', lineHeight: '1.45' }}>
                  <strong>Declaro que li e concordo com o Termo Ético de Pesquisa</strong> da UFJF.
                  Autorizo o uso anônimo dos dados para fins acadêmicos e comprometo-me a exercer a
                  <strong> autoridade e validação docente</strong> sobre todos os materiais gerados por IA.
                </span>
              </label>
            </div>
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
              title={!concordouTermos ? 'Marque o aceite do termo ético para concluir' : 'Concluir cadastro'}
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
