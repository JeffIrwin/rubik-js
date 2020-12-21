
import * as rc from 'rubikConstants';
import math from 'math';

// VTK
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';
import vtkAnnotatedCubeActor from 'vtk.js/Sources/Rendering/Core/AnnotatedCubeActor';

// async-mutex
import {Mutex, Semaphore, withTimeout} from 'async-mutex';

const NFRAMES = 6;  // Number of frames for a single (quarter or half) turn animation

const RADQUART = Math.PI / 2.0;  // quarter turn (radians), equivalent to 90 degrees
//const DEGQUART = 90.0;

// Tile width
const D = 1.0;

// Face center coordinates, for rotations
const XC = 0.0;  //X0 + 0.5 * D * rc.NTILESLINE;
const YC = 0.0;  //Y0 + 0.5 * D * rc.NTILESLINE;
const ZC = 0.0;  //Z0 + 0.5 * D * rc.NTILESLINE;

// Unique tile coordinates
const X0 = XC - 0.5 * D * rc.NTILESLINE;
const X1 = X0 + 1 * D;
const X2 = X0 + 2 * D;
const X3 = X0 + 3 * D;
const Y0 = YC - 0.5 * D * rc.NTILESLINE;
const Y1 = Y0 + 1 * D;
const Y2 = Y0 + 2 * D;
const Y3 = Y0 + 3 * D;
const Z0 = ZC - 0.5 * D * rc.NTILESLINE;
const Z1 = Z0 + 1 * D;
const Z2 = Z0 + 2 * D;
const Z3 = Z0 + 3 * D;

// Coordinates of every tile.  For any given tile, the coordinates are for its
// corner which is closest to the origin.
const X =
[
	             X0, X1, X2,
	             X0, X1, X2,
	             X0, X1, X2,

	X0, X0, X0,  X0, X1, X2,  X3, X3, X3,  X2, X1, X0,
	X0, X0, X0,  X0, X1, X2,  X3, X3, X3,  X2, X1, X0,
	X0, X0, X0,  X0, X1, X2,  X3, X3, X3,  X2, X1, X0,

	             X0, X1, X2,
	             X0, X1, X2,
	             X0, X1, X2
];
const Y =
[
	             Y3, Y3, Y3,
	             Y3, Y3, Y3,
	             Y3, Y3, Y3,

	Y2, Y2, Y2,  Y2, Y2, Y2,  Y2, Y2, Y2,  Y2, Y2, Y2,
	Y1, Y1, Y1,  Y1, Y1, Y1,  Y1, Y1, Y1,  Y1, Y1, Y1,
	Y0, Y0, Y0,  Y0, Y0, Y0,  Y0, Y0, Y0,  Y0, Y0, Y0,

	             Y0, Y0, Y0,
	             Y0, Y0, Y0,
	             Y0, Y0, Y0
];
const Z =
[
	             Z0, Z0, Z0,
	             Z1, Z1, Z1,
	             Z2, Z2, Z2,

	Z0, Z1, Z2,  Z3, Z3, Z3,  Z2, Z1, Z0,  Z0, Z0, Z0,
	Z0, Z1, Z2,  Z3, Z3, Z3,  Z2, Z1, Z0,  Z0, Z0, Z0,
	Z0, Z1, Z2,  Z3, Z3, Z3,  Z2, Z1, Z0,  Z0, Z0, Z0,

	             Z2, Z2, Z2,
	             Z1, Z1, Z1,
	             Z0, Z0, Z0
];

// Primary (U) and secondary (V) directions of each tile plane (0, 1, 2 for x, y, z)
const U =
[
	          0, 0, 0,
	          0, 0, 0,
	          0, 0, 0,

	1, 1, 1,  0, 0, 0,  1, 1, 1,  0, 0, 0,
	1, 1, 1,  0, 0, 0,  1, 1, 1,  0, 0, 0,
	1, 1, 1,  0, 0, 0,  1, 1, 1,  0, 0, 0,

	          0, 0, 0,
	          0, 0, 0,
	          0, 0, 0
];
const V =
[
	          2, 2, 2,
	          2, 2, 2,
	          2, 2, 2,

	2, 2, 2,  1, 1, 1,  2, 2, 2,  1, 1, 1,
	2, 2, 2,  1, 1, 1,  2, 2, 2,  1, 1, 1,
	2, 2, 2,  1, 1, 1,  2, 2, 2,  1, 1, 1,

	          2, 2, 2,
	          2, 2, 2,
	          2, 2, 2
];

const renderWindow = vtkRenderWindow.newInstance();

// Only perform one turn operation at a time, or else you might pop the cube!
const turnMutex = new Mutex();

let planeSources = [];
let actors = [];

function setColors(state)
{
	// Assign colors to each tile, either when the cube is first rendered, or after every move.

	//console.log("starting setColors()");

	for (let i = 0; i < actors.length; i++)
	{
		let c = rc.CMAP[state[rc.FLAT_MAP[i]]];
		let r = 0.0;
		let g = 0.0;
		let b = 0.0;
		if (c == "w")
		{
			r = 1.0;
			g = 1.0;
			b = 1.0;
		}
		else if (c == "r")
		{
			r = 1.0;
		}
		else if (c == "b")
		{
			b = 1.0;
		}
		else if (c == "o")
		{
			r = 1.0;
			g = 0.5;
		}
		else if (c == "g")
		{
			g = 1.0;
		}
		else if (c == "y")
		{
			r = 1.0;
			g = 1.0;
		}

		actors[i].getProperty().setColor(r, g, b);
	}

	// Refresh the render window (otherwise it won't happen until user clicks
	// in the render)
	renderWindow.render();
}

function sleep(ms)
{
	// https://stackoverflow.com/a/39914235/4347028
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function turnTiles(minBound, maxBound, u, stheta, ctheta)
{
	const release = await turnMutex.acquire();
	try
	{
		let itiles = [];
		for (let i = 0; i < planeSources.length; i++)
		{
			let p = planeSources[i].getCenter();
			//console.log("p = " + p);

			if (minBound[0] < p[0] && p[0] < maxBound[0] &&
			    minBound[1] < p[1] && p[1] < maxBound[1] &&
			    minBound[2] < p[2] && p[2] < maxBound[2])
			{
				itiles.push(i);
			}
		}
		//console.log("turnTiles, itiles = " + itiles);

		// Start timer for benchmarking.
		let t0 = new Date;

		for (let itime = 1; itime <= NFRAMES; itime++)
		{
			//console.log("itime = " + itime);
			for (let i = 0; i < itiles.length; i++)
			{
				// This computes rotations for some points twice.  It would be
				// faster to use tile connectivity to only rotate shared points
				// once.  At best it's a factor of 2 speedup, since a vtk plane is
				// defined by only 3 points, we never repeatedly rotate a shared
				// point 4 times (and only a small number of corner points 3 times).

				let itile = itiles[i];

				//if      (axis ==  1)
				//	actors[itile].rotateX( dtheta);
				//else if (axis == -1)
				//	actors[itile].rotateX(-dtheta);
				//else if (axis ==  2)
				//	actors[itile].rotateY( dtheta);
				//else if (axis == -2)
				//	actors[itile].rotateY(-dtheta);
				//else if (axis ==  3)
				//	actors[itile].rotateZ( dtheta);
				//else // -3
				//	actors[itile].rotateZ(-dtheta);

				planeSources[itile].setOrigin(
					//math.rotate(planeSources[itile].getOrigin(), r0, u, stheta, ctheta));
					math.rotate(planeSources[itile].getOrigin(), u, stheta, ctheta));
				planeSources[itile].setPoint1(
					math.rotate(planeSources[itile].getPoint1(), u, stheta, ctheta));
				planeSources[itile].setPoint2(
					math.rotate(planeSources[itile].getPoint2(), u, stheta, ctheta));

			}
			renderWindow.render();

			// For some reason that I don't fully understand, the window won't
			// render until the whole time loop is finished without this.
			await sleep(0);
		}

		let dt = new Date - t0;
		//console.log("dt = " + dt + " ms");
		//console.log("FPS = " + (1000.0 * NFRAMES / dt));

	}
	finally
	{
		release();
	}
}

function turnR(angle)
{
	// TODO:  bundle these (and bounds) into rotation and bounds structs
	//let r0 = [XC, YC, ZC];
	let u = [1.0, 0.0, 0.0];
	let dtheta = angle / NFRAMES;  // incremental turn per frame (radians)
	//let axis = 1;

	let stheta = Math.sin(dtheta);
	let ctheta = Math.cos(dtheta);

	turnTiles([X2, -Infinity, -Infinity], [Infinity, Infinity, Infinity], u, stheta, ctheta);
}

function turnU(angle)
{
	//let r0 = [XC, YC, ZC];
	let u = [0.0, 1.0, 0.0];
	let dtheta = angle / NFRAMES;  // incremental turn per frame
	//let axis = 2;

	let stheta = Math.sin(dtheta);
	let ctheta = Math.cos(dtheta);

	turnTiles([-Infinity, Y2, -Infinity], [Infinity, Infinity, Infinity], u, stheta, ctheta);
}

function turnL(angle)
{
	let u = [-1.0, 0.0, 0.0];
	let dtheta = angle / NFRAMES;  // incremental turn per frame
	let stheta = Math.sin(dtheta);
	let ctheta = Math.cos(dtheta);
	turnTiles([-Infinity, -Infinity, -Infinity], [X1, Infinity, Infinity], u, stheta, ctheta);
}

function turnD(angle)
{
	let u = [0.0, -1.0, 0.0];
	let dtheta = angle / NFRAMES;  // incremental turn per frame
	let stheta = Math.sin(dtheta);
	let ctheta = Math.cos(dtheta);
	turnTiles([-Infinity, -Infinity, -Infinity], [Infinity, Y1, Infinity], u, stheta, ctheta);
}

function turnF(angle)
{
	let u = [0.0, 0.0, 1.0];
	let dtheta = angle / NFRAMES;  // incremental turn per frame
	let stheta = Math.sin(dtheta);
	let ctheta = Math.cos(dtheta);
	turnTiles([-Infinity, -Infinity, Z2], [Infinity, Infinity, Infinity], u, stheta, ctheta);
}

function turnB(angle)
{
	let u = [0.0, 0.0, -1.0];
	let dtheta = angle / NFRAMES;  // incremental turn per frame
	let stheta = Math.sin(dtheta);
	let ctheta = Math.cos(dtheta);
	turnTiles([-Infinity, -Infinity, -Infinity], [Infinity, Infinity, Z1], u, stheta, ctheta);
}

function turnM(angle)
{
	let u = [-1.0, 0.0, 0.0];
	let dtheta = angle / NFRAMES;  // incremental turn per frame
	let stheta = Math.sin(dtheta);
	let ctheta = Math.cos(dtheta);
	turnTiles([X1, -Infinity, -Infinity], [X2, Infinity, Infinity], u, stheta, ctheta);
}

function turnE(angle)
{
	let u = [0.0, -1.0, 0.0];
	let dtheta = angle / NFRAMES;  // incremental turn per frame
	let stheta = Math.sin(dtheta);
	let ctheta = Math.cos(dtheta);
	turnTiles([-Infinity, Y1, -Infinity], [Infinity, Y2, Infinity], u, stheta, ctheta);
}

function turnS(angle)
{
	let u = [0.0, 0.0, 1.0];
	let dtheta = angle / NFRAMES;  // incremental turn per frame
	let stheta = Math.sin(dtheta);
	let ctheta = Math.cos(dtheta);
	turnTiles([-Infinity, -Infinity, Z1], [Infinity, Infinity, Z2], u, stheta, ctheta);
}

function turnR2(angle)
{
	let u = [1.0, 0.0, 0.0];
	let dtheta = angle / NFRAMES;  // incremental turn per frame (radians)
	let stheta = Math.sin(dtheta);
	let ctheta = Math.cos(dtheta);
	turnTiles([X1, -Infinity, -Infinity], [Infinity, Infinity, Infinity], u, stheta, ctheta);
}

function turnU2(angle)
{
	let u = [0.0, 1.0, 0.0];
	let dtheta = angle / NFRAMES;  // incremental turn per frame
	let stheta = Math.sin(dtheta);
	let ctheta = Math.cos(dtheta);
	turnTiles([-Infinity, Y1, -Infinity], [Infinity, Infinity, Infinity], u, stheta, ctheta);
}

function turnL2(angle)
{
	let u = [-1.0, 0.0, 0.0];
	let dtheta = angle / NFRAMES;  // incremental turn per frame
	let stheta = Math.sin(dtheta);
	let ctheta = Math.cos(dtheta);
	turnTiles([-Infinity, -Infinity, -Infinity], [X2, Infinity, Infinity], u, stheta, ctheta);
}

function turnD2(angle)
{
	let u = [0.0, -1.0, 0.0];
	let dtheta = angle / NFRAMES;  // incremental turn per frame
	let stheta = Math.sin(dtheta);
	let ctheta = Math.cos(dtheta);
	turnTiles([-Infinity, -Infinity, -Infinity], [Infinity, Y2, Infinity], u, stheta, ctheta);
}

function turnF2(angle)
{
	let u = [0.0, 0.0, 1.0];
	let dtheta = angle / NFRAMES;  // incremental turn per frame
	let stheta = Math.sin(dtheta);
	let ctheta = Math.cos(dtheta);
	turnTiles([-Infinity, -Infinity, Z1], [Infinity, Infinity, Infinity], u, stheta, ctheta);
}

function turnB2(angle)
{
	let u = [0.0, 0.0, -1.0];
	let dtheta = angle / NFRAMES;  // incremental turn per frame
	let stheta = Math.sin(dtheta);
	let ctheta = Math.cos(dtheta);
	turnTiles([-Infinity, -Infinity, -Infinity], [Infinity, Infinity, Z2], u, stheta, ctheta);
}

function turnX(angle)
{
	let u = [1.0, 0.0, 0.0];
	let dtheta = angle / NFRAMES;  // incremental turn per frame (radians)
	let stheta = Math.sin(dtheta);
	let ctheta = Math.cos(dtheta);
	turnTiles([-Infinity, -Infinity, -Infinity], [Infinity, Infinity, Infinity], u, stheta, ctheta);
}

function turnY(angle)
{
	let u = [0.0, 1.0, 0.0];
	let dtheta = angle / NFRAMES;  // incremental turn per frame
	let stheta = Math.sin(dtheta);
	let ctheta = Math.cos(dtheta);
	turnTiles([-Infinity, -Infinity, -Infinity], [Infinity, Infinity, Infinity], u, stheta, ctheta);
}

function turnZ(angle)
{
	let u = [0.0, 0.0, 1.0];
	let dtheta = angle / NFRAMES;  // incremental turn per frame
	let stheta = Math.sin(dtheta);
	let ctheta = Math.cos(dtheta);
	turnTiles([-Infinity, -Infinity, -Infinity], [Infinity, Infinity, Infinity], u, stheta, ctheta);
}

function animate(imoves)
{
	//console.log("starting animate()");

	//console.log("XC = " + XC);
	//console.log("YC = " + YC);
	//console.log("ZC = " + ZC);

	for (let i = 0; i < imoves.length; i+= 2)
	{
		// Iterate through tuples of face IDs and twist amounts
		let face = imoves[i];
		let turns = imoves[i+1];

		let angle = turns * RADQUART;
		if (angle > 2.5 * RADQUART)
			angle -= 4 * RADQUART;

		if      (face == rc.MOVE_R)
			turnR(angle);
		else if (face == rc.MOVE_U)
			turnU(angle);
		else if (face == rc.MOVE_L)
			turnL(angle);
		else if (face == rc.MOVE_D)
			turnD(angle);
		else if (face == rc.MOVE_F)
			turnF(angle);
		else if (face == rc.MOVE_B)
			turnB(angle);
		else if (face == rc.MOVE_M)
			turnM(angle);
		else if (face == rc.MOVE_E)
			turnE(angle);
		else if (face == rc.MOVE_S)
			turnS(angle);
		else if (face == rc.MOVE_R2)
			turnR2(angle);
		else if (face == rc.MOVE_U2)
			turnU2(angle);
		else if (face == rc.MOVE_L2)
			turnL2(angle);
		else if (face == rc.MOVE_D2)
			turnD2(angle);
		else if (face == rc.MOVE_F2)
			turnF2(angle);
		else if (face == rc.MOVE_B2)
			turnB2(angle);
		else if (face == rc.MOVE_X)
			turnX(angle);
		else if (face == rc.MOVE_Y)
			turnY(angle);
		else if (face == rc.MOVE_Z)
			turnZ(angle);
		else
		{
			// TODO: catch (don't assume parser returns valid IDs)
		}
	}

	// TODO:  round off errors after each move animation to prevent accumulation

}

function initialize()
{
	console.log("starting rubikVtk.initialize()");

	const renderer = vtkRenderer.newInstance({background: [0.08, 0.48, 0.46]});
	renderWindow.addRenderer(renderer);

	let mappers = [];
	for (let i = 0; i < X.length; i++)
	{
		planeSources.push(vtkPlaneSource.newInstance());

		let o = [X[i], Y[i], Z[i]];
		planeSources[i].setOrigin(o);

		let p1 = o.slice();
		p1[U[i]] += D;
		planeSources[i].setPoint1(p1);

		let p2 = o.slice();
		p2[V[i]] += D;
		planeSources[i].setPoint2(p2);

		mappers.push(vtkMapper.newInstance());
		mappers[i].setInputConnection(planeSources[i].getOutputPort());

		actors.push(vtkActor.newInstance());
		actors[i].setMapper(mappers[i]);
		actors[i].getProperty().setColor(0.0, 0.0, 0.0);

		// Add the actor to the renderer and set the camera based on it
		renderer.addActor(actors[i]);
	}

	// setup orientation widget
	const cube = vtkAnnotatedCubeActor.newInstance();
	cube.setDefaultStyle
	({
		text: 'R',
		fontFamily: 'Arial',
		fontColor: 'black',
		fontSizeScale: (res) => res / 2,
		faceColor: '#eeeeee',
		faceRotation: 0,
		edgeThickness: 0.1,
		edgeColor: 'cyan',
		resolution: 400
	});
	cube.setXMinusFaceProperty({text: 'L'});
	cube.setYPlusFaceProperty ({text: 'U'});
	cube.setYMinusFaceProperty({text: 'D'});
	cube.setZPlusFaceProperty ({text: 'F'});
	cube.setZMinusFaceProperty({text: 'B'});

	// Set trimetric camera position (isometric would be [1,1,1])
	const camera = renderer.getActiveCamera();
	camera.setPosition(2, 3, 4);

	renderer.resetCamera();

	// Use OpenGL as the backend to view the all this
	const openglRenderWindow = vtkOpenGLRenderWindow.newInstance();
	renderWindow.addView(openglRenderWindow);

	// Put the render window inside of a div from the HTML
	const container = document.getElementById("rubikDiv");
	openglRenderWindow.setContainer(container);

	// Capture size of the container and set the resolution
	const { width, height } = container.getBoundingClientRect();
	const f = 2;  // larger f == finer resolution
	openglRenderWindow.setSize(f * width, f * height);

	// Setup an interactor to handle mouse events
	const interactor = vtkRenderWindowInteractor.newInstance();
	interactor.setView(openglRenderWindow);
	interactor.initialize();
	interactor.bindEvents(container);

	// Setup interactor style to use
	interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());

	// create orientation widget
	const orientationWidget = vtkOrientationMarkerWidget.newInstance({
	  actor: cube,
	  interactor: renderWindow.getInteractor()
	});
	orientationWidget.setEnabled(true);
	orientationWidget.setViewportCorner(
		vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT);
	orientationWidget.setViewportSize(0.15);
	orientationWidget.setMinPixelSize(100);
	orientationWidget.setMaxPixelSize(300);

}

export default
{
	initialize,
	setColors,
	animate
};

