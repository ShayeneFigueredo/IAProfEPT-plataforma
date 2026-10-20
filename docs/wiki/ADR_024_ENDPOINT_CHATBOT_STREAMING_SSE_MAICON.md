# ADR 024: Endpoint de Chatbot com Streaming SSE para o Assistente Virtual (Prof. mAIcon)

## 1. Contexto & Justificativa
O Ambiente 5 (Suporte / Prof. mAIcon) exige um assistente virtual capaz de guiar o professor pela plataforma, responder dúvidas sobre os outros 4 ambientes e orientar quanto ao uso ético da IA.
Para garantir uma experiência interativa e semelhante ao ChatGPT, era mandatório o uso de Server-Sent Events (SSE) entregando o conteúdo gerado "token a token", para mascarar o tempo de geração e reduzir o Time To First Token (TTFT).

### Relação com os Princípios do Projeto
- **Arquitetura de IA:** O serviço se baseia na LPU da Groq que já está implementada na infraestrutura, conhecida pelo altíssimo throughput, favorecendo assim o TTFT (< 400ms).
- **Proibição de Caixa em Branco (Exceção Ponderada):** Embora os geradores de plano de aula não possuam prompt cru (ADR 001), o assistente de navegação `mAIcon` atua isoladamente como chatbot de suporte. O `System Prompt` limita severamente seu escopo de atuação para garantir que funcione restrito ao contexto da EPT e suporte da plataforma.

## 2. Decisão Arquitetural
- **`POST /api/maicon/chat`**: Recebe o histórico da conversa e se conecta à Groq API utilizando `fetch` nativo no Node com o parâmetro `stream: true`.
- Foi implementado um parser de chunks e TextDecoder que processa as linhas iniciadas com `data: ` geradas pela API compatível da OpenAI/Groq e envia através de `res.write` para a conexão persistente do cliente via protocolo SSE.
- O endpoint também implementa tratamento de fallback. Caso o modelo principal não esteja disponível, ele cai silenciosamente para `openai/gpt-oss-120b` (ou outro definido via variável de ambiente), preservando a resiliência.

## 3. Impacto no Produto Educacional
- **Ambiente Afetado:** Suporte / Prof. mAIcon.
- Os professores terão suporte síncrono para explorar metodologias sem aguardar longos carregamentos, reduzindo atritos com a usabilidade e fomentando a exploração dos acervos formativos.

## 4. Verificação de Acessibilidade & UX
- A ausência de buffering (`X-Accel-Buffering: no` no Nginx/Express) faz com que a interface seja responsiva instantaneamente.
- Em nossos testes unitários, o tempo até o primeiro token ocorreu próximo de 150-500ms dependendo da proximidade geográfica do servidor com o endpoint da Groq e acionamento ou não do Fallback. 

