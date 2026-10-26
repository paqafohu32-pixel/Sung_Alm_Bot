const BASE=(import.meta.env.VITE_API_BASE_URL||"").replace(/\/$/,"");

async function request(path,options={},timeout=30000){
  const c=new AbortController();
  const timer=setTimeout(()=>c.abort(),timeout);
  try{
    const r=await fetch(`${BASE}/api${path}`,{
      ...options, signal:c.signal,
      headers:{"Content-Type":"application/json",...(options.headers||{})}
    });
    let d={};
    try{d=await r.json()}catch{throw new Error("invalid_response")}
    if(!r.ok){
      const e=new Error(d?.message||d?.error||`http_${r.status}`);
      e.status=r.status; e.data=d; throw e;
    }
    return d;
  }catch(e){
    if(e.name==="AbortError")throw new Error("timeout");
    if(e instanceof TypeError)throw new Error("network");
    throw e;
  }finally{clearTimeout(timer)}
}

export const getHealth=()=>request("/health",{},9000);
export const installWhatsApp=phone=>request("/install/whatsapp",{
  method:"POST",body:JSON.stringify({phone})
},60000);
export const getWhatsAppStatus=phone=>request(
  `/install/whatsapp/status?phone=${encodeURIComponent(phone)}`,{},8000
);
