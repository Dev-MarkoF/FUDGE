///<reference types="../../Core/Build/FudgeCore.js"/>
///<reference types="../Physics_Library/OimoPhysics.js"/>
import f = FudgeCore;
//import { oimo } from "../Physics_Library/OimoPhysics";




namespace FudgePhysics_Communication {
  import oimo = window.OIMO;

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

  function init(_event: Event): void {
    f.Debug.log(app);
    f.RenderManager.initialize();
    hierarchy = new f.Node("Scene");

    let ground: f.Node = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube());
    let cmpGroundMesh: f.ComponentTransform = ground.getComponent(f.ComponentTransform);

    cmpGroundMesh.local.scale(new f.Vector3(50, 0.3, 50));
    hierarchy.appendChild(ground);
    initializePhysicsBody(ground.getComponent(f.ComponentTransform), false, 0);

    let cubeNo = 0;
    for (let a: number = 0; a < 10; a++) {
      for (let b: number = 0; b < 10; b++) {
        cubes[cubeNo] = createCompleteMeshNode("Cube_" + cubeNo.toString(), new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
        //cubes[cubeNo].mtxWorld.rotateX(45);
        let cmpCubeTransform: f.ComponentTransform = cubes[cubeNo].getComponent(f.ComponentTransform);
        cmpCubeTransform.local.translate(new f.Vector3(-5 + b, a + 5, 0));
        hierarchy.appendChild(cubes[cubeNo]);
        //Physics
        //  f.Debug.log(cmpCubeTransform.getContainer().name);
        initializePhysicsBody(cmpCubeTransform, true, 1 + cubeNo);
        cubeNo++;
      }
    }

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

    //Physics OIMO
    world.step(f.Loop.timeFrameGame / 1000);
    for (let i: number = 1; i < bodies.length; i++) { //Alle außer dem Grund
      applyPhysicsBody(cubes[i - 1].getComponent(f.ComponentTransform), i);
    }
    //EndPhysics

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
      fpsDisplay.textContent = "FPS: " + fps.toString();
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

  function initializePhysicsBody(_cmpTransform: f.ComponentTransform, dynamic: boolean, no: number) {
    let node: f.Node = _cmpTransform.getContainer();
    let scale: oimo.Vec3 = new oimo.Vec3(node.mtxLocal.scaling.x / 2, node.mtxLocal.scaling.y / 2, node.mtxLocal.scaling.z / 2);
    let shapec: oimo.ShapeConfig = new oimo.ShapeConfig();
    let geometry: oimo.Geometry = new oimo.BoxGeometry(scale);
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

    let rotMutator: f.Mutator = {};
    let tmpRotation: f.Vector3 = makeRotationFromQuaternion(bodies[no].getOrientation(), node.mtxWorld.rotation);
    //f.Debug.log(tmpRotation);
    rotMutator["rotation"] = tmpRotation;
    //node.mtxLocal.rotateX(tmpRotation.x);
    node.mtxLocal.mutate(rotMutator);
    rotMutator["translation"] = tmpPosition;
    node.mtxLocal.mutate(rotMutator);
  }


  function makeRotationFromQuaternion(q: any, targetAxis: f.Vector3 = new f.Vector3(1, 1, 1)): f.Vector3 {
    let angles: f.Vector3 = new f.Vector3();

    // roll (x-axis rotation)
    let sinr_cosp: number = 2 * (q.w * q.x + q.y * q.z);
    let cosr_cosp: number = 1 - 2 * (q.x * q.x + q.y * q.y);
    angles.x = Math.atan2(sinr_cosp, cosr_cosp) * 60;

    // pitch (y-axis rotation)
    let sinp: number = 2 * (q.w * q.y - q.z * q.x);
    if (Math.abs(sinp) >= 1)
      angles.y = copysign(Math.PI / 2, sinp) * 60; // use 90 degrees if out of range
    else
      angles.y = Math.asin(sinp);

    // yaw (z-axis rotation)
    let siny_cosp: number = 2 * (q.w * q.z + q.x * q.y);
    let cosy_cosp: number = 1 - 2 * (q.y * q.y + q.z * q.z);
    angles.z = Math.atan2(siny_cosp, cosy_cosp) * 60;
    return angles;
  }

  function copysign(a: number, b: number): number {
    return b < 0 ? -Math.abs(a) : Math.abs(a);
  }

}