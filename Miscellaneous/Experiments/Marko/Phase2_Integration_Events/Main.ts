///<reference types="../../../../Core/Build/FudgeCore.js"/>
import f = FudgeCore;



namespace FudgePhysics_Communication {

  window.addEventListener("load", init);
  const app: HTMLCanvasElement = document.querySelector("canvas");
  let viewPort: f.Viewport;
  let hierarchy: f.Node;
  let fps: number;
  const times: number[] = [];
  let fpsDisplay: HTMLElement = document.querySelector("h2#FPS");

  let cubes: f.Node[] = new Array();
  let origin: f.Vector3 = new f.Vector3(-5, 0.25, 0);
  let direction: f.Vector3 = new f.Vector3(1, 0, 0);
  let hitInfo: f.RayHitInfo = new f.RayHitInfo();





  function init(_event: Event): void {
    f.Debug.log(app);
    f.RenderManager.initialize();
    f.Physics.initializePhysics();
    hierarchy = new f.Node("Scene");

    let ground: f.Node = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube(), 0, f.PHYSICS_TYPE.STATIC, f.PHYSICS_GROUP.GROUP_1);
    let cmpGroundMesh: f.ComponentTransform = ground.getComponent(f.ComponentTransform);
    cmpGroundMesh.local.scale(new f.Vector3(10, 0.3, 10));

    cmpGroundMesh.local.translate(new f.Vector3(0, -1.5, 0));
    hierarchy.appendChild(ground);

    cubes[0] = createCompleteMeshNode("Cube_1", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC, f.PHYSICS_GROUP.GROUP_2);
    let cmpCubeTransform: f.ComponentTransform = cubes[0].getComponent(f.ComponentTransform);
    hierarchy.appendChild(cubes[0]);
    cmpCubeTransform.local.translate(new f.Vector3(0, 7, 0));

    // cubes[1] = createCompleteMeshNode("Cube_2", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC, f.PHYSICS_GROUP.GROUP_1);
    // let cmpCubeTransform2: f.ComponentTransform = cubes[1].getComponent(f.ComponentTransform);
    // hierarchy.appendChild(cubes[1]);
    // cmpCubeTransform2.local.translate(new f.Vector3(0, 3.5, 0.48));

    // cubes[2] = createCompleteMeshNode("Cube_3", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC);
    // let cmpCubeTransform3: f.ComponentTransform = cubes[2].getComponent(f.ComponentTransform);
    // hierarchy.appendChild(cubes[2]);
    // cmpCubeTransform3.local.translate(new f.Vector3(0.5, 7, 0.5));

    cubes[3] = createCompleteMeshNode("Cube_3", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(0, 1, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.STATIC, f.PHYSICS_GROUP.TRIGGER);
    let cmpCubeTransform4: f.ComponentTransform = cubes[3].getComponent(f.ComponentTransform);
    hierarchy.appendChild(cubes[3]);
    cmpCubeTransform4.local.translate(new f.Vector3(0, 0.5, 0));

    let cmpLight: f.ComponentLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
    cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
    hierarchy.addComponent(cmpLight);

    let cmpCamera: f.ComponentCamera = new f.ComponentCamera();
    cmpCamera.backgroundColor = f.Color.CSS("GREY");
    cmpCamera.pivot.translate(new f.Vector3(2, 2, 10));
    cmpCamera.pivot.lookAt(f.Vector3.ZERO());

    cubes[0].getComponent(f.ComponentRigidbody).addEventListener(f.EVENT_PHYSICS.COLLISION_ENTER, onCollisionEnter as EventListener);
    cubes[0].getComponent(f.ComponentRigidbody).addEventListener(f.EVENT_PHYSICS.TRIGGER_ENTER, onTriggerEnter as EventListener);
    cubes[0].getComponent(f.ComponentRigidbody).addEventListener(f.EVENT_PHYSICS.COLLISION_EXIT, onCollisionExit as EventListener);
    cubes[0].getComponent(f.ComponentRigidbody).addEventListener(f.EVENT_PHYSICS.TRIGGER_EXIT, onTriggerExit as EventListener);

    viewPort = new f.Viewport();
    viewPort.initialize("Viewport", hierarchy, cmpCamera, app);

    viewPort.showSceneGraph();
    f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
    cubes[0].getComponent(f.ComponentRigidbody).setRestitution(1.3);
    f.Physics.start(hierarchy);
    f.Loop.start();
  }

  function onCollisionEnter(_event: CustomEvent): void {
    f.Debug.log("ColEnter: " + _event.detail.getContainer().name);
  }

  function onCollisionExit(_event: CustomEvent): void {
    f.Debug.log("ColExit: " + _event.detail.getContainer().name);
  }

  function onTriggerEnter(_event: CustomEvent): void {
    f.Debug.log("TriggerEnter: " + _event.detail.getContainer().name);
  }

  function onTriggerExit(_event: CustomEvent): void {
    f.Debug.log("TriggerExit: " + _event.detail.getContainer().name);
  }


  function update(): void {

    f.Physics.world.simulate();
    hitInfo = f.Physics.raycast(origin, direction, 10);
    //f.Debug.log(hitInfo);
    viewPort.draw();
    measureFPS();
  }

  function measureFPS(): void {
    window.requestAnimationFrame(() => {
      const now: number = performance.now();
      while (times.length > 0 && times[0] <= now - 1000) {
        times.shift();
      }
      times.push(now);
      fps = times.length;
      fpsDisplay.textContent = "FPS: " + fps.toString();
    });
  }

  function createCompleteMeshNode(_name: string, _material: f.Material, _mesh: f.Mesh, _mass: number, _physicsType: f.PHYSICS_TYPE, _group: f.PHYSICS_GROUP = f.PHYSICS_GROUP.DEFAULT): f.Node {
    let node: f.Node = new f.Node(_name);
    let cmpMesh: f.ComponentMesh = new f.ComponentMesh(_mesh);
    let cmpMaterial: f.ComponentMaterial = new f.ComponentMaterial(_material);

    let cmpTransform: f.ComponentTransform = new f.ComponentTransform();


    let cmpRigidbody: f.ComponentRigidbody = new f.ComponentRigidbody(_mass, _physicsType, f.COLLIDER_TYPE.BOX, _group);
    node.addComponent(cmpMesh);
    node.addComponent(cmpMaterial);
    node.addComponent(cmpTransform);
    node.addComponent(cmpRigidbody);

    return node;
  }

}