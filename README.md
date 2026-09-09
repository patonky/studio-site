# Bow River Three.js model

Portable source repository for **Urban Study 05**, including the latest loop/grade corrections. Based on source commit `7f486187fe62665e65bfeb4250c9d17bc9c85a8f` from the original viewer.

## Run the included example (no npm install required)

From this directory run `python3 -m http.server 8000` (Windows: `py -m http.server 8000`). Open **http://localhost:8000/examples/**. Do not double-click HTML files: ES modules require HTTP.

The vendored Three.js 0.180.0 files let this example run without a CDN. The original interface, camera controls and reference images are preserved at **http://localhost:8000/original-viewer/**.

## Import into an existing Three.js app

Use Three.js **0.180.0**, the version tested here. Other revisions are not verified. Use the host application's Three.js dependency; do not load the vendored copy alongside it.

Copy `src/` into your application and import the file, or install this repository locally:

```sh
npm install /absolute/path/to/bow-river-threejs
```

```js
import { createBowRiverModel, createBowRiverLighting } from 'bow-river-threejs';
// If you copied src/: import from './bow-river/index.js' instead.

const city = createBowRiverModel();
scene.add(city.group);
// Optional: use these lights if your scene does not already have suitable lighting.
const lights = createBowRiverLighting();
scene.add(lights);

// Inside YOUR existing render loop; deltaSeconds is elapsed time in seconds:
city.update(deltaSeconds);

// When removing the model:
city.dispose();
scene.remove(lights);
```

The module creates no canvas, camera, DOM labels, event listeners or animation loop. It returns a normal THREE.Group. Your app owns rendering, cameras, controls, lighting and scheduling. Do not call dispose every frame.

## API

`createBowRiverModel({ traffic: true, mergeStatic: true })` returns:

- `group`: parent THREE.Group, which you can move, rotate or scale.
- `update(deltaSeconds)`: advances illustrative traffic; call from the host render loop.
- `dispose()`: detaches the group and disposes its owned geometries/materials; safe to call twice.
- `bounds`: initial model-local THREE.Box3 before host transforms.
- `labels`: text, kind and local THREE.Vector3 positions. Render with your own label system.
- `routes`: road curves, rail curve, interchange curves, Greyhound bypass and downtown drive.
- `metadata`: study version and coordinate convention.

`cameraPresets` contains `eye` and `target` arrays for roads, interchange, station, park and rail views, in untransformed model coordinates.

`createBowRiverLighting()` returns an optional separate light group. If you transform the city, adjust the light positions and shadow-camera extent as appropriate. The host remains responsible for any light shadow resources it renders.

Set `mergeStatic:false` when you need individual meshes. Default batching combines opaque static meshes by material for performance, so merged objects do not preserve per-building identity. Roads and terrain are procedural geometry, not BIM/NURBS objects. Trees remain instanced. Traffic is illustrative rather than a traffic simulation.

## Coordinates and accuracy

Y is up; north is -Z and east is +X. The initial reference spans x=-497..497 and z=-236..236, with base trim and some structures extending slightly beyond it. Positions came from image tracing; **units are not calibrated metres**. All elevations, widths and building heights are estimates. The model is not surveyed, georeferenced or suitable for engineering verification.

To reposition the model, transform `city.group`. Labels and route samples remain in model-local coordinates; use `city.group.localToWorld(position.clone())` when needed. Recompute world bounds with `new THREE.Box3().setFromObject(city.group)` after transforms.

## Editing and repository contents

- `src/index.js`: independent procedural model and optional light helper.
- `examples/`: minimal import example with orbit controls and traffic pause.
- `original-viewer/`: complete source snapshot of the original published viewer, including references.
- `vendor/`: Three.js and OrbitControls for the no-install example.
- `test/`: headless construction, animation and cleanup tests.

The road control points and `interchangeRoutes` live in `src/index.js`. Edit those for geometry changes. The original viewer is a frozen reference snapshot; it does not automatically track edits to the reusable module.

Run `npm install` then `npm test` to use the normal package test command. Node 20+ recommended. This archive is repository-ready source, not an already-created GitHub repository. To publish it to your own repository, initialize Git here, commit, and push to your chosen remote. No credentials or Sites hosting configuration are included.

## Rights

No third-party ownership rights are granted by this export. Supplied screenshots retain their original providers' rights; they are not needed to render or import the procedural model. Review those rights before redistributing the reference images. Three.js and OrbitControls are MIT licensed; see THIRD_PARTY_NOTICES.md. The package is private by default and no public license has been selected for your project code.
