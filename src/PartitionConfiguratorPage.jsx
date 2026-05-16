import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, QuoteSidebar, PreviewBox, PageLoader, calcQuote } from "./ConfiguratorShared.jsx";
import QuoteModal from "./QuoteModal.jsx";

const FALLBACK = { name:"Partiționări", basePrice:100, systemTypes:{ simpla:{name:"Simplă (fără profile)",pricePerSqm:280,desc:"Panouri fixe, prinderi punctuale"}, profil:{name:"Cu Profile (caroiaj)",pricePerSqm:350,desc:"Profile aluminiu, aspect industrial"}, fono:{name:"Cu Izolație Fonică Ridicată",pricePerSqm:480,desc:"Geam laminat acustic, Rw≥45dB"} }, glassTypes:{ "8mm":{name:"Securit 8mm",pricePerSqm:130,desc:"Partiție interior standard"}, "10mm":{name:"Securit 10mm",pricePerSqm:170,desc:"Rezistență sporită"}, frosted:{name:"Sablat / Imprimat",pricePerSqm:210,desc:"Confidențialitate parțială sau totală"}, "laminat-acustic":{name:"Laminat Acustic 10.4",pricePerSqm:260,desc:"PVB acustic, atenuare fonică maximă"} }, options:{ "usa-batanta":{name:"Ușă Batantă Inclusă",price:550,desc:"Ușă din același sistem, cu balamale"}, "usa-culisanta":{name:"Ușă Culisantă Inclusă",price:750,desc:"Ușă culisantă integrată în partiție"}, caroiaj:{name:"Profile Caroiaj",pricePerSqm:35,desc:"Grilaj decorativ"} } };

function PartitionPreview({ dims, system, glass, inclUsaBatanta, inclUsaCulisanta, inclCaroiaj }) {
  const w=parseFloat(dims.width)||3, h=parseFloat(dims.height)||2.4;
  const W=308,H=185,M=20;
  const sc=Math.min((W-M*2)/w,(H-M*2)/h);
  const gW=w*sc,gH=h*sc,x0=(W-gW)/2,y0=(H-gH)/2;
  const isFrosted=glass==="frosted";
  const isAcoustic=glass==="laminat-acustic";
  const glF=isFrosted?"rgba(200,200,220,0.25)":isAcoustic?"rgba(160,200,255,0.12)":"rgba(180,220,255,0.08)";
  const glS=isFrosted?"rgba(200,200,220,0.45)":"rgba(180,220,255,0.4)";
  const hasProfil=system==="profil";
  const profColor="rgba(200,169,110,0.5)";
  const cols=hasProfil||inclCaroiaj?Math.max(2,Math.round(w/0.9)):0;
  const rows=hasProfil||inclCaroiaj?Math.max(1,Math.round(h/1.2)):0;
  const doorW=inclUsaBatanta||inclUsaCulisanta?Math.min(gW*0.3,60):0;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <line x1={x0-8} y1={y0+gH} x2={x0+gW+8} y2={y0+gH} stroke="rgba(200,169,110,0.4)" strokeWidth="2"/>
      {/* main glass */}
      <rect x={x0} y={y0} width={gW-doorW} height={gH} fill={glF} stroke={glS} strokeWidth="1.5"/>
      {/* grid lines */}
      {cols>0&&Array.from({length:cols-1},(_,i)=><line key={`c${i}`} x1={x0+(i+1)*((gW-doorW)/cols)} y1={y0} x2={x0+(i+1)*((gW-doorW)/cols)} y2={y0+gH} stroke={profColor} strokeWidth={hasProfil?2:1}/>)}
      {rows>0&&Array.from({length:rows-1},(_,i)=><line key={`r${i}`} x1={x0} y1={y0+(i+1)*(gH/rows)} x2={x0+gW-doorW} y2={y0+(i+1)*(gH/rows)} stroke={profColor} strokeWidth={hasProfil?2:1}/>)}
      {/* door */}
      {(inclUsaBatanta||inclUsaCulisanta)&&(
        <>
          <rect x={x0+gW-doorW} y={y0} width={doorW} height={gH} fill={glF} stroke="rgba(200,169,110,0.6)" strokeWidth="2"/>
          {inclUsaBatanta&&<path d={`M ${x0+gW-doorW} ${y0+gH} A ${doorW} ${doorW} 0 0 0 ${x0+gW-doorW-doorW} ${y0+gH-doorW}`} fill="none" stroke="rgba(200,169,110,0.3)" strokeWidth="1" strokeDasharray="3,3"/>}
          {inclUsaCulisanta&&<rect x={x0+gW-doorW*1.5} y={y0+5} width={doorW} height={gH-10} fill="rgba(200,169,110,0.07)" stroke="rgba(200,169,110,0.35)" strokeWidth="1" strokeDasharray="3,2"/>}
          <rect x={x0+gW-doorW*0.35} y={y0+gH/2-18} width={3} height={36} rx="1.5" fill="rgba(200,169,110,0.8)"/>
        </>
      )}
      {isAcoustic&&<rect x={x0+2} y={y0+2} width={gW-doorW-4} height={gH-4} fill="none" stroke="rgba(100,180,255,0.2)" strokeWidth="1" strokeDasharray="6,4"/>}
      <text x={W/2} y={H-5} textAnchor="middle" fill="rgba(200,169,110,0.6)" fontSize="8" fontFamily="DM Sans">{dims.width||"—"}m × {dims.height||"—"}m</text>
    </svg>
  );
}

export default function PartitionConfiguratorPage() {
  const [product,setProduct]=useState(null); const [vatRate,setVatRate]=useState(0.19);
  const [dims,setDims]=useState({width:"",height:"2.4"});
  const [system,setSystem]=useState("simpla"); const [glass,setGlass]=useState("8mm");
  const [inclUsaBatanta,setInclUsaBatanta]=useState(false); const [inclUsaCulisanta,setInclUsaCulisanta]=useState(false); const [inclCaroiaj,setInclCaroiaj]=useState(false);
  const [calculating,setCalculating]=useState(false); const [quote,setQuote]=useState(null); const [showModal,setShowModal]=useState(false);

  useEffect(()=>{ fetch("/catalog.json").then(r=>r.json()).then(d=>{setProduct(d.products["partitionari"]);setVatRate(d.vatRate);}).catch(()=>setProduct(FALLBACK)); },[]);

  const p=product; const isValid=dims.width&&parseFloat(dims.width)>0;

  const calculate=async()=>{
    if(!p)return; setCalculating(true); await new Promise(r=>setTimeout(r,600));
    const w=parseFloat(dims.width)||0,h=parseFloat(dims.height)||0,area=w*h;
    const sysP=area*p.systemTypes[system].pricePerSqm;
    const glP=area*p.glassTypes[glass].pricePerSqm;
    const ubaP=inclUsaBatanta?p.options["usa-batanta"].price:0;
    const ucuP=inclUsaCulisanta?p.options["usa-culisanta"].price:0;
    const carP=inclCaroiaj?area*p.options.caroiaj.pricePerSqm:0;
    const {subtotal,vat,total}=calcQuote(p.basePrice+sysP+glP+ubaP+ucuP+carP,vatRate);
    setQuote({area:area.toFixed(2),sysP:Math.round(sysP),glP:Math.round(glP),ubaP,ucuP,carP:Math.round(carP),subtotal,vat,total});
    setCalculating(false);
  };

  if(!p)return <PageLoader/>;

  return (
    <div style={{minHeight:"100vh",background:"#0f1117",color:"#f0ede8"}}>
      <QuoteModal isOpen={showModal} onClose={()=>setShowModal(false)} quote={quote} productName="Partiționare"/>
      <ConfigHeader title="Configurator Partiționări" quote={quote}/>
      <main style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px",display:"grid",gridTemplateColumns:"1fr 340px",gap:24}} className="configurator-grid">
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <SectionCard num="01" label="Dimensiuni Partiție">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <NumberInput label="Lățime totală (m)" value={dims.width} onChange={v=>setDims(d=>({...d,width:v}))} placeholder="Ex: 3.0"/>
              <NumberInput label="Înălțime (m)" value={dims.height} onChange={v=>setDims(d=>({...d,height:v}))} placeholder="Ex: 2.4" step="0.05"/>
            </div>
          </SectionCard>
          <SectionCard num="02" label="Tip Sistem">
            {Object.entries(p.systemTypes).map(([k,d])=>(
              <OptionBtn key={k} selected={system===k} onClick={()=>setSystem(k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`}/>
            ))}
          </SectionCard>
          <SectionCard num="03" label="Tip Sticlă">
            {Object.entries(p.glassTypes).map(([k,d])=>(
              <OptionBtn key={k} selected={glass===k} onClick={()=>setGlass(k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`}/>
            ))}
          </SectionCard>
          <SectionCard num="04" label="Uși & Accesorii">
            <ToggleOption checked={inclUsaBatanta}   onChange={v=>{setInclUsaBatanta(v);if(v)setInclUsaCulisanta(false);}}  label={p.options["usa-batanta"].name}   desc={p.options["usa-batanta"].desc}   price={`${p.options["usa-batanta"].price}€`}/>
            <ToggleOption checked={inclUsaCulisanta} onChange={v=>{setInclUsaCulisanta(v);if(v)setInclUsaBatanta(false);}} label={p.options["usa-culisanta"].name} desc={p.options["usa-culisanta"].desc} price={`${p.options["usa-culisanta"].price}€`}/>
            <ToggleOption checked={inclCaroiaj}      onChange={setInclCaroiaj}   label={p.options.caroiaj.name}    desc={p.options.caroiaj.desc}    price={`${p.options.caroiaj.pricePerSqm}€/m²`}/>
          </SectionCard>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <PreviewBox><PartitionPreview dims={dims} system={system} glass={glass} inclUsaBatanta={inclUsaBatanta} inclUsaCulisanta={inclUsaCulisanta} inclCaroiaj={inclCaroiaj}/></PreviewBox>
          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={()=>setQuote(null)} onSolicita={()=>setShowModal(true)}
            lines={quote?[
              {label:"Suprafață",value:`${quote.area} m²`},
              {label:"Sistem",value:`${quote.sysP}€`},
              {label:"Sticlă",value:`${quote.glP}€`},
              quote.ubaP>0&&{label:"Ușă batantă",value:`+${quote.ubaP}€`,accent:true},
              quote.ucuP>0&&{label:"Ușă culisantă",value:`+${quote.ucuP}€`,accent:true},
              quote.carP>0&&{label:"Caroiaj",value:`+${quote.carP}€`,accent:true},
            ]:[]}/>
        </div>
      </main>
    </div>
  );
}
