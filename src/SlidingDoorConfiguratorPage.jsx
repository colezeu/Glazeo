import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, QuoteSidebar, PreviewBox, PageLoader, calcQuote } from "./ConfiguratorShared.jsx";
import QuoteModal from "./QuoteModal.jsx";

const FALLBACK = { name:"Uși Culisante", basePrice:150, mountTypes:{ perete:{name:"Prindere pe Perete",pricePerUnit:0,desc:"Șină montată pe perete"}, tavan:{name:"Prindere pe Tavan",pricePerUnit:80,desc:"Șină ascunsă în tavan"}, sincron:{name:"Sincron (fără șină jos)",pricePerUnit:220,desc:"Fără ghidaj la pardoseală"} }, panelTypes:{ "panou-fix":{name:"Cu Panou Fix",pricePerUnit:0,desc:"Panou lateral fix + ușă culisantă"}, "fara-fix":{name:"Fără Panou Fix",pricePerUnit:0,desc:"Doar ușă culisantă"}, buzunar:{name:"Cu Buzunar",pricePerUnit:280,desc:"Ușa dispare în perete"} }, glassTypes:{ "10mm":{name:"Securit 10mm Clar",pricePerSqm:220,desc:"Standard"}, "12mm":{name:"Securit 12mm",pricePerSqm:280,desc:"Ușă mare / grea"}, frosted:{name:"Securit Sablat",pricePerSqm:310,desc:"Confidențialitate"} }, options:{ manere:{name:"Mânere Inox",price:95,desc:"Mâner îngropat sau aplicat"}, incuietoare:{name:"Încuietoare",price:150,desc:"Cilindru sau magnetic"}, caroiaj:{name:"Profile Caroiaj",pricePerSqm:35,desc:"Grilaj decorativ"} } };

function SlidingDoorPreview({ dims, mount, panel, glass, inclCaroiaj }) {
  const w=parseFloat(dims.width)||1.2, h=parseFloat(dims.height)||2.1;
  const totalW=panel==="panou-fix"?w*2:panel==="buzunar"?w*1.1:w;
  const W=308,H=200,M=16;
  const sc=Math.min((W-M*2)/totalW,(H-M*2)/h);
  const dW=w*sc, dH=h*sc, fW=panel==="panou-fix"?w*sc:0;
  const x0=panel==="buzunar"?W/2-dW/2:(W-(dW+fW+8))/2;
  const y0=(H-dH)/2;
  const isFrosted=glass==="frosted";
  const glF=isFrosted?"rgba(200,200,220,0.28)":"rgba(180,220,255,0.1)";
  const glS=isFrosted?"rgba(200,200,220,0.5)":"rgba(180,220,255,0.45)";
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {/* track */}
      {mount!=="tavan"&&<rect x={x0-4} y={y0-5} width={dW+fW+16} height={5} fill="rgba(200,169,110,0.4)" rx="2"/>}
      {mount==="tavan"&&<rect x={x0-4} y={y0-8} width={dW+fW+16} height={4} fill="rgba(200,169,110,0.2)" rx="2" strokeDasharray="3,2" stroke="rgba(200,169,110,0.5)" strokeWidth="1"/>}
      {/* floor line */}
      <line x1={x0-10} y1={y0+dH} x2={x0+dW+fW+18} y2={y0+dH} stroke="rgba(200,169,110,0.35)" strokeWidth="2"/>
      {/* fixed panel */}
      {panel==="panou-fix"&&<rect x={x0} y={y0} width={fW} height={dH} fill={glF} stroke="rgba(200,169,110,0.3)" strokeWidth="1.5"/>}
      {/* sliding door */}
      {panel==="buzunar"?(
        <>
          <rect x={x0} y={y0} width={dW*0.3} height={dH} fill="rgba(200,169,110,0.05)" stroke="rgba(200,169,110,0.25)" strokeWidth="1.5" strokeDasharray="4,3"/>
          <rect x={x0+dW*0.3} y={y0} width={dW*0.7} height={dH} fill={glF} stroke={glS} strokeWidth="1.5"/>
          <text x={x0+dW*0.15} y={y0+dH/2} textAnchor="middle" fill="rgba(200,169,110,0.35)" fontSize="7" fontFamily="DM Sans" transform={`rotate(-90,${x0+dW*0.15},${y0+dH/2})`}>în perete</text>
        </>
      ):(
        <rect x={x0+(panel==="panou-fix"?fW+8:0)} y={y0} width={dW} height={dH} fill={glF} stroke={glS} strokeWidth="1.5"/>
      )}
      {/* caroiaj */}
      {inclCaroiaj&&Array.from({length:2},(_,i)=><line key={i} x1={x0+(panel==="panou-fix"?fW+8:0)+(i+1)*(dW/3)} y1={y0} x2={x0+(panel==="panou-fix"?fW+8:0)+(i+1)*(dW/3)} y2={y0+dH} stroke="rgba(200,169,110,0.25)" strokeWidth="1.5"/>)}
      {/* handle */}
      <rect x={x0+(panel==="panou-fix"?fW+14:6)} y={y0+dH/2-20} width={4} height={40} rx="2" fill="rgba(200,169,110,0.7)"/>
      <text x={W/2} y={H-6} textAnchor="middle" fill="rgba(200,169,110,0.6)" fontSize="8" fontFamily="DM Sans">{dims.width}m × {dims.height}m · {mount}</text>
    </svg>
  );
}

export default function SlidingDoorConfiguratorPage() {
  const [product,setProduct]=useState(null); const [vatRate,setVatRate]=useState(0.19);
  const [dims,setDims]=useState({width:"1.2",height:"2.1"});
  const [mount,setMount]=useState("perete"); const [panel,setPanel]=useState("fara-fix"); const [glass,setGlass]=useState("10mm");
  const [inclManere,setInclManere]=useState(false); const [inclInc,setInclInc]=useState(false); const [inclCar,setInclCar]=useState(false);
  const [calculating,setCalculating]=useState(false); const [quote,setQuote]=useState(null); const [showModal,setShowModal]=useState(false);

  useEffect(()=>{ fetch("/catalog.json").then(r=>r.json()).then(d=>{setProduct(d.products["usi-culisante"]);setVatRate(d.vatRate);}).catch(()=>setProduct(FALLBACK)); },[]);

  const p=product; const isValid=dims.width&&dims.height;

  const calculate=async()=>{
    if(!p)return; setCalculating(true); await new Promise(r=>setTimeout(r,600));
    const w=parseFloat(dims.width)||0,h=parseFloat(dims.height)||0;
    const area=w*h*(panel==="panou-fix"?2:1);
    const mountP=p.mountTypes[mount].pricePerUnit;
    const panelP=p.panelTypes[panel].pricePerUnit;
    const glP=area*p.glassTypes[glass].pricePerSqm;
    const manP=inclManere?p.options.manere.price:0;
    const incP=inclInc?p.options.incuietoare.price:0;
    const carP=inclCar?area*p.options.caroiaj.pricePerSqm:0;
    const {subtotal,vat,total}=calcQuote(p.basePrice+mountP+panelP+glP+manP+incP+carP,vatRate);
    setQuote({area:area.toFixed(2),mountP,panelP,glP:Math.round(glP),manP,incP,carP:Math.round(carP),subtotal,vat,total});
    setCalculating(false);
  };

  if(!p)return <PageLoader/>;

  return (
    <div style={{minHeight:"100vh",background:"#0f1117",color:"#f0ede8"}}>
      <QuoteModal isOpen={showModal} onClose={()=>setShowModal(false)} quote={quote} productName="Ușă Culisantă"/>
      <ConfigHeader title="Configurator Uși Culisante" quote={quote}/>
      <main style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px",display:"grid",gridTemplateColumns:"1fr 340px",gap:24 }}>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <SectionCard num="01" label="Dimensiuni">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <NumberInput label="Lățime ușă (m)" value={dims.width} onChange={v=>setDims(d=>({...d,width:v}))} step="0.05"/>
              <NumberInput label="Înălțime (m)" value={dims.height} onChange={v=>setDims(d=>({...d,height:v}))} step="0.05"/>
            </div>
          </SectionCard>
          <SectionCard num="02" label="Sistem Prindere">
            {Object.entries(p.mountTypes).map(([k,d])=>(
              <OptionBtn key={k} selected={mount===k} onClick={()=>setMount(k)} label={d.name} desc={d.desc} price={d.pricePerUnit>0?`+${d.pricePerUnit}€`:"Standard"}/>
            ))}
          </SectionCard>
          <SectionCard num="03" label="Configurație Panouri">
            {Object.entries(p.panelTypes).map(([k,d])=>(
              <OptionBtn key={k} selected={panel===k} onClick={()=>setPanel(k)} label={d.name} desc={d.desc} price={d.pricePerUnit>0?`+${d.pricePerUnit}€`:"Standard"}/>
            ))}
          </SectionCard>
          <SectionCard num="04" label="Calitate Sticlă">
            {Object.entries(p.glassTypes).map(([k,d])=>(
              <OptionBtn key={k} selected={glass===k} onClick={()=>setGlass(k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`}/>
            ))}
          </SectionCard>
          <SectionCard num="05" label="Accesorii">
            <ToggleOption checked={inclManere} onChange={setInclManere} label={p.options.manere.name}     desc={p.options.manere.desc}     price={`${p.options.manere.price}€`}/>
            <ToggleOption checked={inclInc}    onChange={setInclInc}    label={p.options.incuietoare.name} desc={p.options.incuietoare.desc} price={`${p.options.incuietoare.price}€`}/>
            <ToggleOption checked={inclCar}    onChange={setInclCar}    label={p.options.caroiaj.name}    desc={p.options.caroiaj.desc}    price={`${p.options.caroiaj.pricePerSqm}€/m²`}/>
          </SectionCard>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <PreviewBox><SlidingDoorPreview dims={dims} mount={mount} panel={panel} glass={glass} inclCaroiaj={inclCar}/></PreviewBox>
          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={()=>setQuote(null)} onSolicita={()=>setShowModal(true)}
            lines={quote?[
              {label:"Suprafață",value:`${quote.area} m²`},
              {label:"Sticlă",value:`${quote.glP}€`},
              quote.mountP>0&&{label:"Prindere",value:`+${quote.mountP}€`,accent:true},
              quote.panelP>0&&{label:"Buzunar",value:`+${quote.panelP}€`,accent:true},
              quote.manP>0&&{label:"Mânere",value:`+${quote.manP}€`,accent:true},
              quote.incP>0&&{label:"Încuietoare",value:`+${quote.incP}€`,accent:true},
              quote.carP>0&&{label:"Caroiaj",value:`+${quote.carP}€`,accent:true},
            ]:[]}/>
        </div>
      </main>
    </div>
  );
}
