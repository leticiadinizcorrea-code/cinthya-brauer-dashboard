import { useState, useMemo, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList
} from "recharts";

const ORANGE="#F97316", GRAY="#9CA3AF", BG="#111111", CARD="#1a1a1a",
      BORDER="#2a2a2a", BLUE="#60a5fa", GREEN="#4ade80", PURPLE="#c084fc";

const MESES=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
function mesLabel(m){return `${MESES[m.mes-1]}-${String(m.ano).slice(-2)}`;}

// ── Firebase REST ────────────────────────────────────────────────────────────
const PROJECT_ID = "cinthya-brauer";
const API_KEY    = "AIzaSyCX-kRhdB-HA-WzyCdKUp-zTC05aLigV6Y";
const DOC_URL    = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/dashboard/atletas?key=${API_KEY}`;

async function fsGet() {
  const r = await fetch(DOC_URL);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GET ${r.status}`);
  const j = await r.json();
  return j.fields?.data?.stringValue ? JSON.parse(j.fields.data.stringValue) : null;
}

async function fsSet(dados) {
  const body = JSON.stringify({ fields: { data: { stringValue: JSON.stringify(dados) } } });
  const r = await fetch(DOC_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body
  });
  if (!r.ok) throw new Error(`SET ${r.status}`);
}

// ── Dados base ───────────────────────────────────────────────────────────────
const atletasBase = [
  {id:1,  nome:"Letícia Corrêa",   idade:27, esporte:"Vôlei",              frequencia:"", dados:[{mes:3,ano:2026,cmj:30.4, saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:2,  nome:"João Furtado",     idade:27, esporte:"Futevôlei",          frequencia:"", dados:[{mes:3,ano:2026,cmj:45.8, saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:3,  nome:"Henrique Tarlei",  idade:25, esporte:"Futevôlei",          frequencia:"", dados:[{mes:3,ano:2026,cmj:62.3, saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:4,  nome:"Guilherme Tarlei", idade:25, esporte:"Futevôlei",          frequencia:"", dados:[{mes:3,ano:2026,cmj:50.4, saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:5,  nome:"Will",             idade:40, esporte:"Ciclismo",           frequencia:"", dados:[{mes:3,ano:2026,cmj:31.1, saltHoriz:2.38,saltUniDir:4.88,saltUniEsq:4.60,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:6,  nome:"Stephanie",        idade:39, esporte:"Futevôlei",          frequencia:"", dados:[{mes:3,ano:2026,cmj:33,   saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:7,  nome:"Bruno",            idade:41, esporte:"Corrida / Futevôlei",frequencia:"", dados:[{mes:3,ano:2026,cmj:36.7, saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:8,  nome:"Arthur Muce",      idade:12, esporte:"Futebol",            frequencia:"", dados:[{mes:3,ano:2026,cmj:22.8, saltHoriz:1.89,saltUniDir:4.46,saltUniEsq:5.04,saltCruzDir:4.36,saltCruzEsq:4.03,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:9,  nome:"Arthur",           idade:12, esporte:"Futebol",            frequencia:"", dados:[{mes:3,ano:2026,cmj:null, saltHoriz:2.17,saltUniDir:5.45,saltUniEsq:4.48,saltCruzDir:4.72,saltCruzEsq:3.77,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:10, nome:"Rafael Corvini",   idade:16, esporte:"Futebol",            frequencia:"", dados:[{mes:3,ano:2026,cmj:42.4, saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:11, nome:"Pedro Girardi",    idade:10, esporte:"Futebol",            frequencia:"", dados:[{mes:3,ano:2026,cmj:26.2, saltHoriz:1.53,saltUniDir:4.45,saltUniEsq:4.15,saltCruzDir:3.56,saltCruzEsq:3.43,saltUniTriplo:null,agach:7,supino:6,remada:6,terra:10,freqEsp:null,freqReal:null}]},
  {id:12, nome:"Vitinho",          idade:26, esporte:"Futevôlei",          frequencia:"", dados:[{mes:3,ano:2026,cmj:50.8, saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:13, nome:"Leo",              idade:26, esporte:"Futevôlei",          frequencia:"", dados:[{mes:3,ano:2026,cmj:45.2, saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:14, nome:"Rafa",             idade:26, esporte:"Futevôlei",          frequencia:"", dados:[{mes:3,ano:2026,cmj:50.8, saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
];

const camposLabel = {
  cmj:"Salto CMJ (cm)", saltHoriz:"Salto Horizontal (m)",
  saltUniDir:"Unilateral Direita", saltUniEsq:"Unilateral Esquerda",
  saltCruzDir:"Cruzado Direita", saltCruzEsq:"Cruzado Esquerda",
  saltUniTriplo:"Unilateral Triplo",
  agach:"Agachamento (kg)", terra:"Terra (kg)",
  supino:"Supino (kg)", remada:"Remada (kg)",
  freqEsp:"Freq. Esperada", freqReal:"Freq. Real"
};

const dadoVazio = {
  mes:3, ano:2026,
  cmj:"", saltHoriz:"", saltUniDir:"", saltUniEsq:"",
  saltCruzDir:"", saltCruzEsq:"", saltUniTriplo:"",
  agach:"", terra:"", supino:"", remada:"",
  freqEsp:"", freqReal:""
};

// ── Componentes de gráfico ───────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:"#222",border:`1px solid #2a2a2a`,borderRadius:8,padding:"8px 12px"}}>
      <p style={{color:"#fff",margin:0,fontWeight:700}}>{label}</p>
      {payload.map((p,i) => p.value != null && (
        <p key={i} style={{color:p.color,margin:"2px 0",fontSize:13}}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

function GraficoLinha({ dados, campos, titulo }) {
  const temDados = dados.some(d => campos.some(c => d[c.key] != null));
  return (
    <div style={{background:CARD,borderRadius:12,padding:16,border:`1px solid ${BORDER}`}}>
      <div style={{fontWeight:700,marginBottom:10,textAlign:"center",fontSize:13}}>{titulo}</div>
      {temDados ? (
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
            <XAxis dataKey="label" tick={{fill:GRAY,fontSize:11}}/>
            <YAxis tick={{fill:GRAY,fontSize:11}}/>
            <Tooltip content={<CustomTooltip/>}/>
            {campos.length > 1 && <Legend wrapperStyle={{fontSize:11}}/>}
            {campos.map(c => (
              <Line key={c.key} type="monotone" dataKey={c.key} stroke={c.color}
                strokeWidth={2} dot={{fill:c.color}} name={c.label} connectNulls={false}>
                {campos.length === 1 && <LabelList dataKey={c.key} position="top" style={{fill:"#fff",fontSize:11}}/>}
              </Line>
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{color:GRAY,textAlign:"center",padding:30,fontSize:13}}>Sem dados</div>
      )}
    </div>
  );
}

function GraficoBarra({ dados, campos, titulo }) {
  const temDados = dados.some(d => campos.some(c => d[c.key] != null));
  return (
    <div style={{background:CARD,borderRadius:12,padding:16,border:`1px solid ${BORDER}`}}>
      <div style={{fontWeight:700,marginBottom:10,textAlign:"center",fontSize:13}}>{titulo}</div>
      {temDados ? (
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
            <XAxis dataKey="label" tick={{fill:GRAY,fontSize:11}}/>
            <YAxis tick={{fill:GRAY,fontSize:11}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            {campos.map(c => (
              <Bar key={c.key} dataKey={c.key} name={c.label} fill={c.color} radius={[3,3,0,0]}>
                <LabelList dataKey={c.key} position="top" style={{fill:"#fff",fontSize:10}}/>
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{color:GRAY,textAlign:"center",padding:30,fontSize:13}}>Sem dados</div>
      )}
    </div>
  );
}

// ── Relatório Mobile ─────────────────────────────────────────────────────────
function RelatorioMobile({ atleta, dadosOrdenados, ultimoDado, onFechar }) {
  const grafDefs = [
    {tipo:"linha", titulo:"Salto CMJ (cm)",        campos:[{key:"cmj",color:ORANGE,label:"CMJ (cm)"}]},
    {tipo:"linha", titulo:"Salto Horizontal",       campos:[{key:"saltHoriz",color:ORANGE,label:"Horiz. (m)"}]},
    {tipo:"linha", titulo:"Saltos Unilaterais",     campos:[{key:"saltUniDir",color:ORANGE,label:"Uni. Dir."},{key:"saltUniEsq",color:BLUE,label:"Uni. Esq."},{key:"saltUniTriplo",color:GREEN,label:"Triplo"}]},
    {tipo:"linha", titulo:"Saltos Cruzados",        campos:[{key:"saltCruzDir",color:ORANGE,label:"Cruz. Dir."},{key:"saltCruzEsq",color:PURPLE,label:"Cruz. Esq."}]},
    {tipo:"barra", titulo:"Evolução Inferiores",    campos:[{key:"agach",color:GRAY,label:"Agachamento"},{key:"terra",color:ORANGE,label:"Terra"}]},
    {tipo:"barra", titulo:"Evolução Superiores",    campos:[{key:"supino",color:GRAY,label:"Supino"},{key:"remada",color:ORANGE,label:"Remada"}]},
  ];
  const temDados = c => dadosOrdenados.some(d => c.some(f => d[f.key] != null));

  return (
    <div style={{position:"fixed",inset:0,background:"#111",zIndex:2000,overflowY:"auto"}}>
      <div style={{position:"sticky",top:0,zIndex:10,background:"#0d0d0d",borderBottom:`2px solid ${ORANGE}`,padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <svg width="40" height="32" viewBox="0 0 320 110" xmlns="http://www.w3.org/2000/svg">
            <g fill="white">
              <ellipse cx="62" cy="72" rx="28" ry="26"/>
              <rect x="50" y="44" width="24" height="14" rx="4"/>
              <path d="M54 44 Q62 28 70 44" stroke="white" strokeWidth="7" fill="none" strokeLinecap="round"/>
              <ellipse cx="62" cy="40" rx="5" ry="4"/>
            </g>
            <text x="98" y="52" fontFamily="Arial Black,Arial" fontWeight="900" fontSize="32" fill="white" letterSpacing="2">CINTHYA</text>
            <text x="98" y="84" fontFamily="Arial Black,Arial" fontWeight="900" fontSize="32" fill="white" letterSpacing="2">BRAUER</text>
          </svg>
          <span style={{color:GRAY,fontSize:11,letterSpacing:2}}>PERSONAL TRAINER</span>
        </div>
        <button onClick={onFechar} style={{background:"#333",color:"#fff",border:"none",borderRadius:6,padding:"6px 14px",fontWeight:700,cursor:"pointer",fontSize:13}}>✕ Fechar</button>
      </div>
      <div style={{maxWidth:430,margin:"0 auto",padding:"16px 16px 40px"}}>
        <div style={{background:CARD,borderRadius:14,padding:"18px 20px",border:`1px solid ${BORDER}`,marginBottom:14}}>
          <div style={{fontSize:11,color:GRAY,marginBottom:2}}>Relatório de Desempenho</div>
          <div style={{fontSize:24,fontWeight:900,color:ORANGE,lineHeight:1.2,marginBottom:10}}>{atleta.nome}</div>
          <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
            {atleta.idade && <div><span style={{color:GRAY,fontSize:11}}>Idade </span><span style={{color:"#fff",fontWeight:700}}>{atleta.idade} anos</span></div>}
            {atleta.esporte && <div><span style={{color:GRAY,fontSize:11}}>Esporte </span><span style={{color:"#fff",fontWeight:700}}>{atleta.esporte}</span></div>}
            {ultimoDado && <div><span style={{color:GRAY,fontSize:11}}>Mês ref. </span><span style={{color:ORANGE,fontWeight:700}}>{mesLabel(ultimoDado)}</span></div>}
          </div>
        </div>
        {ultimoDado && (
          <div style={{background:CARD,borderRadius:14,padding:"16px 20px",border:`1px solid ${BORDER}`,marginBottom:14}}>
            <div style={{color:ORANGE,fontWeight:700,fontSize:13,marginBottom:12}}>📊 Resultados — {mesLabel(ultimoDado)}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 16px"}}>
              {Object.entries(camposLabel).map(([k,lb]) => ultimoDado[k] != null && (
                <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,borderBottom:`1px solid ${BORDER}`,paddingBottom:5}}>
                  <span style={{color:GRAY}}>{lb.replace(/ \(.*\)/,"")}</span>
                  <span style={{color:"#fff",fontWeight:700}}>{ultimoDado[k]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {grafDefs.filter(g => temDados(g.campos)).map((g,i) => (
          <div key={i} style={{marginBottom:14}}>
            {g.tipo === "linha"
              ? <GraficoLinha dados={dadosOrdenados} campos={g.campos} titulo={g.titulo}/>
              : <GraficoBarra dados={dadosOrdenados} campos={g.campos} titulo={g.titulo}/>}
          </div>
        ))}
        <div style={{textAlign:"center",borderTop:`1px solid ${BORDER}`,paddingTop:16,marginTop:8}}>
          <div style={{fontSize:11,color:GRAY}}>Relatório gerado por Cinthya Brauer Personal Trainer</div>
          <div style={{fontSize:11,color:GRAY,marginTop:2}}>{new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})}</div>
        </div>
      </div>
    </div>
  );
}

// ── Modal Exportar/Importar ──────────────────────────────────────────────────
function ModalDados({ tipo, atletas, onImportar, onFechar }) {
  const [texto, setTexto] = useState(tipo === "exportar" ? JSON.stringify(atletas, null, 2) : "");
  const [msg, setMsg] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  function copiar() {
    try { navigator.clipboard.writeText(texto); setMsg("✅ Copiado!"); }
    catch { setMsg("Selecione e copie manualmente (Ctrl+C)."); }
  }
  function tentarImportar() {
    try { const p = JSON.parse(texto); if (!Array.isArray(p)) throw new Error(); setConfirmando(true); }
    catch { setMsg("❌ JSON inválido."); }
  }
  function confirmarImportar() {
    onImportar(JSON.parse(texto));
    setMsg("✅ Importado!");
    setConfirmando(false);
    setTimeout(onFechar, 1200);
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#1a1a1a",borderRadius:16,padding:28,maxWidth:540,width:"100%",border:`1px solid ${BORDER}`}}>
        <div style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#fff"}}>
          {tipo === "exportar" ? "📤 Exportar Dados" : "📥 Importar Dados"}
        </div>
        <div style={{color:GRAY,fontSize:13,marginBottom:14}}>
          {tipo === "exportar" ? "Copie o conteúdo abaixo e envie:" : "Cole o JSON recebido e clique em Importar:"}
        </div>
        <textarea value={texto} onChange={e => setTexto(e.target.value)} readOnly={tipo === "exportar"} rows={12}
          style={{width:"100%",background:"#0d0d0d",border:`1px solid ${BORDER}`,borderRadius:8,color:"#fff",padding:12,fontSize:11,fontFamily:"monospace",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
        {msg && <div style={{marginTop:8,fontSize:13,fontWeight:600,color:msg.startsWith("✅")?"#4ade80":"#f87171"}}>{msg}</div>}
        {confirmando && (
          <div style={{marginTop:12,background:"#7f1d1d",borderRadius:8,padding:"12px 16px"}}>
            <div style={{color:"#fecaca",fontWeight:600,fontSize:13,marginBottom:10}}>⚠️ Isso vai substituir TODOS os dados. Tem certeza?</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={confirmarImportar} style={{background:"#dc2626",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",fontWeight:700,cursor:"pointer",fontSize:13}}>Sim, importar</button>
              <button onClick={() => setConfirmando(false)} style={{background:"#333",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",fontWeight:700,cursor:"pointer",fontSize:13}}>Cancelar</button>
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"}}>
          {tipo === "exportar" && <button onClick={copiar} style={{background:ORANGE,color:"#fff",border:"none",borderRadius:6,padding:"10px 20px",fontWeight:700,cursor:"pointer",fontSize:13}}>📋 Copiar Tudo</button>}
          {tipo === "importar" && !confirmando && <button onClick={tentarImportar} style={{background:"#166534",color:"#fff",border:"none",borderRadius:6,padding:"10px 20px",fontWeight:700,cursor:"pointer",fontSize:13}}>📥 Importar</button>}
          <button onClick={onFechar} style={{background:"#333",color:"#fff",border:"none",borderRadius:6,padding:"10px 20px",fontWeight:700,cursor:"pointer",fontSize:13}}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ── App principal ────────────────────────────────────────────────────────────
export default function App() {
  const [atletas, setAtletas]         = useState(null);
  const [selId, setSelId]             = useState(1);
  const [view, setView]               = useState("dashboard");
  const [novoAtleta, setNovoAtleta]   = useState({nome:"",idade:"",esporte:"",frequencia:""});
  const [novoDado, setNovoDado]       = useState({...dadoVazio});
  const [msg, setMsg]                 = useState("");
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [pendente, setPendente]       = useState(false);
  const [verRelatorio, setVerRelatorio] = useState(false);
  const [modalDados, setModalDados]   = useState(null);
  const [statusConexao, setStatusConexao] = useState("🔄 Conectando...");

  // Carregamento
  useEffect(() => {
    let ok = false;
    const timeout = setTimeout(() => {
      if (!ok) { setAtletas(atletasBase); setLoading(false); setStatusConexao("⚠️ Offline"); }
    }, 8000);

    fsGet()
      .then(saved => {
        ok = true; clearTimeout(timeout);
        if (saved) {
          const novos = atletasBase.filter(b => !saved.find(s => s.id === b.id));
          setAtletas([...saved, ...novos]);
          setSelId(saved[0]?.id || 1);
        } else {
          setAtletas(atletasBase);
        }
        setStatusConexao("☁️ Firebase conectado");
        setLoading(false);
      })
      .catch(() => {
        ok = true; clearTimeout(timeout);
        setAtletas(atletasBase);
        setStatusConexao("⚠️ Erro de conexão");
        setLoading(false);
      });
  }, []);

  // Salvar
  const salvarFirebase = useCallback(async (dados) => {
    setSaving(true);
    try {
      await fsSet(dados);
      setPendente(false);
      setStatusConexao("☁️ Firebase conectado");
      showMsg("✅ Dados salvos no Firebase!");
    } catch(e) {
      console.error(e);
      showMsg("❌ Erro ao salvar. Verifique a conexão.");
    }
    setSaving(false);
  }, []);

  const atleta = useMemo(() => atletas?.find(a => a.id === selId), [atletas, selId]);
  const dadosOrdenados = useMemo(() =>
    atleta ? [...atleta.dados].sort((a,b) => a.ano*100+a.mes - (b.ano*100+b.mes)).map(d => ({...d, label:mesLabel(d)})) : []
  , [atleta]);
  const ultimoDado = dadosOrdenados[dadosOrdenados.length - 1];

  function showMsg(m) { setMsg(m); setTimeout(() => setMsg(""), 3000); }

  function preencherExistentes(atletaId, mes, ano) {
    const a = atletas?.find(x => x.id === Number(atletaId));
    const ex = a?.dados.find(d => d.mes === Number(mes) && d.ano === Number(ano));
    if (ex) {
      const p = {...dadoVazio};
      Object.keys(dadoVazio).forEach(k => {
        if (k === "mes") p.mes = ex.mes;
        else if (k === "ano") p.ano = ex.ano;
        else p[k] = ex[k] != null ? ex[k] : "";
      });
      setNovoDado(p);
    } else {
      setNovoDado({...dadoVazio, mes:Number(mes), ano:Number(ano)});
    }
  }

  function abrirLancarDados() { preencherExistentes(selId, novoDado.mes, novoDado.ano); setView("addDado"); }
  function trocarAtletaForm(id) { setSelId(Number(id)); preencherExistentes(id, novoDado.mes, novoDado.ano); }
  function trocarMesForm(mes) { setNovoDado(p => ({...p, mes})); preencherExistentes(selId, mes, novoDado.ano); }
  function trocarAnoForm(ano) { setNovoDado(p => ({...p, ano})); preencherExistentes(selId, novoDado.mes, ano); }

  function salvarAtleta() {
    if (!novoAtleta.nome.trim()) { showMsg("Nome obrigatório."); return; }
    const id = Date.now();
    setAtletas(prev => [...prev, {id, ...novoAtleta, idade:Number(novoAtleta.idade)||"", dados:[]}]);
    setSelId(id); setNovoAtleta({nome:"",idade:"",esporte:"",frequencia:""});
    setPendente(true); showMsg("✅ Atleta adicionado! Clique em 💾 Salvar."); setView("dashboard");
  }

  function adicionarDado() {
    const d = {};
    Object.entries(novoDado).forEach(([k,v]) => {
      if (k === "mes" || k === "ano") d[k] = Number(v);
      else d[k] = v === "" || v === null ? null : Number(v);
    });
    const a = atletas?.find(x => x.id === selId);
    const ex = a?.dados.find(x => x.mes === d.mes && x.ano === d.ano);
    const merged = ex ? {...ex, ...Object.fromEntries(Object.entries(d).filter(([,v]) => v != null))} : d;
    const temValor = Object.entries(merged).some(([k,v]) => k !== "mes" && k !== "ano" && v != null);
    if (!temValor) { showMsg("Preencha ao menos um campo."); return; }
    setAtletas(prev => prev.map(a => {
      if (a.id !== selId) return a;
      return {...a, dados:[...a.dados.filter(x => !(x.mes === d.mes && x.ano === d.ano)), merged]};
    }));
    setNovoDado({...dadoVazio});
    setPendente(true);
    showMsg("✅ Dados adicionados! Clique em 💾 Salvar.");
    setView("dashboard");
  }

  const btn = (bg, extra={}) => ({background:bg, color:"#fff", border:"none", borderRadius:6, padding:"10px 18px", fontWeight:700, cursor:"pointer", fontSize:13, ...extra});
  const inputStyle = {background:"#222", border:`1px solid ${BORDER}`, borderRadius:6, color:"#fff", padding:"8px 12px", width:"100%", fontSize:14, outline:"none", boxSizing:"border-box"};
  const labelStyle = {color:GRAY, fontSize:12, marginBottom:4, display:"block"};

  if (loading) return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      <div style={{color:ORANGE,fontWeight:700,fontSize:18}}>Carregando dados...</div>
      <div style={{color:GRAY,fontSize:13}}>Conectando ao Firebase</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:BG,color:"#fff",fontFamily:"'Segoe UI',sans-serif"}}>
      {verRelatorio && atleta && <RelatorioMobile atleta={atleta} dadosOrdenados={dadosOrdenados} ultimoDado={ultimoDado} onFechar={() => setVerRelatorio(false)}/>}
      {modalDados && <ModalDados tipo={modalDados} atletas={atletas} onImportar={dados => { setAtletas(dados); setPendente(true); }} onFechar={() => setModalDados(null)}/>}

      {/* HEADER */}
      <div style={{background:"#0d0d0d",borderBottom:`1px solid ${BORDER}`,padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <svg width="120" height="52" viewBox="0 0 320 110" xmlns="http://www.w3.org/2000/svg">
          <g fill="white">
            <ellipse cx="62" cy="72" rx="28" ry="26"/>
            <rect x="50" y="44" width="24" height="14" rx="4"/>
            <path d="M54 44 Q62 28 70 44" stroke="white" strokeWidth="7" fill="none" strokeLinecap="round"/>
            <ellipse cx="62" cy="40" rx="5" ry="4"/>
          </g>
          <text x="98" y="52" fontFamily="Arial Black,Arial" fontWeight="900" fontSize="32" fill="white" letterSpacing="2">CINTHYA</text>
          <text x="98" y="84" fontFamily="Arial Black,Arial" fontWeight="900" fontSize="32" fill="white" letterSpacing="2">BRAUER</text>
          <text x="100" y="100" fontFamily="Arial,sans-serif" fontWeight="400" fontSize="13" fill="white" letterSpacing="5">PERSONAL TRAINER</text>
        </svg>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{color:GRAY,fontSize:11}}>{statusConexao}</span>
          <button onClick={() => atletas && salvarFirebase(atletas)} disabled={saving || !pendente}
            style={btn(pendente?"#16a34a":"#1a3a1a", {border:pendente?"2px solid #4ade80":"2px solid transparent", opacity:saving?0.7:1})}>
            {saving ? "⏳ Salvando..." : pendente ? "💾 Salvar agora" : "✅ Salvo"}
          </button>
          <button style={btn("#1d4ed8")} onClick={() => setModalDados("exportar")}>📤 Exportar</button>
          <button style={btn("#166534")} onClick={() => setModalDados("importar")}>📥 Importar</button>
          {[["dashboard","📊 Dashboard"],["addAtleta","➕ Novo Atleta"]].map(([v,lb]) => (
            <button key={v} style={btn(view===v?ORANGE:"#333")} onClick={() => setView(v)}>{lb}</button>
          ))}
          <button style={btn(view==="addDado"?ORANGE:"#333")} onClick={abrirLancarDados}>📝 Lançar Dados</button>
        </div>
      </div>

      {pendente && !saving && (
        <div style={{background:"#1c3a1c",borderBottom:"1px solid #166534",padding:"8px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <span style={{color:"#4ade80",fontSize:13}}>⚠️ Dados não salvos. Clique em <strong>💾 Salvar agora</strong>.</span>
          <button onClick={() => atletas && salvarFirebase(atletas)} style={btn("#16a34a",{padding:"6px 14px",fontSize:12})}>💾 Salvar agora</button>
        </div>
      )}

      {msg && <div style={{background:msg.startsWith("✅")?"#166534":"#7f1d1d",color:msg.startsWith("✅")?"#bbf7d0":"#fecaca",padding:"10px 24px",fontWeight:600,textAlign:"center"}}>{msg}</div>}

      {/* NOVO ATLETA */}
      {view === "addAtleta" && (
        <div style={{maxWidth:480,margin:"40px auto",background:CARD,borderRadius:12,padding:32,border:`1px solid ${BORDER}`}}>
          <h2 style={{color:ORANGE,marginTop:0}}>Novo Atleta</h2>
          {[["nome","Nome completo"],["idade","Idade"],["esporte","Esporte"],["frequencia","Frequência (ex: 3x/semana)"]].map(([k,lb]) => (
            <div key={k} style={{marginBottom:16}}>
              <label style={labelStyle}>{lb}</label>
              <input style={inputStyle} value={novoAtleta[k]} onChange={e => setNovoAtleta(p => ({...p,[k]:e.target.value}))}/>
            </div>
          ))}
          <div style={{display:"flex",gap:12,marginTop:24}}>
            <button style={btn(ORANGE)} onClick={salvarAtleta}>Adicionar Atleta</button>
            <button style={btn("#333")} onClick={() => setView("dashboard")}>Cancelar</button>
          </div>
        </div>
      )}

      {/* LANÇAR DADOS */}
      {view === "addDado" && (
        <div style={{maxWidth:640,margin:"40px auto",background:CARD,borderRadius:12,padding:32,border:`1px solid ${BORDER}`}}>
          <h2 style={{color:ORANGE,marginTop:0}}>Lançar Dados Mensais</h2>
          <div style={{background:"#1a2a1a",border:"1px solid #166534",borderRadius:8,padding:"10px 14px",marginBottom:20,fontSize:13,color:"#4ade80"}}>
            💡 Após preencher, clique em <strong>Adicionar</strong>. Depois clique em <strong>💾 Salvar agora</strong> no topo.
          </div>
          <div style={{marginBottom:16}}>
            <label style={labelStyle}>Atleta</label>
            <select style={inputStyle} value={selId} onChange={e => trocarAtletaForm(e.target.value)}>
              {atletas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
          {atletas?.find(a => a.id === selId)?.dados.find(d => d.mes === Number(novoDado.mes) && d.ano === Number(novoDado.ano)) && (
            <div style={{background:"#1a2a3a",border:"1px solid #3b82f6",borderRadius:8,padding:"8px 14px",marginBottom:16,fontSize:12,color:"#93c5fd"}}>
              📋 Dados de <strong>{MESES[Number(novoDado.mes)-1]}/{novoDado.ano}</strong> carregados. Edite apenas o que precisar.
            </div>
          )}
          <div style={{display:"flex",gap:12,marginBottom:16}}>
            <div style={{flex:1}}>
              <label style={labelStyle}>Mês</label>
              <select style={inputStyle} value={novoDado.mes} onChange={e => trocarMesForm(Number(e.target.value))}>
                {MESES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div style={{flex:1}}>
              <label style={labelStyle}>Ano</label>
              <input style={inputStyle} type="number" value={novoDado.ano} onChange={e => trocarAnoForm(Number(e.target.value))}/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {Object.entries(camposLabel).map(([k,lb]) => (
              <div key={k}>
                <label style={labelStyle}>{lb}</label>
                <input style={inputStyle} type="number" step="0.01" placeholder="—"
                  value={novoDado[k] ?? ""} onChange={e => setNovoDado(p => ({...p,[k]:e.target.value}))}/>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:12,marginTop:24}}>
            <button style={btn(ORANGE)} onClick={adicionarDado}>Adicionar Dados</button>
            <button style={btn("#333")} onClick={() => setView("dashboard")}>Cancelar</button>
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {view === "dashboard" && atleta && (
        <div style={{padding:"20px 24px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
            <div style={{color:GRAY,fontSize:13}}>Relatório de Desempenho</div>
            <select style={{background:"#1a1a1a",border:`1px solid ${BORDER}`,borderRadius:6,color:ORANGE,padding:"6px 12px",fontSize:15,fontWeight:700,outline:"none"}}
              value={selId} onChange={e => setSelId(Number(e.target.value))}>
              {atletas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <div style={{color:GRAY,fontSize:13}}>Mês Atual: <span style={{color:"#fff",fontWeight:600}}>{ultimoDado ? mesLabel(ultimoDado) : "—"}</span></div>
              <button onClick={() => setVerRelatorio(true)} disabled={!ultimoDado} style={btn("#7c3aed",{opacity:!ultimoDado?0.4:1})}>📱 Ver Relatório Mobile</button>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"190px 1fr",gap:20,alignItems:"start"}}>
            <div style={{background:CARD,borderRadius:12,padding:20,border:`1px solid ${BORDER}`}}>
              <div style={{fontSize:11,color:GRAY}}>Atleta</div>
              <div style={{fontSize:20,fontWeight:900,color:ORANGE,marginBottom:12,lineHeight:1.2}}>{atleta.nome}</div>
              {atleta.idade && <><div style={{fontSize:11,color:GRAY}}>Idade</div><div style={{fontSize:16,fontWeight:700,color:ORANGE,marginBottom:10}}>{atleta.idade} anos</div></>}
              {atleta.esporte && <><div style={{fontSize:11,color:GRAY}}>Esporte</div><div style={{fontSize:14,fontWeight:700,color:ORANGE,marginBottom:10}}>{atleta.esporte}</div></>}
              {ultimoDado && (
                <div style={{borderTop:`1px solid ${BORDER}`,paddingTop:12,marginTop:8}}>
                  <div style={{fontSize:11,color:GRAY,marginBottom:8,fontWeight:700}}>Último — {mesLabel(ultimoDado)}</div>
                  {Object.entries(camposLabel).map(([k,lb]) => ultimoDado[k] != null && (
                    <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4,gap:8}}>
                      <span style={{color:GRAY}}>{lb.replace(/ \(.*\)/,"")}</span>
                      <span style={{color:"#fff",fontWeight:600}}>{ultimoDado[k]}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{marginTop:16,padding:"8px 10px",background:"#0d0d0d",borderRadius:8,border:`1px solid ${BORDER}`}}>
                <div style={{fontSize:10,color:GRAY,textAlign:"center"}}>{statusConexao}</div>
                <div style={{fontSize:10,color:pendente?ORANGE:GREEN,textAlign:"center",marginTop:2}}>{pendente?"Clique em 💾 Salvar agora":"Última versão salva"}</div>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <GraficoLinha dados={dadosOrdenados} titulo="Salto CMJ (cm)"           campos={[{key:"cmj",color:ORANGE,label:"CMJ (cm)"}]}/>
              <GraficoLinha dados={dadosOrdenados} titulo="Evolução Salto Horizontal" campos={[{key:"saltHoriz",color:ORANGE,label:"Horizontal (m)"}]}/>
              <GraficoLinha dados={dadosOrdenados} titulo="Saltos Unilaterais"        campos={[{key:"saltUniDir",color:ORANGE,label:"Unilateral Direita"},{key:"saltUniEsq",color:BLUE,label:"Unilateral Esquerda"},{key:"saltUniTriplo",color:GREEN,label:"Unilateral Triplo"}]}/>
              <GraficoLinha dados={dadosOrdenados} titulo="Saltos Cruzados"           campos={[{key:"saltCruzDir",color:ORANGE,label:"Cruzado Direita"},{key:"saltCruzEsq",color:PURPLE,label:"Cruzado Esquerda"}]}/>
              <GraficoBarra dados={dadosOrdenados} titulo="Evolução Inferiores"       campos={[{key:"agach",color:GRAY,label:"Agachamento"},{key:"terra",color:ORANGE,label:"Terra"}]}/>
              <GraficoBarra dados={dadosOrdenados} titulo="Evolução Superiores"       campos={[{key:"supino",color:GRAY,label:"Supino"},{key:"remada",color:ORANGE,label:"Remada"}]}/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
