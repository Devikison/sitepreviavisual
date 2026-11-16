// Dra. Deyse Dhulle: endereço oficial é www.dradeysedhulle.com.br
// Quem entrar sem o "www" é levado para o endereço com "www" (redirecionamento permanente).
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "dradeysedhulle.com.br") {
      url.hostname = "www.dradeysedhulle.com.br";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
