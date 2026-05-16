import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, QuoteSidebar, PreviewBox, PageLoader, calcQuote } from "./ConfiguratorShared.jsx";
import QuoteModal from "./QuoteModal.jsx";

const FALLBACK = { name:"Uși Batante", basePrice:120, doorConfigs:{ simpla:{name:"Simplă",pricePerUnit:0,desc:"Un canat, standard"}, "pe-toc":{name:"Cu Închidere pe Toc",pricePerUnit:150,desc:"Închidere precisă, etanșare sporită"}, fono:{name:"Cu Izolație Fonică Ridicată",pricePerUnit:350,desc:"Garnituri multiple, Rw≥42dB"} }, closerTypes:{ balama:{name:"Balamale Standard",pricePerUnit:0,desc:"Balamale inox reglabile"}, hidraulic:{name:"Amortizor Hidraulic",pricePerUnit:95,desc:"Soft-close, reglabil"} }, glassTypes:{ "10mm":{name:"Securit 10mm Clar",pricePerSqm:220,desc:"Standard"}, "12mm":{name:"Securit 12mm",pricePerSqm:280,desc:"Greutate și rezistență sporită"}, frosted:{name:"Securit Sablat",pricePerSqm:310,desc:"Confidențialitate"} }, options:{ manere:{name:"Mânere Inox Premium",price:120,desc:"Push-pull, diverse finisaje"}, incuietoare:{name:"Încuietoare Magnetică",price:180,desc:"Blocare automată la închidere"}, blocator:{name:"Blocator Interior",price:65,desc:"Blocare din interior"}, caroiaj:{name:"Profile Caroiaj",pricePerSqm:35,desc:"Grilaj decorativ"} } };

function SwingDoorPreview({ dims, glass, config, inclCaroiaj }) {
  const w=parseFloat(dims.width)||1, h=parseFloat(dims.height)||2.1;
  const W=308,H=200,M=20;
  const sc=Math.min((W*0.45)/w,(H-M*2)/h);
  const dW=w*sc,dH=h*sc,x0=(W-dW)/2,y0=(H-dH)/2;
  const isFrosted=glass==="frosted";
  const glF=isFrosted?"rgba(200,200,220,0.3)":"rgba(180,220,255,0.1)";
  const glS=isFrosted?"rgba(200,200,220,0.5)":"rgba(180,220,255,0.45)";
  const frameW=config==="fono"?8:4;
  const rows=inclCaroiaj?3:0, cols=inclCaroiaj?2:0;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <line x1={x0-20} y1={y0+dH} x2={x0+dW+20} y2={y0+dH} stroke="rgba(200,169,110,0.4)" strokeWidth="2"/>
      <rect x={x0} y={y0} width={dW} height={dH} fill="none" stroke="rgba(200,169,110,0.6)" strokeWidth={frameW}/>
      <rect x={x0+frameW/2} y={y0+frameW/2} width={dW-frameW} height={dH-frameW} fill={glF} stroke={glS} strokeWidth="1"/>
      {inclCaroiaj&&Array.from({length:cols-1},(_,i)=><line key={`c${i}`} x1={x0+(i+1)*(dW/cols)} y1={y0} x2={x0+(i+1)*(dW/cols)} y2={y0+dH} stroke="rgba(200,169,110,0.3)" strokeWidth="1.5"/>)}
      {inclCaroiaj&&Array.from({length:rows-1},(_,i)=><line key={`r${i}`} x1={x0} y1={y0+(i+1)*(dH/rows)} x2={x0+dW} y2={y0+(i+1)*(dH/rows)} stroke="rgba(200,169,110,0.3)" strokeWidth="1.5"/>)}
      <rect x={x0+dW*0.78} y={y0+dH/2-20} width={5} height={40} rx="2.5" fill="rgba(200,169,110,0.8)"/>
      <path d={`M ${x0} ${y0+dH} A ${dW*0.85} ${dW*0.85} 0 0 1 ${x0-dW*0.85} ${y0+dH-dW*0.85}`}
        fill="none" stroke="rgba(200,169,110,0.2)" strokeWidth="1" strokeDasharray="4,3"/>
      <text x={x0+dW/2} y={H-6} textAnchor="middle" fill="rgba(200,169,110,0.6)" fontSize="8" fontFamily="DM Sans">{dims.width}m × {dims.height}m</text>
    </svg>
  );
}

export default function SwingDoorConfiguratorPage() {
  const [product,setProduct]=useState(null); const [vatRate,setVatRate]=useState(0.19);
  const [dims,setDims]=useState({width:"1.0",height:"2.1"});
  const [config,setConfig]=useState("simpla"); const [closer,setCloser]=useState("balama"); const [glass,setGlass]=useState("10mm");
  const [inclManere,setInclManere]=useState(false); const [inclIncuietoare,setInclIncuietoare]=useState(false);
  const [inclBlocator,setInclBlocator]=useState(false); const [inclCaroiaj,setInclCaroiaj]=useState(false);
  const [calculating,setCalculating]=useState(false); const [quote,setQuote]=useState(null); const [showModal,setShowModal]=useState(false);

  useEffect(()=>{ fetch("/catalog.json").then(r=>r.json()).then(d=>{setProduct(d.products["usi-batante"]);setVatRate(d.vatRate);}).catch(()=>setProduct(FALLBACK)); },[]);

  const p=product; const isValid=dims.width&&dims.height;

  const calculate=async()=>{
    if(!p)return; setCalculating(true); await new Promise(r=>setTimeout(r,600));
    const w=parseFloat(dims.width)||0,h=parseFloat(dims.height)||0,area=w*h;
    const configP=p.doorConfigs[config].pricePerUnit;
    const closerP=p.closerTypes[closer].pricePerUnit;
    const glP=area*p.glassTypes[glass].pricePerSqm;
    const manP=inclManere?p.options.manere.price:0;
    const incP=inclIncuietoare?p.options.incuietoare.price:0;
    const bloP=inclBlocator?p.options.blocator.price:0;
    const carP=inclCaroiaj?area*p.options.caroiaj.pricePerSqm:0;
    const {subtotal,vat,total}=calcQuote(p.basePrice+configP+closerP+glP+manP+incP+bloP+carP,vatRate);
    setQuote({area:area.toFixed(2),configP,closerP,glP:Math.round(glP),manP,incP,bloP,carP:Math.round(carP),subtotal,vat,total});
    setCalculating(false);
  };

  if(!p)return <PageLoader/>;

  return (
    <div style={{minHeight:"100vh",background:"#0f1117",color:"#f0ede8"}}>
      <QuoteModal isOpen={showModal} onClose={()=>setShowModal(false)} quote={quote} productName="Ușă Batantă"/>
      <ConfigHeader title="Configurator Uși Batante" quote={quote}/>
      <main style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px",display:"grid",gridTemplateColumns:"1fr 340px",gap:24}} className="configurator-grid">
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <SectionCard num="01" label="Dimensiuni">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <NumberInput label="Lățime (m)" value={dims.width} onChange={v=>setDims(d=>({...d,width:v}))} step="0.05"/>
              <NumberInput label="Înălțime (m)" value={dims.height} onChange={v=>setDims(d=>({...d,height:v}))} step="0.05"/>
            </div>
          </SectionCard>
          <SectionCard num="02" label="Tip Ușă">
            {Object.entries(p.doorConfigs).map(([k,d])=>(
              <OptionBtn key={k} selected={config===k} onClick={()=>setConfig(k)} label={d.name} desc={d.desc} price={d.pricePerUnit>0?`+${d.pricePerUnit}€`:"Standard"}/>
            ))}
          </SectionCard>
          <SectionCard num="03" label="Sistem Închidere">
            {Object.entries(p.closerTypes).map(([k,d])=>(
              <OptionBtn key={k} selected={closer===k} onClick={()=>setCloser(k)} label={d.name} desc={d.desc} price={d.pricePerUnit>0?`+${d.pricePerUnit}€`:"Inclus"}/>
            ))}
          </SectionCard>
          <SectionCard num="04" label="Calitate Sticlă">
            {Object.entries(p.glassTypes).map(([k,d])=>(
              <OptionBtn key={k} selected={glass===k} onClick={()=>setGlass(k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`}/>
            ))}
          </SectionCard>
          <SectionCard num="05" label="Accesorii">
            <ToggleOption checked={inclManere}      onChange={setInclManere}      label={p.options.manere.name}      desc={p.options.manere.desc}      price={`${p.options.manere.price}€`}/>
            <ToggleOption checked={inclIncuietoare} onChange={setInclIncuietoare} label={p.options.incuietoare.name} desc={p.options.incuietoare.desc} price={`${p.options.incuietoare.price}€`}/>
            <ToggleOption checked={inclBlocator}    onChange={setInclBlocator}    label={p.options.blocator.name}    desc={p.options.blocator.desc}    price={`${p.options.blocator.price}€`}/>
            <ToggleOption checked={inclCaroiaj}     onChange={setInclCaroiaj}     label={p.options.caroiaj.name}     desc={p.options.caroiaj.desc}     price={`${p.options.caroiaj.pricePerSqm}€/m²`}/>
          </SectionCard>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <PreviewBox><SwingDoorPreview dims={dims} glass={glass} config={config} inclCaroiaj={inclCaroiaj}/></PreviewBox>
          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={()=>setQuote(null)} onSolicita={()=>setShowModal(true)}
            lines={quote?[
              {label:"Suprafață",value:`${quote.area} m²`},
              {label:"Sticlă",value:`${quote.glP}€`},
              quote.configP>0&&{label:"Tip ușă",value:`+${quote.configP}€`,accent:true},
              quote.closerP>0&&{label:"Amortizor",value:`+${quote.closerP}€`,accent:true},
              quote.manP>0&&{label:"Mânere",value:`+${quote.manP}€`,accent:true},
              quote.incP>0&&{label:"Încuietoare",value:`+${quote.incP}€`,accent:true},
              quote.bloP>0&&{label:"Blocator",value:`+${quote.bloP}€`,accent:true},
              quote.carP>0&&{label:"Caroiaj",value:`+${quote.carP}€`,accent:true},
            ]:[]}/>
        </div>
      </main>
    </div>
  );
}
