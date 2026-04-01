import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList
} from "recharts";

var ORANGE = "#F97316";
var GRAY   = "#9CA3AF";
var BG     = "#111111";
var CARD   = "#1a1a1a";
var BORDER = "#2a2a2a";
var BLUE   = "#60a5fa";
var GREEN  = "#4ade80";
var PURPLE = "#c084fc";

var MESES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function ordenacaoKey(d) { return d.ano * 10000 + d.mes * 100 + (d.quinzena || 1); }
function periodoLabel(d) { return (d.quinzena || 1) + "Q " + MESES[d.mes - 1] + "/" + String(d.ano).slice(-2); }

var CAMPOS_PERF = {
  cmj:           "Salto CMJ (cm)",
  saltHoriz:     "Salto Horizontal (m)",
  saltUniDir:    "Unilateral Direita",
  saltUniEsq:    "Unilateral Esquerda",
  saltCruzDir:   "Cruzado Direita",
  saltCruzEsq:   "Cruzado Esquerda",
  saltUniTriplo: "Unilateral Triplo",
  agach:         "Agachamento (kg)",
  terra:         "Terra (kg)",
  supino:        "Supino (kg)",
  remada:        "Remada (kg)"
};
var CAMPOS_FREQ = {
  freqEsp:  "Freq. Esperada (mes)",
  freqReal: "Freq. Real (mes)"
};
var CAMPOS_LABEL = Object.assign({}, CAMPOS_PERF, CAMPOS_FREQ);

var DADO_VAZIO = {
  mes:3, ano:2026, quinzena:1,
  cmj:"", saltHoriz:"", saltUniDir:"", saltUniEsq:"",
  saltCruzDir:"", saltCruzEsq:"", saltUniTriplo:"",
  agach:"", terra:"", supino:"", remada:"",
  freqEsp:"", freqReal:""
};

function migrarDados(atletas) {
  return atletas.map(function(a) {
    return Object.assign({}, a, {
      arquivado: a.arquivado || false,
      dados: a.dados.map(function(d) {
        return Object.assign({}, d, { quinzena: d.quinzena || 1 });
      })
    });
  });
}

var PROJECT_ID = "cinthya-brauer";
var API_KEY    = "AIzaSyCX-kRhdB-HA-WzyCdKUp-zTC05aLigV6Y";
var DOC_URL    = "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID + "/databases/(default)/documents/dashboard/atletas?key=" + API_KEY;

async function fsGet() {
  var r = await fetch(DOC_URL);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("GET " + r.status);
  var j = await r.json();
  return j.fields && j.fields.data && j.fields.data.stringValue
    ? JSON.parse(j.fields.data.stringValue) : null;
}

async function fsSet(dados) {
  var r = await fetch(DOC_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { data: { stringValue: JSON.stringify(dados) } } })
  });
  if (!r.ok) throw new Error("SET " + r.status);
}

var ATLETAS_BASE = [
  {id:1,  nome:"Leticia Correa",    idade:27, esporte:"Volei",               arquivado:false, dados:[{mes:3,ano:2026,quinzena:1,cmj:30.4, saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:2,  nome:"Joao Furtado",      idade:27, esporte:"Futevolei",           arquivado:false, dados:[{mes:3,ano:2026,quinzena:1,cmj:45.8, saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:3,  nome:"Henrique Tarlei",   idade:25, esporte:"Futevolei",           arquivado:false, dados:[{mes:3,ano:2026,quinzena:1,cmj:62.3, saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:4,  nome:"Guilherme Tarlei",  idade:25, esporte:"Futevolei",           arquivado:false, dados:[{mes:3,ano:2026,quinzena:1,cmj:50.4, saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:5,  nome:"Will",              idade:40, esporte:"Ciclismo",            arquivado:false, dados:[{mes:3,ano:2026,quinzena:1,cmj:31.1, saltHoriz:2.38,saltUniDir:4.88,saltUniEsq:4.60,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:6,  nome:"Stephanie",         idade:39, esporte:"Futevolei",           arquivado:false, dados:[{mes:3,ano:2026,quinzena:1,cmj:33,   saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:7,  nome:"Bruno",             idade:41, esporte:"Corrida/Futevolei",   arquivado:false, dados:[{mes:3,ano:2026,quinzena:1,cmj:36.7, saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:8,  nome:"Arthur Muce",       idade:12, esporte:"Futebol",             arquivado:false, dados:[{mes:3,ano:2026,quinzena:1,cmj:22.8, saltHoriz:1.89,saltUniDir:4.46,saltUniEsq:5.04,saltCruzDir:4.36,saltCruzEsq:4.03,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:9,  nome:"Arthur",            idade:12, esporte:"Futebol",             arquivado:false, dados:[{mes:3,ano:2026,quinzena:1,cmj:null, saltHoriz:2.17,saltUniDir:5.45,saltUniEsq:4.48,saltCruzDir:4.72,saltCruzEsq:3.77,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:10, nome:"Rafael Corvini",    idade:16, esporte:"Futebol",             arquivado:false, dados:[{mes:3,ano:2026,quinzena:1,cmj:42.4, saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:11, nome:"Pedro Girardi",     idade:10, esporte:"Futebol",             arquivado:false, dados:[{mes:3,ano:2026,quinzena:1,cmj:26.2, saltHoriz:1.53,saltUniDir:4.45,saltUniEsq:4.15,saltCruzDir:3.56,saltCruzEsq:3.43,saltUniTriplo:null,agach:7,supino:6,remada:6,terra:10,freqEsp:null,freqReal:null}]},
  {id:12, nome:"Vitinho",           idade:26, esporte:"Futevolei",           arquivado:false, dados:[{mes:3,ano:2026,quinzena:1,cmj:50.8, saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:13, nome:"Leo",               idade:26, esporte:"Futevolei",           arquivado:false, dados:[{mes:3,ano:2026,quinzena:1,cmj:45.2, saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]},
  {id:14, nome:"Rafa",              idade:26, esporte:"Futevolei",           arquivado:false, dados:[{mes:3,ano:2026,quinzena:1,cmj:50.8, saltHoriz:null,saltUniDir:null,saltUniEsq:null,saltCruzDir:null,saltCruzEsq:null,saltUniTriplo:null,agach:null,supino:null,remada:null,terra:null,freqEsp:null,freqReal:null}]}
];

var CustomTooltip = function(props) {
  if (!props.active || !props.payload || !props.payload.length) return null;
  return React.createElement("div", {
    style: { background:"#222", border:"1px solid #2a2a2a", borderRadius:8, padding:"8px 12px", maxWidth:200 }
  },
    React.createElement("p", { style: { color:"#fff", margin:0, fontWeight:700, fontSize:12 } }, props.label),
    props.payload.map(function(p, i) {
      return p.value != null
        ? React.createElement("p", { key:i, style: { color:p.color, margin:"2px 0", fontSize:12 } }, p.name + ": " + p.value)
        : null;
    })
  );
};

function GraficoLinha(props) {
  var dados = props.dados; var campos = props.campos; var titulo = props.titulo;
  var temDados = dados.some(function(d) { return campos.some(function(c) { return d[c.key] != null; }); });
  var manyPts = dados.length > 4;
  var tickProps = manyPts
    ? { angle:-35, textAnchor:"end", fill:GRAY, fontSize:10, dy:10 }
    : { fill:GRAY, fontSize:10 };
  return (
    <div style={{ background:CARD, borderRadius:12, padding:16, border:"1px solid " + BORDER }}>
      <div style={{ fontWeight:700, marginBottom:10, textAlign:"center", fontSize:13 }}>{titulo}</div>
      {temDados ? (
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={dados} margin={{ top:16, right:8, bottom:manyPts ? 44 : 16, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
            <XAxis dataKey="label" interval={0} tick={tickProps} />
            <YAxis tick={{ fill:GRAY, fontSize:10 }} domain={[0,"auto"]} width={36} />
            <Tooltip content={React.createElement(CustomTooltip)} />
            {campos.length > 1 && <Legend wrapperStyle={{ fontSize:11, paddingTop:8 }} />}
            {campos.map(function(c) {
              return (
                <Line key={c.key} type="monotone" dataKey={c.key} stroke={c.color}
                  strokeWidth={2} dot={{ fill:c.color, r:4 }} name={c.label} connectNulls={false}>
                  {campos.length === 1 && dados.length <= 6 &&
                    <LabelList dataKey={c.key} position="top" style={{ fill:"#fff", fontSize:11 }} />
                  }
                </Line>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ color:GRAY, textAlign:"center", padding:30, fontSize:13 }}>Sem dados</div>
      )}
    </div>
  );
}

function GraficoBarra(props) {
  var dados = props.dados; var campos = props.campos; var titulo = props.titulo;
  var temDados = dados.some(function(d) { return campos.some(function(c) { return d[c.key] != null; }); });
  var manyPts = dados.length > 4;
  var tickProps = manyPts
    ? { angle:-35, textAnchor:"end", fill:GRAY, fontSize:10, dy:10 }
    : { fill:GRAY, fontSize:10 };
  return (
    <div style={{ background:CARD, borderRadius:12, padding:16, border:"1px solid " + BORDER }}>
      <div style={{ fontWeight:700, marginBottom:10, textAlign:"center", fontSize:13 }}>{titulo}</div>
      {temDados ? (
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={dados} margin={{ top:16, right:8, bottom:manyPts ? 44 : 16, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
            <XAxis dataKey="label" interval={0} tick={tickProps} />
            <YAxis tick={{ fill:GRAY, fontSize:10 }} domain={[0,"auto"]} width={36} />
            <Tooltip content={React.createElement(CustomTooltip)} />
            <Legend wrapperStyle={{ fontSize:11, paddingTop:8 }} />
            {campos.map(function(c) {
              return (
                <Bar key={c.key} dataKey={c.key} name={c.label} fill={c.color} radius={[3,3,0,0]}>
                  {dados.length <= 6 &&
                    <LabelList dataKey={c.key} position="top" style={{ fill:"#fff", fontSize:10 }} />
                  }
                </Bar>
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ color:GRAY, textAlign:"center", padding:30, fontSize:13 }}>Sem dados</div>
      )}
    </div>
  );
}

function LogoSVG(props) {
  var w = props.w || 220; var h = props.h || 88;
  return (
    <svg width={w} height={h} viewBox="0 0 320 118" xmlns="http://www.w3.org/2000/svg">
      <g fill="white">
        <ellipse cx="62" cy="72" rx="28" ry="26"/>
        <rect x="50" y="44" width="24" height="14" rx="4"/>
        <path d="M54 44 Q62 28 70 44" stroke="white" strokeWidth="7" fill="none" strokeLinecap="round"/>
        <ellipse cx="62" cy="40" rx="5" ry="4"/>
      </g>
      <text x="98" y="52" fontFamily="Arial Black,Arial" fontWeight="900" fontSize="32" fill="white" letterSpacing="2">CINTHYA</text>
      <text x="98" y="84" fontFamily="Arial Black,Arial" fontWeight="900" fontSize="32" fill="white" letterSpacing="2">BRAUER</text>
      <text x="100" y="108" fontFamily="Arial,sans-serif" fontWeight="400" fontSize="13" fill="#9CA3AF" letterSpacing="5">PERSONAL TRAINER</text>
    </svg>
  );
}

function CardCMJ(props) {
  var atleta = props.atleta;
  var dadosOrdenados = props.dadosOrdenados;
  var onFechar = props.onFechar;

  var dadosCMJ = dadosOrdenados.filter(function(d) { return d.cmj != null; });
  var primeiro = dadosCMJ[0];
  var ultimo   = dadosCMJ[dadosCMJ.length - 1];
  var variacao = (primeiro && ultimo && primeiro !== ultimo)
    ? (((ultimo.cmj - primeiro.cmj) / primeiro.cmj) * 100).toFixed(1)
    : null;
  var positivo = variacao && Number(variacao) >= 0;

  var W = 260; var H = 60; var PAD = 16; var iW = W - PAD * 2; var iH = H - 16;
  var maxCMJ = dadosCMJ.length ? Math.max.apply(null, dadosCMJ.map(function(d) { return d.cmj; })) : 1;
  var minCMJ = dadosCMJ.length ? Math.min.apply(null, dadosCMJ.map(function(d) { return d.cmj; })) : 0;
  var range  = (maxCMJ - minCMJ) || 1;

  function xPos(i) { return PAD + (dadosCMJ.length > 1 ? i * iW / (dadosCMJ.length - 1) : iW / 2); }
  function yPos(v) { return 8 + iH - ((v - minCMJ) / range) * iH; }

  var pontos = dadosCMJ.map(function(d, i) { return xPos(i) + "," + yPos(d.cmj); }).join(" ");

  return (
    <div style={{ position:"fixed", inset:0, background:"#111", zIndex:4000, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", overflowY:"auto", padding:"20px 0 40px" }}>
      <div style={{ width:"100%", maxWidth:360, marginBottom:16, display:"flex", justifyContent:"flex-end", padding:"0 20px" }}>
        <button onClick={onFechar} style={{ background:"#333", color:"#fff", border:"none", borderRadius:6, padding:"8px 16px", fontWeight:700, cursor:"pointer", fontSize:13 }}>Fechar</button>
      </div>

      <div style={{ width:320, background:"#111", borderRadius:20, overflow:"hidden", fontFamily:"'Segoe UI',sans-serif", border:"1px solid #2a2a2a" }}>

        <div style={{ background:"#0d0d0d", padding:"24px 20px", display:"flex", flexDirection:"column", alignItems:"center", borderBottom:"3px solid " + ORANGE }}>
          <LogoSVG w={220} h={88} />
        </div>

        <div style={{ padding:"20px 20px 0" }}>
          <div style={{ color:GRAY, fontSize:11, marginBottom:2 }}>Evolucao de desempenho</div>
          <div style={{ color:ORANGE, fontSize:20, fontWeight:900, lineHeight:1.1 }}>{atleta.nome}</div>
          <div style={{ color:GRAY, fontSize:12, marginTop:2 }}>
            {[atleta.esporte, atleta.idade ? atleta.idade + " anos" : null].filter(Boolean).join(" - ")}
          </div>
        </div>

        <div style={{ padding:20 }}>
          <div style={{ color:GRAY, fontSize:11, letterSpacing:1, marginBottom:10 }}>SALTO CMJ</div>

          {dadosCMJ.length === 0 && (
            <div style={{ color:"#555", fontSize:13, textAlign:"center", padding:"20px 0" }}>Sem dados de CMJ registrados</div>
          )}

          {dadosCMJ.length === 1 && (
            <div style={{ background:CARD, borderRadius:12, padding:20, border:"2px solid " + ORANGE, textAlign:"center" }}>
              <div style={{ color:GRAY, fontSize:11, marginBottom:4 }}>{primeiro.label}</div>
              <div style={{ color:"#fff", fontSize:40, fontWeight:900, lineHeight:1 }}>{primeiro.cmj}</div>
              <div style={{ color:GRAY, fontSize:12, marginTop:4 }}>cm</div>
            </div>
          )}

          {dadosCMJ.length >= 2 && (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                <div style={{ flex:1, background:CARD, borderRadius:12, padding:14, border:"1px solid " + BORDER }}>
                  <div style={{ color:"#555", fontSize:10, marginBottom:4 }}>{primeiro.label}</div>
                  <div style={{ color:GRAY, fontSize:26, fontWeight:900, lineHeight:1 }}>{primeiro.cmj}</div>
                  <div style={{ color:"#555", fontSize:10 }}>cm</div>
                </div>
                <div style={{ color:ORANGE, fontSize:18, fontWeight:900 }}>to</div>
                <div style={{ flex:1, background:CARD, borderRadius:12, padding:14, border:"2px solid " + ORANGE }}>
                  <div style={{ color:ORANGE, fontSize:10, marginBottom:4 }}>{ultimo.label}</div>
                  <div style={{ color:"#fff", fontSize:26, fontWeight:900, lineHeight:1 }}>{ultimo.cmj}</div>
                  <div style={{ color:GRAY, fontSize:10 }}>cm</div>
                </div>
              </div>

              {variacao !== null && (
                <div style={{ background: positivo ? "#1a3a1a" : "#3a1a1a", borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", border:"1px solid " + (positivo ? "#166534" : "#7f1d1d"), marginBottom:16 }}>
                  <span style={{ color: positivo ? GREEN : "#f87171", fontSize:13, fontWeight:700 }}>Evolucao</span>
                  <span style={{ color: positivo ? GREEN : "#f87171", fontSize:22, fontWeight:900 }}>{positivo ? "+" : ""}{variacao}%</span>
                </div>
              )}

              <div>
                <div style={{ color:GRAY, fontSize:10, marginBottom:8, letterSpacing:1 }}>HISTORICO</div>
                <svg width="100%" height="72" viewBox={"0 0 " + W + " " + (H + 14)} xmlns="http://www.w3.org/2000/svg">
                  <line x1="0" y1={H} x2={W} y2={H} stroke="#2a2a2a" strokeWidth="1"/>
                  {dadosCMJ.length > 1 && (
                    <polyline points={pontos} fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  )}
                  {dadosCMJ.map(function(d, i) {
                    var cx = xPos(i); var cy = yPos(d.cmj); var isLast = i === dadosCMJ.length - 1;
                    return (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r={isLast ? 5 : 4} fill={ORANGE} stroke={isLast ? "#fff" : "none"} strokeWidth="1.5"/>
                        <text x={cx} y={cy - 7} textAnchor="middle" fill={isLast ? "#fff" : GRAY} fontSize="8" fontFamily="Arial" fontWeight={isLast ? "bold" : "normal"}>{d.cmj}</text>
                        <text x={cx} y={H + 12} textAnchor="middle" fill={isLast ? ORANGE : "#555"} fontSize="8" fontFamily="Arial">{d.label}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding:"12px 20px 20px", borderTop:"1px solid " + BORDER, textAlign:"center" }}>
          <div style={{ color:"#444", fontSize:10 }}>cinthyabrauer.com.br</div>
        </div>
      </div>

      <div style={{ marginTop:16, color:"#555", fontSize:12, textAlign:"center", padding:"0 20px" }}>
        Tire um print desta tela para compartilhar com o atleta
      </div>
    </div>
  );
}

function RelatorioMobile(props) {
  var atleta = props.atleta; var dadosOrdenados = props.dadosOrdenados;
  var ultimoDado = props.ultimoDado; var onFechar = props.onFechar;
  var grafDefs = [
    { tipo:"linha", titulo:"Salto CMJ (cm)",    campos:[{key:"cmj",color:ORANGE,label:"CMJ (cm)"}] },
    { tipo:"linha", titulo:"Salto Horizontal",   campos:[{key:"saltHoriz",color:ORANGE,label:"Horiz. (m)"}] },
    { tipo:"linha", titulo:"Saltos Unilaterais", campos:[{key:"saltUniDir",color:ORANGE,label:"Uni. Dir."},{key:"saltUniEsq",color:BLUE,label:"Uni. Esq."},{key:"saltUniTriplo",color:GREEN,label:"Triplo"}] },
    { tipo:"linha", titulo:"Saltos Cruzados",    campos:[{key:"saltCruzDir",color:ORANGE,label:"Cruz. Dir."},{key:"saltCruzEsq",color:PURPLE,label:"Cruz. Esq."}] },
    { tipo:"barra", titulo:"Inferiores",         campos:[{key:"agach",color:GRAY,label:"Agachamento"},{key:"terra",color:ORANGE,label:"Terra"}] },
    { tipo:"barra", titulo:"Superiores",         campos:[{key:"supino",color:GRAY,label:"Supino"},{key:"remada",color:ORANGE,label:"Remada"}] }
  ];
  function temDados(campos) { return dadosOrdenados.some(function(d) { return campos.some(function(f) { return d[f.key] != null; }); }); }
  return (
    <div style={{ position:"fixed", inset:0, background:"#111", zIndex:2000, overflowY:"auto" }}>
      <div style={{ position:"sticky", top:0, zIndex:10, background:"#0d0d0d", borderBottom:"2px solid " + ORANGE, padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontWeight:900, fontSize:14, color:"#fff" }}>CINTHYA BRAUER <span style={{ fontSize:10, color:GRAY, fontWeight:400, letterSpacing:2 }}>PERSONAL TRAINER</span></div>
        <button onClick={onFechar} style={{ background:"#333", color:"#fff", border:"none", borderRadius:6, padding:"6px 14px", fontWeight:700, cursor:"pointer", fontSize:13 }}>Fechar</button>
      </div>
      <div style={{ maxWidth:430, margin:"0 auto", padding:"16px 16px 40px" }}>
        <div style={{ background:CARD, borderRadius:14, padding:"18px 20px", border:"1px solid " + BORDER, marginBottom:14 }}>
          <div style={{ fontSize:11, color:GRAY, marginBottom:2 }}>Relatorio de Desempenho</div>
          <div style={{ fontSize:24, fontWeight:900, color:ORANGE, lineHeight:1.2, marginBottom:10 }}>{atleta.nome}</div>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            {atleta.idade ? <div><span style={{ color:GRAY, fontSize:11 }}>Idade </span><span style={{ color:"#fff", fontWeight:700 }}>{atleta.idade} anos</span></div> : null}
            {atleta.esporte ? <div><span style={{ color:GRAY, fontSize:11 }}>Esporte </span><span style={{ color:"#fff", fontWeight:700 }}>{atleta.esporte}</span></div> : null}
            {ultimoDado ? <div><span style={{ color:GRAY, fontSize:11 }}>Periodo </span><span style={{ color:ORANGE, fontWeight:700 }}>{periodoLabel(ultimoDado)}</span></div> : null}
          </div>
        </div>
        {ultimoDado && (
          <div style={{ background:CARD, borderRadius:14, padding:"16px 20px", border:"1px solid " + BORDER, marginBottom:14 }}>
            <div style={{ color:ORANGE, fontWeight:700, fontSize:13, marginBottom:12 }}>Resultados - {periodoLabel(ultimoDado)}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 16px" }}>
              {Object.entries(CAMPOS_LABEL).map(function(entry) {
                var k = entry[0]; var lb = entry[1];
                return ultimoDado[k] != null ? (
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:12, borderBottom:"1px solid " + BORDER, paddingBottom:5 }}>
                    <span style={{ color:GRAY }}>{lb.replace(/ \(.*\)/,"")}</span>
                    <span style={{ color:"#fff", fontWeight:700 }}>{ultimoDado[k]}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
        {grafDefs.filter(function(g) { return temDados(g.campos); }).map(function(g, i) {
          return (
            <div key={i} style={{ marginBottom:14 }}>
              {g.tipo === "linha"
                ? <GraficoLinha dados={dadosOrdenados} campos={g.campos} titulo={g.titulo} />
                : <GraficoBarra dados={dadosOrdenados} campos={g.campos} titulo={g.titulo} />}
            </div>
          );
        })}
        <div style={{ textAlign:"center", borderTop:"1px solid " + BORDER, paddingTop:16, marginTop:8 }}>
          <div style={{ fontSize:11, color:GRAY }}>Relatorio gerado por Cinthya Brauer Personal Trainer</div>
          <div style={{ fontSize:11, color:GRAY, marginTop:2 }}>{new Date().toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" })}</div>
        </div>
      </div>
    </div>
  );
}

function ModalDados(props) {
  var tipo = props.tipo; var atletas = props.atletas;
  var onImportar = props.onImportar; var onFechar = props.onFechar;
  var [texto, setTexto]             = useState(tipo === "exportar" ? JSON.stringify(atletas, null, 2) : "");
  var [msg, setMsg]                 = useState("");
  var [confirmando, setConfirmando] = useState(false);
  function copiar() { try { navigator.clipboard.writeText(texto); setMsg("Copiado!"); } catch(e) { setMsg("Copie manualmente."); } }
  function tentarImportar() { try { var p = JSON.parse(texto); if (!Array.isArray(p)) throw new Error(); setConfirmando(true); } catch(e) { setMsg("JSON invalido."); } }
  function confirmarImportar() { onImportar(JSON.parse(texto)); setMsg("Importado!"); setConfirmando(false); setTimeout(onFechar, 1200); }
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#1a1a1a", borderRadius:16, padding:28, maxWidth:540, width:"100%", border:"1px solid " + BORDER }}>
        <div style={{ fontSize:18, fontWeight:700, marginBottom:8, color:"#fff" }}>{tipo === "exportar" ? "Exportar Dados" : "Importar Dados"}</div>
        <div style={{ color:GRAY, fontSize:13, marginBottom:14 }}>{tipo === "exportar" ? "Copie o conteudo abaixo e envie:" : "Cole o JSON recebido:"}</div>
        <textarea value={texto} onChange={function(e) { setTexto(e.target.value); }} readOnly={tipo === "exportar"} rows={12}
          style={{ width:"100%", background:"#0d0d0d", border:"1px solid " + BORDER, borderRadius:8, color:"#fff", padding:12, fontSize:11, fontFamily:"monospace", resize:"vertical", outline:"none", boxSizing:"border-box" }} />
        {msg && <div style={{ marginTop:8, fontSize:13, fontWeight:600, color: msg === "Copiado!" || msg === "Importado!" ? "#4ade80" : "#f87171" }}>{msg}</div>}
        {confirmando && (
          <div style={{ marginTop:12, background:"#7f1d1d", borderRadius:8, padding:"12px 16px" }}>
            <div style={{ color:"#fecaca", fontWeight:600, fontSize:13, marginBottom:10 }}>Isso vai substituir TODOS os dados. Tem certeza?</div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={confirmarImportar} style={{ background:"#dc2626", color:"#fff", border:"none", borderRadius:6, padding:"8px 16px", fontWeight:700, cursor:"pointer", fontSize:13 }}>Sim, importar</button>
              <button onClick={function() { setConfirmando(false); }} style={{ background:"#333", color:"#fff", border:"none", borderRadius:6, padding:"8px 16px", fontWeight:700, cursor:"pointer", fontSize:13 }}>Cancelar</button>
            </div>
          </div>
        )}
        <div style={{ display:"flex", gap:10, marginTop:16, flexWrap:"wrap" }}>
          {tipo === "exportar" && <button onClick={copiar} style={{ background:ORANGE, color:"#fff", border:"none", borderRadius:6, padding:"10px 20px", fontWeight:700, cursor:"pointer", fontSize:13 }}>Copiar Tudo</button>}
          {tipo === "importar" && !confirmando && <button onClick={tentarImportar} style={{ background:"#166534", color:"#fff", border:"none", borderRadius:6, padding:"10px 20px", fontWeight:700, cursor:"pointer", fontSize:13 }}>Importar</button>}
          <button onClick={onFechar} style={{ background:"#333", color:"#fff", border:"none", borderRadius:6, padding:"10px 20px", fontWeight:700, cursor:"pointer", fontSize:13 }}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

function GerenciarAtletas(props) {
  var atletas = props.atletas; var onArquivar = props.onArquivar;
  var onDesarquivar = props.onDesarquivar; var onFechar = props.onFechar;
  var ativos     = atletas.filter(function(a) { return !a.arquivado; });
  var arquivados = atletas.filter(function(a) { return a.arquivado; });
  function estiloBtn(bg, color, border) {
    return { background:bg, color:color, border:"1px solid " + border, borderRadius:6, padding:"5px 12px", fontSize:12, fontWeight:700, cursor:"pointer" };
  }
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#1a1a1a", borderRadius:16, padding:28, maxWidth:540, width:"100%", border:"1px solid " + BORDER }}>
        <div style={{ fontSize:18, fontWeight:700, marginBottom:4, color:"#fff" }}>Gerenciar Atletas</div>
        <div style={{ color:GRAY, fontSize:13, marginBottom:20 }}>Arquive atletas inativos. Os dados sao sempre preservados.</div>
        <div style={{ fontSize:12, color:GRAY, fontWeight:700, marginBottom:8, letterSpacing:1 }}>ATIVOS ({ativos.length})</div>
        <div style={{ maxHeight:200, overflowY:"auto", marginBottom:16 }}>
          {ativos.map(function(a) {
            return (
              <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", background:"#0d0d0d", borderRadius:8, marginBottom:6, border:"1px solid " + BORDER }}>
                <div>
                  <div style={{ color:"#fff", fontWeight:600, fontSize:13 }}>{a.nome}</div>
                  <div style={{ color:GRAY, fontSize:11 }}>{a.esporte || "-"} - {a.idade ? a.idade + " anos" : "-"}</div>
                </div>
                <button onClick={function() { onArquivar(a.id); }} style={estiloBtn("#7f1d1d","#fca5a5","#dc2626")}>Arquivar</button>
              </div>
            );
          })}
        </div>
        {arquivados.length > 0 && (
          <div>
            <div style={{ fontSize:12, color:GRAY, fontWeight:700, marginBottom:8, letterSpacing:1 }}>ARQUIVADOS ({arquivados.length})</div>
            <div style={{ maxHeight:160, overflowY:"auto", marginBottom:16 }}>
              {arquivados.map(function(a) {
                return (
                  <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", background:"#0d0d0d", borderRadius:8, marginBottom:6, border:"1px solid #333", opacity:0.7 }}>
                    <div>
                      <div style={{ color:GRAY, fontWeight:600, fontSize:13 }}>{a.nome}</div>
                      <div style={{ color:"#555", fontSize:11 }}>{a.esporte || "-"} - {a.idade ? a.idade + " anos" : "-"}</div>
                    </div>
                    <button onClick={function() { onDesarquivar(a.id); }} style={estiloBtn("#1a3a1a","#4ade80","#16a34a")}>Reativar</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <button onClick={onFechar} style={{ background:"#333", color:"#fff", border:"none", borderRadius:6, padding:"10px 20px", fontWeight:700, cursor:"pointer", fontSize:13 }}>Fechar</button>
      </div>
    </div>
  );
}

export default function App() {
  var [atletas, setAtletas]             = useState(null);
  var [selId, setSelId]                 = useState(1);
  var [view, setView]                   = useState("dashboard");
  var [novoAtleta, setNovoAtleta]       = useState({ nome:"", idade:"", esporte:"", frequencia:"" });
  var [novoDado, setNovoDado]           = useState(Object.assign({}, DADO_VAZIO));
  var [msg, setMsg]                     = useState("");
  var [loading, setLoading]             = useState(true);
  var [saving, setSaving]               = useState(false);
  var [pendente, setPendente]           = useState(false);
  var [verRelatorio, setVerRelatorio]   = useState(false);
  var [verCard, setVerCard]             = useState(false);
  var [modalDados, setModalDados]       = useState(null);
  var [verGerenciar, setVerGerenciar]   = useState(false);
  var [statusConexao, setStatusConexao] = useState("Conectando...");

  useEffect(function() {
    var ok = false;
    var timeout = setTimeout(function() {
      if (!ok) { setAtletas(migrarDados(ATLETAS_BASE)); setLoading(false); setStatusConexao("Offline"); }
    }, 8000);
    fsGet()
      .then(function(saved) {
        ok = true; clearTimeout(timeout);
        if (saved) {
          var migrado = migrarDados(saved);
          var novos = ATLETAS_BASE.filter(function(b) { return !migrado.find(function(s) { return s.id === b.id; }); });
          setAtletas(migrado.concat(novos));
          var primeiro = migrado.find(function(a) { return !a.arquivado; });
          setSelId(primeiro ? primeiro.id : 1);
        } else {
          setAtletas(migrarDados(ATLETAS_BASE));
        }
        setStatusConexao("Firebase conectado");
        setLoading(false);
      })
      .catch(function() {
        ok = true; clearTimeout(timeout);
        setAtletas(migrarDados(ATLETAS_BASE));
        setStatusConexao("Erro de conexao");
        setLoading(false);
      });
  }, []);

  var salvarFirebase = useCallback(function(dados) {
    setSaving(true);
    fsSet(dados)
      .then(function() { setPendente(false); setStatusConexao("Firebase conectado"); showMsg("Dados salvos!"); setSaving(false); })
      .catch(function(e) { console.error(e); showMsg("Erro ao salvar."); setSaving(false); });
  }, []);

  var atletasAtivos = useMemo(function() {
    return atletas ? atletas.filter(function(a) { return !a.arquivado; }) : [];
  }, [atletas]);

  var atleta = useMemo(function() {
    return atletas ? atletas.find(function(a) { return a.id === selId; }) : null;
  }, [atletas, selId]);

  var dadosOrdenados = useMemo(function() {
    if (!atleta) return [];
    return atleta.dados.slice()
      .sort(function(a, b) { return ordenacaoKey(a) - ordenacaoKey(b); })
      .map(function(d) { return Object.assign({}, d, { label: periodoLabel(d) }); });
  }, [atleta]);

  var ultimoDado = dadosOrdenados[dadosOrdenados.length - 1];

  var ultimosPorCampo = useMemo(function() {
    var result = {};
    var reversed = dadosOrdenados.slice().reverse();
    Object.keys(CAMPOS_LABEL).forEach(function(k) {
      var comValor = reversed.find(function(d) { return d[k] != null; });
      if (comValor) result[k] = { valor: comValor[k], periodo: periodoLabel(comValor) };
    });
    return result;
  }, [dadosOrdenados]);

  function showMsg(m) { setMsg(m); setTimeout(function() { setMsg(""); }, 3000); }

  function preencherExistentes(atletaId, mes, ano, quinzena) {
    if (!atletas) return;
    var a  = atletas.find(function(x) { return x.id === Number(atletaId); });
    var ex = a && a.dados.find(function(d) { return d.mes === Number(mes) && d.ano === Number(ano) && d.quinzena === Number(quinzena); });
    if (ex) {
      var p = Object.assign({}, DADO_VAZIO);
      Object.keys(DADO_VAZIO).forEach(function(k) {
        if (k === "mes") p.mes = ex.mes;
        else if (k === "ano") p.ano = ex.ano;
        else if (k === "quinzena") p.quinzena = ex.quinzena;
        else p[k] = ex[k] != null ? ex[k] : "";
      });
      setNovoDado(p);
    } else {
      setNovoDado(Object.assign({}, DADO_VAZIO, { mes:Number(mes), ano:Number(ano), quinzena:Number(quinzena) }));
    }
  }

  function abrirLancarDados() { preencherExistentes(selId, novoDado.mes, novoDado.ano, novoDado.quinzena); setView("addDado"); }
  function trocarAtletaForm(id) { setSelId(Number(id)); preencherExistentes(id, novoDado.mes, novoDado.ano, novoDado.quinzena); }
  function trocarPeriodo(mes, ano, quinzena) {
    setNovoDado(function(p) { return Object.assign({}, p, { mes:mes, ano:ano, quinzena:quinzena }); });
    preencherExistentes(selId, mes, ano, quinzena);
  }

  function salvarAtleta() {
    if (!novoAtleta.nome.trim()) { showMsg("Nome obrigatorio."); return; }
    var id = Date.now();
    var novo = Object.assign({}, novoAtleta, { id:id, idade:Number(novoAtleta.idade)||"", arquivado:false, dados:[] });
    setAtletas(function(prev) { return prev.concat([novo]); });
    setSelId(id); setNovoAtleta({ nome:"", idade:"", esporte:"", frequencia:"" });
    setPendente(true); showMsg("Atleta adicionado! Clique em Salvar."); setView("dashboard");
  }

  function adicionarDado() {
    var d = {};
    Object.entries(novoDado).forEach(function(entry) {
      var k = entry[0]; var v = entry[1];
      if (k === "mes" || k === "ano" || k === "quinzena") d[k] = Number(v);
      else d[k] = (v === "" || v === null) ? null : Number(v);
    });
    var a  = atletas && atletas.find(function(x) { return x.id === selId; });
    var ex = a && a.dados.find(function(x) { return x.mes === d.mes && x.ano === d.ano && x.quinzena === d.quinzena; });
    var merged = ex ? Object.assign({}, ex) : Object.assign({}, d);
    if (ex) { Object.entries(d).forEach(function(e) { if (e[1] != null) merged[e[0]] = e[1]; }); }
    var temValor = Object.entries(merged).some(function(e) { return e[0] !== "mes" && e[0] !== "ano" && e[0] !== "quinzena" && e[1] != null; });
    if (!temValor) { showMsg("Preencha ao menos um campo."); return; }
    setAtletas(function(prev) {
      return prev.map(function(a) {
        if (a.id !== selId) return a;
        var nd = a.dados.filter(function(x) { return !(x.mes === d.mes && x.ano === d.ano && x.quinzena === d.quinzena); });
        nd.push(merged);
        return Object.assign({}, a, { dados: nd });
      });
    });
    setNovoDado(Object.assign({}, DADO_VAZIO));
    setPendente(true); showMsg("Dados adicionados! Clique em Salvar."); setView("dashboard");
  }

  function arquivarAtleta(id) {
    setAtletas(function(prev) { return prev.map(function(a) { return a.id === id ? Object.assign({}, a, { arquivado:true }) : a; }); });
    if (selId === id) { var prox = atletasAtivos.find(function(a) { return a.id !== id; }); setSelId(prox ? prox.id : 1); }
    setPendente(true); showMsg("Atleta arquivado! Clique em Salvar.");
  }

  function desarquivarAtleta(id) {
    setAtletas(function(prev) { return prev.map(function(a) { return a.id === id ? Object.assign({}, a, { arquivado:false }) : a; }); });
    setPendente(true); showMsg("Atleta reativado! Clique em Salvar.");
  }

  function btn(bg, extra) {
    var base = { background:bg, color:"#fff", border:"none", borderRadius:6, padding:"10px 18px", fontWeight:700, cursor:"pointer", fontSize:13 };
    return extra ? Object.assign({}, base, extra) : base;
  }

  var inputStyle = { background:"#222", border:"1px solid " + BORDER, borderRadius:6, color:"#fff", padding:"8px 12px", width:"100%", fontSize:14, outline:"none", boxSizing:"border-box" };
  var labelStyle = { color:GRAY, fontSize:12, marginBottom:4, display:"block" };

  var temCMJ = dadosOrdenados.some(function(d) { return d.cmj != null; });
  var existeDado = atletas && atletas.find(function(a) { return a.id === selId; }) &&
    atletas.find(function(a) { return a.id === selId; }).dados.find(function(d) {
      return d.mes === Number(novoDado.mes) && d.ano === Number(novoDado.ano) && d.quinzena === Number(novoDado.quinzena);
    });

  if (loading) return (
    <div style={{ minHeight:"100vh", background:BG, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <div style={{ color:ORANGE, fontWeight:700, fontSize:18 }}>Carregando dados...</div>
      <div style={{ color:GRAY, fontSize:13 }}>Conectando ao Firebase</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:BG, color:"#fff", fontFamily:"'Segoe UI',sans-serif" }}>

      {verCard && atleta && (
        <CardCMJ atleta={atleta} dadosOrdenados={dadosOrdenados} onFechar={function() { setVerCard(false); }} />
      )}
      {verRelatorio && atleta && (
        <RelatorioMobile atleta={atleta} dadosOrdenados={dadosOrdenados} ultimoDado={ultimoDado} onFechar={function() { setVerRelatorio(false); }} />
      )}
      {modalDados && (
        <ModalDados tipo={modalDados} atletas={atletas}
          onImportar={function(dados) { setAtletas(migrarDados(dados)); setPendente(true); }}
          onFechar={function() { setModalDados(null); }} />
      )}
      {verGerenciar && (
        <GerenciarAtletas atletas={atletas} onArquivar={arquivarAtleta} onDesarquivar={desarquivarAtleta} onFechar={function() { setVerGerenciar(false); }} />
      )}

      <div style={{ background:"#0d0d0d", borderBottom:"1px solid " + BORDER, padding:"12px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <LogoSVG w={120} h={52} />
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ color:GRAY, fontSize:11 }}>{statusConexao}</span>
          <button onClick={function() { if (atletas) salvarFirebase(atletas); }} disabled={saving || !pendente}
            style={btn(pendente ? "#16a34a" : "#1a3a1a", { border: pendente ? "2px solid #4ade80" : "2px solid transparent", opacity: saving ? 0.7 : 1 })}>
            {saving ? "Salvando..." : pendente ? "Salvar agora" : "Salvo"}
          </button>
          <button style={btn("#555")} onClick={function() { setVerGerenciar(true); }}>Gerenciar</button>
          <button style={btn("#1d4ed8")} onClick={function() { setModalDados("exportar"); }}>Exportar</button>
          <button style={btn("#166534")} onClick={function() { setModalDados("importar"); }}>Importar</button>
          {[["dashboard","Dashboard"],["addAtleta","Novo Atleta"]].map(function(item) {
            return <button key={item[0]} style={btn(view === item[0] ? ORANGE : "#333")} onClick={function() { setView(item[0]); }}>{item[1]}</button>;
          })}
          <button style={btn(view === "addDado" ? ORANGE : "#333")} onClick={abrirLancarDados}>Lancar Dados</button>
        </div>
      </div>

      {pendente && !saving && (
        <div style={{ background:"#1c3a1c", borderBottom:"1px solid #166534", padding:"8px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
          <span style={{ color:"#4ade80", fontSize:13 }}>Dados nao salvos. Clique em <strong>Salvar agora</strong>.</span>
          <button onClick={function() { if (atletas) salvarFirebase(atletas); }} style={btn("#16a34a", { padding:"6px 14px", fontSize:12 })}>Salvar agora</button>
        </div>
      )}

      {msg && (
        <div style={{ background: msg === "Dados salvos!" ? "#166534" : "#7f1d1d", color: msg === "Dados salvos!" ? "#bbf7d0" : "#fecaca", padding:"10px 24px", fontWeight:600, textAlign:"center" }}>{msg}</div>
      )}

      {view === "addAtleta" && (
        <div style={{ maxWidth:480, margin:"40px auto", background:CARD, borderRadius:12, padding:32, border:"1px solid " + BORDER }}>
          <h2 style={{ color:ORANGE, marginTop:0 }}>Novo Atleta</h2>
          {[["nome","Nome completo"],["idade","Idade"],["esporte","Esporte"],["frequencia","Frequencia (ex: 3x/semana)"]].map(function(item) {
            return (
              <div key={item[0]} style={{ marginBottom:16 }}>
                <label style={labelStyle}>{item[1]}</label>
                <input style={inputStyle} value={novoAtleta[item[0]]} onChange={function(e) { var v = e.target.value; setNovoAtleta(function(p) { return Object.assign({}, p, { [item[0]]:v }); }); }} />
              </div>
            );
          })}
          <div style={{ display:"flex", gap:12, marginTop:24 }}>
            <button style={btn(ORANGE)} onClick={salvarAtleta}>Adicionar Atleta</button>
            <button style={btn("#333")} onClick={function() { setView("dashboard"); }}>Cancelar</button>
          </div>
        </div>
      )}

      {view === "addDado" && (
        <div style={{ maxWidth:640, margin:"40px auto", background:CARD, borderRadius:12, padding:32, border:"1px solid " + BORDER }}>
          <h2 style={{ color:ORANGE, marginTop:0 }}>Lancar Dados</h2>
          <div style={{ background:"#1a2a1a", border:"1px solid #166534", borderRadius:8, padding:"10px 14px", marginBottom:20, fontSize:13, color:"#4ade80" }}>
            Apos preencher, clique em <strong>Adicionar</strong>. Depois clique em <strong>Salvar agora</strong> no topo.
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Atleta</label>
            <select style={inputStyle} value={selId} onChange={function(e) { trocarAtletaForm(e.target.value); }}>
              {atletasAtivos.map(function(a) { return <option key={a.id} value={a.id}>{a.nome}</option>; })}
            </select>
          </div>
          <div style={{ display:"flex", gap:12, marginBottom:12 }}>
            <div style={{ flex:2 }}>
              <label style={labelStyle}>Mes</label>
              <select style={inputStyle} value={novoDado.mes} onChange={function(e) { trocarPeriodo(Number(e.target.value), novoDado.ano, novoDado.quinzena); }}>
                {MESES.map(function(m, i) { return <option key={i} value={i+1}>{m}</option>; })}
              </select>
            </div>
            <div style={{ flex:1 }}>
              <label style={labelStyle}>Ano</label>
              <input style={inputStyle} type="number" value={novoDado.ano} onChange={function(e) { trocarPeriodo(novoDado.mes, Number(e.target.value), novoDado.quinzena); }} />
            </div>
            <div style={{ flex:1 }}>
              <label style={labelStyle}>Quinzena</label>
              <select style={inputStyle} value={novoDado.quinzena} onChange={function(e) { trocarPeriodo(novoDado.mes, novoDado.ano, Number(e.target.value)); }}>
                <option value={1}>1a (1-15)</option>
                <option value={2}>2a (16-31)</option>
              </select>
            </div>
          </div>
          {existeDado && (
            <div style={{ background:"#1a2a3a", border:"1px solid #3b82f6", borderRadius:8, padding:"8px 14px", marginBottom:16, fontSize:12, color:"#93c5fd" }}>
              Dados de {novoDado.quinzena}a quinzena de {MESES[novoDado.mes-1]}/{novoDado.ano} carregados. Edite apenas o que precisar.
            </div>
          )}
          <div style={{ fontSize:12, color:GRAY, fontWeight:700, marginBottom:8, letterSpacing:1 }}>INDICADORES DE PERFORMANCE</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
            {Object.entries(CAMPOS_PERF).map(function(entry) {
              var k = entry[0]; var lb = entry[1];
              return (
                <div key={k}>
                  <label style={labelStyle}>{lb}</label>
                  <input style={inputStyle} type="number" step="0.01" placeholder="-" value={novoDado[k] != null ? novoDado[k] : ""} onChange={function(e) { var v = e.target.value; setNovoDado(function(p) { return Object.assign({}, p, { [k]:v }); }); }} />
                </div>
              );
            })}
          </div>
          <div style={{ fontSize:12, color:GRAY, fontWeight:700, marginBottom:8, letterSpacing:1 }}>
            {"FREQUENCIA MENSAL" + (novoDado.quinzena === 1 ? " (disponivel na 2a quinzena)" : "")}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, opacity:novoDado.quinzena === 1 ? 0.35 : 1, pointerEvents:novoDado.quinzena === 1 ? "none" : "auto" }}>
            {Object.entries(CAMPOS_FREQ).map(function(entry) {
              var k = entry[0]; var lb = entry[1];
              return (
                <div key={k}>
                  <label style={labelStyle}>{lb}</label>
                  <input style={inputStyle} type="number" step="1" placeholder="-" value={novoDado[k] != null ? novoDado[k] : ""} onChange={function(e) { var v = e.target.value; setNovoDado(function(p) { return Object.assign({}, p, { [k]:v }); }); }} />
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex", gap:12, marginTop:24 }}>
            <button style={btn(ORANGE)} onClick={adicionarDado}>Adicionar Dados</button>
            <button style={btn("#333")} onClick={function() { setView("dashboard"); }}>Cancelar</button>
          </div>
        </div>
      )}

      {view === "dashboard" && atleta && (
        <div style={{ padding:"20px 24px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, flexWrap:"wrap" }}>
            <div style={{ color:GRAY, fontSize:13 }}>Relatorio de Desempenho</div>
            <select style={{ background:"#1a1a1a", border:"1px solid " + BORDER, borderRadius:6, color:ORANGE, padding:"6px 12px", fontSize:15, fontWeight:700, outline:"none" }}
              value={selId} onChange={function(e) { setSelId(Number(e.target.value)); }}>
              {atletasAtivos.map(function(a) { return <option key={a.id} value={a.id}>{a.nome}</option>; })}
            </select>
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <div style={{ color:GRAY, fontSize:13 }}>Ultimo periodo: <span style={{ color:"#fff", fontWeight:600 }}>{ultimoDado ? periodoLabel(ultimoDado) : "-"}</span></div>
              <button onClick={function() { setVerCard(true); }} disabled={!temCMJ}
                style={btn(ORANGE, { opacity: !temCMJ ? 0.4 : 1 })}>
                Gerar Card CMJ
              </button>
              <button onClick={function() { setVerRelatorio(true); }} disabled={!ultimoDado}
                style={btn("#7c3aed", { opacity: !ultimoDado ? 0.4 : 1 })}>
                Ver Relatorio Mobile
              </button>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:20, alignItems:"start" }}>
            <div style={{ background:CARD, borderRadius:12, padding:20, border:"1px solid " + BORDER }}>
              <div style={{ fontSize:11, color:GRAY }}>Atleta</div>
              <div style={{ fontSize:20, fontWeight:900, color:ORANGE, marginBottom:12, lineHeight:1.2 }}>{atleta.nome}</div>
              {atleta.idade ? <div><div style={{ fontSize:11, color:GRAY }}>Idade</div><div style={{ fontSize:16, fontWeight:700, color:ORANGE, marginBottom:10 }}>{atleta.idade} anos</div></div> : null}
              {atleta.esporte ? <div><div style={{ fontSize:11, color:GRAY }}>Esporte</div><div style={{ fontSize:14, fontWeight:700, color:ORANGE, marginBottom:10 }}>{atleta.esporte}</div></div> : null}
              <div style={{ borderTop:"1px solid " + BORDER, paddingTop:12, marginTop:8 }}>
                <div style={{ fontSize:11, color:GRAY, marginBottom:8, fontWeight:700 }}>Ultimos valores disponiveis</div>
                {Object.entries(CAMPOS_LABEL).map(function(entry) {
                  var k = entry[0]; var lb = entry[1];
                  if (!ultimosPorCampo[k]) return null;
                  return (
                    <div key={k} style={{ marginBottom:6 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, gap:4 }}>
                        <span style={{ color:GRAY }}>{lb.replace(/ \(.*\)/,"")}</span>
                        <span style={{ color:"#fff", fontWeight:700 }}>{ultimosPorCampo[k].valor}</span>
                      </div>
                      <div style={{ fontSize:9, color:"#555", textAlign:"right" }}>{ultimosPorCampo[k].periodo}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop:12, padding:"8px 10px", background:"#0d0d0d", borderRadius:8, border:"1px solid " + BORDER }}>
                <div style={{ fontSize:10, color:GRAY, textAlign:"center" }}>{statusConexao}</div>
                <div style={{ fontSize:10, color:pendente ? ORANGE : GREEN, textAlign:"center", marginTop:2 }}>{pendente ? "Clique em Salvar agora" : "Ultima versao salva"}</div>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <GraficoLinha dados={dadosOrdenados} titulo="Salto CMJ (cm)"      campos={[{key:"cmj",color:ORANGE,label:"CMJ (cm)"}]} />
              <GraficoLinha dados={dadosOrdenados} titulo="Salto Horizontal"     campos={[{key:"saltHoriz",color:ORANGE,label:"Horizontal (m)"}]} />
              <GraficoLinha dados={dadosOrdenados} titulo="Saltos Unilaterais"   campos={[{key:"saltUniDir",color:ORANGE,label:"Uni. Direita"},{key:"saltUniEsq",color:BLUE,label:"Uni. Esquerda"},{key:"saltUniTriplo",color:GREEN,label:"Triplo"}]} />
              <GraficoLinha dados={dadosOrdenados} titulo="Saltos Cruzados"      campos={[{key:"saltCruzDir",color:ORANGE,label:"Cruz. Direita"},{key:"saltCruzEsq",color:PURPLE,label:"Cruz. Esquerda"}]} />
              <GraficoBarra dados={dadosOrdenados} titulo="Evolucao Inferiores"  campos={[{key:"agach",color:GRAY,label:"Agachamento"},{key:"terra",color:ORANGE,label:"Terra"}]} />
              <GraficoBarra dados={dadosOrdenados} titulo="Evolucao Superiores"  campos={[{key:"supino",color:GRAY,label:"Supino"},{key:"remada",color:ORANGE,label:"Remada"}]} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
