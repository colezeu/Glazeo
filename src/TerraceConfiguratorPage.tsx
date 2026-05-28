import { supabase } from "./lib/supabase";
import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, QuoteSidebar, PreviewBox, PageLoader, calcQuote } from "./ConfiguratorShared.js";
import QuoteModal from "./QuoteModal.js";

const FALLBACK = { name:"Închidere Mobilă Terase / Balcoane", basePrice:150, systemTypes:{ multitrack:{name:"Multitrack",pricePerSqm:380,desc:"Panouri culisante pe șine multiple, stivuire laterală"}, frameless:{name:"Frameless",pricePerSqm:450,desc:"Full-glass fără profile, pivot la sol și tavan"}, ghilotina:{name:"Ghilotină",pricePerSqm:420,desc:"Panou unic culisant vertical, ascuns în plafon"} }, glassTypes:{ "8mm":{name:"Securit 8mm Clar",pricePerSqm:140,desc:"Standard rezidențial"}, "10mm":{name:"Securit 10mm",pricePerSqm:185,desc:"Rezistență sporită, vânt puternic"}, dgu:{name:"Termoizolant DGU",pricePerSqm:320,desc:"Izolare termică și fonică"} }, options:{ blocator:{name:"Blocator Interior",price:65,desc:"Blocare panou în poziție deschis"}, incuietoare:{name:"Încuietoare Cheie",price:95,desc:"Cilindru de siguranță"}, "profile-lat":{name:"Profile Laterale",price:120,desc:"Profile de etanșare laterale"} } };

function TerracePreview({ dims, system, glass }) {
  const w=parseFloat(dims.width)||4, h=parseFloat(dims.height)||2.4;
  const W=308,H=180,M=20;
  const sc=Math.min((W-M*2)/w,(H-M*2)/h);
  const gW=w*sc,gH=h*sc,x0=(W-gW)/2,y0=(H-gH)/2;
  const panels=Math.max(2,Math.round(w/0.9));
  const glF=glass==="dgu"?"rgba(140,200,160,0.1)":"rgba(180,220,255,0.09)";
  const glS=glass==="dgu"?"rgba(140,200,160,0.4)":"rgba(180,220,255,0.4)";
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <line x1={x0-10} y1={y0+gH} x2={x0+gW+10} y2={y0+gH} stroke="rgba(200,169,110,0.4)" strokeWidth="2"/>
      {system==="ghilotina" ? (
        <>
          <rect x={x0} y={y0} width={gW} height={gH} fill={glF} stroke={glS} strokeWidth="1.5"/>
          <line x1={x0} y1={y0+gH*0.15} x2={x0+gW} y2={y0+gH*0.15} stroke="rgba(200,169,110,0.35)" strokeWidth="1.5" strokeDasharray="4,3"/>
          <text x={x0+gW/2} y={y0+gH*0.07} textAnchor="middle" fill="rgba(200,169,110,0.5)" fontSize="7" fontFamily="DM Sans">↑ deschidere</text>
        </>
      ) : (
        Array.from({length:panels},(_,i)=>{
          const px=x0+i*(gW/panels),pw=gW/panels-2;
          const isOpen=i===panels-1&&system==="multitrack";
          return (
            <g key={i}>
              <rect x={px+1} y={y0} width={pw} height={gH} fill={isOpen?"rgba(200,169,110,0.06)":glF} stroke={isOpen?"rgba(200,169,110,0.3)":glS} strokeWidth="1.5"/>
              {system==="frameless"&&<rect x={px+1} y={y0+gH-6} width={pw} height={4} fill="rgba(200,169,110,0.25)" rx="2"/>}
            </g>
          );
        })
      )}
      {system==="multitrack"&&<line x1={x0} y1={y0-6} x2={x0+gW} y2={y0-6} stroke="rgba(200,169,110,0.5)" strokeWidth="3" strokeLinecap="round"/>}
      <text x={x0+gW/2} y={H-6} textAnchor="middle" fill="rgba(200,169,110,0.6)" fontSize="8" fontFamily="DM Sans">{dims.width||"—"}m × {dims.height||"—"}m · {panels} panouri</text>
    </svg>
  );
}

export default function TerraceConfiguratorPage() {
  const [product,setProduct]=useState(null); const [vatRate,setVatRate]=useState(0.19);
  const [dims,setDims]=useState({width:"",height:"2.4"});
  const [system,setSystem]=useState("multitrack"); const [glass,setGlass]=useState("8mm");
  const [opts,setOpts]=useState({blocator:false,incuietoare:false,"profile-lat":false});
  const [calculating,setCalculating]=useState(false); const [quote,setQuote]=useState(null); const [showModal,setShowModal]=useState(false);

  useEffect(()=>{ fetch("/catalog.json").then(r=>r.json()).then(d=>{setProduct(d.products["inchidere-terasa"]);setVatRate(d.vatRate);}).catch(()=>setProduct(FALLBACK)); },[]);

  const p=product; const isValid=dims.width&&parseFloat(dims.width)>0;
const saveProject = async () => {
  const projectName = prompt("Nume proiect:", "Proiect " + new Date().toLocaleDateString());
  if (!projectName) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert("Trebuie să fii logat!");
    return;
  }

  const { error } = await supabase.from("projects").insert({
    user_id: user.id,
    name: projectName,
    product_type: "terrace",        // ← schimbă aici pentru fiecare pagină
    config: config                  // sau "dims" / "config" în funcție de pagină
  });

  if (error) {
    alert("Eroare: " + error.message);
  } else {
    alert("Proiect salvat!");
  }
};
  const calculate=async()=>{
    if(!p)return; setCalculating(true); await new Promise(r=>setTimeout(r,600));
    const w=parseFloat(dims.width)||0,h=parseFloat(dims.height)||0,area=w*h;
    const sysP=area*p.systemTypes[system].pricePerSqm;
    const glP=area*p.glassTypes[glass].pricePerSqm;
    const optP=Object.entries(opts).reduce((s,[k,v])=>s+(v?p.options[k].price:0),0);
    const {subtotal,vat,total}=calcQuote(p.basePrice+sysP+glP+optP,vatRate);
    setQuote({area:area.toFixed(2),sysP:Math.round(sysP),glP:Math.round(glP),optP,subtotal,vat,total});
    setCalculating(false);
  };

  if(!p)return <PageLoader/>;

  return (
    <div style={{minHeight:"100vh",background:"#0f1117",color:"#f0ede8"}}>
      <QuoteModal isOpen={showModal} onClose={()=>setShowModal(false)} quote={quote} productName="Închidere Mobilă Terasă" />
      <ConfigHeader title="Configurator Terase & Balcoane" quote={quote}/>
      <main className="configurator-grid" style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px",display:"grid",gridTemplateColumns:"1fr 340px",gap:24 }}>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <SectionCard num="01" label="Dimensiuni Deschidere">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <NumberInput label="Lățime totală (m)" value={dims.width} onChange={v=>setDims(d=>({...d,width:v}))} placeholder="Ex: 4.0"/>
              <NumberInput label="Înălțime (m)" value={dims.height} onChange={v=>setDims(d=>({...d,height:v}))} placeholder="Ex: 2.4" step="0.05"/>
            </div>
          </SectionCard>
          <SectionCard num="02" label="Sistem">
            {Object.entries(p.systemTypes).map(([k,d])=>(
              <OptionBtn key={k} selected={system===k} onClick={()=>setSystem(k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`}/>
            ))}
          </SectionCard>
          <SectionCard num="03" label="Tip Sticlă">
            {Object.entries(p.glassTypes).map(([k,d])=>(
              <OptionBtn key={k} selected={glass===k} onClick={()=>setGlass(k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`}/>
            ))}
          </SectionCard>
          <SectionCard num="04" label="Accesorii">
            {Object.entries(p.options).map(([k,d])=>(
              <ToggleOption key={k} checked={opts[k]||false} onChange={v=>setOpts(o=>({...o,[k]:v}))} label={d.name} desc={d.desc} price={`${d.price}€`}/>
            ))}
          </SectionCard>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <PreviewBox><TerracePreview dims={dims} system={system} glass={glass}/></PreviewBox>
          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={()=>setQuote(null)} onSolicita={()=>setShowModal(true)}
            lines={quote?[
              {label:"Suprafață",value:`${quote.area} m²`},
              {label:"Sistem",value:`${quote.sysP}€`},
              {label:"Sticlă",value:`${quote.glP}€`},
              quote.optP>0&&{label:"Accesorii",value:`+${quote.optP}€`,accent:true},
            ]:[]}/>
       
          <button
            onClick={saveProject}
            className="btn-primary w-full mt-3 flex items-center justify-center gap-2 text-sm"
            style={{ background: "linear-gradient(90deg, #c8a96e, #a88b5a)" }}
          >
            💾 Salvează proiect
          </button>
        </div>
      </main>
    </div>
  );
}
