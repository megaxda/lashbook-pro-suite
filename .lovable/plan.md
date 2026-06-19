## Plano: Esconder Badge do Lovable via CSS

### Objetivo
Adicionar ao final do `src/index.css` uma regra CSS que oculte o elemento `#lovable-badge` em todas as páginas da aplicação.

### Alteração
- **Arquivo**: `src/index.css`
- **Ação**: Inserir no final do arquivo (após o fechamento da última chave `}`):
  ```css
  #lovable-badge {
    display: none !important;
  }
  ```
  (Nota: CSS usa `!important` em inglês, não `!importante`.)

### Resultado esperado
A badge "Edit with Lovable" não será mais exibida no preview nem na versão publicada do app.