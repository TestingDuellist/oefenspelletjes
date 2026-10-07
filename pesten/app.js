(function(){
  'use strict';
  const P=Pesten,$=id=>document.getElementById(id),names=['Jij','Mei','Kai','Bao'],avatars=['🙂','🦊','🐼','🐯'];
  let state=null,selected=null,timer=null,roundLevel='normal',byRank=false,sound=false,audio=null,recorded=false,history=[],announced=false;
  const profile={xp:0,wins:0,games:0,streak:0,best:0,expert:false,calls:0};
  try{const p=JSON.parse(localStorage.getItem('pestenProfileV1'));if(p&&typeof p==='object')for(const k of Object.keys(profile))if(typeof p[k]===typeof profile[k])profile[k]=typeof p[k]==='number'?(Number.isFinite(p[k])?Math.max(0,Math.floor(p[k])):0):p[k];}catch{}
  function save(){try{localStorage.setItem('pestenProfileV1',JSON.stringify(profile));}catch{}}
  function progress(){const level=Math.floor(profile.xp/200)+1;$('level').textContent=`Level ${level} · ${level>=10?'Pestmeester':level>=5?'Tactisch talent':level>=2?'Uitdager':'Rookie'}`;$('xp').textContent=`${profile.xp} XP`;$('xpBar').value=profile.xp%200;$('stats').textContent=`${profile.wins} overwinningen · ${profile.games} rondes`;$('badges').textContent=[profile.wins?'🏆 Eerste winst':'',profile.best>=3?'🔥 3 op rij':'',profile.expert?'👑 Expert':'',profile.calls>=10?'📣 Scherp':''].filter(Boolean).join('  ');}
  function card(c,interactive=false){
    const el=document.createElement(interactive?'button':'div'),joker=P.rank(c)===13,mine=state&&state.turn===0&&state.winner===null,legal=mine&&P.canPlay(P.context(state),c);
    el.className='card'+([0,2].includes(P.suit(c))?' red':'')+(joker?' joker':'')+(interactive?(c===selected?' selected':'')+(legal?' playable':' unplayable')+(state.drawn===c?' drawn':''):'');
    const value=joker?'JOKER':P.ranks[P.rank(c)]+P.suits[P.suit(c)],pip=joker?'🃏':P.suits[P.suit(c)];
    el.innerHTML=`<span class="corner">${value}</span><span class="pip">${pip}</span><span class="bottomCorner">${value}</span>`;
    if(interactive){el.type='button';el.dataset.card=c;el.setAttribute('aria-label',`${joker?'Joker':P.ranks[P.rank(c)]+' '+P.suitNames[P.suit(c)]} · ${P.effect(c)}${legal?' · speelbaar':''}`);el.setAttribute('aria-pressed',c===selected);el.disabled=!mine;el.onclick=()=>{selected=selected===c?null:c;renderHand();};if(state.drawn===c){const tag=document.createElement('span');tag.className='drawnLabel';tag.textContent='GEPAKT';el.append(tag);}}
    return el;
  }
  function message(s){$('status').textContent=s;}
  function log(s){history.unshift(s);history=history.slice(0,14);$('history').replaceChildren(...history.map(t=>{const li=document.createElement('li');li.textContent=t;return li;}));}
  function renderHand(){
    if(!state)return;
    const focus=document.activeElement?.dataset.card,hand=[...state.hands[0]].sort((a,b)=>byRank?P.rank(a)-P.rank(b)||a-b:(P.suit(a)??4)-(P.suit(b)??4)||a-b);
    $('hand').replaceChildren(...hand.map(c=>card(c,true)));if(focus!==undefined)[...$('hand').children].find(e=>e.dataset.card===focus)?.focus({preventScroll:true});
    const mine=state.turn===0&&state.winner===null,valid=mine&&selected!==null&&P.canPlay(P.context(state),selected);
    $('play').disabled=!valid;$('draw').disabled=!mine||state.drawn!==null;$('draw').textContent=state.pending?`Pak ${state.pending} kaarten`:'Pak kaart';$('pass').disabled=!mine||state.drawn===null;$('pass').hidden=state.drawn===null;$('hint').disabled=!mine;
    $('call').disabled=!mine||state.hands[0].length!==2;$('call').setAttribute('aria-pressed',announced);$('call').textContent=announced?'✓ Laatste kaart geroepen!':'📣 Laatste kaart!';
    $('selection').textContent=selected!==null?`${P.label(selected)} · ${P.effect(selected)}${valid?'':' · nu niet speelbaar'}`:'Kies één kaart';$('yourCount').textContent=`${hand.length} kaarten`;
  }
  function render(){
    if(!state)return;for(let i=1;i<4;i++){const el=$('opponent'+i);el.classList.toggle('active',state.turn===i&&state.winner===null);el.innerHTML=`<strong>${avatars[i]} ${names[i]}</strong><div class="backs" aria-hidden="true">▧▧▧▧▧</div><small>${state.hands[i].length} kaarten${state.hands[i].length===1?' · Laatste kaart!':''}</small>`;}
    const deck=document.createElement('button');deck.className='card deckCard';deck.textContent='✦';deck.setAttribute('aria-label','Pak kaart van de trekstapel');deck.disabled=state.turn!==0||state.winner!==null||state.drawn!==null;deck.onclick=draw;
    const meta=document.createElement('div');meta.className='tableMeta';meta.innerHTML=`<strong>${P.suits[state.activeSuit]} ${P.suitNames[state.activeSuit]}</strong><span>${state.direction===1?'→ Met de klok mee':'← Tegen de klok in'}</span><span>${state.pending?'⚡ '+state.pending+' strafkaarten':state.deck.length+' kaarten in stapel'}</span>`;
    $('tableCards').replaceChildren(deck,card(state.discard.at(-1)),meta);$('tableLabel').textContent='ACTIEVE KAARTSOORT';document.querySelector('.you').classList.toggle('active',state.turn===0&&state.winner===null);renderHand();
  }
  function tone(win=false){if(!sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.value=win?660:330;g.gain.setValueAtTime(.04,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);o.start();o.stop(audio.currentTime+.15);}catch{}}
  function celebrate(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(let i=0;i<36;i++){const p=document.createElement('i');p.className='confetti';p.style.left=Math.random()*100+'vw';p.style.background=['#ffcc91','#eeaa91','#86cddd'][i%3];p.style.animationDelay=Math.random()*.7+'s';document.body.append(p);setTimeout(()=>p.remove(),3200);}}
  function finish(){if(recorded)return;recorded=true;const win=state.winner===0;profile.games++;profile.xp+=win?125:25;if(win){profile.wins++;profile.streak++;profile.best=Math.max(profile.best,profile.streak);if(roundLevel==='hard')profile.expert=true;}else profile.streak=0;save();progress();message(`${names[state.winner]} wint de ronde!`);$('resultTag').textContent=win?'GOED GEPEST!':'VOLGENDE RONDE, NIEUWE KANS';$('resultTitle').textContent=win?'Lekker uitgespeeld! 🏆':`${names[state.winner]} wint`;$('resultText').textContent=win?'+125 XP · Je bent al je kaarten kwijt.':`+25 XP · Je had nog ${state.hands[0].length} kaarten. Pak de volgende ronde!`;$('result').showModal();if(win)celebrate();tone(win);}
  function logPlay(e,choice){const r=P.rank(e.card);let text=`${names[e.actor]} speelt ${P.label(e.card)} · ${e.effect}`;if(r===10||r===13)text+=` (${P.suitNames[choice]})`;log(text);if(e.forgot)log(`${names[e.actor]} vergat Laatste kaart! +${e.penaltyCards} kaarten.`);else if(state.hands[e.actor].length===1)log(`${names[e.actor]}: Laatste kaart!`);}
  function logDraw(e){log(`${names[e.actor]} pakt ${e.cards.length} kaart${e.cards.length===1?'':'en'}${e.penalty?' als straf':''}${e.cards.length<e.requested?' (stapel uitgeput)':''}.`);}
  function advance(){
    render();if(state.winner!==null){finish();return;}
    if(state.turn===0){message(state.pending?`Stapelen of ${state.pending} kaarten pakken.`:state.drawn!==null?'Speel alleen je gepakte kaart, of beëindig je beurt.':'Jouw beurt. Leg een passende kaart of pak er één.');return;}
    message(`${names[state.turn]} denkt na…`);
    timer=setTimeout(()=>{timer=null;const choice=P.choose(state.hands[state.turn],P.context(state),roundLevel);if(choice){const e=P.play(state,choice.card,choice);logPlay(e,choice.chosenSuit);tone();}else if(state.drawn!==null){log(`${names[state.turn]} beëindigt de beurt.`);P.pass(state);}else{logDraw(P.draw(state));}advance();},650);
  }
  function start(){clearTimeout(timer);if($('result').open)$('result').close();if($('suitDialog').open)$('suitDialog').close();roundLevel=$('difficulty').value;state=P.create();selected=null;announced=false;recorded=false;history=[];log(`Nieuwe ronde · ${$('difficulty').selectedOptions[0].textContent}`);advance();}
  function play(chosenSuit=null){if(!state||state.turn!==0||selected===null)return;try{const calling=announced&&state.hands[0].length===2,e=P.play(state,selected,{chosenSuit,announced});if(calling&&!e.forgot)profile.calls++;logPlay(e,chosenSuit);selected=null;announced=false;tone();advance();}catch(e){message(e.message);}}
  function draw(){if(!state||state.turn!==0)return;try{const e=P.draw(state);selected=!e.penalty&&e.cards.length&&P.canPlay(P.context(state),e.cards[0])?e.cards[0]:null;announced=false;logDraw(e);advance();}catch(e){message(e.message);}}
  $('start').onclick=()=>{if(state&&state.winner===null&&!confirm('Deze ronde stoppen en opnieuw delen?'))return;start();};$('again').onclick=start;$('closeResult').onclick=()=>$('result').close();
  $('play').onclick=()=>{if(selected!==null&&[10,13].includes(P.rank(selected)))$('suitDialog').showModal();else play();};
  document.querySelectorAll('[data-suit]').forEach(el=>el.onclick=()=>{$('suitDialog').close();play(Number(el.dataset.suit));});$('cancelSuit').onclick=()=>$('suitDialog').close();
  $('draw').onclick=draw;$('pass').onclick=()=>{if(!state||state.turn!==0)return;try{P.pass(state);selected=null;announced=false;log('Jij beëindigt de beurt.');advance();}catch(e){message(e.message);}};
  $('hint').onclick=()=>{if(!state||state.turn!==0)return;const choice=P.choose(state.hands[0],P.context(state),'hard');selected=choice?.card??null;renderHand();message(choice?`Tip: ${P.label(choice.card)}. ${state.hands[0].length===2?'Vergeet Laatste kaart! niet.':P.effect(choice.card)+'.'}`:state.drawn!==null?'Je gepakte kaart past niet. Klik op Beurt klaar.':state.pending?`Pak ${state.pending} strafkaarten.`:'Geen passende kaart. Pak een kaart.');};
  $('call').onclick=()=>{announced=!announced;renderHand();if(announced)message('Laatste kaart! Nu je kaart spelen.');};$('sort').onclick=()=>{byRank=!byRank;$('sort').textContent=byRank?'Sorteer op soort':'Sorteer op waarde';renderHand();};$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'Geluid aan':'Geluid uit';$('sound').setAttribute('aria-pressed',sound);tone();};$('rulesButton').onclick=()=>$('rules').showModal();$('closeRules').onclick=()=>$('rules').close();
  for(const id of ['play','draw','pass','hint','call'])$(id).disabled=true;$('pass').hidden=true;progress();
})();
