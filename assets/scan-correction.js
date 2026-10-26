(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const KEY = "enat-itest-demo-questions-v1";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let selectedImage = null;
  function say(message) {
    const el = $("scan-status");
    if (el) el.textContent = message;
  }
  function decodeQr(canvas) {
    if (!window.jsQR) return {error:"Leitor QR indisponível. Verifique a conexão e recarregue a página."};
    const ctx = canvas.getContext("2d", {willReadFrequently:true});
    const image = ctx.getImageData(0,0,canvas.width,canvas.height);
    const result = window.jsQR(image.data, image.width, image.height, {inversionAttempts:"attemptBoth"});
    if (!result) return {error:"QR Code não identificado. Tente uma imagem mais nítida, com o código inteiro visível."};
    let payload;
    try { payload = JSON.parse(result.data); } catch (_) { return {error:"QR encontrado, mas o conteúdo não é um identificador ENAT iTEST reconhecido."}; }
    return {payload, raw:result.data};
  }
  async function analyzeFile(file) {
    if (!file || !/^image\/(png|jpeg|webp|bmp)$/i.test(file.type)) {
      say("Selecione uma imagem PNG, JPG ou WebP da folha preenchida. PDFs ainda não são processados nesta etapa.");
      return;
    }
    selectedImage = file;
    say("Lendo imagem e procurando o QR Code…");
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});
      const maxSide=1800, scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
      canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      canvas.getContext("2d",{willReadFrequently:true}).drawImage(img,0,0,canvas.width,canvas.height);
      const decoded=decodeQr(canvas);
      $("scan-preview").innerHTML='<img alt="Pré-visualização da folha enviada" src="'+url+'">';
      if(decoded.error){
        say(decoded.error);
        $("scan-result").innerHTML='<div class="scan-warning">'+esc(decoded.error)+'</div>';
        return;
      }
      const p=decoded.payload;
      $("scan-result").innerHTML='<div class="scan-success"><strong>QR Code lido</strong><dl><dt>Sistema</dt><dd>'+esc(p.app||"Não identificado")+'</dd><dt>Formato</dt><dd>'+esc(p.format||"Não informado")+'</dd><dt>Versão</dt><dd>'+esc(p.version||"Não informada")+'</dd><dt>Identificador</dt><dd>'+esc(p.examId||p.assessmentId||p.id||"Não incluído no QR")+'</dd></dl></div><div class="scan-warning"><strong>Leitura identificada; correção ainda não executada.</strong><p>O QR Code atual identifica o documento, mas não fornece um modelo calibrado de marcações. A leitura OMR e a comparação com o gabarito ainda precisam ser implementadas e validadas antes de atribuir notas.</p></div>';
      say("QR Code decodificado. A leitura das respostas está pendente da implementação OMR.");
    } catch (e) {
      say("Não foi possível abrir esta imagem. Verifique o arquivo e tente novamente.");
    } finally { URL.revokeObjectURL(url); }
  }
  document.addEventListener("DOMContentLoaded",()=>{
    const open=$("open-correction");
    const dialog=$("correction-dialog");
    if(open&&dialog) open.addEventListener("click",()=>{if(typeof dialog.showModal==="function")dialog.showModal();else dialog.setAttribute("open","");});
    const close=$("close-correction");
    const closeBottom=$("close-correction-bottom");
    const closeDialog=()=>dialog&&(dialog.close?dialog.close():dialog.removeAttribute("open"));
    if(close)close.addEventListener("click",closeDialog);
    if(closeBottom)closeBottom.addEventListener("click",closeDialog);
    const file=$("scan-file");
    if(file)file.addEventListener("change",()=>analyzeFile(file.files&&file.files[0]));
    const camera=$("scan-camera");
    if(camera)camera.addEventListener("click",()=>{if(file){file.setAttribute("capture","environment");file.click();}});
    const reset=$("scan-reset");
    if(reset)reset.addEventListener("click",()=>{$("scan-file").value="";$("scan-preview").replaceChildren();$("scan-result").replaceChildren();selectedImage=null;say("Envie uma imagem para iniciar a identificação da folha.");});
  });
})();