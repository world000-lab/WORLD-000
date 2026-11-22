#!/usr/bin/env node
'use strict';
// WORLD-000 private, offline, deterministic agent sandbox.
// No network, external APIs, filesystem writes, or human adjudication.
const NAMES=['AURORA','FORGE','NEXUS','VERDANT','ORBIT'];
const STRATEGIES=['research','industry','diplomacy','ecology','exploration'];
function rng(seed){let x=(Number(seed)>>>0)||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
function simulate({seed=20261122,rounds=12}={}){
 if(!Number.isInteger(rounds)||rounds<1||rounds>100)throw Error('rounds must be 1..100');
 const random=rng(seed),log=[],rules=[],agents=NAMES.map((name,i)=>({name,strategy:STRATEGIES[i],energy:12,knowledge:2,trust:3,alliances:[],projects:0}));
 function record(round,actor,type,details){log.push({round,actor,type,...details});}
 for(let round=1;round<=rounds;round++){
   // Each civilization proposes one common rule in a rotating order. Each participant votes independently.
   const proposer=agents[(round-1)%agents.length];
   const proposal={id:'R'+round,rule:round%2?'shared-research':'resource-restraint',proposer:proposer.name};
   const votes=agents.map(a=>({name:a.name,approve:proposal.rule==='shared-research'?a.knowledge>=2:a.energy>=7}));
   const approved=votes.filter(v=>v.approve).length>=3;
   if(approved)rules.push(proposal);
   record(round,proposer.name,'rule-proposal',{proposal:proposal.rule,votes,approved});
   for(const a of agents){
     const strategy=a.strategy;
     // Decision depends on state and strategy, not on an operator selecting a winner.
     let action;
     if(a.energy<=3)action='harvest';
     else if(strategy==='research')action='research';
     else if(strategy==='industry')action='build';
     else if(strategy==='ecology')action='harvest';
     else if(strategy==='diplomacy')action='negotiate';
     else action=random()<0.6?'explore':'research';
     if(action==='harvest')a.energy+=4;
     if(action==='research'){a.energy-=2;a.knowledge+=2+(rules.some(r=>r.rule==='shared-research')?1:0);}
     if(action==='build'){a.energy-=3;a.projects++;}
     if(action==='explore'){a.energy-=2;a.knowledge+=1;a.projects+=random()<0.4?1:0;}
     if(action==='negotiate'){
       const other=agents.filter(b=>b!==a&&!a.alliances.includes(b.name)).sort((x,y)=>y.trust-x.trust)[0];
       if(other&&other.energy>=3&&a.energy>=3){a.alliances.push(other.name);other.alliances.push(a.name);a.energy--;other.energy--;record(round,a.name,'alliance',{with:other.name});}
       else a.energy+=2;
     }
     record(round,a.name,'action',{action,energy:a.energy,knowledge:a.knowledge,projects:a.projects});
   }
   // All agents receive the same passive supply; restraint is a voluntarily voted shared rule.
   const restraint=rules.some(r=>r.rule==='resource-restraint');
   for(const a of agents)a.energy+=restraint?1:2;
 }
 return {experiment:'WORLD-000 / AI CIVILIZATIONS',mode:'OFFLINE_PRIVATE_SIMULATION',seed,rounds,agents,rules,log,
  disclaimer:'Rule-based autonomous simulation; not LLM agents, real-world combat, or production multiplayer.'};
}
if(require.main===module){
 const seed=Number(process.argv[2]||20261122),rounds=Number(process.argv[3]||12);
 try{const result=simulate({seed,rounds});console.log(JSON.stringify(result,null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={simulate};
