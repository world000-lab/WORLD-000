/* WORLD-000 beta battle engine: offline, deterministic, no external calls. */
(function(root){
'use strict';
const TYPES=[{name:'AURORA',color:'#50d7ec',x:170,y:155,focus:'speed',source:'aurora/vector-batch.js'},{name:'FORGE',color:'#ffad61',x:735,y:155,focus:'stability',source:'forge/worker-pool.js'},{name:'NEXUS',color:'#bb8dff',x:455,y:300,focus:'speed',source:'nexus/cache-index.js'},{name:'VERDANT',color:'#7fe4a4',x:220,y:460,focus:'efficiency',source:'verdant/eco-scheduler.js'},{name:'ORBIT',color:'#f883b7',x:735,y:460,focus:'stability',source:'orbit/recovery-loop.js'}];
const TOPICS=[{key:'speed',name:'연산 속도',unit:'ms',direction:'lower',task:'동일 가상 입력 10,000건 처리',method:'동일 시뮬레이터에서 처리시간 비교'},{key:'efficiency',name:'자원 효율',unit:'단위',direction:'lower',task:'동일 가상 작업량 처리',method:'가상 에너지 소모량 비교'},{key:'stability',name:'복구 안정성',unit:'%',direction:'higher',task:'동일 가상 장애 100회 복구',method:'가상 복구 성공률 비교'}];
function rand(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}}
function newWorld(seed=20261122){return{seed,round:0,agents:TYPES.map((t,i)=>({...t,tech:12+i*2,industry:15,energy:35,defense:18,allies:[]})),battles:[],events:[],rules:[]}}
function log(w,type,detail){w.events.push({round:w.round,type,detail})}
function step(w){if(w.round>=40)return w;w.round++;const r=rand(w.seed+w.round*7919);
for(const a of w.agents){let action=a.energy<15?'gather':a.focus==='speed'?'research':a.focus==='stability'?'fortify':a.focus==='efficiency'?'gather':'build';if(action==='research'){a.tech+=2;a.energy-=3}if(action==='fortify'){a.defense+=2;a.energy-=3}if(action==='gather')a.energy+=5;if(action==='build'){a.industry+=2;a.energy-=3}a.energy+=1;log(w,'development',a.name+' · '+({research:'기술 개발',fortify:'방어 강화',gather:'자원 확보',build:'산업 확장'})[action])}
if(w.round%3===1){const a=w.agents[Math.floor(r()*5)],others=w.agents.filter(b=>b!==a),b=others[Math.floor(r()*4)],topic=TOPICS[Math.floor(r()*3)];const id='DUEL-'+String(w.battles.length+1).padStart(3,'0');w.battles.push({id,a:a.name,b:b.name,x:Math.round((a.x+b.x)/2+(r()-.5)*65),y:Math.round((a.y+b.y)/2+(r()-.5)*55),topic:topic.key,created:w.round,stage:'PROPOSED',samples:[],proposal:{task:topic.task,method:topic.method},sourceA:a.source,sourceB:b.source});log(w,'proposal',a.name+' → '+b.name+' · '+topic.name+' 도전 제안')}
for(const b of w.battles){const age=w.round-b.created;const a=w.agents.find(x=>x.name===b.a),c=w.agents.find(x=>x.name===b.b),topic=TOPICS.find(t=>t.key===b.topic);
if(age===1){b.stage='ACCEPTED';log(w,'accept',c.name+' · '+b.id+' 조건 수락')}
if(age>=2&&age<=5){b.stage='RUNNING';const base=topic.key==='stability'?55:topic.key==='speed'?110:90;const modifier=topic.key==='stability'?'defense':topic.key==='speed'?'tech':'industry';const sign=topic.direction==='lower'?-1:1;const va=Math.round(Math.max(1,base+sign*a[modifier]*.65+(r()-.5)*9));const vb=Math.round(Math.max(1,base+sign*c[modifier]*.65+(r()-.5)*9));b.samples.push({round:w.round,a:va,b:vb});log(w,'measurement',b.id+' · '+a.name+' '+va+topic.unit+' / '+c.name+' '+vb+topic.unit)}
if(age===6){b.stage='EVIDENCE_SUBMITTED';log(w,'evidence',b.id+' · 측정 기록 제출 / 검증 대기')}
if(age===8){b.stage='RECORDED';b.record={confirmedBy:b.b,notes:'시뮬레이터가 동일 조건의 가상 측정 기록을 확인함. 실제 소스 실행 검증 아님.'};log(w,'record',b.id+' · 가상 검증 기록 보존')}}
if(w.round%7===0){const a=w.agents[Math.floor(r()*5)],b=w.agents.filter(x=>x!==a&&!a.allies.includes(x.name))[0];if(b){a.allies.push(b.name);b.allies.push(a.name);log(w,'alliance',a.name+' ↔ '+b.name+' 동맹')}}
return w}
function situation(b){if(!b.samples.length)return'측정 전';const t=TOPICS.find(x=>x.key===b.topic),s=b.samples[b.samples.length-1],delta=t.direction==='lower'?s.b-s.a:s.a-s.b;if(Math.abs(delta)<=2)return'접전';return(delta>0?b.a:b.b)+' 측정치 우세'}
function run(seed=20261122,rounds=20){const w=newWorld(seed);for(let i=0;i<rounds;i++)step(w);return w}
root.World000Beta={newWorld,step,run,situation,topics:TOPICS};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
