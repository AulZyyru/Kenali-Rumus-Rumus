/* ANIMATED COLORFUL BACKGROUND */
(function(){
  const c=document.getElementById('bg-canvas'), x=c.getContext('2d')
  let W,H
  const COLS=['#f72585','#4361ee','#4cc9f0','#7ed957','#f9c74f','#f3722c','#7b2ff7','#55efc4','#ff9f43']
  const hex2rgba=(h,a)=>{const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return`rgba(${r},${g},${b},${a})`}
  function resize(){ W=c.width=innerWidth; H=c.height=innerHeight }
  addEventListener('resize',resize); resize()
  const blobs=Array.from({length:24},(_,i)=>({
    x:Math.random()*innerWidth, y:Math.random()*innerHeight,
    r:40+Math.random()*100,
    dx:(Math.random()-.5)*.35, dy:(Math.random()-.5)*.35,
    col:COLS[i%COLS.length], a:.05+Math.random()*.1,
    ph:Math.random()*Math.PI*2, ps:.008+Math.random()*.012
  }))
  function frame(){
    x.clearRect(0,0,W,H)
    x.fillStyle='#ffffff'; x.fillRect(0,0,W,H)
    blobs.forEach(b=>{
      b.ph+=b.ps; b.x+=b.dx; b.y+=b.dy
      if(b.x<-120)b.x=W+80; if(b.x>W+120)b.x=-80
      if(b.y<-120)b.y=H+80; if(b.y>H+120)b.y=-80
      const r=b.r+Math.sin(b.ph)*12
      const g=x.createRadialGradient(b.x,b.y,0,b.x,b.y,r)
      g.addColorStop(0,hex2rgba(b.col,b.a+0.05))
      g.addColorStop(1,hex2rgba(b.col,0))
      x.beginPath(); x.arc(b.x,b.y,r,0,Math.PI*2)
      x.fillStyle=g; x.fill()
    })
    requestAnimationFrame(frame)
  }
  frame()
})()

/* CUBE ENGINE */
const cv=document.getElementById('cv'), ctx=cv.getContext('2d')
const CW=cv.width, CH=cv.height

let S=3, filled=0, timer=null
let rotX=-0.5, rotY=0.6
let dragging=false, lastX=0, lastY=0
let velX=0, velY=0
let rotMode=false
const hintEl=document.getElementById('rot-hint')

function indexToPos(i,s){
  const layer=Math.floor(i/(s*s))
  const rem=i%(s*s)
  const row=Math.floor(rem/s)
  const col=rem%s
  return {col,row,layer}
}

function calcCS(s){
  const padX=40, padY=50
  const availW=CW-padX*2, availH=CH-padY*2
  const csW = availW / (s*2*0.82)
  const csH = availH / (s*2*0.42 + s*0.9)
  return Math.max(8, Math.min(csW, csH, 60))
}

function rotate3D(x,y,z,rx,ry){
  const cosY=Math.cos(ry), sinY=Math.sin(ry)
  const x1=x*cosY+z*sinY, z1=-x*sinY+z*cosY
  const cosX=Math.cos(rx), sinX=Math.sin(rx)
  const y2=y*cosX-z1*sinX, z2=y*sinX+z1*cosX
  return {x:x1, y:y2, z:z2}
}

function project(x,y,z,scale,ox,oy){
  return {x: ox+x*scale, y: oy-y*scale}
}

function calcScale3D(s){
  const pad=50
  const avail=Math.min(CW,CH)-pad*2
  return Math.max(6, Math.min(avail/(s*1.8), 55))
}

function gridToPx(gx,gy,gz,cs,ox,oy){
  const ex=cs*0.82, ey=cs*0.42, h=cs*0.9
  return {x: ox+(gx-gy)*ex, y: oy-gz*h+(gx+gy)*ey}
}

function getOrigin(s,cs){
  const ey=cs*0.42, h=cs*0.9
  const totalH=s*h+s*2*ey
  const ox=CW/2
  const oy=totalH-s*ey+20
  return {ox,oy}
}

const COLORS=[
  ['#ff6b6b','#ff3333','#cc0000'],['#ff9f43','#ff7f00','#cc5500'],
  ['#ffd93d','#ffbb00','#cc8800'],['#6bcb77','#33aa44','#1a7730'],
  ['#4dd5ff','#00bbee','#0088bb'],['#a78bfa','#7c3aed','#5b21b6'],
  ['#f472b6','#ec4899','#be185d'],['#34d399','#10b981','#047857'],
  ['#fb923c','#f97316','#c2410c'],['#38bdf8','#0ea5e9','#0369a1'],
  ['#f9a8d4','#f472b6','#db2777'],['#86efac','#4ade80','#16a34a'],
  ['#fde68a','#fbbf24','#d97706'],['#c4b5fd','#a78bfa','#7c3aed'],
  ['#67e8f9','#22d3ee','#0891b2'],['#fca5a5','#f87171','#dc2626'],
]

function getCubeColor(col,row,layer,s){
  const idx=(layer*s*s+row*s+col)%COLORS.length
  return COLORS[idx]
}

function drawFace(pts,color,stroke){
  ctx.beginPath()
  ctx.moveTo(pts[0].x,pts[0].y)
  for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y)
  ctx.closePath()
  ctx.fillStyle=color; ctx.fill()
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=0.6;ctx.stroke()}
}

function drawSmallCube(col,row,layer,cs,ox,oy,alpha,s){
  const[top,right,left]=getCubeColor(col,row,layer,s)
  const dark=getCubeColor(col,row,layer,s)[2]
  ctx.globalAlpha=alpha
  const a=gridToPx(col,   row,   layer,   cs,ox,oy)
  const b=gridToPx(col+1, row,   layer,   cs,ox,oy)
  const c=gridToPx(col+1, row+1, layer,   cs,ox,oy)
  const d=gridToPx(col,   row+1, layer,   cs,ox,oy)
  const e=gridToPx(col,   row,   layer+1, cs,ox,oy)
  const f=gridToPx(col+1, row,   layer+1, cs,ox,oy)
  const g=gridToPx(col+1, row+1, layer+1, cs,ox,oy)
  const h=gridToPx(col,   row+1, layer+1, cs,ox,oy)
  const stroke='rgba(0,0,0,0.18)'
  drawFace([a,b,c,d], dark, stroke)
  drawFace([b,c,g,f], dark, stroke)
  drawFace([d,c,g,h], dark, stroke)
  drawFace([a,d,h,e], left, stroke)
  drawFace([a,b,f,e], right, stroke)
  drawFace([e,f,g,h], top, stroke)
  ctx.globalAlpha=1
}

function drawGhost(s,cs,ox,oy){
  const A=gridToPx(0,0,0,cs,ox,oy),B=gridToPx(s,0,0,cs,ox,oy),C=gridToPx(s,s,0,cs,ox,oy),D=gridToPx(0,s,0,cs,ox,oy)
  const E=gridToPx(0,0,s,cs,ox,oy),F=gridToPx(s,0,s,cs,ox,oy),G=gridToPx(s,s,s,cs,ox,oy),H=gridToPx(0,s,s,cs,ox,oy)
  ctx.globalAlpha=.30
  ctx.beginPath();ctx.moveTo(E.x,E.y);ctx.lineTo(F.x,F.y);ctx.lineTo(G.x,G.y);ctx.lineTo(H.x,H.y);ctx.closePath();ctx.fillStyle='#ffe566';ctx.fill()
  ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.lineTo(F.x,F.y);ctx.lineTo(E.x,E.y);ctx.closePath();ctx.fillStyle='#4cc9f0';ctx.fill()
  ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(D.x,D.y);ctx.lineTo(H.x,H.y);ctx.lineTo(E.x,E.y);ctx.closePath();ctx.fillStyle='#f72585';ctx.fill()
  ctx.globalAlpha=1
  const ECOLS=['#ffe566','#f72585','#4cc9f0','#7ed957','#c77dff','#ff9f43']
  const edges=[[E,F],[F,G],[G,H],[H,E],[A,B],[B,C],[C,D],[D,A],[A,E],[B,F],[C,G],[D,H]]
  ctx.lineWidth=1.8;ctx.setLineDash([5,4])
  edges.forEach(([a,b],i)=>{ctx.strokeStyle=ECOLS[i%ECOLS.length];ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()})
  ctx.setLineDash([])
}

function drawSmallCube3D(col,row,layer,scale,ox,oy,s){
  const[topC,rightC,leftC]=getCubeColor(col,row,layer,s)
  const dark=getCubeColor(col,row,layer,s)[2]
  const half=s/2
  function pt(dx,dy,dz){
    const lx=(col+dx)-half, ly=(row+dy)-half, lz=(layer+dz)-half
    const r=rotate3D(lx,lz,ly,rotX,rotY)
    return project(r.x,r.y,r.z,scale,ox,oy)
  }
  const a=pt(0,0,0),b=pt(1,0,0),c=pt(1,1,0),d=pt(0,1,0)
  const e=pt(0,0,1),f=pt(1,0,1),g=pt(1,1,1),h=pt(0,1,1)
  const faces=[
    {pts:[e,f,g,h], base:topC},
    {pts:[a,b,c,d], base:dark},
    {pts:[a,b,f,e], base:rightC},
    {pts:[d,c,g,h], base:leftC},
    {pts:[b,c,g,f], base:leftC},
    {pts:[a,d,h,e], base:rightC},
  ]
  faces.sort((a,b)=>{
    const za=a.pts.reduce((s,p)=>s+p.z,0)/4
    const zb=b.pts.reduce((s,p)=>s+p.z,0)/4
    return zb-za
  })
  const stroke='rgba(0,0,0,0.15)'
  faces.forEach(face=>drawFace(face.pts, face.base, stroke))
}

function drawAll3D(){
  ctx.clearRect(0,0,CW,CH)
  const s=S
  const scale=calcScale3D(s)
  const ox=CW/2, oy=CH/2+10
  const cubes=[]
  for(let i=0;i<filled;i++){
    const{col,row,layer}=indexToPos(i,s)
    const half=s/2
    const lx=(col+0.5)-half, ly=(row+0.5)-half, lz=(layer+0.5)-half
    const r=rotate3D(lx,lz,ly,rotX,rotY)
    cubes.push({col,row,layer,z:r.z})
  }
  cubes.sort((a,b)=>b.z-a.z)
  cubes.forEach(({col,row,layer})=>drawSmallCube3D(col,row,layer,scale,ox,oy,s))
}

function drawAll(){
  if(rotMode){ drawAll3D(); return }
  ctx.clearRect(0,0,CW,CH)
  const s=S
  const cs=calcCS(s)
  const {ox,oy}=getOrigin(s,cs)
  drawGhost(s,cs,ox,oy)
  const order=[]
  for(let i=0;i<filled;i++) order.push(i)
  order.sort((a,b)=>{
    const pa=indexToPos(a,s), pb=indexToPos(b,s)
    if(pa.layer!==pb.layer) return pa.layer-pb.layer
    return (pa.row+pa.col)-(pb.row+pb.col)
  })
  for(const i of order){
    const {col,row,layer}=indexToPos(i,s)
    drawSmallCube(col,row,layer,cs,ox,oy,1,s)
  }
  const total=s*s*s
  if(filled<total){
    const {col,row,layer}=indexToPos(filled,s)
    drawSmallCube(col,row,layer,cs,ox,oy,0.25,s)
  }
}

function inertiaLoop(){
  if(!rotMode) return
  if(!dragging && (Math.abs(velX)>0.001||Math.abs(velY)>0.001)){
    rotY+=velX; rotX+=velY
    velX*=0.92; velY*=0.92
    drawAll()
  }
  requestAnimationFrame(inertiaLoop)
}

cv.addEventListener('mousedown',e=>{
  if(!rotMode) return
  dragging=true; velX=0; velY=0
  lastX=e.clientX; lastY=e.clientY
  cv.style.cursor='grabbing'
})
window.addEventListener('mousemove',e=>{
  if(!dragging||!rotMode) return
  const dx=e.clientX-lastX, dy=e.clientY-lastY
  velX=dx*0.012; velY=dy*0.012
  rotY+=velX; rotX+=velY
  lastX=e.clientX; lastY=e.clientY
  drawAll()
})
window.addEventListener('mouseup',()=>{
  dragging=false
  if(rotMode) cv.style.cursor='grab'
})

cv.addEventListener('touchstart',e=>{
  if(!rotMode) return
  e.preventDefault()
  const t=e.touches[0]
  dragging=true; velX=0; velY=0
  lastX=t.clientX; lastY=t.clientY
},{passive:false})
cv.addEventListener('touchmove',e=>{
  if(!dragging||!rotMode) return
  e.preventDefault()
  const t=e.touches[0]
  const dx=t.clientX-lastX, dy=t.clientY-lastY
  velX=dx*0.012; velY=dy*0.012
  rotY+=velX; rotX+=velY
  lastX=t.clientX; lastY=t.clientY
  drawAll()
},{passive:false})
cv.addEventListener('touchend',()=>{dragging=false})

function enableRotMode(){
  rotMode=true
  cv.style.cursor='grab'
  rotX=-0.5; rotY=0.6
  velX=0.008; velY=0
  drawAll()
  inertiaLoop()
  if(hintEl) hintEl.style.display='block'
}

function disableRotMode(){
  rotMode=false
  cv.style.cursor='default'
  velX=0; velY=0
  if(hintEl) hintEl.style.display='none'
}

function updateUI(){
  const s=S, tot=S*S*S
  const pct=Math.round(filled/tot*100)
  const layDisplay=filled===0?0:(filled===tot?s:Math.min(s,Math.floor((filled-1)/(s*s))+1))
  document.getElementById('st-n').textContent=filled
  document.getElementById('st-l').textContent=`${layDisplay} / ${s}`
  document.getElementById('st-p').textContent=pct+'%'
  document.getElementById('pg').style.width=pct+'%'
  document.getElementById('pg-pct').textContent=pct+'%'
  const msg=document.getElementById('pg-msg')
  if(filled===0){msg.textContent='Belum ada kubus kecil yang masuk';msg.className='pg-msg'}
  else if(filled===tot){msg.textContent='✅ Penuh!';msg.className='pg-msg done'}
  else{msg.textContent=`${filled} dari ${tot} kubus masuk (${pct}%)`;msg.className='pg-msg'}
  document.getElementById('btn-add').disabled=filled>=tot
  document.getElementById('btn-all').disabled=filled>=tot
}

function addOne(){
  const s=S, tot=s*s*s
  if(filled>=tot)return
  const prev=filled; filled++
  drawAll()
  const {col,row,layer}=indexToPos(prev,s)
  const log=document.getElementById('log')
  const d=document.createElement('div')
  d.className='log-item'
  d.innerHTML=`Kubus ke-<b>${filled}</b> → Lap ${layer+1}, baris ${row+1}, kolom ${col+1}`
  log.appendChild(d); log.scrollTop=log.scrollHeight
  updateUI()
  if(filled>=tot) setTimeout(showCel,350)
}

function fillAll(){
  const s=S, tot=s*s*s
  if(filled>=tot)return
  document.getElementById('btn-add').disabled=true
  document.getElementById('btn-all').disabled=true
  const delay=Math.max(8,Math.min(70,250/tot))
  function step(){
    if(filled>=tot){updateUI();showCel();return}
    addOne(); timer=setTimeout(step,delay)
  }
  step()
}

function reset(){
  clearTimeout(timer); filled=0
  disableRotMode()
  document.getElementById('log').innerHTML=''
  drawAll(); updateUI()
}

function changeSize(){
  clearTimeout(timer)
  let v=parseInt(document.getElementById('slider').value)||1
  if(v<1)v=1; if(v>100)v=100
  document.getElementById('slider').value=v
  S=v; filled=0
  disableRotMode()
  document.getElementById('log').innerHTML=''
  drawAll(); updateUI()
}

function showCel(){
  document.getElementById('cel').classList.add('show')
  spawnConfetti()
  enableRotMode()
}
function closeCel(){document.getElementById('cel').classList.remove('show')}
document.getElementById('cel').addEventListener('click',e=>{if(e.target===e.currentTarget)closeCel()})

function spawnConfetti(){
  const COLS=['#f9c74f','#f72585','#4cc9f0','#7ed957','#f3722c','#a29bfe','#55efc4','#ff8f3f']
  for(let i=0;i<75;i++){
    const p=document.createElement('div')
    p.className='prt'
    const sz=5+Math.random()*10
    p.style.cssText=`left:${Math.random()*100}vw;top:-20px;width:${sz}px;height:${sz}px;background:${COLS[~~(Math.random()*COLS.length)]};border-radius:${Math.random()>.5?'50%':'3px'};animation-duration:${1.5+Math.random()*2.5}s;animation-delay:${Math.random()*.9}s`
    document.body.appendChild(p)
    setTimeout(()=>p.remove(),5000)
  }
}

drawAll(); updateUI()
