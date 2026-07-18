# Documentação FinBeauty

- [FinBeauty-Documentacao-Completa.md](./FinBeauty-Documentacao-Completa.md) — fonte em markdown (editável, versionada).
- Versão `.docx` gerada e disponível para download no chat.

Para regerar o `.docx`:

```bash
pandoc docs/FinBeauty-Documentacao-Completa.md -o FinBeauty-Documentacao-Completa.docx --toc --toc-depth=2 --number-sections -V lang=pt-BR
```
