(function(root) {
  'use strict';
  const ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const suits=['♦','♣','♥','♠'],suitNames=['ruiten','klaveren','harten','schoppen'];
  const rank=c=>c<52?Math.floor(c/4):13,suit=c=>c<52?c%4:null;
  const validCard=c=>Number.isInteger(c)&&c>=0&&c<54;
  const label=c=>rank(c)===13?'Joker':ranks[rank(c)]+suits[suit(c)];
  const effect=c=>({0:'Richting om',1:'+2 kaarten',6:'Nog een beurt',7:'Beurt overslaan',10:'Kies een soort',13:'+5 kaarten · kies een soort'}[rank(c)]||'Gewone kaart');
  function shuffle(cards,random=Math.random){const out=[...cards];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
  function create(random=Math.random){const deck=shuffle(Array.from({length:54},(_,i)=>i),random),hands=Array.from({length:4},()=>deck.splice(0,7));const at=deck.findIndex(c=>[2,3,4,5,8,9,11,12].includes(rank(c))),top=deck.splice(at,1)[0];return {hands,deck,discard:[top],activeSuit:suit(top),turn:0,direction:1,pending:0,penalty:null,drawn:null,winner:null,plays:0};}
  function context(s){return {top:s.discard.at(-1),activeSuit:s.activeSuit,pending:s.pending,penalty:s.penalty,drawn:s.drawn,nextCount:s.hands[(s.turn+s.direction+4)%4].length};}
  function canPlay(ctx,c){
    if(!validCard(c))return false;
    if(ctx.drawn!==null&&ctx.drawn!==c)return false;
    if(ctx.pending)return rank(c)===ctx.penalty;
    if(rank(c)===13)return true;
    if(rank(c)===10)return rank(ctx.top)!==10;
    return suit(c)===ctx.activeSuit||(rank(ctx.top)!==10&&rank(ctx.top)!==13&&rank(c)===rank(ctx.top));
  }
  function next(s,steps=1){s.turn=(s.turn+s.direction*steps+8)%4;s.drawn=null;}
  function ensureActive(s){if(s.winner!==null)throw Error('De ronde is afgelopen.');}
  function take(s,n,random=Math.random){const picked=[];for(let i=0;i<n;i++){if(!s.deck.length&&s.discard.length>1){const top=s.discard.pop();s.deck=shuffle(s.discard,random);s.discard=[top];}if(!s.deck.length)break;picked.push(s.deck.pop());}s.hands[s.turn].push(...picked);return picked;}
  function play(s,c,{chosenSuit=null,announced=false}={}){
    ensureActive(s);const actor=s.turn,h=s.hands[actor],r=rank(c);
    if(!h.includes(c)||!canPlay(context(s),c))throw Error('Deze kaart kun je nu niet spelen.');
    if((r===10||r===13)&&(!Number.isInteger(chosenSuit)||chosenSuit<0||chosenSuit>3))throw Error('Kies eerst een kaartsoort.');
    h.splice(h.indexOf(c),1);s.discard.push(c);s.activeSuit=(r===10||r===13)?chosenSuit:suit(c);s.drawn=null;s.plays++;
    const event={actor,card:c,effect:effect(c),forgot:false,penaltyCards:0};
    if(h.length===1&&!announced){const picked=take(s,2);event.forgot=true;event.penaltyCards=picked.length;}
    if(!h.length){s.winner=actor;return event;}
    if(r===1||r===13){s.pending+=r===1?2:5;s.penalty=r;next(s);}
    else if(r===0){s.direction*=-1;next(s);}
    else if(r===7)next(s,2);
    else if(r!==6)next(s);
    return event;
  }
  function draw(s,random=Math.random){ensureActive(s);if(s.drawn!==null)throw Error('Je hebt deze beurt al een kaart gepakt.');const actor=s.turn;
    if(s.pending){const requested=s.pending,cards=take(s,requested,random);s.pending=0;s.penalty=null;next(s);return {actor,cards,requested,penalty:true};}
    const cards=take(s,1,random);s.drawn=cards[0]??-1;return {actor,cards,requested:1,penalty:false};
  }
  function pass(s){ensureActive(s);if(s.drawn===null||s.pending)throw Error('Pak eerst een kaart.');next(s);}
  // The AI is passed only its hand, the public top card and public opponent counts.
  function choose(hand,ctx,level='normal',random=Math.random){
    const legal=hand.filter(c=>canPlay(ctx,c));if(!legal.length)return null;
    let card;
    if(level==='easy')card=legal[Math.floor(random()*legal.length)];
    else {
      const counts=suits.map((_,s)=>hand.filter(c=>suit(c)===s).length);
      function score(c){const r=rank(c),left=hand.length-1,threat=level==='hard'&&ctx.nextCount<=2;return (suit(c)===null?0:counts[suit(c)]*2)+(r===6?8:r===7?5:r===0?2:0)+(threat&&[1,7,13].includes(r)?22:0)-([10,13].includes(r)&&left>2&&!threat?10:0)+(ctx.pending?20:0);}
      card=legal.reduce((best,c)=>score(c)>score(best)?c:best);
    }
    const rest=hand.filter(c=>c!==card),counts=suits.map((_,s)=>rest.filter(c=>suit(c)===s).length);
    const chosenSuit=level==='easy'?Math.floor(random()*4):counts.indexOf(Math.max(...counts));
    return {card,chosenSuit,announced:true};
  }
  const api={ranks,suits,suitNames,rank,suit,label,effect,shuffle,create,context,canPlay,play,draw,pass,choose};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Pesten=api;
})(typeof globalThis!=='undefined'?globalThis:this);
