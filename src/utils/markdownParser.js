export function parseMarkdown(text) {
  if (!text) return '';
  let html = text;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Code block
  html = html.replace(/```([\s\S]*?)```/g, '<pre style="background:var(--bg-main); padding:10px; border-radius:5px; overflow-x:auto;"><code>$1</code></pre>');
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background:var(--bg-main); padding:2px 4px; border-radius:3px;">$1</code>');
  
  // Line breaks
  html = html.replace(/\n/g, '<br/>');

  return html;
}

