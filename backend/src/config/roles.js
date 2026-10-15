/**
 * Definição de Papéis de Usuários (RBAC) e Níveis de Permissão
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Tese de Doutorado: Maycon Luiz Amaral Magalhães
 * Orientação: Prof. Dr. Eduardo Barrére & Prof. Dr. Manuel Cabral dos Santos Reis
 * 
 * Papéis Oficiais em Conformidade com o Esquema Relacional do PostgreSQL:
 * 1. docente_rfepct: Professor da Rede Federal (Acesso aos 5 Ambientes e Práticas)
 * 2. pesquisador_doutorado: Pesquisador Acadêmico (Acesso docente + Métricas da Tese e Telemetria A/B)
 * 3. administrador_ufjf: Administrador Institucional da UFJF (Acesso irrestrito a governança e auditoria)
 */

export const ROLES = Object.freeze({
  DOCENTE_RFEPCT: 'docente_rfepct',
  PESQUISADOR_DOUTORADO: 'pesquisador_doutorado',
  ADMINISTRADOR_UFJF: 'administrador_ufjf',
});

export const VALID_ROLES = Object.freeze(Object.values(ROLES));

export const ROLE_HIERARCHY = Object.freeze({
  [ROLES.DOCENTE_RFEPCT]: 1,
  [ROLES.PESQUISADOR_DOUTORADO]: 2,
  [ROLES.ADMINISTRADOR_UFJF]: 3,
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.DOCENTE_RFEPCT]: 'Docente da RFEPCT',
  [ROLES.PESQUISADOR_DOUTORADO]: 'Pesquisador de Doutorado (PPGEM/UFJF)',
  [ROLES.ADMINISTRADOR_UFJF]: 'Administrador de Sistema (UFJF)',
});

/**
 * Verifica se um papel informado é válido dentro do ecossistema IAprofEPT
 * @param {string} role 
 * @returns {boolean}
 */
export function isValidRole(role) {
  return typeof role === 'string' && VALID_ROLES.includes(role);
}

/**
 * Verifica se o papel do usuário satisfaz a lista de papéis permitidos
 * @param {string} userRole 
 * @param {string[]} allowedRoles 
 * @returns {boolean}
 */
export function isRoleAllowed(userRole, allowedRoles = []) {
  if (!userRole) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole);
}

export default {
  ROLES,
  VALID_ROLES,
  ROLE_HIERARCHY,
  ROLE_LABELS,
  isValidRole,
  isRoleAllowed,
};
