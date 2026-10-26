(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const QUESTION_KEY = "enat-itest-demo-questions-v1";
  const ASSESSMENT_KEY = "enat-itest-assessments-v2";
  const RESULT_KEY = "enat-itest-omr-results-v1";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let cameraStream = null;
  function say(message) { const el = $("scan-status"); if (el) el.textContent = message; }
  function readStore(key) { try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; } catch (_) { return []; } }
  function decodeQr(canvas) {
    if (!window.jsQR) return {error:"Leitor QR indisponível. Recarregue a página e verifique a conexão."};
    const ctx = canvas.getContext("2d", {willReadFrequently:true});
    const image = ctx.getImageData(0,0,canvas.width,canvas.height);
    const result = window.jsQR(image.data,image.width,image.height,{inversionAttempts:"attemptBoth"});
    if (!result) return {error:"QR Code não identificado. Fotografe a folha inteira, sem cortar o código."};
    let payload;
    try { payload = JSON.parse(result.data); } catch (_) { return {error:"O QR Code não contém um identificador ENAT iTEST válido."}; }
    if (payload.app !== "ENAT-iTEST" || !payload.assessmentId || !Array.isArray(payload.questionIds)) return {error:"QR lido, mas não contém a avaliação e a sequência de questões necessárias para corrigir."};
    const loc = result.location;
    const qWidth = Math.hypot(loc.topRightCorner.x-loc.topLeftCorner.x,loc.topRightCorner.y-loc.topLeftCorner.y);
    return {payload, location:loc, qWidth};
  }
  function darkness(canvas, cx, cy, radius) {
    const ctx=canvas.getContext("2d",{willReadFrequently:true});
    const x0=Math.max(0,Math.floor(cx-radius)), y0=Math.max(0,Math.floor(cy-radius));
    const x1=Math.min(canvas.width,Math.ceil(cx+radius)), y1=Math.min(canvas.height,Math.ceil(cy+radius));
    if(x1<=x0||y1<=y0)return 0;
    const data=ctx.getImageData(x0,y0,x1-x0,y1-y0).data;
    let dark=0,total=0;
    for(let y=0;y<y1-y0;y++)for(let x=0;x<x1-x0;x++){
      const dx=x+x0-cx,dy=y+y0-cy;
      if(dx*dx+dy*dy>radius*radius)continue;
      const i=(y*(x1-x0)+x)*4;
      const gray=.299*data[i]+.587*data[i+1]+.114*data[i+2];
      if(gray<105)dark++;
      total++;
    }
    return total?dark/total:0;
  }
  function sampleAnswers(canvas, decoded, questionCount) {
    const q=decoded.qWidth, loc=decoded.location;
    const originX=loc.topLeftCorner.x, originY=loc.topLeftCorner.y;
    const choices=[];
    // Printed OMR template: QR at 18 mm from page top/left; answer grid starts at 75 mm.
    // Geometry is scaled from the QR width, so image resolution may vary.
    const firstRowY=originY+q*1.9, rowPitch=q*.20;
    const firstChoiceX=originX+q*.57, choicePitch=q*.57, radius=q*.035;
    for(let row=0;row<questionCount;row++){
      const scores=[];
      for(let col=0;col<5;col++) scores.push(darkness(canvas,firstChoiceX+col*choicePitch,firstRowY+row*rowPitch,radius));
      const ranked=scores.map((score,index)=>({score,index})).sort((a,b)=>b.score-a.score);
      const best=ranked[0], second=ranked[1];
      if(best.score<.24) choices.push({number:row+1,answer:null,status:"blank",scores});
      else if(second.score>.24 && best.score-second.score<.12) choices.push({number:row+1,answer:null,status:"multiple",scores});
      else if(best.score-second.score<.09) choices.push({number:row+1,answer:null,status:"uncertain",scores});
      else choices.push({number:row+1,answer:best.index,status:"read",confidence:best.score-second.score,scores});
    }
    return choices;
  }
  function renderReview(decoded, scan, assessment, questions, scoreData) {
    const total=scoreData.filter(x=>x.correct===true).length;
    const review=scoreData.filter(x=>x.status!=="ok").length;
    const saved={id:"omr-"+Date.now(),assessmentId:assessment.id,assessmentName:assessment.name,scannedAt:new Date().toISOString(),total:scoreData.length,correct:total,score:scoreData.length?Math.round(total/scoreData.length*10000)/100:0,answers:scoreData};
    let history=readStore(RESULT_KEY);history.push(saved);
    try{localStorage.setItem(RESULT_KEY,JSON.stringify(history));}catch(_){}
    const rows=scoreData.map(item=>'<tr><td>'+item.number+'</td><td>'+esc(item.prompt)+'</td><td>'+esc(item.readAnswer||"—")+'</td><td>'+esc(item.correctAnswer||"—")+'</td><td><span class="omr-state '+(item.status==="ok"?"good":"review")+'">'+esc(item.statusLabel)+'</span></td></tr>').join("");
    $("scan-result").innerHTML='<div class="scan-success"><strong>Correção automática concluída</strong><dl><dt>Avaliação</dt><dd>'+esc(assessment.name)+'</dd><dt>Questões</dt><dd>'+scoreData.length+'</dd><dt>Acertos</dt><dd>'+total+'</dd><dt>Nota percentual</dt><dd>'+saved.score.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})+'%</dd><dt>Pendências</dt><dd>'+review+'</dd></dl></div><div class="scan-warning"><strong>Resultado salvo somente neste navegador.</strong><p>Questões em branco, marcações duplas, baixa confiança ou tipos não objetivos precisam de revisão manual. Este módulo ainda não envia resultados a um servidor.</p></div><div class="omr-table-wrap"><table class="omr-table"><thead><tr><th>Nº</th><th>Questão</th><th>Lida</th><th>Gabarito</th><th>Situação</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
    say("Correção concluída: "+total+" acertos em "+scoreData.length+" questões; "+review+" pendência(s) para revisão.");
  }
  async function analyzeFile(file) {
    if(!file||!/^image\/(png|jpeg|webp|bmp)$/i.test(file.type)){say("Selecione uma imagem PNG, JPG ou WebP. PDF ainda não é processado.");return;}
    say("Analisando QR Code e marcações…");
    const url=URL.createObjectURL(file);
    try{
      const img=new Image();
      await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});
      const scale=Math.min(1,2200/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement("canvas");canvas.width=Math.round(img.naturalWidth*scale);canvas.height=Math.round(img.naturalHeight*scale);
      canvas.getContext("2d",{willReadFrequently:true}).drawImage(img,0,0,canvas.width,canvas.height);
      $("scan-preview").innerHTML='<img alt="Pré-visualização da folha enviada" src="'+url+'">';
      const decoded=decodeQr(canvas);
      if(decoded.error){say(decoded.error);$("scan-result").innerHTML='<div class="scan-warning">'+esc(decoded.error)+'</div>';return;}
      const p=decoded.payload;
      const assessments=readStore(ASSESSMENT_KEY), questions=readStore(QUESTION_KEY);
      const assessment=assessments.find(x=>Number(x.id)===Number(p.assessmentId));
      if(!assessment){const message="O QR foi lido, mas esta avaliação não está disponível no armazenamento deste navegador. A versão atual não tem banco central conectado.";say(message);$("scan-result").innerHTML='<div class="scan-warning">'+esc(message)+'</div>';return;}
      const ids=p.questionIds.map(Number), linked=ids.map(id=>questions.find(q=>Number(q.id)===id));
      if(!ids.length||linked.some(q=>!q)){const message="Não foi possível recuperar todas as questões vinculadas ao QR Code. Verifique se a avaliação foi criada neste mesmo navegador e se o banco de questões continua disponível.";say(message);$("scan-result").innerHTML='<div class="scan-warning">'+esc(message)+'</div>';return;}
      if(ids.length>30){const message="Esta versão do cartão OMR suporta até 30 questões por folha. Gere um cartão com até 30 questões para corrigir automaticamente.";say(message);$("scan-result").innerHTML='<div class="scan-warning">'+esc(message)+'</div>';return;}
      if(decoded.qWidth<25){const message="O QR Code está pequeno demais para calibrar a leitura. Envie uma foto mais próxima e nítida da folha inteira.";say(message);$("scan-result").innerHTML='<div class="scan-warning">'+esc(message)+'</div>';return;}
      const scanned=sampleAnswers(canvas,decoded,ids.length);
      const scoreData=scanned.map((read,index)=>{
        const q=linked[index];
        const type=q.type||"multiple_choice";
        const objective=type==="multiple_choice"||type==="true_false";
        const answerIndex=read.answer;
        const correctIndex=Number(q.answer);
        let status=read.status, correct=null, readAnswer=answerIndex===null?null:String.fromCharCode(65+answerIndex);
        if(!objective){status="manual";readAnswer=readAnswer||null;}
        else if(status==="read"){correct=answerIndex===correctIndex;status="ok";}
        const labels={blank:"Em branco",multiple:"Múltiplas marcações",uncertain:"Leitura incerta",manual:"Correção manual necessária",ok:correct?"Correta":"Incorreta"};
        return {number:index+1,questionId:q.id,prompt:q.prompt,readAnswer,correctAnswer:objective?String.fromCharCode(65+correctIndex):"Manual",correct,status:status==="ok"?"ok":status,statusLabel:labels[status]||"Revisar",confidence:read.confidence||0};
      });
      renderReview(decoded,scanned,assessment,linked,scoreData);
    }catch(error){say("Não foi possível analisar a imagem. Tente outra foto, com a folha inteira visível.");$("scan-result").innerHTML='<div class="scan-warning">Falha na leitura da imagem. Nenhum resultado foi calculado.</div>';}
    finally{URL.revokeObjectURL(url);}
  }
  document.addEventListener("DOMContentLoaded",()=>{
    const dialog=$("correction-dialog");
    const open=$("open-correction");
    if(open&&dialog)open.addEventListener("click",()=>{if(typeof dialog.showModal==="function")dialog.showModal();else dialog.setAttribute("open","");});
    const closeDialog=()=>{if(dialog){if(dialog.close)dialog.close();else dialog.removeAttribute("open");}stopCameraStream();};
    ["close-correction","close-correction-bottom"].forEach(id=>{const button=$(id);if(button)button.addEventListener("click",closeDialog);});
    const file=$("scan-file");if(file)file.addEventListener("change",()=>analyzeFile(file.files&&file.files[0]));
    const video=$("scan-video"),panel=$("camera-panel");
    function stopCameraStream(){if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null;}if(video)video.srcObject=null;if(panel)panel.hidden=true;}
    const camera=$("scan-camera");
    if(camera)camera.addEventListener("click",async()=>{
      if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){say("Câmera indisponível neste navegador. Envie uma imagem.");return;}
      try{stopCameraStream();cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});video.srcObject=cameraStream;panel.hidden=false;await video.play();say("Câmera ativa. Enquadre a folha inteira e capture.");}
      catch(e){say(e&&e.name==="NotAllowedError"?"Acesso à câmera negado. Autorize nas permissões do navegador.":"Não foi possível abrir a câmera. Use o envio de imagem.");}
    });
    const stop=$("scan-camera-stop");if(stop)stop.addEventListener("click",()=>{stopCameraStream();say("Câmera desligada.");});
    const capture=$("scan-capture");if(capture)capture.addEventListener("click",async()=>{
      if(!video||!video.videoWidth){say("A câmera ainda está iniciando.");return;}
      const canvas=document.createElement("canvas");canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext("2d").drawImage(video,0,0);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",.94));stopCameraStream();
      if(blob)await analyzeFile(new File([blob],"captura-omr.jpg",{type:"image/jpeg"}));else say("Não foi possível capturar a imagem.");
    });
    const reset=$("scan-reset");if(reset)reset.addEventListener("click",()=>{stopCameraStream();if(file)file.value="";$("scan-preview").replaceChildren();$("scan-result").replaceChildren();say("Envie uma imagem para iniciar a correção automática.");});
    if(dialog)dialog.addEventListener("close",stopCameraStream);
  });
})();