const STAGES = [
  'MARINE STAGE',
  'BEACH STAGE',
  'MOUNTAIN STAGE',
  'SONIC STAGE',
  'Spotify Stage',
  'PACIFIC STAGE'
];

const SCHEDULE = [
  [0,'11:05','11:45','HANA'],[0,'12:25','13:05','DESTIN CONRAD'],[0,'13:50','14:40','BE:FIRST'],[0,'15:25','16:25','mgk'],[0,'17:25','18:25','ALEX WARREN'],[0,'19:25','20:55','Ado'],
  [1,'12:30','13:00','紫 今'],[1,'13:30','14:00','のん & the tears of knight'],[1,'14:30','15:00','阿部真央'],[1,'15:30','16:10','Kvi Baba'],[1,'16:40','17:20','SIRUP'],[1,'17:50','18:30','PALOMA MORPHY'],[1,'19:00','19:50','LATIN MAFIA'],[1,'20:30','21:30','CARÍN LEÓN'],
  [2,'11:40','12:10','GOOD NEIGHBOURS'],[2,'12:40','13:30','VIAGRA BOYS'],[2,'14:00','14:50','JON SPENCER'],[2,'15:20','16:10','羊文学'],[2,'16:50','17:40','SUEDE'],[2,'18:30','19:40','サカナクション'],[2,'20:40','22:00','DAVID BYRNE'],
  [3,'10:30','10:50','WOOS'],[3,'11:20','11:50','THE GUEST LIST'],[3,'12:20','13:00','FATHER OF PEACE'],[3,'13:30','14:10','PRETTY BLEAK'],[3,'14:40','15:20','Saucy Dog'],[3,'15:50','16:35','ELMIENE'],[3,'17:10','18:00','Cornelius'],[3,'18:40','19:30','電気グルーヴ'],[3,'20:10','21:10','STEVE LACY'],
  [4,'10:15','10:35','Iga Nana'],[4,'10:55','11:20','Liza'],[4,'11:45','12:15','Litty'],[4,'12:45','13:15','さらさ (Band Set)'],[4,'13:45','14:15','OddRe:'],[4,'14:50','15:20','luv'],[4,'15:40','16:05','7'],[4,'16:05','16:30','MIKADO'],[4,'16:30','17:01','Kohjiya'],[4,'17:10','17:50','FULLHOUSE'],[4,'18:30','19:10','Dungeoneering'],[4,'19:55','20:35','パソコン音楽クラブ'],[4,'21:25','22:15','Verses GT'],
  [5,'10:35','10:55','KOMOREBI'],[5,'11:20','11:45','板歯目'],[5,'12:15','12:45','花冷え。'],[5,'13:15','13:45','Paledusk'],[5,'14:10','14:50','中島健人'],[5,'15:20','16:00','MIDNIGHT TIL MORNING'],[5,'16:30','17:10','HOMBE'],[5,'17:50','18:30','SB19'],[5,'19:10','19:55','GENERATIONS'],[5,'20:45','21:35','MAZZEL']
];

const ARTISTS = new Map(SCHEDULE.map((item) => {
  const [stageIndex,start,end,name] = item;
  const id = `${stageIndex}-${start}-${name}`;
  return [id,{id,name,stage:STAGES[stageIndex],start,end}];
}));

const POINTS = {1:10,2:11,3:12};
const PUBLIC_ORIGIN = 'https://c86tori.github.io';

function isAllowedOrigin(origin){
  return origin === PUBLIC_ORIGIN || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
}

function corsHeaders(request){
  const origin = request.headers.get('Origin');
  const headers = {
    'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
    'Access-Control-Max-Age':'86400',
    'Vary':'Origin'
  };
  if(isAllowedOrigin(origin))headers['Access-Control-Allow-Origin']=origin;
  return headers;
}

function json(request,data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{...corsHeaders(request),'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
  });
}

async function deviceHash(deviceId){
  const bytes = new TextEncoder().encode(`summersonic2026-ranking-v1:${deviceId}`);
  const digest = await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
}

function levelCounts(level,sign){
  return {
    normal:level===1?sign:0,
    gold:level===2?sign:0,
    rainbow:level===3?sign:0
  };
}

async function syncSelections(request,env){
  const origin=request.headers.get('Origin');
  if(!isAllowedOrigin(origin))return json(request,{error:'Origin not allowed.'},403);
  const length=Number(request.headers.get('Content-Length')||0);
  if(length>30000)return json(request,{error:'Request is too large.'},413);

  let body;
  try{body=await request.json();}catch(_error){return json(request,{error:'Invalid JSON.'},400);}
  if(typeof body.deviceId!=='string'||!/^[A-Za-z0-9-]{16,128}$/.test(body.deviceId)){
    return json(request,{error:'Invalid device identifier.'},400);
  }
  if(!Array.isArray(body.selections)||body.selections.length>ARTISTS.size){
    return json(request,{error:'Invalid selections.'},400);
  }

  const desired=new Map();
  for(const selection of body.selections){
    if(!selection||typeof selection.artistId!=='string'||!ARTISTS.has(selection.artistId)){
      return json(request,{error:'Unknown artist.'},400);
    }
    const level=Number(selection.level);
    if(!Number.isInteger(level)||level<1||level>3){
      return json(request,{error:'Invalid selection level.'},400);
    }
    desired.set(selection.artistId,level);
  }

  const hash=await deviceHash(body.deviceId);
  const existingResult=await env.DB.prepare('SELECT artist_id, level FROM votes WHERE device_hash = ?').bind(hash).all();
  const existing=new Map((existingResult.results||[]).map(row=>[row.artist_id,Number(row.level)]));
  const artistIds=new Set([...existing.keys(),...desired.keys()]);
  const now=new Date().toISOString();
  const statements=[];
  let changed=0;

  for(const artistId of artistIds){
    const oldLevel=existing.get(artistId)||0;
    const newLevel=desired.get(artistId)||0;
    if(oldLevel===newLevel)continue;
    changed+=1;

    if(newLevel){
      statements.push(env.DB.prepare(
        'INSERT INTO votes (device_hash, artist_id, level, updated_at) VALUES (?, ?, ?, ?) '+
        'ON CONFLICT(device_hash, artist_id) DO UPDATE SET level = excluded.level, updated_at = excluded.updated_at'
      ).bind(hash,artistId,newLevel,now));
    }else{
      statements.push(env.DB.prepare('DELETE FROM votes WHERE device_hash = ? AND artist_id = ?').bind(hash,artistId));
    }

    const oldCounts=levelCounts(oldLevel,-1);
    const newCounts=levelCounts(newLevel,1);
    const deltaPoints=(POINTS[newLevel]||0)-(POINTS[oldLevel]||0);
    const deltaVoters=(newLevel?1:0)-(oldLevel?1:0);
    const deltaNormal=oldCounts.normal+newCounts.normal;
    const deltaGold=oldCounts.gold+newCounts.gold;
    const deltaRainbow=oldCounts.rainbow+newCounts.rainbow;
    statements.push(env.DB.prepare(
      'INSERT INTO ranking_totals (artist_id, points10, voters, normal, gold, rainbow, updated_at) '+
      'VALUES (?, MAX(0, ?), MAX(0, ?), MAX(0, ?), MAX(0, ?), MAX(0, ?), ?) '+
      'ON CONFLICT(artist_id) DO UPDATE SET '+
      'points10 = MAX(0, ranking_totals.points10 + ?), '+
      'voters = MAX(0, ranking_totals.voters + ?), '+
      'normal = MAX(0, ranking_totals.normal + ?), '+
      'gold = MAX(0, ranking_totals.gold + ?), '+
      'rainbow = MAX(0, ranking_totals.rainbow + ?), '+
      'updated_at = excluded.updated_at'
    ).bind(
      artistId,deltaPoints,deltaVoters,deltaNormal,deltaGold,deltaRainbow,now,
      deltaPoints,deltaVoters,deltaNormal,deltaGold,deltaRainbow
    ));
  }

  if(statements.length)await env.DB.batch(statements);
  return json(request,{ok:true,changed,syncedAt:now});
}

async function ranking(request,env){
  const result=await env.DB.prepare(
    'SELECT artist_id, points10, voters, normal, gold, rainbow, updated_at '+
    'FROM ranking_totals WHERE voters > 0 ORDER BY points10 DESC, voters DESC, artist_id ASC'
  ).all();
  let updatedAt=null;
  const rankings=[];
  for(const row of result.results||[]){
    const artist=ARTISTS.get(row.artist_id);
    if(!artist)continue;
    if(!updatedAt||row.updated_at>updatedAt)updatedAt=row.updated_at;
    rankings.push({
      artistId:artist.id,
      name:artist.name,
      stage:artist.stage,
      start:artist.start,
      end:artist.end,
      score:Number(row.points10)/10,
      voters:Number(row.voters),
      normal:Number(row.normal),
      gold:Number(row.gold),
      rainbow:Number(row.rainbow)
    });
  }
  return json(request,{rankings,updatedAt,weights:{normal:1,gold:1.1,rainbow:1.2}});
}

export default {
  async fetch(request,env){
    if(request.method==='OPTIONS'){
      const origin=request.headers.get('Origin');
      return new Response(null,{status:isAllowedOrigin(origin)?204:403,headers:corsHeaders(request)});
    }
    const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
    try{
      if(request.method==='POST'&&path==='/api/sync')return await syncSelections(request,env);
      if(request.method==='GET'&&path==='/api/ranking')return await ranking(request,env);
      if(request.method==='GET'&&path==='/api/health')return json(request,{ok:true,artists:ARTISTS.size});
      return json(request,{error:'Not found.'},404);
    }catch(error){
      console.error(error);
      return json(request,{error:'Server error.'},500);
    }
  }
};
