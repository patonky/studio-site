import * as THREE from 'three';
import {OrbitControls} from './OrbitControls.js';
const scene=new THREE.Scene();scene.background=new THREE.Color('#dce6ea');
const camera=new THREE.PerspectiveCamera(39,innerWidth/innerHeight,1,5000);
let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true});}catch(e){document.querySelector('#error').hidden=false;document.querySelector('#error').textContent='This model needs WebGL. Please open it in a browser with hardware acceleration enabled.';throw e;}
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor('#dce6ea');renderer.outputColorSpace=THREE.SRGBColorSpace;document.querySelector('#scene').appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.47;controls.minDistance=100;controls.maxDistance=1900;controls.target.set(0,0,0);
scene.add(new THREE.HemisphereLight('#ebf6ff','#77816d',2.3));const sun=new THREE.DirectionalLight('#fff5df',3);sun.position.set(-300,600,-350);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-700,right:700,top:700,bottom:-700,near:1,far:1600});sun.shadow.normalBias=.7;scene.add(sun);
const materials={};function mat(c){return materials[c]??=new THREE.MeshStandardMaterial({color:c,roughness:.86});}function box(x,z,w,d,h,c,y=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x-497,y+h/2,z-236);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
box(497,236,994,472,13,'#b3b9a4',-14);box(497,236,1006,484,5,'#738b87',-19);
function poly(points,c,y=.1){const s=new THREE.Shape();points.forEach(([x,z],i)=>i?s.lineTo(x-497,z-236):s.moveTo(x-497,z-236));s.closePath();const g=new THREE.ShapeGeometry(s);g.rotateX(Math.PI/2);const m=new THREE.Mesh(g,mat(c));m.position.y=y;m.material.side=THREE.DoubleSide;m.receiveShadow=true;scene.add(m);return m;}
// World coordinates correspond to pixels in the supplied satellite reference.
const northBank=[[0,124],[95,128],[220,139],[350,144],[460,149],[555,140],[650,139],[725,128],[790,108],[850,82],[918,43],[963,10],[994,0]];
const southBank=[[0,189],[95,203],[220,209],[350,211],[460,222],[555,227],[650,223],[725,204],[790,185],[850,154],[918,113],[963,93],[994,80]];
poly([...northBank,...southBank.slice().reverse()],'#408a99',-.3);
function curve(points,y){return new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0]-497,p[2]??y,p[1]-236)),false,'centripetal');}
function ribbon(points,width,c,y=.4){const cv=curve(points,y),ps=cv.getPoints(200),vs=[],ix=[];ps.forEach((p,i)=>{const t=cv.getTangent(i/200),n=new THREE.Vector3(-t.z,0,t.x).normalize().multiplyScalar(width/2);vs.push(p.x+n.x,p.y,p.z+n.z,p.x-n.x,p.y,p.z-n.z);if(i<200){let k=i*2;ix.push(k,k+2,k+1,k+1,k+2,k+3);}});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));g.setIndex(ix);g.computeVertexNormals();const m=new THREE.Mesh(g,mat(c));m.material.side=THREE.DoubleSide;m.receiveShadow=true;scene.add(m);return cv;}
ribbon(northBank,11,'#94aa79',.1);ribbon(southBank,15,'#8da478',.1);ribbon(northBank.map(p=>[p[0],p[1]-7]),2,'#d8d1b9',.6);ribbon(southBank.map(p=>[p[0],p[1]+7]),2,'#d8d1b9',.6);
poly([[0,211],[180,218],[218,240],[118,297],[0,337]],'#a9ac9b');poly([[0,30],[141,30],[139,93],[42,94]],'#7e9a6d');poly([[412,0],[507,0],[509,45],[410,44]],'#859c6c');poly([[765,274],[925,232],[932,370],[772,348]],'#8fa275');
// Decks, ramps and railway are separate 3D structures. Heights are interpreted, not surveyed.
function offsetPath(cv,offset,dy=0,n=160){return cv.getPoints(n).map((p,i)=>{const t=cv.getTangent(i/n),l=Math.hypot(t.x,t.z);return [p.x+497-t.z/l*offset,p.z+236+t.x/l*offset,p.y+dy];});}
function beam(a,b,width,height,color){const d=new THREE.Vector3().subVectors(b,a),m=new THREE.Mesh(new THREE.BoxGeometry(width,height,d.length()),mat(color));m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),d.normalize());m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
function structure(cv,w,{pillars=true,spacing=32,barriers=true,endX=Infinity,pierEndX=Infinity}={}){
 const pts=cv.getPoints(160);for(let i=0;i<pts.length-1;i++){const a=pts[i].clone(),b=pts[i+1].clone();if(a.x+497>endX)continue;a.y-=.85;b.y-=.85;beam(a,b,w+1,1.6,'#a7ada8');}
 if(barriers)for(const side of [-1,1]){const edge=offsetPath(cv,side*(w/2+.15),.6,100);for(let i=0;i<edge.length-1;i++){if(edge[i][0]>endX)continue;beam(new THREE.Vector3(edge[i][0]-497,edge[i][2],edge[i][1]-236),new THREE.Vector3(edge[i+1][0]-497,edge[i+1][2],edge[i+1][1]-236),.65,1.1,'#d0d1c5');}}
 if(pillars){const count=Math.floor(cv.getLength()/spacing);for(let i=1;i<count;i++){const pt=cv.getPointAt(i/count);if(pt.y<6)continue;const x=pt.x+497,z=pt.z+236;if(x>pierEndX)continue;if((Math.abs(x-657)<19&&z>340)||(z>367&&z<391&&x>610&&x<800))continue;box(x,z,4,5,pt.y-1.6,'#b2b5ad');box(x,z,Math.min(w,13),5,1.2,'#a3aaa4',pt.y-2.8);}}
}
function bank(cv,w,slope=12){const ps=cv.getPoints(100),v=[],idx=[];ps.forEach((p,i)=>{const t=cv.getTangent(i/100),l=Math.hypot(t.x,t.z),nx=-t.z/l,nz=t.x/l;for(const [off,h] of [[-w/2-slope,0],[-w/2,p.y-.4],[w/2,p.y-.4],[w/2+slope,0]])v.push(p.x+nx*off,h,p.z+nz*off);if(i<100)for(let k=0;k<3;k++){const q=i*4+k;idx.push(q,q+4,q+1,q+1,q+4,q+5);}});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,mat('#91a077'));m.material.side=THREE.DoubleSide;m.receiveShadow=true;scene.add(m);}
const roadCurves=[];function road(p,w=12,y=1,mark=true,deck=false){const center=curve(p,y);ribbon(offsetPath(center,0,-.14),w+(w<=7?1.2:3),'#c9cabd');const cv=ribbon(p,w,w<=7?'#929991':'#7d8887',y);cv.userData={width:w};if(mark){for(const off of w>17?[-w/4,w/4]:[0]){const pts=offsetPath(cv,off,.1,180).map(p=>new THREE.Vector3(p[0]-497,p[2],p[1]-236));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineDashedMaterial({color:'#e5e3ce',dashSize:4,gapSize:4}));line.computeLineDistances();scene.add(line);}if(w>17)ribbon(offsetPath(cv,0,.12),.45,'#dbcfa3');}if(deck)structure(cv,w);roadCurves.push(cv);return cv;}
road([[0,106],[143,106],[285,114],[422,119],[527,104],[629,92],[702,85],[768,25],[792,0]],18);
// Bow Trail / 9 Avenue rises over 14 Street; western approaches also bridge the railway corridor.
road([[0,455,15],[87,387,15],[180,353,4],[263,351,1.6],[385,375,1.6],[469,386,2],[570,385,5],[610,378,11],[652,367,14],[694,357,14],[739,361,10],[795,378,2],[994,389,1.5]],22,2,true,true);
road([[0,427,15],[80,353,14],[135,307,7],[201,260,2],[312,226,1.5],[408,234,1.5],[523,247,1.5],[624,259,1.5],[710,258,1.5],[797,220,1.5],[898,152,1.5],[994,106,1.5]],21,1.5,true,true);
road([[659,0,3],[658,91,10],[657,161,10],[656,233,10],[657,294,8],[657,327,5],[657,365,1.5],[657,410,1.5],[657,472,1.5]],19,10,true,true);
road([[0,25],[152,25],[383,24],[642,24]],7,.8,false);road([[0,59],[149,59],[379,57],[642,55]],6,.8,false);
for(const x of [37,149,382,491])road([[x,0],[x,103]],7,.8,false);
// Narrow ground-level bypass around the Greyhound frontage and the municipal compound.
// No diagonal through-road exists along the east side of the Greyhound building.
const greyhoundBypass=road([[392,233,1.5],[402,265,1.5],[419,307,1.5],[436,341,1.5],[453,360,1.5],[479,371,1.5],[537,371,1.5],[579,370,1.5],[590,360,1.5],[591,335,1.5],[592,318,1.5],[606,308,1.5]],6,1.5,false);
const bypassSouthJunction=road([[385,375,1.6],[420,375,1.6],[442,368,1.5],[453,360,1.5]],6,1.5,false);
// Short access at the north end of Greyhound, ending in its forecourt.
road([[402,265],[417,260],[433,257],[449,257]],4.5,1.5,false);
road([[11,385],[171,377],[317,387],[457,402]],4.5,1,false);
const eastStreet=road([[946,132],[945,220],[944,264],[942,350],[941,472]],14,1.5);
// Park-side service route remains on the river side of the descending railway.
const parkApproach=road([[748,286],[777,271],[808,248],[831,221],[851,195],[875,180],[900,177],[924,182],[945,199]],6.5,1.5,false);
// Short fork joins the riverside arterial; the through route continues around the museum.
const arterialJoin=roadJunctionEarly(roadCurves[2],873,169);
road([[831,221,1.5],[842,203,1.5],[856,184,1.5],arterialJoin],5.5,1.5,false);
function roadJunctionEarly(cv,x,z){const p=cv.getPoints(2000).reduce((a,p)=>Math.hypot(p.x+497-x,p.z+236-z)<Math.hypot(a.x+497-x,a.z+236-z)?p:a);return [p.x+497,p.z+236,p.y];}
// Connections into the 11 Street grid, clear of the armoury and its forecourt.
road([[930,282],[944,282],[994,282]],9,1.5);
road([[930,368],[942,368],[994,368]],10,1.5);
// Pavements along the armoury-facing street and signal-controlled cross streets.
ribbon([[932,280],[931,354],[931,377]],3,'#d7d6c7',1.55);
ribbon([[954,275],[954,377]],3,'#d7d6c7',1.55);
function crossing(x,z){for(let i=-5;i<=5;i+=2)box(x+i,z,1.1,4,.08,'#efeee1',1.56);}
crossing(944,280);crossing(943,365);crossing(945,202);
for(const [x,z] of [[934,276],[955,270],[934,359],[954,378],[935,191]]){box(x,z,.45,.45,6,'#697a7b');box(x,z,1.1,.7,2,'#39474b',5);box(x,z-.4,.4,.15,.4,'#bd6354',6.25);}
// Interchange paths reconstructed as connected routes, with endpoint levels inherited
// from the receiving road instead of independent floating ramp elevations.
function roadJunction(cv,x,z){return cv.getPoints(3000).reduce((best,p)=>Math.hypot(p.x+497-x,p.z+236-z)<Math.hypot(best.x+497-x,best.z+236-z)?p:best).clone();}
function node(p){return [p.x+497,p.z+236,p.y];}
const bridgeExit=node(roadJunction(roadCurves[3],657,277));
const bridgeWest=node(roadJunction(roadCurves[3],657,280));
const bridgeLower=node(roadJunction(roadCurves[3],657,342));
const bridgeMiddle=node(roadJunction(roadCurves[3],657,314));
const overpassMerge=node(roadJunction(roadCurves[1],652,367));
const downtownMerge=node(roadJunction(roadCurves[1],795,378));
const westJunction=[606,308,1.5];const downtownFork=[748,286,1.5];
const interchangeRoutes={
 // The northwest loop connects to 14 Street south of the riverside underpass.
 northwest:[bridgeWest,[636,279,7.1],[615,279,4.3],[603,287,2],[601,299,1.5],westJunction,[627,323,2],bridgeLower],
 // The southwest loop rises onto Bow Trail / 9 Avenue, not the lower 14 Street surface.
 southwest:[westJunction,[599,325,2],[601,343,4.5],[612,356,7.5],[635,365,11.5],overpassMerge],
 // This east-side exit descends from the bridge, curves around the compound, then heads downtown.
 bridgeToDowntown:[bridgeExit,[667,296,6],[681,305,3.5],[703,308,1.5],[726,299,1.5],downtownFork],
 // Lower east-side route passes below the elevated railway beside the skatepark.
 eastLower:[bridgeMiddle,[680,314,3],[707,312,1.5],[735,309,1.5],[750,315,1.5],[765,337,1.5],[779,359,1.5],downtownMerge],
 // A separate curved southeast loop feeds the southern road.
 southeast:[bridgeLower,[669,328,3],[688,325,2],[709,331,1.5],[735,347,1.5],[765,365,1.5],downtownMerge]
};
const interchangeCurves={};for(const [name,points] of Object.entries(interchangeRoutes)){const cv=road(points,name==='eastLower'?6:6.5,1.5,false);bank(cv,8,5);interchangeCurves[name]=cv;}
// Preserve the north-bank Memorial Drive ramp separately from the south-bank interchange.
const northRamp=road([[659,61,8],[673,35,4],[696,36,1],[708,52,1],[696,75,2],[658,92,10]],6.5,1.5,false);bank(northRamp,8,5);
road([[76,354,14],[76,342,10],[130,304,4],[218,254,1.5],[249,241,1.5],[242,225,1.5],[215,231,1.5],[187,254,1.5]],7,1,true,true);
for(const z of [418,461])road([[0,z],[994,z]],6,.6,false);
// Ground railway remains below the elevated LRT.
for(let z=427;z<442;z+=4)ribbon([[0,z],[994,z]],.65,'#5f6966',.5);
const railPath=[[0,448,24],[200,448,24],[380,448,24],[515,448,24],[591,444,24],[653,427,24],[701,393,23],[746,346,20],[790,305,14],[824,286,10],[860,276,6],[891,270,3.3],[920,265,1.7],[932,263,1.5],[945,261,1.5],[969,257,1.5],[994,253,1.5]];
const railCurve=ribbon(railPath,13,'#b2b5ad');structure(railCurve,13,{spacing:29,barriers:true,endX:925,pierEndX:795});
// The viaduct becomes a solid retained approach, then meets the street at grade.
const retained=railCurve.getPoints(1600).filter(p=>p.x+497>=793&&p.x+497<=928);
for(let i=0;i<retained.length-1;i++){const a=retained[i],b=retained[i+1],h=(a.y+b.y)/2-.55;const aa=a.clone(),bb=b.clone();aa.y=h/2;bb.y=h/2;beam(aa,bb,12.8,Math.max(.3,h),'#9ba49b');}
// Fencing follows the ramp; it stops before the road crossing.
for(const side of [-1,1]){const edge=offsetPath(railCurve,side*7.4,0,600).filter(p=>p[0]>792&&p[0]<927);for(let i=0;i<edge.length;i+=6){const p=edge[i];box(p[0],p[1],.18,.18,1.6,'#586c69',p[2]);}if(edge.length)ribbon(edge.map(p=>[p[0],p[1],p[2]+1.5]),.12,'#607570');}
// A flush street surface crosses the two tracks at 11 Street.
box(944,261,17,13,.2,'#969d96',1.4);
for(const z of [249,274]){box(934,z,.45,.45,5,'#c2cbc4');box(954,z,.45,.45,5,'#c2cbc4');}
for(const off of [-4.5,-2.8,2.8,4.5])ribbon(offsetPath(railCurve,off,.35),.32,'#616d70');
for(let i=0;i<railCurve.getLength();i+=3){const t=i/railCurve.getLength(),p=railCurve.getPointAt(t),tan=railCurve.getTangentAt(t),n=new THREE.Vector3(-tan.z,0,tan.x).normalize();beam(p.clone().addScaledVector(n,-5).add(new THREE.Vector3(0,.12,0)),p.clone().addScaledVector(n,5).add(new THREE.Vector3(0,.12,0)),.65,.24,'#8c918b');}
for(let i=18;i<railCurve.getLength();i+=40){const t=i/railCurve.getLength(),p=railCurve.getPointAt(t),tan=railCurve.getTangentAt(t),n=new THREE.Vector3(-tan.z,0,tan.x).normalize();const foot=p.clone().addScaledVector(n,6);beam(foot,foot.clone().add(new THREE.Vector3(0,10,0)),.5,.5,'#7b898a');beam(foot.clone().add(new THREE.Vector3(0,9,0)),p.clone().addScaledVector(n,-4).add(new THREE.Vector3(0,9,0)),.4,.4,'#7b898a');}
for(const off of [-3.6,3.6])ribbon(offsetPath(railCurve,off,8.8),.12,'#58686b');
// Sunalta station: raised island platform, glazed enclosure, ribbed barrel canopy, access towers.
box(357,448,142,20,2,'#c7c9c0',22);box(357,448,132,8,1,'#e1d9bd',24);
const glass=new THREE.MeshStandardMaterial({color:'#668d9b',transparent:true,opacity:.55,roughness:.3,metalness:.2});
for(const z of [439,457]){const wall=new THREE.Mesh(new THREE.BoxGeometry(137,7,.25),glass);wall.position.set(357-497,28,z-236);scene.add(wall);for(let x=291;x<426;x+=10)box(x,z,.5,.5,8,'#66787d',24);}
function stationArch(x){const pts=[];for(let i=0;i<=24;i++){const t=i/24*Math.PI;pts.push(new THREE.Vector3(x-497,31+Math.sin(t)*5,448-236+Math.cos(t)*10.7));}const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.3,5,false),mat('#afbbb9'));scene.add(m);}
const canopy=new THREE.Mesh(new THREE.CylinderGeometry(10.7,10.7,143,32,1,true,0,Math.PI),new THREE.MeshStandardMaterial({color:'#93a6aa',side:THREE.DoubleSide,roughness:.5}));canopy.rotation.z=Math.PI/2;canopy.rotation.x=Math.PI/2;canopy.position.set(357-497,31,448-236);scene.add(canopy);
// Custom half-ellipse canopy avoids cylinder orientation ambiguity.
scene.remove(canopy);const rv=[],ri=[];for(let k=0;k<2;k++)for(let i=0;i<=32;i++){const t=i/32*Math.PI;rv.push((k?429:285)-497,31+Math.sin(t)*5,448-236+Math.cos(t)*10.7);if(k===0&&i<32)ri.push(i,i+1,i+33,i+1,i+34,i+33);}const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(rv,3));rg.setIndex(ri);rg.computeVertexNormals();const rm=new THREE.Mesh(rg,canopy.material);rm.castShadow=true;scene.add(rm);for(let x=286;x<=429;x+=11)stationArch(x);
for(const x of [296,424]){box(x,470,10,12,31,'#c0c7c4');box(x,470,7,12.3,18,'#7f9ba3',10);box(x,462,7,18,1.5,'#c2c9c4',24);for(let i=0;i<21;i++)box(x-8,479-i*.8,5,1,1+i*1.1,'#b0b8b5');}
// Low-rise housing north of Memorial Drive.
let seed=172;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function house(x,z){const w=7+rand()*3,d=10+rand()*4,h=4+rand()*3;box(x,z,w+3,d+4,.3,'#c8c9b5');box(x,z,w,d,h,['#dbd7c8','#d6c8ac','#b9c6c4'][Math.floor(rand()*3)],.4);const roof=new THREE.Mesh(new THREE.CylinderGeometry(0,w*.75,d,4,1),mat(['#7f8582','#586d70','#8e8271'][Math.floor(rand()*3)]));roof.rotation.z=Math.PI/2;roof.rotation.y=Math.PI/4;roof.scale.set(.5,1,1);/* pitched roof */const g=new THREE.BufferGeometry();const a=w/2,b=d/2;g.setAttribute('position',new THREE.Float32BufferAttribute([-a,0,-b,a,0,-b,0,3,-b,-a,0,b,0,3,b,a,0,b,-a,0,-b,0,3,-b,-a,0,b,0,3,-b,0,3,b,-a,0,b,a,0,-b,a,0,b,0,3,-b,a,0,b,0,3,b,0,3,-b],3));g.computeVertexNormals();const r=new THREE.Mesh(g,mat('#78817e'));r.position.set(x-497,h+.4,z-236);r.castShadow=true;scene.add(r);}
for(let x=165;x<637;x+=14)for(const z of [10,43,78,93]){if((x>365&&x<399)||(x>405&&x<491&&z<50)||(x>386&&x<492&&z>65))continue;house(x+rand()*3,z);}
for(let x=3;x<29;x+=15)for(const z of [13,45,77])house(x,z);
// Parking fields, warehouses, bus depot and southern city blocks.
function parking(x,z,w,d){box(x,z,w,d,.4,'#aeb2ab');for(let zz=z-d/2+5;zz<z+d/2-3;zz+=12)for(let xx=x-w/2+4;xx<x+w/2-3;xx+=5){box(xx,zz,.35,6,.06,'#deded0',.45);if(rand()>.25)box(xx+2,zz,2.1,4.3,1.3,['#e7e5d9','#697d84','#aeb7b6','#7b7770','#a57964'][Math.floor(rand()*5)],.5);}}
parking(57,276,88,87);parking(242,294,115,73);parking(347,307,69,92);parking(840,243,70,28);
function building(x,z,w,d,h,c='#d7d0bd'){box(x,z,w,d,h,c);box(x,z,w+1,d+1,1,'#ecE8da',h);if(w>18){box(x+2,z,Math.min(w*.35,12),Math.min(d*.3,8),1.6,'#a6b0ac',h+1);for(let xx=x-w/2+4;xx<x+w/2-2;xx+=6)box(xx,z+d/2+.1,2,.15,2,'#7c9297',Math.max(2,h-4));}}
building(118,285,47,19,8);building(266,277,28,18,6);building(342,271,25,14,5);
const depotStart=scene.children.length;
const depot=building(462,307,22,86,19,'#9a7060');
for(const h of [5,10,15]){box(450.8,307,.3,85,1.5,'#655e58',h);box(473.2,307,.3,85,1.5,'#655e58',h);}
const depotOrigin=new THREE.Vector3(462-497,0,307-236);for(const part of scene.children.slice(depotStart)){part.position.sub(depotOrigin).applyAxisAngle(new THREE.Vector3(0,1,0),.39).add(depotOrigin);part.rotation.y+=.39;}building(546,331,50,26,9);building(550,352,45,15,7);building(537,298,29,21,6);building(570,300,22,21,7);
parking(569,275,38,20);parking(721,407,51,27);
for(let x=174;x<630;x+=42){building(x,450,23+rand()*13,18,8+rand()*17);}
for(const [x,z,w,d,h] of [[748,401,30,29,14],[784,405,28,20,10],[817,402,29,24,12],[877,402,70,22,9],[937,449,25,28,18],[792,449,30,22,13],[700,456,25,22,16],[144,469,25,10,10]])building(x,z,w,d,h);
// Towers across 11 Street: podiums, vertical glazing and repeating balcony slabs.
// Heights and facade proportions are visually estimated from the supplied views.
function tower(x,z,w,d,h,color,balconies=true){
 box(x,z,w+9,d+9,7,'#7f8a89');box(x,z,w+9.5,d+9.5,.7,'#c0c7c3',7);
 box(x,z,w,d,h,color,7);
 for(let y=10;y<h+5;y+=3){box(x,z,w+.8,d+.8,.4,balconies?'#b3c2c4':'#a29a92',y);if(balconies){box(x-w/2-.4,z,1.6,d+.6,.35,'#b7c5c6',y);box(x+w/2+.4,z,1.6,d+.6,.35,'#b7c5c6',y);}}
 for(let xx=x-w/2+2;xx<x+w/2;xx+=3.5){box(xx,z-d/2-.06,.45,.2,h-2,'#bfd0ce',8);box(xx,z+d/2+.06,.45,.2,h-2,'#bfd0ce',8);}
 box(x,z,w-4,d-4,4,'#a2b1b3',h+7);box(x,z,w-7,d-7,1,'#d0d7d1',h+11);
}
tower(974,309,20,22,76,'#506b7e');tower(974,344,22,22,96,'#4b6676');
// Pair of lighter faceted river-facing towers north of the at-grade rail crossing.
for(const z of [192,229]){box(975,z,31,30,6,'#9ca9a7');const m=new THREE.Mesh(new THREE.CylinderGeometry(12,12,53,8),mat('#849ca7'));m.position.set(975-497,32.5,z-236);m.castShadow=true;scene.add(m);for(let y=8;y<59;y+=3){const ring=new THREE.Mesh(new THREE.CylinderGeometry(12.6,12.6,.55,8),mat('#c0cdd0'));ring.position.set(975-497,y,z-236);scene.add(ring);}const cap=new THREE.Mesh(new THREE.CylinderGeometry(9,12,4,8),mat('#c8d1c8'));cap.position.set(975-497,61,z-236);scene.add(cap);}
// Cowboys Park paths and circular plaza.
ribbon([[772,330],[804,307],[850,284],[892,282]],3,'#d9d3bc',.6);ribbon([[806,355],[819,326],[821,283],[812,270]],3,'#d9d3bc',.6);ribbon([[849,352],[850,319],[883,298],[911,282]],3,'#d9d3bc',.6);
const circle=[];for(let i=0;i<=50;i++){const t=i/50*Math.PI*2;circle.push([817+Math.cos(t)*13,306+Math.sin(t)*13]);}ribbon(circle,3,'#d7d1bb',.8);
// Landmark masses interpreted from the user's oblique reference images.
// Armoury: long red masonry hall, pale pitched roof and projecting corner towers.
box(910,322,26,60,13,'#9c6254');box(910,322,28,62,1.2,'#bba38a',12.5);
const roofVertices=[[-15,0,-32],[15,0,-32],[0,9,-32],[-15,0,32],[0,9,32],[15,0,32],[-15,0,-32],[0,9,-32],[-15,0,32],[0,9,-32],[0,9,32],[-15,0,32],[15,0,-32],[15,0,32],[0,9,-32],[15,0,32],[0,9,32],[0,9,-32]].flat();const ag=new THREE.BufferGeometry();ag.setAttribute('position',new THREE.Float32BufferAttribute(roofVertices,3));ag.computeVertexNormals();const ar=new THREE.Mesh(ag,mat('#d7d5c9'));ar.position.set(910-497,14,322-236);ar.castShadow=true;scene.add(ar);
for(const x of [896,924])for(const z of [291,353]){box(x,z,5,6,18,'#a46b58');box(x,z,5.8,6.8,1,'#c0a889',18);for(const dx of [-2,2])box(x+dx,z,1.2,6.8,1.2,'#a46b58',19);}
for(let z=298;z<350;z+=7){box(895.8,z,.6,2.5,6,'#c3ad91',5);box(895.4,z,.3,1.5,4,'#526771',6);box(924.2,z,.6,2.5,6,'#c3ad91',5);}
box(894,322,5,8,14,'#ab705b');box(891.4,322,.3,4,6,'#46575a');
// Contemporary Calgary: faceted white planetarium dome and adjoining low concrete galleries.
building(889,230,37,25,8,'#c8c9bd');building(913,223,17,24,10,'#bfc2b8');building(875,247,25,13,6,'#d9d9cb');
const dome=new THREE.Mesh(new THREE.SphereGeometry(17,16,6,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:'#f0f0df',flatShading:true,roughness:.78}));dome.position.set(883-497,8,228-236);dome.scale.y=.78;dome.castShadow=true;scene.add(dome);
const drum=new THREE.Mesh(new THREE.CylinderGeometry(17,16,3,16),mat('#deded0'));drum.position.set(883-497,7,228-236);scene.add(drum);
box(868,234,7,8,15,'#c8cbbf');box(868,234,5,6,3,'#e4e5d6',15);
// Skatepark sits on the park side of the curve, separated from the retained rail corridor.
const skateOutline=[[773,327],[782,309],[799,304],[819,310],[828,330],[821,354],[787,358],[774,347]];
const bowls=[[786,342,7,7,'#a9bcc0'],[807,337,9,8,'#afbac0'],[798,319,5,4,'#c77876']];
const skateShape=new THREE.Shape();skateOutline.forEach(([x,z],i)=>i?skateShape.lineTo(x-497,z-236):skateShape.moveTo(x-497,z-236));skateShape.closePath();
for(const [x,z,rx,rz] of bowls){const hole=new THREE.Path();hole.absellipse(x-497,z-236,rx,rz,0,Math.PI*2,true);skateShape.holes.push(hole);}
const sg=new THREE.ShapeGeometry(skateShape);sg.rotateX(Math.PI/2);const skateMaterial=mat('#d5d2c4');skateMaterial.side=THREE.DoubleSide;const sm=new THREE.Mesh(sg,skateMaterial);sm.position.y=.9;sm.receiveShadow=true;scene.add(sm);
for(const [x,z,rx,rz,color] of bowls){const verts=[],ids=[],ring=[];for(let j=0;j<=6;j++){const r=j/6;for(let i=0;i<=48;i++){const t=i/48*Math.PI*2;verts.push(x-497+Math.cos(t)*rx*r,-.7+1.6*r*r,z-236+Math.sin(t)*rz*r);if(j<6&&i<48){const k=j*49+i;ids.push(k,k+1,k+49,k+1,k+50,k+49);}if(j===6)ring.push([x+Math.cos(t)*rx,z+Math.sin(t)*rz,.99]);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(ids);g.computeVertexNormals();const m=new THREE.Mesh(g,mat(color));m.material.side=THREE.DoubleSide;m.receiveShadow=true;scene.add(m);ribbon(ring,.6,'#eee8d8');}
// Curved concrete viewing wall around the circular plaza, outside the running surface.
const plazaWall=[];for(let i=0;i<=36;i++){const t=.3+Math.PI*1.4*i/36;plazaWall.push(new THREE.Vector3(817-497+Math.cos(t)*13,1.6,306-236+Math.sin(t)*13));}for(let i=0;i<plazaWall.length-1;i++)beam(plazaWall[i],plazaWall[i+1],1.1,3,'#b4bcb4');
for(let i=0;i<5;i++)box(814+i*1.4,348,1.4,8,.8+i*.35,'#e0dccd');
for(const [x,z] of [[787,329],[815,319]]){beam(new THREE.Vector3(x-497,1.8,z-236),new THREE.Vector3(x-491,1.8,z-236),.25,.25,'#697a79');box(x,z,.3,.3,1,'#697a79',.9);box(x+6,z,.3,.3,1,'#697a79',.9);}
// Walkways go around the skatepark and along the armoury forecourt, not across the tracks.
ribbon([[832,352],[845,328],[865,315],[889,321]],3,'#e0dbca',1.1);
ribbon([[836,298],[861,294],[884,290],[930,285]],3,'#e0dbca',1.1);
// Tall park light standards and smaller roadside lamps reinforce the relative heights.
for(const [x,z] of [[777,311],[824,346],[851,281],[872,358]]){box(x,z,.65,.65,26,'#929f9e');box(x,z,5,2,.8,'#d7ded9',26);}
for(let x=80;x<910;x+=65){const z=roadCurves[1].getPointAt(x/994);if(z.y<12)box(z.x+497,z.z+247,.45,.45,9,'#879390',z.y);}
// Instanced tree canopy keeps the model responsive.
const treePts=[];for(let i=0;i<700;i++){const x=rand()*990;const k=Math.min(northBank.length-2,Math.floor(x/994*(northBank.length-1))); /* use actual bank segments */let j=0;while(j<northBank.length-2&&northBank[j+1][0]<x)j++;const t=(x-northBank[j][0])/(northBank[j+1][0]-northBank[j][0]);const n=northBank[j][1]*(1-t)+northBank[j+1][1]*t;const s=southBank[j][1]*(1-t)+southBank[j+1][1]*t;const z=i%2?n-9-rand()*7:s+10+rand()*10;if(Math.abs(x-657)>15)treePts.push([x,z]);}
for(let i=0;i<190;i++){let x=rand()*640,z=rand()*99;if((x<140&&x>40&&z>30)||Math.abs(x-149)<8||Math.abs(x-382)<9||Math.abs(z-25)<5||Math.abs(z-57)<5)continue;treePts.push([x,z]);}
for(let i=0;i<100;i++){const x=780+rand()*143,z=272+rand()*83;if((x-817)**2+(z-306)**2>280&&!(x>890&&z>285)&&!(x<829&&z>296)&&!(z<305&&x<854))treePts.push([x,z]);}
for(let i=0;i<130;i++){let x=716+rand()*190,z=rand()*60;if(z<85-(x-716)*.42)treePts.push([x,z]);}
const loopSamples=Object.values(interchangeCurves).flatMap(cv=>cv.getPoints(130));for(let i=treePts.length-1;i>=0;i--){const [x,z]=treePts[i];if(loopSamples.some(p=>Math.hypot(p.x+497-x,p.z+236-z)<7))treePts.splice(i,1);}
const railSamples=railCurve.getPoints(350);for(let i=treePts.length-1;i>=0;i--){const [x,z]=treePts[i];if(x>710&&railSamples.some(p=>Math.hypot(p.x+497-x,p.z+236-z)<12))treePts.splice(i,1);}
const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.55,.8,4,5),mat('#7e7e65'),treePts.length),canopies=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),mat('#789a70'),treePts.length),dummy=new THREE.Object3D();treePts.forEach(([x,z],i)=>{const h=3+rand()*3;dummy.position.set(x-497,2,z-236);dummy.scale.set(1,1,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);dummy.position.y=h+2;dummy.scale.set(h*.65,h,h*.65);dummy.rotation.y=rand()*6;dummy.updateMatrix();canopies.setMatrixAt(i,dummy.matrix);canopies.setColorAt(i,new THREE.Color().setHSL(.24+rand()*.05,.19+rand()*.15,.35+rand()*.13));});trunks.castShadow=true;canopies.castShadow=true;scene.add(trunks,canopies);
const cars=[];for(const index of [0,1,2,3])for(let i=0;i<10;i++){const car=box(0,0,2.4,4.6,1.6,['#f1eee4','#507b87','#be8164','#d2bc80'][i%4]);cars.push({mesh:car,curve:roadCurves[index],t:rand(),speed:.006+rand()*.006});}
// Vehicles demonstrate the bridge-to-downtown connection across both joined curves.
const downtownDrive=curve([...interchangeRoutes.bridgeToDowntown,...offsetPath(parkApproach,0,0,90).slice(1)],1.5);
for(let i=0;i<6;i++){const car=box(0,0,1.8,3.8,1.25,['#eee9db','#638491','#bc8971'][i%3]);cars.push({mesh:car,curve:downtownDrive,t:i/6,speed:.018,laneOffset:0});}
// Batch opaque static meshes by material; moving vehicles and tree instances stay separate.
const moving=new Set(cars.map(c=>c.mesh));const batches=new Map();
for(const object of [...scene.children]){if(!object.isMesh||object.isInstancedMesh||moving.has(object)||object.material.transparent)continue;object.updateMatrixWorld(true);const g=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();g.applyMatrix4(object.matrixWorld);if(!g.attributes.normal)g.computeVertexNormals();const key=object.material.id;if(!batches.has(key))batches.set(key,{material:object.material,geometries:[]});batches.get(key).geometries.push(g);scene.remove(object);object.geometry.dispose();}
for(const {material,geometries} of batches.values()){let size=0;for(const g of geometries)size+=g.attributes.position.array.length;const positions=new Float32Array(size),normals=new Float32Array(size);let offset=0;for(const g of geometries){positions.set(g.attributes.position.array,offset);normals.set(g.attributes.normal.array,offset);offset+=g.attributes.position.array.length;g.dispose();}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setAttribute('normal',new THREE.BufferAttribute(normals,3));g.computeBoundingSphere();const m=new THREE.Mesh(g,material);m.castShadow=true;m.receiveShadow=true;scene.add(m);}
const labelData=[['Bow River',440,180,'river'],['14 Street bridge',657,160,''],['Memorial Drive',327,111,''],['Sunalta station',355,448,'',44],['Greyhound',462,307,'',27],['Cowboys Park',851,347,''],['Armoury',912,316,'',32],['Rail meets street',933,263,'',6],['Contemporary Calgary',883,227,'',34],['Broadview',275,36,'']];const labels=labelData.map(([txt,x,z,cls,height])=>{const el=document.createElement('div');el.className='maplabel '+cls;el.textContent=txt;document.querySelector('#labels').appendChild(el);return {el,pos:new THREE.Vector3(x-497,height??(cls?3:22),z-236)};});
let transition=null;function view(top=false){const narrow=innerWidth<700;transition={from:camera.position.clone(),to:top?new THREE.Vector3(0,narrow?1580:1040,.1):new THREE.Vector3(narrow?-800:-680,narrow?740:540,narrow?930:730),start:performance.now(),target:controls.target.clone(),targetTo:new THREE.Vector3()};document.querySelector('#top').classList.toggle('active',top);document.querySelector('#perspective').classList.toggle('active',!top);}camera.position.set(-680,540,730);if(innerWidth<700)camera.position.set(-800,740,930);controls.update();document.querySelector('#top').onclick=()=>view(true);document.querySelector('#perspective').onclick=()=>view();document.querySelector('#reset').onclick=()=>view();controls.addEventListener('start',()=>{transition=null;});let showLabels=true;document.querySelector('#labelToggle').onclick=e=>{showLabels=!showLabels;e.target.textContent=showLabels?'Labels on':'Labels off';e.target.setAttribute('aria-pressed',showLabels);document.querySelector('#labels').hidden=!showLabels;};const dialog=document.querySelector('#refDialog');document.querySelector('#reference').onclick=()=>dialog.showModal();document.querySelector('#closeRef').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});let last=performance.now();const proj=new THREE.Vector3();function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;if(transition){let t=Math.min((now-transition.start)/850,1);t=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.to,t);controls.target.lerpVectors(transition.target,transition.targetTo,t);if(t===1)transition=null;}controls.update();cars.forEach(c=>{c.t=(c.t+dt*c.speed)%1;const p=c.curve.getPointAt(c.t),v=c.curve.getTangentAt(c.t);c.mesh.position.copy(p);c.mesh.position.y+=1;c.mesh.position.x+=v.z*(c.laneOffset??3);c.mesh.position.z-=v.x*(c.laneOffset??3);c.mesh.rotation.y=Math.atan2(v.x,v.z);});if(showLabels)labels.forEach(l=>{proj.copy(l.pos).project(camera);l.el.style.left=(proj.x*.5+.5)*innerWidth+'px';l.el.style.top=(-proj.y*.5+.5)*innerHeight+'px';l.el.style.display=proj.z>1?'none':'';});renderer.render(scene,camera);}requestAnimationFrame(animate);

const focusViews={roads:{eye:[-65,200,370],target:[5,0,75]},interchange:{eye:[-45,185,-70],target:[187,3,89]},station:{eye:[-300,115,440],target:[-140,24,212]},park:{eye:[183,162,-95],target:[369,13,60]},rail:{eye:[230,90,-20],target:[383,6,38]}};
for(const button of document.querySelectorAll('[data-focus]'))button.onclick=()=>{const f=focusViews[button.dataset.focus];transition={from:camera.position.clone(),to:new THREE.Vector3(...f.eye),start:performance.now(),target:controls.target.clone(),targetTo:new THREE.Vector3(...f.target)};document.querySelector('#top').classList.remove('active');document.querySelector('#perspective').classList.add('active');};
