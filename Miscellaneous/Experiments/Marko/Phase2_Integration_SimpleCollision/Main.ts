///<reference types="../../../../Core/Build/FudgeCore.js"/>
///<reference types="../../../../Physics/OimoPhysics.js"/>
import f = FudgeCore;
//import { oimo } from "../Physics_Library/OimoPhysics";




namespace FudgePhysics_Communication {
  import oimo = OIMO;

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
    f.Physics.initializePhysics();
    hierarchy = new f.Node("Scene");

    let ground: f.Node = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube(), 0, f.PHYSICS_TYPE.STATIC);
    let cmpGroundMesh: f.ComponentTransform = ground.getComponent(f.ComponentTransform);

    cmpGroundMesh.local.scale(new f.Vector3(10, 0.3, 10));
    hierarchy.appendChild(ground);

    cubes[0] = createCompleteMeshNode("Cube_1", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC);
    let cmpCubeTransform: f.ComponentTransform = cubes[0].getComponent(f.ComponentTransform);
    cmpCubeTransform.local.translate(new f.Vector3(0, 2, 0));
    hierarchy.appendChild(cubes[0]);

    cubes[1] = createCompleteMeshNode("Cube_2", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.STATIC);
    let cmpCubeTransform2: f.ComponentTransform = cubes[1].getComponent(f.ComponentTransform);
    cmpCubeTransform2.local.translate(new f.Vector3(0, 3.5, 0.4));
    hierarchy.appendChild(cubes[1]);

    let cmpLight: f.ComponentLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
    cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
    hierarchy.addComponent(cmpLight);

    let cmpCamera: f.ComponentCamera = new f.ComponentCamera();
    cmpCamera.backgroundColor = f.Color.CSS("GREY");
    cmpCamera.pivot.translate(new f.Vector3(2, 2, 10));
    cmpCamera.pivot.lookAt(f.Vector3.ZERO());


    viewPort = new f.Viewport();
    viewPort.initialize("Viewport", hierarchy, cmpCamera, app);

    viewPort.showSceneGraph();

    f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
    f.Loop.start();
  }

  function update(): void {

    //Physics 
    f.Physics.instance.simulate();
    //f.Debug.log(cubes[0].getComponent(f.ComponentRigidbody).getPosition());
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

  function createCompleteMeshNode(_name: string, _material: f.Material, _mesh: f.Mesh, _mass: number, _physicsType: f.PHYSICS_TYPE): f.Node {
    let node: f.Node = new f.Node(_name);
    let cmpMesh: f.ComponentMesh = new f.ComponentMesh(_mesh);
    let cmpMaterial: f.ComponentMaterial = new f.ComponentMaterial(_material);

    let cmpTransform: f.ComponentTransform = new f.ComponentTransform();
    let cmpRigidbody: f.ComponentRigidbody = new f.ComponentRigidbody(_mass, _physicsType, f.COLLIDER_TYPE.BOX, cmpTransform);

    node.addComponent(cmpMesh);
    node.addComponent(cmpMaterial);
    node.addComponent(cmpTransform);
    node.addComponent(cmpRigidbody);

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
    rb.setMassData(massData);
    rb.getShapeList().setRestitution(0);
    rb.getShapeList().setFriction(1);
    bodies[no] = rb;
    world.addRigidBody(rb);
  }

  function applyPhysicsBody(_cmpTransform: f.ComponentTransform, no: number): void {
    let node: f.Node = _cmpTransform.getContainer();
    let tmpPosition: f.Vector3 = new f.Vector3(bodies[no].getPosition().x, bodies[no].getPosition().y, bodies[no].getPosition().z);

    let mutator: f.Mutator = {};
    let orientation: oimo.Quat = bodies[no].getOrientation();
    let tmpQuat: f.Quaternion = new f.Quaternion(orientation.x, orientation.y, orientation.z, orientation.w);
    let tmpRotation: f.Vector3 = tmpQuat.toDegrees();
    mutator["rotation"] = tmpRotation;
    mutator["translation"] = tmpPosition;
    node.mtxLocal.mutate(mutator);
  }

}