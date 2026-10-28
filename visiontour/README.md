# Vision Tour | site institucional (prévia)

Prévia: https://www.sitepreviavisual.site/visiontour/
Extensão do link na bio aprovado (`/biovisiontour`): mesma paleta, fontes, logo, textura de rotas e cartões de embarque.

## Onde editar

| O quê | Onde |
|---|---|
| Número do WhatsApp | `js/rastreio.js`, campo `whatsapp` (hoje 5585994366957, conferir com a Sarah) |
| Links de pacotes e promoções, site oficial, Google Maps, Instagram | `js/rastreio.js`, bloco `links` (os botões com `data-link` puxam daqui) |
| Mensagem pronta de cada botão | atributo `data-wa-msg` no `index.html` |
| GA4 e Meta Pixel | `js/consent.js`, bloco `CONFIG` (só carregam depois do aceite) |
| Textos | `index.html`, seção por seção (os comentários marcam cada uma) |
| Cadastur, noites dos roteiros, prazo de 24 horas | procurar por `[` no `index.html` |
| E-mail das políticas | procurar `[EMAIL_DE_CONTATO]` nas pastas `politica-de-*` |

## Scrollytelling (seções 1 e 2)

O vídeo do topo virou sequência de quadros em `assets/seq/` e avança com a rolagem (`js/main.js`, bloco "voo").

- `aviao/` e `chegada/`: computador (1280 e 1120 px)
- `aviao-m/` e `chegada-m/`: celular (vertical)

Para trocar o vídeo, gerar de novo os quadros com ffmpeg:

```bash
ffmpeg -i video.mp4 -vf "fps=5,scale=1280:-2" -c:v libwebp -quality 62 -start_number 0 assets/seq/aviao/%03d.webp
```

e ajustar o `total` de quadros em `js/main.js` (objeto `SEQ`).

## Antes de publicar de verdade

1. Esconder as notas de prévia: apagar os elementos `.previa-nota`.
2. Seção de depoimentos (`#depoimentos`): trocar `data-previa` por `hidden` até existir depoimento real.
3. Mapa: deixar no `<select id="saida">` e no SVG só as capitais que a operadora confirmar.
4. Trocar as fotos pendentes (blocos `.vaga`) pelas fotos reais, em WebP, com `width` e `height`.
5. Domínio final: atualizar `canonical`, `og:url`, `og:image`, `sitemap.xml`, `robots.txt` e os caminhos `/visiontour/` do `404.html` e do `consent.js`.
6. Hostinger: enviar tudo para `public_html` (o `.htaccess` já está pronto).
