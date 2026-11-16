// Dra. Deyse Dhulle: endereço oficial é https://www.dradeysedhulle.com.br
// Sem "www" ou sem "https": leva para o endereço oficial (redirecionamento permanente).
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const oficial = url.hostname === "dradeysedhulle.com.br" || url.hostname === "www.dradeysedhulle.com.br";
    if (oficial && (url.hostname !== "www.dradeysedhulle.com.br" || url.protocol !== "https:")) {
      url.hostname = "www.dradeysedhulle.com.br";
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
