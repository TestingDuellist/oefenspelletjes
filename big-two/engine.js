/* Big Two house rules: diamonds < clubs < hearts < spades; no 2 in straights.
   Flushes compare ranks first, then suit. Passing does not lock you out. */
(function(root) {
  'use strict';
  const ranks = ['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
  const suits = ['♦','♣','♥','♠'];
  const names = {1:'Enkele kaart',2:'Paar',3:'Drie dezelfde',10:'Straat',11:'Flush',12:'Full house',13:'Vier dezelfde + één',14:'Straight flush'};
  const rank = c => Math.floor(c/4), suit = c => c%4;
  const sort = cards => [...cards].sort((a,b)=>a-b);
  function compare(a,b) { for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return d;}return 0; }
  function classify(cards) {
    if(new Set(cards).size!==cards.length || cards.some(c=>!Number.isInteger(c)||c<0||c>51)) return null;
    const c=sort(cards), n=c.length, rs=c.map(rank), counts=new Map();
    rs.forEach(r=>counts.set(r,(counts.get(r)||0)+1));
    let type, key;
    if(n===1){type=1;key=[c[0]];}
    else if((n===2||n===3)&&counts.size===1){type=n;key=[c[n-1]];}
    else if(n===5){
      const flush=c.every(x=>suit(x)===suit(c[0]));
      const straight=counts.size===5&&rs[4]<12&&rs[4]-rs[0]===4;
      const group=k=>[...counts].find(([,v])=>v===k)?.[0];
      if(flush&&straight){type=14;key=[c[4]];}
      else if(group(4)!==undefined){type=13;key=[group(4)];}
      else if(group(3)!==undefined&&group(2)!==undefined){type=12;key=[group(3)];}
      else if(flush){type=11;key=[...rs].reverse().concat(suit(c[0]));}
      else if(straight){type=10;key=[c[4]];}
      else return null;
    } else return null;
    return {cards:c,size:n,type,key,name:names[type]};
  }
  function beats(a,b){return !!a&&(!b||(a.size===b.size&&(a.type>b.type||(a.type===b.type&&compare(a.key,b.key)>0))));}
  function combinations(cards,n){const out=[];function visit(start,p){if(p.length===n){out.push(p);return;}for(let i=start;i<=cards.length-(n-p.length);i++)visit(i+1,[...p,cards[i]]);}visit(0,[]);return out;}
  function moves(hand,table=null,opening=false){const out=[];for(const n of (table?[table.size]:[1,2,3,5]))for(const c of combinations(hand,n)){if(opening&&!c.includes(0))continue;const m=classify(c);if(beats(m,table))out.push(m);}return out;}
  function create(random=Math.random){const deck=Array.from({length:52},(_,i)=>i);for(let i=51;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}const hands=Array.from({length:4},(_,i)=>sort(deck.slice(i*13,i*13+13)));return {hands,turn:hands.findIndex(h=>h.includes(0)),table:null,last:null,passes:0,opening:true,winner:null,plays:0};}
  function play(state,cards){
    if(state.winner!==null)throw Error('De ronde is afgelopen.');
    const h=state.hands[state.turn],m=classify(cards);
    if(!cards.every(c=>h.includes(c))||!beats(m,state.table))throw Error('Speel een geldige, hogere combinatie met hetzelfde aantal kaarten.');
    if(state.opening&&!cards.includes(0))throw Error('De eerste zet moet ruiten 3 bevatten.');
    const actor=state.turn;state.hands[actor]=h.filter(c=>!cards.includes(c));state.table=m;state.last=actor;state.passes=0;state.opening=false;state.plays++;
    if(!state.hands[actor].length)state.winner=actor;else state.turn=(actor+1)%4;
    return m;
  }
  function pass(state){if(state.winner!==null||!state.table)throw Error('Je moet een combinatie spelen als je de tafel opent.');state.passes++;state.turn=(state.turn+1)%4;if(state.passes===3){state.turn=state.last;state.table=null;state.passes=0;} }
  // Hard AI minimizes remaining plays using only its own cards. It never reads another hand.
  function choose(hand,table,opening,level='normal',random=Math.random){
    const options=moves(hand,table,opening);if(!options.length)return null;
    const finish=options.find(m=>m.size===hand.length);if(finish)return finish;
    options.sort((a,b)=>a.size-b.size||a.type-b.type||compare(a.key,b.key));
    if(level==='easy')return options[Math.floor(random()*options.length)];
    let turns;
    if(level==='hard'){
      const all=moves(hand), masks=all.map(m=>m.cards.reduce((v,c)=>v|(1<<hand.indexOf(c)),0));
      const byBit=hand.map((_,i)=>masks.filter(m=>m&(1<<i))),memo=new Map([[0,0]]);
      turns=function solve(mask){if(memo.has(mask))return memo.get(mask);const bit=31-Math.clz32(mask&-mask);let best=13;for(const m of byBit[bit])if((m&mask)===m)best=Math.min(best,1+solve(mask^m));memo.set(mask,best);return best;};
    }
    function cost(m){const rest=hand.filter(c=>!m.cards.includes(c));let splits=0;for(const r of new Set(m.cards.map(rank))){const before=hand.filter(c=>rank(c)===r).length,after=rest.filter(c=>rank(c)===r).length;if(before>=2&&after>0)splits+=before;}
      const mask=rest.reduce((v,c)=>v|(1<<hand.indexOf(c)),0);
      return (turns?turns(mask)*100:rest.length*10)+splits*3+m.cards.reduce((v,c)=>v+(rank(c)>=11?7:rank(c)*.08),0)+m.type*.08;
    }
    return options.reduce((best,m)=>cost(m)<cost(best)?m:best);
  }
  const api={ranks,suits,rank,suit,sort,classify,compare,beats,combinations,moves,create,play,pass,choose};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BigTwo=api;
})(typeof globalThis!=='undefined'?globalThis:this);
