(function(){
  'use strict';

  var IMAGE_WIDTH = 1463;
  var IMAGE_HEIGHT = 2560;
  // 元画像の9:00と23:00の横線を実測した位置。
  var TIME_TOP_PX = 277.566;
  var TIME_BOTTOM_PX = 2521.223;
  var START_MINUTES = 9 * 60;
  var END_MINUTES = 23 * 60;
  var STAGE_LEFT_PX = [94,310,525,740,955,1170];
  var CELL_WIDTH_PX = 198;
  var BASE_WIDTH = 1000;
  var ZOOM_LEVELS = [.35,.5,.65,.8,.9,1,1.1,1.2,1.3];
  var STORAGE_PREFIX = 'summersonic2026-picks-v1:tokyo-0815:';
  var ZOOM_KEY = 'summersonic2026-zoom-v1';
  var DIM_KEY = 'summersonic2026-dim-v1';

  var stages = [
    {name:'MARINE STAGE',color:'rgba(18,146,224,.9)',hover:'rgba(8,125,204,.95)'},
    {name:'BEACH STAGE',color:'rgba(181,157,99,.9)',hover:'rgba(157,132,75,.95)'},
    {name:'MOUNTAIN STAGE',color:'rgba(0,151,74,.9)',hover:'rgba(0,126,62,.95)'},
    {name:'SONIC STAGE',color:'rgba(247,139,0,.92)',hover:'rgba(218,117,0,.96)'},
    {name:'Spotify Stage',color:'rgba(110,110,110,.9)',hover:'rgba(84,84,84,.95)'},
    {name:'PACIFIC STAGE',color:'rgba(232,137,166,.92)',hover:'rgba(207,109,142,.96)'}
  ];

  var schedule = [
    [0,'11:05','11:45','HANA'],[0,'12:25','13:05','DESTIN CONRAD'],[0,'13:50','14:40','BE:FIRST'],[0,'15:25','16:25','mgk'],[0,'17:25','18:25','ALEX WARREN'],[0,'19:25','20:55','Ado'],
    [1,'12:30','13:00','紫 今'],[1,'13:30','14:00','のん & the tears of knight'],[1,'14:30','15:00','阿部真央'],[1,'15:30','16:10','Kvi Baba'],[1,'16:40','17:20','SIRUP'],[1,'17:50','18:30','PALOMA MORPHY'],[1,'19:00','19:50','LATIN MAFIA'],[1,'20:30','21:30','CARÍN LEÓN'],
    [2,'11:40','12:10','GOOD NEIGHBOURS'],[2,'12:40','13:30','VIAGRA BOYS'],[2,'14:00','14:50','JON SPENCER'],[2,'15:20','16:10','羊文学'],[2,'16:50','17:40','SUEDE'],[2,'18:30','19:40','サカナクション'],[2,'20:40','22:00','DAVID BYRNE'],
    [3,'10:30','10:50','WOOS'],[3,'11:20','11:50','THE GUEST LIST'],[3,'12:20','13:00','FATHER OF PEACE'],[3,'13:30','14:10','PRETTY BLEAK'],[3,'14:40','15:20','Saucy Dog'],[3,'15:50','16:35','ELMIENE'],[3,'17:10','18:00','Cornelius'],[3,'18:40','19:30','電気グルーヴ'],[3,'20:10','21:10','STEVE LACY'],
    [4,'10:15','10:35','Iga Nana'],[4,'10:55','11:20','Liza'],[4,'11:45','12:15','Litty'],[4,'12:45','13:15','さらさ (Band Set)'],[4,'13:45','14:15','OddRe:'],[4,'14:50','15:20','luv'],[4,'15:40','16:05','7'],[4,'16:05','16:30','MIKADO'],[4,'16:30','17:01','Kohjiya'],[4,'17:10','17:50','FULLHOUSE'],[4,'18:30','19:10','Dungeoneering'],[4,'19:55','20:35','パソコン音楽クラブ'],[4,'21:25','22:15','Verses GT'],
    [5,'10:35','10:55','KOMOREBI'],[5,'11:20','11:45','板歯目'],[5,'12:15','12:45','花冷え。'],[5,'13:15','13:45','Paledusk'],[5,'14:10','14:50','中島健人'],[5,'15:20','16:00','MIDNIGHT TIL MORNING'],[5,'16:30','17:10','HOMBE'],[5,'17:50','18:30','SB19'],[5,'19:10','19:55','GENERATIONS'],[5,'20:45','21:35','MAZZEL']
  ];

  var viewer = document.getElementById('viewer');
  var sheet = document.getElementById('sheet');
  var pickLayer = sheet.querySelector('.pick-layer');
  var timeLayer = sheet.querySelector('.time-layer');
  var pickTimeLayer = sheet.querySelector('.pick-time-layer');
  var nowLine = sheet.querySelector('.now-line');
  var clockText = document.getElementById('clockText');
  var statusText = document.getElementById('statusText');
  var focusButtons = [].slice.call(document.querySelectorAll('.focus-toggle'));
  var startUtc = new Date(document.body.dataset.startUtc).getTime();
  var endUtc = new Date(document.body.dataset.endUtc).getTime();
  var clockTimer = 0;

  function pct(px,total){ return (px / total * 100).toFixed(4) + '%'; }
  function toMinutes(value){ var p=value.split(':'); return Number(p[0])*60+Number(p[1]); }
  function topForTime(value){ return pct(TIME_TOP_PX + (toMinutes(value)-START_MINUTES)/(END_MINUTES-START_MINUTES)*(TIME_BOTTOM_PX-TIME_TOP_PX),IMAGE_HEIGHT); }
  function heightForTimes(start,end){ return pct((toMinutes(end)-toMinutes(start))/(END_MINUTES-START_MINUTES)*(TIME_BOTTOM_PX-TIME_TOP_PX),IMAGE_HEIGHT); }
  function escapeHtml(value){ return value.replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function itemId(item){ return item[0]+'-'+item[1]+'-'+item[3]; }
  function getLevel(item){ var v=parseInt(localStorage.getItem(STORAGE_PREFIX+itemId(item)),10); return v>=1&&v<=3?v:0; }
  function setLevel(cell,label,level){
    cell.classList.toggle('is-picked',level>0);
    cell.classList.toggle('is-gold',level===2);
    cell.classList.toggle('is-rainbow',level===3);
    cell.setAttribute('aria-pressed',level>0?'true':'false');
    label.classList.toggle('is-visible',level>0);
  }

  var artistCells = [];
  schedule.forEach(function(item,index){
    var stage=stages[item[0]], start=item[1], end=item[2], artist=item[3];
    var cell=document.createElement('button');
    cell.type='button';cell.className='pick-cell';
    cell.style.left=pct(STAGE_LEFT_PX[item[0]],IMAGE_WIDTH);
    cell.style.top=topForTime(start);
    cell.style.width=pct(CELL_WIDTH_PX,IMAGE_WIDTH);
    cell.style.height=heightForTimes(start,end);
    cell.style.setProperty('--pick-color',stage.color);
    cell.style.setProperty('--pick-color-hover',stage.hover);
    cell.title=artist+' / '+stage.name+' / '+start+'-'+end;
    cell.setAttribute('aria-label',cell.title);
    cell.innerHTML='<span>'+escapeHtml(artist)+'</span>';
    var label=document.createElement('time');
    label.className='pick-time-label';
    label.style.left=cell.style.left;label.style.top=cell.style.top;
    label.textContent=start+'-'+end;
    pickLayer.appendChild(cell);pickTimeLayer.appendChild(label);artistCells.push(cell);
    setLevel(cell,label,getLevel(item));
    cell.addEventListener('click',function(){
      var level=(getLevel(item)+1)%4;
      if(level)localStorage.setItem(STORAGE_PREFIX+itemId(item),String(level));
      else localStorage.removeItem(STORAGE_PREFIX+itemId(item));
      setLevel(cell,label,level);
    });
  });

  for(var hour=9;hour<=23;hour++){
    var label=document.createElement('div');
    label.className='time-label';label.style.top=topForTime(String(hour).padStart(2,'0')+':00');label.textContent=hour;
    timeLayer.appendChild(label);
  }

  function jstParts(date){
    return new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).reduce(function(out,p){out[p.type]=p.value;return out;},{});
  }
  function displayNow(){
    var test=new URLSearchParams(location.search).get('test');
    if(!test)return {date:new Date(),test:false};
    var value=test.trim().replace(' ','T');
    if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))value+=':00+09:00';
    else if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value))value+='+09:00';
    var date=new Date(value);
    return Number.isNaN(date.getTime())?{date:new Date(),test:false,invalid:true}:{date:date,test:true};
  }
  function formatDate(date){var p=jstParts(date);return p.year+'-'+p.month+'-'+p.day+' '+p.hour+':'+p.minute;}
  function updateClock(){
    var shown=displayNow(),t=shown.date.getTime();
    clockText.textContent=(shown.test?'テスト時刻 ':'現在時刻 ')+formatDate(shown.date)+'（JST）';
    if(shown.invalid)statusText.textContent='テスト日時の形式を確認してください。';
    if(t<startUtc){viewer.classList.remove('active');statusText.textContent='8月15日（土）9:00から現在時刻の赤線を表示します。';return;}
    if(t>endUtc){viewer.classList.remove('active');statusText.textContent='8月15日（土）のタイムテーブルは終了しました。';return;}
    var progress=Math.max(0,Math.min(1,(t-startUtc)/(endUtc-startUtc)));
    sheet.style.setProperty('--line-progress',progress.toFixed(6));
    viewer.classList.add('active');
    statusText.textContent='赤線が現在時刻の位置です。';
  }
  function startClock(){updateClock();if(!clockTimer)clockTimer=window.setInterval(updateClock,30000);}
  function stopClock(){if(clockTimer){window.clearInterval(clockTimer);clockTimer=0;}}
  document.addEventListener('visibilitychange',function(){if(document.hidden)stopClock();else startClock();});
  if(document.hidden)updateClock();else startClock();

  var zoomIndex=Math.max(0,ZOOM_LEVELS.indexOf(Number(localStorage.getItem(ZOOM_KEY)||1)));
  if(ZOOM_LEVELS.indexOf(Number(localStorage.getItem(ZOOM_KEY)||1))<0)zoomIndex=5;
  var fitPending=false;
  function fitsArtistLabel(cell,size){
    var span=cell.firstElementChild;
    cell.style.fontSize=size.toFixed(3)+'px';
    return span.scrollHeight<=Math.max(1,cell.clientHeight-2) && span.scrollWidth<=Math.max(1,cell.clientWidth-2);
  }
  function fitArtistNames(){
    var zoom=parseFloat(getComputedStyle(sheet).getPropertyValue('--zscale'))||1;
    artistCells.forEach(function(cell){
      var maximum=22*zoom;
      var minimum=Math.max(2.5,6*zoom);
      if(fitsArtistLabel(cell,maximum))return;
      var low=minimum,high=maximum;
      fitsArtistLabel(cell,minimum);
      for(var i=0;i<8;i++){
        var middle=(low+high)/2;
        if(fitsArtistLabel(cell,middle))low=middle;else high=middle;
      }
      cell.style.fontSize=low.toFixed(3)+'px';
    });
  }
  function scheduleArtistFit(){
    if(fitPending)return;
    fitPending=true;
    requestAnimationFrame(function(){fitPending=false;fitArtistNames();});
  }
  function applyZoom(next,preserve){
    var oldW=sheet.offsetWidth||BASE_WIDTH,oldH=sheet.offsetHeight||BASE_WIDTH*IMAGE_HEIGHT/IMAGE_WIDTH;
    var cx=viewer.scrollLeft+viewer.clientWidth/2,cy=viewer.scrollTop+viewer.clientHeight/2;
    zoomIndex=Math.max(0,Math.min(ZOOM_LEVELS.length-1,next));
    var zoom=ZOOM_LEVELS[zoomIndex];
    sheet.style.width=(BASE_WIDTH*zoom)+'px';sheet.style.setProperty('--zscale',zoom);
    sheet.style.setProperty('--now-label-scale',zoom<=.9005?zoom:1);
    document.getElementById('zoomLabel').textContent=Math.round(zoom*100)+'%';
    document.getElementById('zoomIn').disabled=zoomIndex===ZOOM_LEVELS.length-1;
    document.getElementById('zoomOut').disabled=zoomIndex===0;
    localStorage.setItem(ZOOM_KEY,String(zoom));
    requestAnimationFrame(function(){
      fitArtistNames();
      if(preserve){viewer.scrollLeft=cx/oldW*sheet.offsetWidth-viewer.clientWidth/2;viewer.scrollTop=cy/oldH*sheet.offsetHeight-viewer.clientHeight/2;}
    });
  }
  document.getElementById('zoomIn').addEventListener('click',function(){applyZoom(zoomIndex+1,true);});
  document.getElementById('zoomOut').addEventListener('click',function(){applyZoom(zoomIndex-1,true);});
  applyZoom(zoomIndex,false);
  window.addEventListener('resize',scheduleArtistFit);

  function applyDim(on){sheet.classList.toggle('dim-on',on);focusButtons.forEach(function(button){button.setAttribute('aria-pressed',on?'true':'false');});}
  applyDim(localStorage.getItem(DIM_KEY)==='1');
  focusButtons.forEach(function(button){button.addEventListener('click',function(){var on=!sheet.classList.contains('dim-on');localStorage.setItem(DIM_KEY,on?'1':'0');applyDim(on);});});

  function createFloatingAxis(){
    var axis=document.createElement('div'),win=document.createElement('div'),track=document.createElement('div');
    axis.className='floating-time-axis';axis.setAttribute('aria-hidden','true');win.className='floating-time-window';track.className='floating-time-track';
    [].slice.call(timeLayer.children).forEach(function(source){var copy=document.createElement('div');copy.className='floating-time-label';copy.style.top=source.style.top;copy.textContent=source.textContent;track.appendChild(copy);});
    win.appendChild(track);axis.appendChild(win);viewer.insertBefore(axis,sheet);
    var shown=false,pending=false;
    function syncSize(){
      var font=parseFloat(getComputedStyle(timeLayer.firstElementChild).fontSize)||9;
      axis.style.setProperty('--floating-axis-viewer-height',viewer.clientHeight+'px');
      axis.style.setProperty('--floating-axis-sheet-height',sheet.offsetHeight+'px');
      axis.style.setProperty('--floating-axis-font-size',font+'px');
      axis.style.setProperty('--floating-axis-width',Math.ceil(font*2.05)+'px');
      sync();
    }
    function sync(){
      track.style.transform='translate3d(0,'+(-viewer.scrollTop-5)+'px,0)';
      var should=viewer.scrollLeft>=Math.ceil(sheet.offsetWidth*(STAGE_LEFT_PX[0]/IMAGE_WIDTH));
      if(should!==shown){shown=should;axis.classList.toggle('is-visible',shown);}
    }
    function scheduleSync(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;sync();});}
    viewer.addEventListener('scroll',scheduleSync,{passive:true});window.addEventListener('resize',syncSize);
    if('ResizeObserver' in window)new ResizeObserver(syncSize).observe(sheet);
    syncSize();
  }
  createFloatingAxis();

  document.getElementById('jumpNow').addEventListener('click',function(){
    updateClock();
    if(viewer.classList.contains('active'))viewer.scrollTo({top:Math.max(0,nowLine.offsetTop-viewer.clientHeight*.35),behavior:'smooth'});
    else viewer.scrollTo({top:0,behavior:'smooth'});
  });

  var infoSheet=document.getElementById('infoSheet'),backdrop=document.getElementById('infoBackdrop'),infoOpen=document.getElementById('infoOpen');
  function setInfo(open){infoSheet.classList.toggle('open',open);backdrop.classList.toggle('open',open);infoSheet.setAttribute('aria-hidden',open?'false':'true');infoOpen.setAttribute('aria-expanded',open?'true':'false');}
  infoOpen.addEventListener('click',function(){setInfo(true);});document.getElementById('infoClose').addEventListener('click',function(){setInfo(false);});backdrop.addEventListener('click',function(){setInfo(false);});
})();
