// ==========================================
// NOVA DAW / ALPHA 0.1
// Core Engine
// ==========================================

const $ = id => document.getElementById(id);

let audio = null;
let master = null;
let playing = false;
let timer = null;
let currentStep = 0;
let bpm = 140;
let history = [];
let future = [];

const colors = ["#b7f36b","#65d8db","#bd91f5","#f49a72","#e47ca6","#e9cb75"];

let tracks = [
  {name:"DRUMS",color:colors[0],clips:[],mute:false,solo:false},
  {name:"808 BASS",color:colors[1],clips:[],mute:false,solo:false},
  {name:"PIANO",color:colors[2],clips:[],mute:false,solo:false},
  {name:"SYNTH",color:colors[3],clips:[],mute:false,solo:false},
  {name:"VOCAL",color:colors[4],clips:[],mute:false,solo:false}
];

let channels = [
  {name:"KICK",type:"kick",steps:[0,4,8,12]},
  {name:"SNARE",type:"snare",steps:[4,12]},
  {name:"CLAP",type:"clap",steps:[4,12]},
  {name:"HIHAT",type:"hat",steps:[2,6,10,14]},
  {name:"OPEN HAT",type:"open",steps:[6,14]},
  {name:"808",type:"bass",steps:[0,8]}
];

let notes = [
  {x:0,y:7,w:2},
  {x:2,y:4,w:2},
  {x:4,y:2,w:2},
  {x:6,y:4,w:2},
  {x:8,y:7,w:2},
  {x:10,y:4,w:2},
  {x:12,y:2,w:2},
  {x:14,y:4,w:2}
];

// AUDIO ENGINE

function initAudio(){
  if(audio) {
    if(audio.state === "suspended") audio.resume();
    return;
  }

  audio = new (window.AudioContext || window.webkitAudioContext)();
  master = audio.createGain();
  master.gain.value = 0.7;
  master.connect(audio.destination);
}

function tone(freq,duration,type="sine",volume=.3){
  if(!audio) return;

  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq,audio.currentTime);

  gain.gain.setValueAtTime(volume,audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    .001,audio.currentTime+duration
  );

  osc.connect(gain);
  gain.connect(master);

  osc.start();
  osc.stop(audio.currentTime+duration);
}

function kick(){
  if(!audio) return;

  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type="sine";
  osc.frequency.setValueAtTime(150,audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(
    42,audio.currentTime+.13
  );

  gain.gain.setValueAtTime(.9,audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    .001,audio.currentTime+.35
  );

  osc.connect(gain);
  gain.connect(master);
  osc.start();
  osc.stop(audio.currentTime+.36);
}

function snare(){
  if(!audio) return;

  const buffer = audio.createBuffer(
    1,audio.sampleRate*.18,audio.sampleRate
  );
  const data=buffer.getChannelData(0);

  for(let i=0;i<data.length;i++){
    data[i]=(Math.random()*2-1)*(1-i/data.length);
  }

  const src=audio.createBufferSource();
  const gain=audio.createGain();

  src.buffer=buffer;
  gain.gain.value=.3;
  src.connect(gain);
  gain.connect(master);
  src.start();
}

function hat(open=false){
  if(!audio) return;

  const buffer=audio.createBuffer(
    1,audio.sampleRate*.12,audio.sampleRate
  );
  const data=buffer.getChannelData(0);

  for(let i=0;i<data.length;i++){
    data[i]=(Math.random()*2-1)*(1-i/data.length);
  }

  const src=audio.createBufferSource();
  const filter=audio.createBiquadFilter();
  const gain=audio.createGain();

  src.buffer=buffer;
  filter.type="highpass";
  filter.frequency.value=7500;
  gain.gain.value=.22;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start();

  if(open){
    gain.gain.setTargetAtTime(.001,audio.currentTime+.03,.09);
  }
}

function playChannel(channel){
  switch(channel.type){
    case "kick": kick(); break;
    case "snare": snare(); break;
    case "clap": snare(); break;
    case "hat": hat(); break;
    case "open": hat(true); break;
    case "bass": tone(55,.25,"sawtooth",.25); break;
  }
}

// TRANSPORT

function playStep(){
  const anySolo=channels.some(c=>c.solo);

  channels.forEach(channel=>{
    if(channel.mute) return;
    if(anySolo && !channel.solo) return;

    if(channel.steps.includes(currentStep)){
      playChannel(channel);
    }
  });

  currentStep=(currentStep+1)%16;
  renderSteps();
}

function start(){
  initAudio();
  if(playing) return;

  playing=true;
  currentStep=0;
  bpm=Number($("bpm").value)||140;

  $("play").textContent="Ⅱ";
  $("status").textContent="PLAYING";

  playStep();

  timer=setInterval(()=>{
    bpm=Number($("bpm").value)||140;
    clearInterval(timer);
    timer=setInterval(playStep,60000/bpm/4);
  },1000);
}

function stop(){
  playing=false;
  clearInterval(timer);
  currentStep=0;

  $("play").textContent="▶";
  $("status").textContent="READY";

  renderSteps();
}

$("play").onclick=()=>{
  playing?stop():start();
};

$("stop").onclick=stop;

$("record").onclick=()=>{
  $("status").textContent="RECORDING READY";
  alert("録音機能は次の開発段階で実装します。");
};

$("bpm").onchange=()=>{
  bpm=Number($("bpm").value)||140;
  if(playing){
    stop();
    start();
  }
};

// ARRANGEMENT

function renderRuler(){
  $("ruler").innerHTML=Array.from({length:16},(_,i)=>
    `<span>${i+1}</span>`
  ).join("");
}

function snapshot(){
  history.push(JSON.stringify({
    tracks,channels,notes
  }));

  if(history.length>50) history.shift();
  future=[];
}

function renderPlaylist(){
  $("playlist").innerHTML='<div class="playhead" id="playhead"></div>';

  tracks.forEach((track,index)=>{
    const row=document.createElement("div");
    row.className="track-row";

    const info=document.createElement("div");
    info.className="track-info";

    info.innerHTML=`
      <div class="track-color" style="background:${track.color}"></div>
      <div class="track-name">${track.name}</div>
      <div class="track-buttons">
        <button class="${track.mute?'active':''}" data-action="mute">M</button>
        <button class="${track.solo?'active':''}" data-action="solo">S</button>
      </div>
    `;

    info.querySelectorAll("button").forEach(btn=>{
      btn.onclick=()=>{
        const action=btn.dataset.action;
        track[action]=!track[action];
        renderPlaylist();
      };
    });

    const lane=document.createElement("div");
    lane.className="track-lane";

    track.clips.forEach((clip,ci)=>{
      const el=document.createElement("div");
      el.className="clip";
      el.style.left=(clip.start/16*100)+"%";
      el.style.width=(clip.length/16*100)+"%";
      el.style.background=track.color+"33";
      el.style.color=track.color;
      el.style.borderLeftColor=track.color;

      el.innerHTML=`
        ${clip.name}
        <small>${clip.length} BARS</small>
      `;

      el.draggable=true;

      el.ondragstart=e=>{
        e.dataTransfer.setData("clip",JSON.stringify({
          index,ci
        }));
      };

      lane.ondragover=e=>e.preventDefault();

      lane.ondrop=e=>{
        e.preventDefault();
        const data=JSON.parse(e.dataTransfer.getData("clip"));
        const rect=lane.getBoundingClientRect();
        const position=Math.max(0,Math.min(
          15,Math.floor((e.clientX-rect.left)/rect.width*16)
        ));

        snapshot();

        const moving=tracks[data.index].clips[data.ci];

        if(data.index===index){
          moving.start=position;
        }else{
          tracks[data.index].clips.splice(data.ci,1);
          track.clips.push({...moving,start:position});
        }

        renderPlaylist();
      };

      el.ondblclick=()=>{
        snapshot();
        track.clips.splice(ci,1);
        renderPlaylist();
      };

      lane.appendChild(el);
    });

    row.append(info,lane);
    $("playlist").appendChild(row);
  });
}

function addTrack(){
  snapshot();

  const name=prompt("Track name?","NEW TRACK");
  if(!name) return;

  tracks.push({
    name:name.toUpperCase(),
    color:colors[tracks.length%colors.length],
    clips:[],
    mute:false,
    solo:false
  });

  renderPlaylist();
}

function addClip(){
  snapshot();

  const index=tracks.findIndex(t=>!t.mute);
  if(index<0) return;

  const track=tracks[index];

  track.clips.push({
    name:"NEW PATTERN",
    start:track.clips.length*2%16,
    length:4
  });

  renderPlaylist();
}

$("addTrack").onclick=addTrack;
$("addClip").onclick=addClip;

// CHANNEL RACK

function renderSteps(){
  $("channelRack").innerHTML="";

  channels.forEach((channel,index)=>{
    const row=document.createElement("div");
    row.className="channel";

    const label=document.createElement("div");
    label.className="channel-label";
    label.textContent=channel.name;

    const steps=document.createElement("div");
    steps.className="steps";

    for(let i=0;i<16;i++){
      const btn=document.createElement("button");
      btn.className="step"+
        (channel.steps.includes(i)?" on":"");

      btn.title=`Step ${i+1}`;

      btn.onclick=()=>{
        snapshot();

        if(channel.steps.includes(i)){
          channel.steps=channel.steps.filter(x=>x!==i);
        }else{
          channel.steps.push(i);
        }

        renderSteps();
      };

      steps.appendChild(btn);
    }

    const controls=document.createElement("div");
    controls.className="channel-controls";

    const mute=document.createElement("button");
    mute.textContent=channel.mute?"UNMUTE":"MUTE";
    mute.onclick=()=>{
      channel.mute=!channel.mute;
      renderSteps();
    };

    controls.appendChild(mute);

    row.append(label,steps,controls);
    $("channelRack").appendChild(row);
  });
}

$("addChannel").onclick=()=>{
  snapshot();

  const name=prompt("Channel name?","NEW SOUND");
  if(!name) return;

  channels.push({
    name:name.toUpperCase(),
    type:"hat",
    steps:[]
  });

  renderSteps();
};

// PIANO ROLL

function renderPiano(){
  const roll=$("pianoRoll");
  roll.innerHTML='<div class="piano-grid"></div>';

  notes.forEach((note,index)=>{
    const el=document.createElement("div");
    el.className="piano-note";

    el.style.left=(note.x/16*100)+"%";
    el.style.width=(note.w/16*100)+"%";
    el.style.bottom=(note.y*14)+"px";

    el.draggable=true;

    el.ondragstart=e=>{
      e.dataTransfer.setData("note",index);
    };

    el.ondblclick=()=>{
      snapshot();
      notes.splice(index,1);
      renderPiano();
    };

    roll.appendChild(el);
  });

  roll.ondragover=e=>e.preventDefault();

  roll.ondrop=e=>{
    const index=Number(e.dataTransfer.getData("note"));
    if(!Number.isInteger(index)||!notes[index]) return;

    const rect=roll.getBoundingClientRect();

    snapshot();

    notes[index].x=Math.max(0,Math.min(
      15,Math.floor((e.clientX-rect.left)/rect.width*16)
    ));

    notes[index].y=Math.max(0,Math.min(
      14,Math.floor((rect.bottom-e.clientY)/14)
    ));

    renderPiano();
  };
}

$("addNote").onclick=()=>{
  snapshot();

  notes.push({
    x:Math.floor(Math.random()*12),
    y:7,
    w:2
  });

  renderPiano();
};

// TABS

document.querySelectorAll(".tab").forEach(tab=>{
  tab.onclick=()=>{
    document.querySelectorAll(".tab").forEach(t=>
      t.classList.remove("active")
    );

    tab.classList.add("active");

    ["rack","piano","mixer"].forEach(name=>{
      $(name+"Panel").classList.toggle(
        "hidden",name!==tab.dataset.tab
      );
    });

    if(tab.dataset.tab==="mixer") renderMixer();
  };
});

// MIXER

function renderMixer(){
  $("mixer").innerHTML="";

  ["DRUMS","BASS","MELODY","VOCAL","MASTER"].forEach(name=>{
    const el=document.createElement("div");
    el.className="mix-channel";

    el.innerHTML=`
      <span>${name}</span>
      <div class="meter-bar"></div>
      <span>0.0 dB</span>
    `;

    $("mixer").appendChild(el);
  });
}

// PROJECT SAVE / LOAD

function saveProject(){
  const project={
    version:"0.1",
    bpm:Number($("bpm").value),
    tracks,channels,notes
  };

  localStorage.setItem("nova-project",JSON.stringify(project));
  $("status").textContent="PROJECT SAVED";

  setTimeout(()=>$("status").textContent="READY",2000);
}

function loadProject(){
  const raw=localStorage.getItem("nova-project");

  if(!raw) return;

  try{
    const project=JSON.parse(raw);

    bpm=project.bpm||140;
    tracks=project.tracks||tracks;
    channels=project.channels||channels;
    notes=project.notes||notes;

    $("bpm").value=bpm;

    renderAll();
  }catch(e){
    console.error("Project load error",e);
  }
}

$("save").onclick=saveProject;

$("export").onclick=()=>{
  const project={
    version:"0.1",
    bpm:Number($("bpm").value),
    tracks,channels,notes
  };

  const blob=new Blob(
    [JSON.stringify(project,null,2)],
    {type:"application/json"}
  );

  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");

  a.href=url;
  a.download="nova-project.json";
  a.click();

  URL.revokeObjectURL(url);
};

// UNDO / REDO

$("undo").onclick=()=>{
  if(!history.length) return;

  future.push(JSON.stringify({tracks,channels,notes}));

  const state=JSON.parse(history.pop());

  tracks=state.tracks;
  channels=state.channels;
  notes=state.notes;

  renderAll();
};

$("redo").onclick=()=>{
  if(!future.length) return;

  history.push(JSON.stringify({tracks,channels,notes}));

  const state=JSON.parse(future.pop());

  tracks=state.tracks;
  channels=state.channels;
  notes=state.notes;

  renderAll();
};

// RENDER

function renderAll(){
  renderRuler();
  renderPlaylist();
  renderSteps();
  renderPiano();
  renderMixer();
}

renderAll();
loadProject();

console.log("NOVA DAW Alpha 0.1 initialized.");