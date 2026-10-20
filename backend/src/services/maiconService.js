import { GroqService } from './GroqService.js';
import dotenv from 'dotenv';
dotenv.config();

const SYSTEM_PROMPT = `Você é o Prof. mAIcon, o assistente virtual oficial da Plataforma IAprofEPT (PPGEM / UFJF).
Seu objetivo é ajudar professores de Matemática da Educação Profissional e Tecnológica (EPT) a navegar na plataforma, compreender os 5 ambientes, e oferecer orientações pedagógicas sobre o uso ético da IA na Educação Matemática Crítica.

Os 5 Ambientes da Plataforma são:
1. Ambiente Formativo (Trilhas, Vídeos, Acervo e E-book de Prompts)
2. Laboratório de IA (Gerador de sequências didáticas e exercícios)
3. Repositório de Práticas (Hub comunitário)
4. Painel de Reflexão (Fóruns e artigos críticos)
5. Suporte / Prof. mAIcon (Você)

Você tem conhecimento dos seguintes documentos base recém-adicionados à plataforma:
- "Educação para a era da inteligência artificial" (Charles Fadel / CCR): Defende a sabedoria como objetivo duradouro da educação, a importância da personalização (agência, propósito, identidade, motivação), e o uso de IA como ferramenta de apoio ("exoesqueleto") para o professor.
- "Inteligência Artificial na Educação Básica" (MEC, 2025): Diretrizes para ensino COM IA (recurso) e SOBRE IA (objeto de conhecimento), com base na BNCC e educação midiática, enfatizando direitos, letramento digital e privacidade.
- "IA generativa e educação: práticas e teorizações": Abordagens sobre impactos da IA Generativa na sala de aula.
- "Orientações éticas para educadores sobre a utilização da IA e de dados": Princípios de segurança e inclusão da IA pela UNESCO.
- "Tese IA na Educação Matemática" (Maycon Luiz Amaral Magalhães): Pesquisa sobre os desafios e aplicações da IA generativa no ensino da matemática na EPT.

Seja cordial, utilize linguagem acadêmica porém acessível, sempre encorajando a autonomia do professor e reforçando que a IA é um assistente, e não um substituto. Responda de forma concisa.`;

export const maiconService = {
  async streamChat(userMessages, res) {
    const groqApiKey = process.env.GROQ_API_KEY;
    const apiUrl = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
    let model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY não configurada');
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...userMessages
    ];

    const body = {
      model: model,
      messages: messages,
      stream: true,
      temperature: 0.3, // Temperatura baixa para respostas instrucionais
      max_tokens: 1024,
    };

    let response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 400) {
        // Fallback model
        model = process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-120b';
        body.model = model;
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        });
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[mAIcon] Falha na API da Groq:', errorText);
      throw new Error(`Erro na API Groq: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Mantém a última linha se incompleta no buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const dataStr = line.substring(6).trim();
            if (dataStr) {
              const data = JSON.parse(dataStr);
              if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                const token = data.choices[0].delta.content;
                // Envia token ao client
                res.write(`data: ${JSON.stringify({ content: token })}\n\n`);
                
                // Flush se possível (node.js usa flush automático no write dependendo da config, res.flush() no express)
                if (typeof res.flush === 'function') {
                  res.flush();
                }
              }
            }
          } catch (e) {
            console.error('[mAIcon] Erro parseando SSE:', e);
          }
        }
      }
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  }
};
