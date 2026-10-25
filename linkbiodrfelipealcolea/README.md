# Link na bio | Dr. Felipe Alcoléa

Cirurgião-dentista, harmonização facial e clínica geral. Sorocaba, SP. CRO-SP 99542. Instagram @drfelipealcolea.

Prévia: https://www.sitepreviavisual.site/linkbiodrfelipealcolea/

## Onde editar

| O quê | Arquivo | Onde |
|---|---|---|
| WhatsApp do consultório | `site/js/rastreio.js` | `CONFIG.whatsapp` (só números: 55 + DDD + número) |
| Link do Google Maps | `site/js/rastreio.js` | `CONFIG.links.maps` |
| Link dos cursos e da mentoria | `site/js/rastreio.js` | `CONFIG.links.mentoria` |
| Mensagens prontas de cada botão | `site/index.html` | atributo `data-wa-msg` de cada botão |
| GA4 e Meta Pixel (carregam só após "Aceitar") | `site/js/consent.js` | `CONFIG.ga4`, `CONFIG.metaPixel` |
| Textos e lista de atendimentos | `site/index.html` | seções "Consultório", "Atendimentos", "Para dentistas" |
| Cores e fontes | `site/css/styles.css` | bloco `:root` no topo |

Enquanto um link do CONFIG estiver vazio, o botão mostra "Este link está sendo configurado" em vez de abrir.
Cada clique dispara o evento com o nome do `data-btn` (GA4 `clique_whatsapp` / `clique_botao` e Meta `Contact`). As UTMs da URL são repassadas para o WhatsApp e para os links.

Link para colocar no Instagram (com UTM):
`https://www.sitepreviavisual.site/linkbiodrfelipealcolea/?utm_source=instagram&utm_medium=organic&utm_campaign=link_na_bio`

## Domínio próprio
Ao mudar de endereço, trocar `https://www.sitepreviavisual.site/linkbiodrfelipealcolea/` em: `index.html` (canonical, og:url, og:image, JSON-LD), páginas de política, `robots.txt` e `sitemap.xml`. No `404.html`, trocar o caminho `/linkbiodrfelipealcolea/` por `/`.

## Publicar
- Hostinger: enviar o conteúdo de `site/` para `public_html` (o `.htaccess` já força HTTPS e aponta o 404). Conferir SSL com e sem www.
- GitHub Pages: copiar `site/` para a pasta do repositório e dar push.

## Estilo (registro)
Arquitetônico/escultural. Pedra #ECE8E2, grafite #23211F, acento ferrugem #9A4528. Gloock + Schibsted Grotesk. Cantos retos (2px). Retrato em círculo à direita com o "traço de contorno" (arco ferrugem que se desenha na entrada).
