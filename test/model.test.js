import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBowRiverModel} from '../src/index.js';
test('model builds without a browser and exports connected routes',()=>{
 const m=createBowRiverModel();assert.equal(m.group.isGroup,true);assert.equal(m.metadata.version,5);assert(!m.bounds.isEmpty());
 m.group.traverse(o=>{if(o.geometry)for(const v of o.geometry.attributes.position.array)assert(Number.isFinite(v));});
 const merge=m.routes.interchange.southwest.getPoint(1);assert(Math.min(...m.routes.roads[1].getPoints(3000).map(p=>p.distanceTo(merge)))<.01);
 const before=m.group.children.filter(o=>o.isMesh).map(o=>o.position.clone());m.update(1);
 assert(m.group.children.filter(o=>o.isMesh).some((o,i)=>!o.position.equals(before[i])));
 m.dispose();assert.equal(m.group.children.length,0);m.dispose();
});
test('unmerged static model works independently',()=>{const m=createBowRiverModel({traffic:false,mergeStatic:false});assert(m.group.children.length>1000);const a=m.group.children.map(o=>o.position.clone());m.update(1);assert(m.group.children.every((o,i)=>o.position.equals(a[i])));m.dispose();});
