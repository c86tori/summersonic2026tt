(function(){
  'use strict';

  var CACHE_KEY='summersonic2026-ranking-result-v1';
  var PICK_PREFIX='summersonic2026-picks-v1:tokyo-0815:';
  var config=window.SUMMERSONIC_RANKING_CONFIG||{};
  var supabaseUrl=String(config.supabaseUrl||'').replace(/\/+$/,'');
  var publishableKey=String(config.publishableKey||'');
  var rankingEnabled=config.provider==='supabase'&&Boolean(supabaseUrl&&publishableKey);
  var list=document.getElementById('rankList');
  var status=document.getElementById('rankStatus');
  var updated=document.getElementById('rankUpdated');
  var refresh=document.getElementById('rankRefresh');
  var more=document.getElementById('rankMore');
  var currentData=null;
  var showAll=false;

  function jstDate(value){
    if(!value)return 'まだ集計結果はありません。';
    var date=new Date(value);
    if(Number.isNaN(date.getTime()))return '更新時刻不明';
    return new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date)+' 更新';
  }

  function ownLevel(artistId){
    var level=parseInt(localStorage.getItem(PICK_PREFIX+artistId),10);
    return level>=1&&level<=3?level:0;
  }

  function make(tag,className,text){
    var element=document.createElement(tag);
    if(className)element.className=className;
    if(text!==undefined)element.textContent=text;
    return element;
  }

  function render(data,fromCache){
    currentData=data;
    list.textContent='';
    var rankings=Array.isArray(data.rankings)?data.rankings:[];
    var visible=showAll?rankings:rankings.slice(0,10);
    if(!rankings.length){
      var empty=make('li','rank-empty','まだ選択結果がありません。\n最初の集計が届くと、ここにランキングが表示されます。');
      empty.style.whiteSpace='pre-line';
      list.appendChild(empty);
    }
    visible.forEach(function(item,index){
      var row=make('li','rank-item');
      var number=make('span','rank-number',String(index+1));
      var center=make('div','rank-center');
      var nameLine=make('div','rank-name-line');
      var pick=make('span','rank-my-pick level-'+ownLevel(item.artistId));
      pick.setAttribute('aria-hidden','true');
      nameLine.appendChild(pick);
      nameLine.appendChild(make('h2','rank-name',item.name));
      center.appendChild(nameLine);
      center.appendChild(make('p','rank-meta',item.stage+' · '+item.start+'–'+item.end));
      var breakdown=make('div','rank-breakdown');
      breakdown.appendChild(make('span','rank-chip','通常 '+item.normal));
      breakdown.appendChild(make('span','rank-chip','金 '+item.gold));
      breakdown.appendChild(make('span','rank-chip','虹 '+item.rainbow));
      center.appendChild(breakdown);
      var score=make('div','rank-score');
      score.appendChild(make('strong','',Number(item.score).toFixed(1)+' pt'));
      score.appendChild(make('span','',item.voters+'人'));
      row.appendChild(number);row.appendChild(center);row.appendChild(score);list.appendChild(row);
    });
    updated.textContent=(fromCache?'保存済み · ':'')+jstDate(data.updatedAt);
    more.hidden=rankings.length<=10;
    more.textContent=showAll?'上位10組に戻す':'11位以下を見る';
  }

  function readCache(){
    try{
      var cached=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');
      return cached&&Array.isArray(cached.rankings)?cached:null;
    }catch(_error){return null;}
  }

  function setStatus(message,error){
    status.textContent=message||'';
    status.classList.toggle('is-error',Boolean(error));
  }

  async function loadRanking(){
    var cached=readCache();
    if(cached&&!currentData)render(cached,true);
    if(!rankingEnabled){
      setStatus('ランキングAPIの接続設定がまだ完了していません。',true);
      refresh.disabled=true;
      return;
    }
    refresh.disabled=true;
    setStatus('最新のランキングを確認しています。',false);
    var controller=new AbortController();
    var timeout=window.setTimeout(function(){controller.abort();},8000);
    try{
      var response=await fetch(supabaseUrl+'/rest/v1/rpc/get_ranking',{
        method:'POST',
        headers:{'Content-Type':'application/json','apikey':publishableKey},
        body:'{}',
        cache:'no-store',
        signal:controller.signal
      });
      if(!response.ok)throw new Error('ranking request failed');
      var data=await response.json();
      if(!data||!Array.isArray(data.rankings))throw new Error('invalid ranking response');
      localStorage.setItem(CACHE_KEY,JSON.stringify(data));
      render(data,false);
      setStatus(data.rankings.length?'':'集計が始まると順位が表示されます。',false);
    }catch(_error){
      if(cached){render(cached,true);setStatus('通信できないため、最後に保存したランキングを表示しています。',false);}
      else setStatus('ランキングを取得できませんでした。電波の良い場所でもう一度お試しください。',true);
    }finally{
      window.clearTimeout(timeout);
      refresh.disabled=false;
    }
  }

  refresh.addEventListener('click',loadRanking);
  more.addEventListener('click',function(){showAll=!showAll;if(currentData)render(currentData,false);});
  loadRanking();
})();
