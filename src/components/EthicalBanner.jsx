import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function EthicalBanner() {
  return (
    <div className="ethical-alert-box">
      <div className="ethical-icon-circle">
        <AlertTriangle size={20} />
      </div>
      <div className="ethical-text-content">
        <h4>Compromisso Ético e Validação Pedagógica Obrigatória</h4>
        <p>
          "Este material foi concebido com assistência de Inteligência Artificial Generativa e <strong>deve ser revisado, validado e adaptado pela autoridade docente</strong> antes de qualquer aplicação em sala de aula."
        </p>
      </div>
    </div>
  );
}
