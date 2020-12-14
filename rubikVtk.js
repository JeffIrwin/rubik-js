
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

// Tile width
const D = 1.0;

// Unique tile coordinates
const X0 = 0.0;
const X1 = X0 + 1 * D;
const X2 = X0 + 2 * D;
const X3 = X0 + 3 * D;
const Y0 = 0.0;
const Y1 = Y0 + 1 * D;
const Y2 = Y0 + 2 * D;
const Y3 = Y0 + 3 * D;
const Z0 = 0.0;
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

let planeSources = [];  // doesn't need to be global (yet)
let actors = [];

function setRubikVtkColors(state, cmap, flatmap)
{
	for (let i = 0; i < actors.length; i++)
	{
		let c = cmap[state[flatmap[i]]];
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

function initRubikVtk()
{
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
	setRubikVtkColors
};

initRubikVtk();

