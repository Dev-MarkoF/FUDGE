///<reference types="../../Core/Build/FudgeCore.js"/>
///<reference types="../Physics_Library/OimoPhysics.js"/>
import f = FudgeCore;
//import { oimo } from "../Physics_Library/OimoPhysics";




namespace FudgePhysics_Communication {
  import oimo = window.OIMO;

  let starttimer: number = 2;

  window.addEventListener("load", init);
  const app: HTMLCanvasElement = document.querySelector("canvas");
  let viewPort: f.Viewport;
  let hierarchy: f.Node;
  let fps: number;
  const times: number[] = [];
  let cubes: f.Node[] = new Array();
  let fpsDisplay: HTMLElement = document.querySelector("h2#FPS");
  let bodies = new Array();
  let world = new oimo.World();
  let ground: f.Node;
  let cubeNo: number = 0;
  let time: number = 0;

  function init(_event: Event): void {
    f.Debug.log(app);
    f.RenderManager.initialize();
    hierarchy = new f.Node("Scene");

    ground = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube());
    let cmpGroundMesh: f.ComponentTransform = ground.getComponent(f.ComponentTransform);

    cmpGroundMesh.local.scale(new f.Vector3(100, 0.3, 100));
    hierarchy.appendChild(ground);
    initializePhysicsBody(ground.getComponent(f.ComponentTransform), false, 0);

    createRandomObject();

    let cmpLight: f.ComponentLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
    cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
    hierarchy.addComponent(cmpLight);

    let cmpCamera: f.ComponentCamera = new f.ComponentCamera();
    cmpCamera.backgroundColor = f.Color.CSS("GREY");
    cmpCamera.pivot.translate(new f.Vector3(2, 5, 25));
    cmpCamera.pivot.lookAt(f.Vector3.ZERO());

    //world.setNumPositionIterations(6);
    //world.setNumVelocityIterations(6);

    viewPort = new f.Viewport();
    viewPort.initialize("Viewport", hierarchy, cmpCamera, app);

    viewPort.showSceneGraph();

    f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
    f.Loop.start();
  }


  function update(): void {
    if (starttimer <= 0) {
      //Physics OIMO
      world.step(f.Loop.timeFrameGame / 1000);
      //world.step(1 / 60);
      applyPhysicsBody(ground.getComponent(f.ComponentTransform), 0);
      for (let i: number = 1; i < bodies.length; i++) {
        applyPhysicsBody(cubes[i - 1].getComponent(f.ComponentTransform), i);
      }
      //EndPhysics
    } else {
      starttimer -= f.Loop.timeFrameGame / 1000;
    }
    time += f.Loop.timeFrameReal / 1000;

    viewPort.draw();
    measureFPS();
  }

  function measureFPS(): void {
    window.requestAnimationFrame(() => {
      const now = performance.now();
      while (times.length > 0 && times[0] <= now - 1000) {
        times.shift();
      }
      times.push(now);
      fps = times.length;
      fpsDisplay.textContent = "FPS: " + fps.toString() + " / Rigidbodies: " + bodies.length + " / Time: " + time.toFixed(2);
    });
  }

  function createCompleteMeshNode(_name: string, _material: f.Material, _mesh: f.Mesh): f.Node {
    let node: f.Node = new f.Node(_name);
    let cmpMesh: f.ComponentMesh = new f.ComponentMesh(_mesh);
    let cmpMaterial: f.ComponentMaterial = new f.ComponentMaterial(_material);

    let cmpTransform: f.ComponentTransform = new f.ComponentTransform();
    node.addComponent(cmpMesh);
    node.addComponent(cmpMaterial);
    node.addComponent(cmpTransform);

    return node;
  }

  function createRandomObject(): void {
    let type: number = f.random.getRangeFloored(0, 2);
    let mesh: f.Mesh = type == 0 ? new f.MeshCube() : new f.MeshSphere();
    cubes[cubeNo] = createCompleteMeshNode("Cube_" + cubeNo.toString(), new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), mesh);
    let cmpCubeTransform: f.ComponentTransform = cubes[cubeNo].getComponent(f.ComponentTransform);
    cmpCubeTransform.local.translate(new f.Vector3(0, 10, 0));
    hierarchy.appendChild(cubes[cubeNo]);
    initializePhysicsBody(cmpCubeTransform, true, 1 + cubeNo, type);
    cubeNo++;

    setTimeout(createRandomObject, 100);
  }

  function initializePhysicsBody(_cmpTransform: f.ComponentTransform, dynamic: boolean, no: number, type: number = 0) {
    let node: f.Node = _cmpTransform.getContainer();
    let scale: oimo.Vec3 = new oimo.Vec3(node.mtxLocal.scaling.x / 2, node.mtxLocal.scaling.y / 2, node.mtxLocal.scaling.z / 2);
    let shapec: oimo.ShapeConfig = new oimo.ShapeConfig();
    let geometry: oimo.Geometry;
    if (type == 0)
      geometry = new oimo.BoxGeometry(scale);
    else
      geometry = new oimo.SphereGeometry(scale.y);

    shapec.geometry = geometry;
    let massData: oimo.MassData = new oimo.MassData();
    massData.mass = 1;

    let bodyc: oimo.RigidBodyConfig = new oimo.RigidBodyConfig();
    bodyc.type = dynamic ? oimo.RigidBodyType.DYNAMIC : oimo.RigidBodyType.STATIC;
    bodyc.position = new oimo.Vec3(node.mtxLocal.translation.x, node.mtxLocal.translation.y, node.mtxLocal.translation.z);
    bodyc.rotation.fromEulerXyz(new oimo.Vec3(node.mtxLocal.rotation.x, node.mtxLocal.rotation.y, node.mtxLocal.rotation.z));
    let rb: oimo.RigidBody = new oimo.RigidBody(bodyc);
    rb.addShape(new oimo.Shape(shapec));
    rb.getShapeList().setRestitution(0);
    rb.getShapeList().setFriction(1);
    rb.setMassData(massData);
    bodies[no] = rb;
    world.addRigidBody(rb);
  }

  function applyPhysicsBody(_cmpTransform: f.ComponentTransform, no: number): void {
    let node: f.Node = _cmpTransform.getContainer();
    let tmpPosition: f.Vector3 = new f.Vector3(bodies[no].getPosition().x, bodies[no].getPosition().y, bodies[no].getPosition().z);

    let mutator: f.Mutator = {};
    let orientation = bodies[no].getOrientation();
    let tmpQuat: f.Quaternion = new f.Quaternion(orientation.x, orientation.y, orientation.z, orientation.w);
    let tmpRotation: f.Vector3 = tmpQuat.toDegrees();
    //f.Debug.log(tmpRotation);
    mutator["rotation"] = tmpRotation;
    mutator["translation"] = tmpPosition;
    node.mtxLocal.mutate(mutator);
  }


}