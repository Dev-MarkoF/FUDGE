"use strict";
///<reference types="../../../../Core/Build/FudgeCore.js"/>
///<reference types="../../../../Physics/OimoPhysics.js"/>
var f = FudgeCore;
//import { oimo } from "../Physics_Library/OimoPhysics";
var FudgePhysics_Communication;
//import { oimo } from "../Physics_Library/OimoPhysics";
(function (FudgePhysics_Communication) {
    var oimo = OIMO;
    window.addEventListener("load", init);
    const app = document.querySelector("canvas");
    let viewPort;
    let hierarchy;
    let fps;
    const times = [];
    let cubes = new Array();
    let fpsDisplay = document.querySelector("h2#FPS");
    let bodies = new Array();
    let world = new oimo.World();
    function init(_event) {
        f.Debug.log(app);
        f.RenderManager.initialize();
        f.Physics.initializePhysics();
        hierarchy = new f.Node("Scene");
        let ground = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube(), 0, f.PHYSICS_TYPE.STATIC);
        let cmpGroundMesh = ground.getComponent(f.ComponentTransform);
        cmpGroundMesh.local.scale(new f.Vector3(10, 0.3, 10));
        hierarchy.appendChild(ground);
        cubes[0] = createCompleteMeshNode("Cube_1", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC);
        let cmpCubeTransform = cubes[0].getComponent(f.ComponentTransform);
        cmpCubeTransform.local.translate(new f.Vector3(0, 2, 0));
        hierarchy.appendChild(cubes[0]);
        cubes[1] = createCompleteMeshNode("Cube_2", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.STATIC);
        let cmpCubeTransform2 = cubes[1].getComponent(f.ComponentTransform);
        cmpCubeTransform2.local.translate(new f.Vector3(0, 3.5, 0.4));
        hierarchy.appendChild(cubes[1]);
        let cmpLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
        cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
        hierarchy.addComponent(cmpLight);
        let cmpCamera = new f.ComponentCamera();
        cmpCamera.backgroundColor = f.Color.CSS("GREY");
        cmpCamera.pivot.translate(new f.Vector3(2, 2, 10));
        cmpCamera.pivot.lookAt(f.Vector3.ZERO());
        viewPort = new f.Viewport();
        viewPort.initialize("Viewport", hierarchy, cmpCamera, app);
        viewPort.showSceneGraph();
        f.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, update);
        f.Loop.start();
    }
    function update() {
        //Physics 
        f.Physics.instance.simulate();
        //f.Debug.log(cubes[0].getComponent(f.ComponentRigidbody).getPosition());
        //EndPhysics
        viewPort.draw();
        measureFPS();
    }
    function measureFPS() {
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
    function createCompleteMeshNode(_name, _material, _mesh, _mass, _physicsType) {
        let node = new f.Node(_name);
        let cmpMesh = new f.ComponentMesh(_mesh);
        let cmpMaterial = new f.ComponentMaterial(_material);
        let cmpTransform = new f.ComponentTransform();
        let cmpRigidbody = new f.ComponentRigidbody(_mass, _physicsType, f.COLLIDER_TYPE.BOX, cmpTransform);
        node.addComponent(cmpMesh);
        node.addComponent(cmpMaterial);
        node.addComponent(cmpTransform);
        node.addComponent(cmpRigidbody);
        return node;
    }
    function initializePhysicsBody(_cmpTransform, dynamic, no) {
        let node = _cmpTransform.getContainer();
        let scale = new oimo.Vec3(node.mtxLocal.scaling.x / 2, node.mtxLocal.scaling.y / 2, node.mtxLocal.scaling.z / 2);
        let shapec = new oimo.ShapeConfig();
        let geometry = new oimo.BoxGeometry(scale);
        shapec.geometry = geometry;
        let massData = new oimo.MassData();
        massData.mass = 1;
        let bodyc = new oimo.RigidBodyConfig();
        bodyc.type = dynamic ? oimo.RigidBodyType.DYNAMIC : oimo.RigidBodyType.STATIC;
        bodyc.position = new oimo.Vec3(node.mtxLocal.translation.x, node.mtxLocal.translation.y, node.mtxLocal.translation.z);
        bodyc.rotation.fromEulerXyz(new oimo.Vec3(node.mtxLocal.rotation.x, node.mtxLocal.rotation.y, node.mtxLocal.rotation.z));
        let rb = new oimo.RigidBody(bodyc);
        rb.addShape(new oimo.Shape(shapec));
        rb.setMassData(massData);
        rb.getShapeList().setRestitution(0);
        rb.getShapeList().setFriction(1);
        bodies[no] = rb;
        world.addRigidBody(rb);
    }
    function applyPhysicsBody(_cmpTransform, no) {
        let node = _cmpTransform.getContainer();
        let tmpPosition = new f.Vector3(bodies[no].getPosition().x, bodies[no].getPosition().y, bodies[no].getPosition().z);
        let mutator = {};
        let orientation = bodies[no].getOrientation();
        let tmpQuat = new f.Quaternion(orientation.x, orientation.y, orientation.z, orientation.w);
        let tmpRotation = tmpQuat.toDegrees();
        mutator["rotation"] = tmpRotation;
        mutator["translation"] = tmpPosition;
        node.mtxLocal.mutate(mutator);
    }
})(FudgePhysics_Communication || (FudgePhysics_Communication = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDJEQUEyRDtBQUMzRCwwREFBMEQ7QUFDMUQsSUFBTyxDQUFDLEdBQUcsU0FBUyxDQUFDO0FBQ3JCLHdEQUF3RDtBQUt4RCxJQUFVLDBCQUEwQixDQW1JbkM7QUF4SUQsd0RBQXdEO0FBS3hELFdBQVUsMEJBQTBCO0lBQ2xDLElBQU8sSUFBSSxHQUFHLElBQUksQ0FBQztJQUVuQixNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3RDLE1BQU0sR0FBRyxHQUFzQixRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2hFLElBQUksUUFBb0IsQ0FBQztJQUN6QixJQUFJLFNBQWlCLENBQUM7SUFDdEIsSUFBSSxHQUFXLENBQUM7SUFDaEIsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO0lBQzNCLElBQUksS0FBSyxHQUFhLElBQUksS0FBSyxFQUFFLENBQUM7SUFDbEMsSUFBSSxVQUFVLEdBQWdCLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDL0QsSUFBSSxNQUFNLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUN6QixJQUFJLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUk3QixTQUFTLElBQUksQ0FBQyxNQUFhO1FBQ3pCLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDN0IsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzlCLFNBQVMsR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFaEMsSUFBSSxNQUFNLEdBQVcsc0JBQXNCLENBQUMsUUFBUSxF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QUMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekcsSUFBSSxXQUFXLEdBQWMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2pELE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxXQUFXLENBQUM7UUFDbEMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxHQUFHLFdBQVcsQ0FBQztRQUNyQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNoQyxDQUFDO0FBRUgsQ0FBQyxFQW5JUywwQkFBMEIsS0FBMUIsMEJBQTBCLFFBbUluQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLzxyZWZlcmVuY2UgdHlwZXM9XCIuLi8uLi8uLi8uLi9Db3JlL0J1aWxkL0Z1ZGdlQ29yZS5qc1wiLz5cclxuLy8vPHJlZmVyZW5jZSB0eXBlcz1cIi4uLy4uLy4uLy4uL1BoeXNpY3MvT2ltb1BoeXNpY3MuanNcIi8+XHJcbmltcG9ydCBmID0gRnVkZ2VDb3JlO1xyXG4vL2ltcG9ydCB7IG9pbW8gfSBmcm9tIFwiLi4vUGh5c2ljc19MaWJyYXJ5L09pbW9QaHlzaWNzXCI7XHJcblxyXG5cclxuXHJcblxyXG5uYW1lc3BhY2UgRnVkZ2VQaHlzaWNzX0NvbW11bmljYXRpb24ge1xyXG4gIGltcG9ydCBvaW1vID0gT0lNTztcclxuXHJcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIGluaXQpO1xyXG4gIGNvbnN0IGFwcDogSFRNTENhbnZhc0VsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiY2FudmFzXCIpO1xyXG4gIGxldCB2aWV3UG9ydDogZi5WaWV3cG9ydDtcclxuICBsZXQgaGllcmFyY2h5OiBmLk5vZGU7XHJcbiAgbGV0IGZwczogbnVtYmVyO1xyXG4gIGNvbnN0IHRpbWVzOiBudW1iZXJbXSA9IFtdO1xyXG4gIGxldCBjdWJlczogZi5Ob2RlW10gPSBuZXcgQXJyYXkoKTtcclxuICBsZXQgZnBzRGlzcGxheTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaDIjRlBTXCIpO1xyXG4gIGxldCBib2RpZXMgPSBuZXcgQXJyYXkoKTtcclxuICBsZXQgd29ybGQgPSBuZXcgb2ltby5Xb3JsZCgpO1xyXG5cclxuXHJcblxyXG4gIGZ1bmN0aW9uIGluaXQoX2V2ZW50OiBFdmVudCk6IHZvaWQge1xyXG4gICAgZi5EZWJ1Zy5sb2coYXBwKTtcclxuICAgIGYuUmVuZGVyTWFuYWdlci5pbml0aWFsaXplKCk7XHJcbiAgICBmLlBoeXNpY3MuaW5pdGlhbGl6ZVBoeXNpY3MoKTtcclxuICAgIGhpZXJhcmNoeSA9IG5ldyBmLk5vZGUoXCJTY2VuZVwiKTtcclxuXHJcbiAgICBsZXQgZ3JvdW5kOiBmLk5vZGUgPSBjcmVhdGVDb21wbGV0ZU1lc2hOb2RlKFwiR3JvdW5kXCIsIG5ldyBmLk1hdGVyaWFsKFwiR3JvdW5kXCIsIGYuU2hhZGVyRmxhdCwgbmV3IGYuQ29hdENvbG9yZWQobmV3IGYuQ29sb3IoMC4yLCAwLjIsIDAuMiwgMSkpKSwgbmV3IGYuTWVzaEN1YmUoKSwgMCwgZi5QSFlTSUNTX1RZUEUuU1RBVElDKTtcclxuICAgIGxldCBjbXBHcm91bmRNZXNoOiBmLkNvbXBvbmVudFRyYW5zZm9ybSA9IGdyb3VuZC5nZXRDb21wb25lbnQoZi5Db21wb25lbnRUcmFuc2Zvcm0pO1xyXG5cclxuICAgIGNtcEdyb3VuZE1lc2gubG9jYWwuc2NhbGUobmV3IGYuVmVjdG9yMygxMCwgMC4zLCAxMCkpO1xyXG4gICAgaGllcmFyY2h5LmFwcGVuZENoaWxkKGdyb3VuZCk7XHJcblxyXG4gICAgY3ViZXNbMF0gPSBjcmVhdGVDb21wbGV0ZU1lc2hOb2RlKFwiQ3ViZV8xXCIsIG5ldyBmLk1hdGVyaWFsKFwiQ3ViZVwiLCBmLlNoYWRlckZsYXQsIG5ldyBmLkNvYXRDb2xvcmVkKG5ldyBmLkNvbG9yKDEsIDAsIDAsIDEpKSksIG5ldyBmLk1lc2hDdWJlKCksIDEsIGYuUEhZU0lDU19UWVBFLkRZTkFNSUMpO1xyXG4gICAgbGV0IGNtcEN1YmVUcmFuc2Zvcm06IGYuQ29tcG9uZW50VHJhbnNmb3JtID0gY3ViZXNbMF0uZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50VHJhbnNmb3JtKTtcclxuICAgIGNtcEN1YmVUcmFuc2Zvcm0ubG9jYWwudHJhbnNsYXRlKG5ldyBmLlZlY3RvcjMoMCwgMiwgMCkpO1xyXG4gICAgaGllcmFyY2h5LmFwcGVuZENoaWxkKGN1YmVzWzBdKTtcclxuXHJcbiAgICBjdWJlc1sxXSA9IGNyZWF0ZUNvbXBsZXRlTWVzaE5vZGUoXCJDdWJlXzJcIiwgbmV3IGYuTWF0ZXJpYWwoXCJDdWJlXCIsIGYuU2hhZGVyRmxhdCwgbmV3IGYuQ29hdENvbG9yZWQobmV3IGYuQ29sb3IoMSwgMCwgMCwgMSkpKSwgbmV3IGYuTWVzaEN1YmUoKSwgMSwgZi5QSFlTSUNTX1RZUEUuU1RBVElDKTtcclxuICAgIGxldCBjbXBDdWJlVHJhbnNmb3JtMjogZi5Db21wb25lbnRUcmFuc2Zvcm0gPSBjdWJlc1sxXS5nZXRDb21wb25lbnQoZi5Db21wb25lbnRUcmFuc2Zvcm0pO1xyXG4gICAgY21wQ3ViZVRyYW5zZm9ybTIubG9jYWwudHJhbnNsYXRlKG5ldyBmLlZlY3RvcjMoMCwgMy41LCAwLjQpKTtcclxuICAgIGhpZXJhcmNoeS5hcHBlbmRDaGlsZChjdWJlc1sxXSk7XHJcblxyXG4gICAgbGV0IGNtcExpZ2h0OiBmLkNvbXBvbmVudExpZ2h0ID0gbmV3IGYuQ29tcG9uZW50TGlnaHQobmV3IGYuTGlnaHREaXJlY3Rpb25hbChmLkNvbG9yLkNTUyhcIldISVRFXCIpKSk7XHJcbiAgICBjbXBMaWdodC5waXZvdC5sb29rQXQobmV3IGYuVmVjdG9yMygwLjUsIC0xLCAtMC44KSk7XHJcbiAgICBoaWVyYXJjaHkuYWRkQ29tcG9uZW50KGNtcExpZ2h0KTtcclxuXHJcbiAgICBsZXQgY21wQ2FtZXJhOiBmLkNvbXBvbmVudENhbWVyYSA9IG5ldyBmLkNvbXBvbmVudENhbWVyYSgpO1xyXG4gICAgY21wQ2FtZXJhLmJhY2tncm91bmRDb2xvciA9IGYuQ29sb3IuQ1NTKFwiR1JFWVwiKTtcclxuICAgIGNtcENhbWVyYS5waXZvdC50cmFuc2xhdGUobmV3IGYuVmVjdG9yMygyLCAyLCAxMCkpO1xyXG4gICAgY21wQ2FtZXJhLnBpdm90Lmxvb2tBdChmLlZlY3RvcjMuWkVSTygpKTtcclxuXHJcblxyXG4gICAgdmlld1BvcnQgPSBuZXcgZi5WaWV3cG9ydCgpO1xyXG4gICAgdmlld1BvcnQuaW5pdGlhbGl6ZShcIlZpZXdwb3J0XCIsIGhpZXJhcmNoeSwgY21wQ2FtZXJhLCBhcHApO1xyXG5cclxuICAgIHZpZXdQb3J0LnNob3dTY2VuZUdyYXBoKCk7XHJcblxyXG4gICAgZi5Mb29wLmFkZEV2ZW50TGlzdGVuZXIoZi5FVkVOVC5MT09QX0ZSQU1FLCB1cGRhdGUpO1xyXG4gICAgZi5Mb29wLnN0YXJ0KCk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1cGRhdGUoKTogdm9pZCB7XHJcblxyXG4gICAgLy9QaHlzaWNzIFxyXG4gICAgZi5QaHlzaWNzLmluc3RhbmNlLnNpbXVsYXRlKCk7XHJcbiAgICAvL2YuRGVidWcubG9nKGN1YmVzWzBdLmdldENvbXBvbmVudChmLkNvbXBvbmVudFJpZ2lkYm9keSkuZ2V0UG9zaXRpb24oKSk7XHJcbiAgICAvL0VuZFBoeXNpY3NcclxuXHJcbiAgICB2aWV3UG9ydC5kcmF3KCk7XHJcbiAgICBtZWFzdXJlRlBTKCk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBtZWFzdXJlRlBTKCk6IHZvaWQge1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XHJcbiAgICAgIGNvbnN0IG5vdyA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgICB3aGlsZSAodGltZXMubGVuZ3RoID4gMCAmJiB0aW1lc1swXSA8PSBub3cgLSAxMDAwKSB7XHJcbiAgICAgICAgdGltZXMuc2hpZnQoKTtcclxuICAgICAgfVxyXG4gICAgICB0aW1lcy5wdXNoKG5vdyk7XHJcbiAgICAgIGZwcyA9IHRpbWVzLmxlbmd0aDtcclxuICAgICAgZnBzRGlzcGxheS50ZXh0Q29udGVudCA9IFwiRlBTOiBcIiArIGZwcy50b1N0cmluZygpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBjcmVhdGVDb21wbGV0ZU1lc2hOb2RlKF9uYW1lOiBzdHJpbmcsIF9tYXRlcmlhbDogZi5NYXRlcmlhbCwgX21lc2g6IGYuTWVzaCwgX21hc3M6IG51bWJlciwgX3BoeXNpY3NUeXBlOiBmLlBIWVNJQ1NfVFlQRSk6IGYuTm9kZSB7XHJcbiAgICBsZXQgbm9kZTogZi5Ob2RlID0gbmV3IGYuTm9kZShfbmFtZSk7XHJcbiAgICBsZXQgY21wTWVzaDogZi5Db21wb25lbnRNZXNoID0gbmV3IGYuQ29tcG9uZW50TWVzaChfbWVzaCk7XHJcbiAgICBsZXQgY21wTWF0ZXJpYWw6IGYuQ29tcG9uZW50TWF0ZXJpYWwgPSBuZXcgZi5Db21wb25lbnRNYXRlcmlhbChfbWF0ZXJpYWwpO1xyXG5cclxuICAgIGxldCBjbXBUcmFuc2Zvcm06IGYuQ29tcG9uZW50VHJhbnNmb3JtID0gbmV3IGYuQ29tcG9uZW50VHJhbnNmb3JtKCk7XHJcbiAgICBsZXQgY21wUmlnaWRib2R5OiBmLkNvbXBvbmVudFJpZ2lkYm9keSA9IG5ldyBmLkNvbXBvbmVudFJpZ2lkYm9keShfbWFzcywgX3BoeXNpY3NUeXBlLCBmLkNPTExJREVSX1RZUEUuQk9YLCBjbXBUcmFuc2Zvcm0pO1xyXG5cclxuICAgIG5vZGUuYWRkQ29tcG9uZW50KGNtcE1lc2gpO1xyXG4gICAgbm9kZS5hZGRDb21wb25lbnQoY21wTWF0ZXJpYWwpO1xyXG4gICAgbm9kZS5hZGRDb21wb25lbnQoY21wVHJhbnNmb3JtKTtcclxuICAgIG5vZGUuYWRkQ29tcG9uZW50KGNtcFJpZ2lkYm9keSk7XHJcblxyXG4gICAgcmV0dXJuIG5vZGU7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBpbml0aWFsaXplUGh5c2ljc0JvZHkoX2NtcFRyYW5zZm9ybTogZi5Db21wb25lbnRUcmFuc2Zvcm0sIGR5bmFtaWM6IGJvb2xlYW4sIG5vOiBudW1iZXIpIHtcclxuICAgIGxldCBub2RlOiBmLk5vZGUgPSBfY21wVHJhbnNmb3JtLmdldENvbnRhaW5lcigpO1xyXG4gICAgbGV0IHNjYWxlOiBvaW1vLlZlYzMgPSBuZXcgb2ltby5WZWMzKG5vZGUubXR4TG9jYWwuc2NhbGluZy54IC8gMiwgbm9kZS5tdHhMb2NhbC5zY2FsaW5nLnkgLyAyLCBub2RlLm10eExvY2FsLnNjYWxpbmcueiAvIDIpO1xyXG4gICAgbGV0IHNoYXBlYzogb2ltby5TaGFwZUNvbmZpZyA9IG5ldyBvaW1vLlNoYXBlQ29uZmlnKCk7XHJcbiAgICBsZXQgZ2VvbWV0cnk6IG9pbW8uR2VvbWV0cnkgPSBuZXcgb2ltby5Cb3hHZW9tZXRyeShzY2FsZSk7XHJcbiAgICBzaGFwZWMuZ2VvbWV0cnkgPSBnZW9tZXRyeTtcclxuICAgIGxldCBtYXNzRGF0YTogb2ltby5NYXNzRGF0YSA9IG5ldyBvaW1vLk1hc3NEYXRhKCk7XHJcbiAgICBtYXNzRGF0YS5tYXNzID0gMTtcclxuXHJcbiAgICBsZXQgYm9keWM6IG9pbW8uUmlnaWRCb2R5Q29uZmlnID0gbmV3IG9pbW8uUmlnaWRCb2R5Q29uZmlnKCk7XHJcbiAgICBib2R5Yy50eXBlID0gZHluYW1pYyA/IG9pbW8uUmlnaWRCb2R5VHlwZS5EWU5BTUlDIDogb2ltby5SaWdpZEJvZHlUeXBlLlNUQVRJQztcclxuICAgIGJvZHljLnBvc2l0aW9uID0gbmV3IG9pbW8uVmVjMyhub2RlLm10eExvY2FsLnRyYW5zbGF0aW9uLngsIG5vZGUubXR4TG9jYWwudHJhbnNsYXRpb24ueSwgbm9kZS5tdHhMb2NhbC50cmFuc2xhdGlvbi56KTtcclxuICAgIGJvZHljLnJvdGF0aW9uLmZyb21FdWxlclh5eihuZXcgb2ltby5WZWMzKG5vZGUubXR4TG9jYWwucm90YXRpb24ueCwgbm9kZS5tdHhMb2NhbC5yb3RhdGlvbi55LCBub2RlLm10eExvY2FsLnJvdGF0aW9uLnopKTtcclxuICAgIGxldCByYjogb2ltby5SaWdpZEJvZHkgPSBuZXcgb2ltby5SaWdpZEJvZHkoYm9keWMpO1xyXG4gICAgcmIuYWRkU2hhcGUobmV3IG9pbW8uU2hhcGUoc2hhcGVjKSk7XHJcbiAgICByYi5zZXRNYXNzRGF0YShtYXNzRGF0YSk7XHJcbiAgICByYi5nZXRTaGFwZUxpc3QoKS5zZXRSZXN0aXR1dGlvbigwKTtcclxuICAgIHJiLmdldFNoYXBlTGlzdCgpLnNldEZyaWN0aW9uKDEpO1xyXG4gICAgYm9kaWVzW25vXSA9IHJiO1xyXG4gICAgd29ybGQuYWRkUmlnaWRCb2R5KHJiKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGFwcGx5UGh5c2ljc0JvZHkoX2NtcFRyYW5zZm9ybTogZi5Db21wb25lbnRUcmFuc2Zvcm0sIG5vOiBudW1iZXIpOiB2b2lkIHtcclxuICAgIGxldCBub2RlOiBmLk5vZGUgPSBfY21wVHJhbnNmb3JtLmdldENvbnRhaW5lcigpO1xyXG4gICAgbGV0IHRtcFBvc2l0aW9uOiBmLlZlY3RvcjMgPSBuZXcgZi5WZWN0b3IzKGJvZGllc1tub10uZ2V0UG9zaXRpb24oKS54LCBib2RpZXNbbm9dLmdldFBvc2l0aW9uKCkueSwgYm9kaWVzW25vXS5nZXRQb3NpdGlvbigpLnopO1xyXG5cclxuICAgIGxldCBtdXRhdG9yOiBmLk11dGF0b3IgPSB7fTtcclxuICAgIGxldCBvcmllbnRhdGlvbjogb2ltby5RdWF0ID0gYm9kaWVzW25vXS5nZXRPcmllbnRhdGlvbigpO1xyXG4gICAgbGV0IHRtcFF1YXQ6IGYuUXVhdGVybmlvbiA9IG5ldyBmLlF1YXRlcm5pb24ob3JpZW50YXRpb24ueCwgb3JpZW50YXRpb24ueSwgb3JpZW50YXRpb24ueiwgb3JpZW50YXRpb24udyk7XHJcbiAgICBsZXQgdG1wUm90YXRpb246IGYuVmVjdG9yMyA9IHRtcFF1YXQudG9EZWdyZWVzKCk7XHJcbiAgICBtdXRhdG9yW1wicm90YXRpb25cIl0gPSB0bXBSb3RhdGlvbjtcclxuICAgIG11dGF0b3JbXCJ0cmFuc2xhdGlvblwiXSA9IHRtcFBvc2l0aW9uO1xyXG4gICAgbm9kZS5tdHhMb2NhbC5tdXRhdGUobXV0YXRvcik7XHJcbiAgfVxyXG5cclxufSJdfQ==