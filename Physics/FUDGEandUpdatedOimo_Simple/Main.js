"use strict";
///<reference types="../../Core/Build/FudgeCore.js"/>
///<reference types="../Physics_Library/OimoPhysics.js"/>
var f = FudgeCore;
//import { oimo } from "../Physics_Library/OimoPhysics";
var FudgePhysics_Communication;
//import { oimo } from "../Physics_Library/OimoPhysics";
(function (FudgePhysics_Communication) {
    var oimo = window.OIMO;
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
    let matHit = new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0, 1, 0, 1)));
    let matNormal = new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1)));
    function init(_event) {
        f.Debug.log(app);
        f.RenderManager.initialize();
        hierarchy = new f.Node("Scene");
        let ground = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube());
        let cmpGroundMesh = ground.getComponent(f.ComponentTransform);
        cmpGroundMesh.local.scale(new f.Vector3(10, 0.3, 10));
        hierarchy.appendChild(ground);
        cubes[0] = createCompleteMeshNode("Cube_1", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
        let cmpCubeTransform = cubes[0].getComponent(f.ComponentTransform);
        cmpCubeTransform.local.translate(new f.Vector3(0, 2, 0));
        //cubes[0].mtxLocal.rotateX(45);
        hierarchy.appendChild(cubes[0]);
        cubes[1] = createCompleteMeshNode("Cube_2", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
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
        //Physics OIMO
        initializePhysicsBody(ground.getComponent(f.ComponentTransform), false, 0);
        initializePhysicsBody(cmpCubeTransform, true, 1);
        initializePhysicsBody(cmpCubeTransform2, true, 2);
        //EndPhysics
        viewPort = new f.Viewport();
        viewPort.initialize("Viewport", hierarchy, cmpCamera, app);
        viewPort.showSceneGraph();
        f.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, update);
        f.Loop.start();
    }
    function update() {
        //Physics OIMO
        world.step(f.Loop.timeFrameGame / 1000);
        applyPhysicsBody(cubes[0].getComponent(f.ComponentTransform), 1);
        applyPhysicsBody(cubes[1].getComponent(f.ComponentTransform), 2);
        //EndPhysics
        raycastMatChange();
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
    function createCompleteMeshNode(_name, _material, _mesh) {
        let node = new f.Node(_name);
        let cmpMesh = new f.ComponentMesh(_mesh);
        let cmpMaterial = new f.ComponentMaterial(_material);
        let cmpTransform = new f.ComponentTransform();
        node.addComponent(cmpMesh);
        node.addComponent(cmpMaterial);
        node.addComponent(cmpTransform);
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
        let rotMutator = {};
        let tmpRotation = makeRotationFromQuaternion(bodies[no].getOrientation());
        rotMutator["rotation"] = tmpRotation;
        rotMutator["translation"] = tmpPosition;
        node.mtxLocal.mutate(rotMutator);
    }
    function raycastMatChange() {
        let ray = new oimo.RayCastClosest();
        let begin = new oimo.Vec3(-5, 0.3, 0);
        let end = getRayEndPoint(begin, new f.Vector3(1, 0, 0), 10);
        ray.clear();
        world.rayCast(begin, end, ray);
        if (ray.hit)
            cubes[0].getComponent(f.ComponentMaterial).material = matHit;
        else {
            cubes[0].getComponent(f.ComponentMaterial).material = matNormal;
        }
    }
    function makeRotationFromQuaternion(q) {
        let angles = new f.Vector3();
        // roll (x-axis rotation)
        let sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
        let cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
        angles.x = Math.atan2(sinr_cosp, cosr_cosp) * 60;
        // pitch (y-axis rotation)
        let sinp = 2 * (q.w * q.y - q.z * q.x);
        if (Math.abs(sinp) >= 1)
            angles.y = copysign(Math.PI / 2, sinp) * 60; // use 90 degrees if out of range
        else
            angles.y = Math.asin(sinp);
        // yaw (z-axis rotation)
        let siny_cosp = 2 * (q.w * q.z + q.x * q.y);
        let cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
        angles.z = Math.atan2(siny_cosp, cosy_cosp) * 60;
        return angles;
    }
    function copysign(a, b) {
        return b < 0 ? -Math.abs(a) : Math.abs(a);
    }
    function getRayEndPoint(start, direction, length) {
        let endpoint = f.Vector3.ZERO();
        endpoint.add(start);
        let endDirection = direction;
        endDirection.scale(length);
        endpoint.add(endDirection);
        return endpoint;
    }
})(FudgePhysics_Communication || (FudgePhysics_Communication = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFEQUFxRDtBQUNyRCx5REFBeUQ7QUFDekQsSUFBTyxDQUFDLEdBQUcsU0FBUyxDQUFDO0FBQ3JCLHdEQUF3RDtBQUt4RCxJQUFVLDBCQUEwQixDQXVMbkM7QUE1TEQsd0RBQXdEO0FBS3hELFdBQVUsMEJBQTBCO0lBQ2xDLElBQU8sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFFMUIsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN0QyxNQUFNLEdBQUcsR0FBc0IsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNoRSxJQUFJLFFBQW9CLENBQUM7SUFDekIsSUFBSSxTQUFpQixDQUFDO0lBQ3RCLElBQUksR0FBVyxDQUFDO0lBQ2hCLE1BQU0sS0FBSyxHQUFhLEVBQUUsQ0FBQztJQUMzQixJQUFJLEtBQUssR0FBYSxJQUFJLEtBQUssRUFBRSxDQUFDO0lBQ2xDLElBQUksVUFBVSxHQUFnQixRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQy9ELElBQUksTUFBTSxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7SUFDekIsSUFBSSxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7SUFFN0IsSUFBSSxNQUFNLEdBQWUsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVHLElBQUksU0FBUyxHQUFlLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFD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QyxNQUFNLENBQUMsQ0FBQztRQUMzQixRQUFRLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzNCLE9BQU8sUUFBUSxDQUFDO0lBRWxCLENBQUM7QUFFSCxDQUFDLEVBdkxTLDBCQUEwQixLQUExQiwwQkFBMEIsUUF1TG5DIiwic291cmNlc0NvbnRlbnQiOlsiLy8vPHJlZmVyZW5jZSB0eXBlcz1cIi4uLy4uL0NvcmUvQnVpbGQvRnVkZ2VDb3JlLmpzXCIvPlxyXG4vLy88cmVmZXJlbmNlIHR5cGVzPVwiLi4vUGh5c2ljc19MaWJyYXJ5L09pbW9QaHlzaWNzLmpzXCIvPlxyXG5pbXBvcnQgZiA9IEZ1ZGdlQ29yZTtcclxuLy9pbXBvcnQgeyBvaW1vIH0gZnJvbSBcIi4uL1BoeXNpY3NfTGlicmFyeS9PaW1vUGh5c2ljc1wiO1xyXG5cclxuXHJcblxyXG5cclxubmFtZXNwYWNlIEZ1ZGdlUGh5c2ljc19Db21tdW5pY2F0aW9uIHtcclxuICBpbXBvcnQgb2ltbyA9IHdpbmRvdy5PSU1PO1xyXG5cclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgaW5pdCk7XHJcbiAgY29uc3QgYXBwOiBIVE1MQ2FudmFzRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJjYW52YXNcIik7XHJcbiAgbGV0IHZpZXdQb3J0OiBmLlZpZXdwb3J0O1xyXG4gIGxldCBoaWVyYXJjaHk6IGYuTm9kZTtcclxuICBsZXQgZnBzOiBudW1iZXI7XHJcbiAgY29uc3QgdGltZXM6IG51bWJlcltdID0gW107XHJcbiAgbGV0IGN1YmVzOiBmLk5vZGVbXSA9IG5ldyBBcnJheSgpO1xyXG4gIGxldCBmcHNEaXNwbGF5OiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJoMiNGUFNcIik7XHJcbiAgbGV0IGJvZGllcyA9IG5ldyBBcnJheSgpO1xyXG4gIGxldCB3b3JsZCA9IG5ldyBvaW1vLldvcmxkKCk7XHJcblxyXG4gIGxldCBtYXRIaXQ6IGYuTWF0ZXJpYWwgPSBuZXcgZi5NYXRlcmlhbChcIkdyb3VuZFwiLCBmLlNoYWRlckZsYXQsIG5ldyBmLkNvYXRDb2xvcmVkKG5ldyBmLkNvbG9yKDAsIDEsIDAsIDEpKSk7XHJcbiAgbGV0IG1hdE5vcm1hbDogZi5NYXRlcmlhbCA9IG5ldyBmLk1hdGVyaWFsKFwiR3JvdW5kXCIsIGYuU2hhZGVyRmxhdCwgbmV3IGYuQ29hdENvbG9yZWQobmV3IGYuQ29sb3IoMSwgMCwgMCwgMSkpKTtcclxuXHJcbiAgZnVuY3Rpb24gaW5pdChfZXZlbnQ6IEV2ZW50KTogdm9pZCB7XHJcbiAgICBmLkRlYnVnLmxvZyhhcHApO1xyXG4gICAgZi5SZW5kZXJNYW5hZ2VyLmluaXRpYWxpemUoKTtcclxuICAgIGhpZXJhcmNoeSA9IG5ldyBmLk5vZGUoXCJTY2VuZVwiKTtcclxuXHJcbiAgICBsZXQgZ3JvdW5kOiBmLk5vZGUgPSBjcmVhdGVDb21wbGV0ZU1lc2hOb2RlKFwiR3JvdW5kXCIsIG5ldyBmLk1hdGVyaWFsKFwiR3JvdW5kXCIsIGYuU2hhZGVyRmxhdCwgbmV3IGYuQ29hdENvbG9yZWQobmV3IGYuQ29sb3IoMC4yLCAwLjIsIDAuMiwgMSkpKSwgbmV3IGYuTWVzaEN1YmUoKSk7XHJcbiAgICBsZXQgY21wR3JvdW5kTWVzaDogZi5Db21wb25lbnRUcmFuc2Zvcm0gPSBncm91bmQuZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50VHJhbnNmb3JtKTtcclxuXHJcbiAgICBjbXBHcm91bmRNZXNoLmxvY2FsLnNjYWxlKG5ldyBmLlZlY3RvcjMoMTAsIDAuMywgMTApKTtcclxuICAgIGhpZXJhcmNoeS5hcHBlbmRDaGlsZChncm91bmQpO1xyXG5cclxuICAgIGN1YmVzWzBdID0gY3JlYXRlQ29tcGxldGVNZXNoTm9kZShcIkN1YmVfMVwiLCBuZXcgZi5NYXRlcmlhbChcIkN1YmVcIiwgZi5TaGFkZXJGbGF0LCBuZXcgZi5Db2F0Q29sb3JlZChuZXcgZi5Db2xvcigxLCAwLCAwLCAxKSkpLCBuZXcgZi5NZXNoQ3ViZSgpKTtcclxuICAgIGxldCBjbXBDdWJlVHJhbnNmb3JtOiBmLkNvbXBvbmVudFRyYW5zZm9ybSA9IGN1YmVzWzBdLmdldENvbXBvbmVudChmLkNvbXBvbmVudFRyYW5zZm9ybSk7XHJcbiAgICBjbXBDdWJlVHJhbnNmb3JtLmxvY2FsLnRyYW5zbGF0ZShuZXcgZi5WZWN0b3IzKDAsIDIsIDApKTtcclxuICAgIC8vY3ViZXNbMF0ubXR4TG9jYWwucm90YXRlWCg0NSk7XHJcbiAgICBoaWVyYXJjaHkuYXBwZW5kQ2hpbGQoY3ViZXNbMF0pO1xyXG5cclxuICAgIGN1YmVzWzFdID0gY3JlYXRlQ29tcGxldGVNZXNoTm9kZShcIkN1YmVfMlwiLCBuZXcgZi5NYXRlcmlhbChcIkN1YmVcIiwgZi5TaGFkZXJGbGF0LCBuZXcgZi5Db2F0Q29sb3JlZChuZXcgZi5Db2xvcigxLCAwLCAwLCAxKSkpLCBuZXcgZi5NZXNoQ3ViZSgpKTtcclxuICAgIGxldCBjbXBDdWJlVHJhbnNmb3JtMjogZi5Db21wb25lbnRUcmFuc2Zvcm0gPSBjdWJlc1sxXS5nZXRDb21wb25lbnQoZi5Db21wb25lbnRUcmFuc2Zvcm0pO1xyXG4gICAgY21wQ3ViZVRyYW5zZm9ybTIubG9jYWwudHJhbnNsYXRlKG5ldyBmLlZlY3RvcjMoMCwgMy41LCAwLjQpKTtcclxuICAgIGhpZXJhcmNoeS5hcHBlbmRDaGlsZChjdWJlc1sxXSk7XHJcblxyXG4gICAgbGV0IGNtcExpZ2h0OiBmLkNvbXBvbmVudExpZ2h0ID0gbmV3IGYuQ29tcG9uZW50TGlnaHQobmV3IGYuTGlnaHREaXJlY3Rpb25hbChmLkNvbG9yLkNTUyhcIldISVRFXCIpKSk7XHJcbiAgICBjbXBMaWdodC5waXZvdC5sb29rQXQobmV3IGYuVmVjdG9yMygwLjUsIC0xLCAtMC44KSk7XHJcbiAgICBoaWVyYXJjaHkuYWRkQ29tcG9uZW50KGNtcExpZ2h0KTtcclxuXHJcbiAgICBsZXQgY21wQ2FtZXJhOiBmLkNvbXBvbmVudENhbWVyYSA9IG5ldyBmLkNvbXBvbmVudENhbWVyYSgpO1xyXG4gICAgY21wQ2FtZXJhLmJhY2tncm91bmRDb2xvciA9IGYuQ29sb3IuQ1NTKFwiR1JFWVwiKTtcclxuICAgIGNtcENhbWVyYS5waXZvdC50cmFuc2xhdGUobmV3IGYuVmVjdG9yMygyLCAyLCAxMCkpO1xyXG4gICAgY21wQ2FtZXJhLnBpdm90Lmxvb2tBdChmLlZlY3RvcjMuWkVSTygpKTtcclxuXHJcbiAgICAvL1BoeXNpY3MgT0lNT1xyXG4gICAgaW5pdGlhbGl6ZVBoeXNpY3NCb2R5KGdyb3VuZC5nZXRDb21wb25lbnQoZi5Db21wb25lbnRUcmFuc2Zvcm0pLCBmYWxzZSwgMCk7XHJcbiAgICBpbml0aWFsaXplUGh5c2ljc0JvZHkoY21wQ3ViZVRyYW5zZm9ybSwgdHJ1ZSwgMSk7XHJcbiAgICBpbml0aWFsaXplUGh5c2ljc0JvZHkoY21wQ3ViZVRyYW5zZm9ybTIsIHRydWUsIDIpO1xyXG4gICAgLy9FbmRQaHlzaWNzXHJcblxyXG4gICAgdmlld1BvcnQgPSBuZXcgZi5WaWV3cG9ydCgpO1xyXG4gICAgdmlld1BvcnQuaW5pdGlhbGl6ZShcIlZpZXdwb3J0XCIsIGhpZXJhcmNoeSwgY21wQ2FtZXJhLCBhcHApO1xyXG5cclxuICAgIHZpZXdQb3J0LnNob3dTY2VuZUdyYXBoKCk7XHJcblxyXG4gICAgZi5Mb29wLmFkZEV2ZW50TGlzdGVuZXIoZi5FVkVOVC5MT09QX0ZSQU1FLCB1cGRhdGUpO1xyXG4gICAgZi5Mb29wLnN0YXJ0KCk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1cGRhdGUoKTogdm9pZCB7XHJcblxyXG4gICAgLy9QaHlzaWNzIE9JTU9cclxuICAgIHdvcmxkLnN0ZXAoZi5Mb29wLnRpbWVGcmFtZUdhbWUgLyAxMDAwKTtcclxuICAgIGFwcGx5UGh5c2ljc0JvZHkoY3ViZXNbMF0uZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50VHJhbnNmb3JtKSwgMSk7XHJcbiAgICBhcHBseVBoeXNpY3NCb2R5KGN1YmVzWzFdLmdldENvbXBvbmVudChmLkNvbXBvbmVudFRyYW5zZm9ybSksIDIpO1xyXG4gICAgLy9FbmRQaHlzaWNzXHJcbiAgICByYXljYXN0TWF0Q2hhbmdlKCk7XHJcblxyXG4gICAgdmlld1BvcnQuZHJhdygpO1xyXG4gICAgbWVhc3VyZUZQUygpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gbWVhc3VyZUZQUygpOiB2b2lkIHtcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG4gICAgICBjb25zdCBub3cgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuICAgICAgd2hpbGUgKHRpbWVzLmxlbmd0aCA+IDAgJiYgdGltZXNbMF0gPD0gbm93IC0gMTAwMCkge1xyXG4gICAgICAgIHRpbWVzLnNoaWZ0KCk7XHJcbiAgICAgIH1cclxuICAgICAgdGltZXMucHVzaChub3cpO1xyXG4gICAgICBmcHMgPSB0aW1lcy5sZW5ndGg7XHJcbiAgICAgIGZwc0Rpc3BsYXkudGV4dENvbnRlbnQgPSBcIkZQUzogXCIgKyBmcHMudG9TdHJpbmcoKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY3JlYXRlQ29tcGxldGVNZXNoTm9kZShfbmFtZTogc3RyaW5nLCBfbWF0ZXJpYWw6IGYuTWF0ZXJpYWwsIF9tZXNoOiBmLk1lc2gpOiBmLk5vZGUge1xyXG4gICAgbGV0IG5vZGU6IGYuTm9kZSA9IG5ldyBmLk5vZGUoX25hbWUpO1xyXG4gICAgbGV0IGNtcE1lc2g6IGYuQ29tcG9uZW50TWVzaCA9IG5ldyBmLkNvbXBvbmVudE1lc2goX21lc2gpO1xyXG4gICAgbGV0IGNtcE1hdGVyaWFsOiBmLkNvbXBvbmVudE1hdGVyaWFsID0gbmV3IGYuQ29tcG9uZW50TWF0ZXJpYWwoX21hdGVyaWFsKTtcclxuXHJcbiAgICBsZXQgY21wVHJhbnNmb3JtOiBmLkNvbXBvbmVudFRyYW5zZm9ybSA9IG5ldyBmLkNvbXBvbmVudFRyYW5zZm9ybSgpO1xyXG4gICAgbm9kZS5hZGRDb21wb25lbnQoY21wTWVzaCk7XHJcbiAgICBub2RlLmFkZENvbXBvbmVudChjbXBNYXRlcmlhbCk7XHJcbiAgICBub2RlLmFkZENvbXBvbmVudChjbXBUcmFuc2Zvcm0pO1xyXG5cclxuICAgIHJldHVybiBub2RlO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gaW5pdGlhbGl6ZVBoeXNpY3NCb2R5KF9jbXBUcmFuc2Zvcm06IGYuQ29tcG9uZW50VHJhbnNmb3JtLCBkeW5hbWljOiBib29sZWFuLCBubzogbnVtYmVyKSB7XHJcbiAgICBsZXQgbm9kZTogZi5Ob2RlID0gX2NtcFRyYW5zZm9ybS5nZXRDb250YWluZXIoKTtcclxuICAgIGxldCBzY2FsZTogb2ltby5WZWMzID0gbmV3IG9pbW8uVmVjMyhub2RlLm10eExvY2FsLnNjYWxpbmcueCAvIDIsIG5vZGUubXR4TG9jYWwuc2NhbGluZy55IC8gMiwgbm9kZS5tdHhMb2NhbC5zY2FsaW5nLnogLyAyKTtcclxuICAgIGxldCBzaGFwZWM6IG9pbW8uU2hhcGVDb25maWcgPSBuZXcgb2ltby5TaGFwZUNvbmZpZygpO1xyXG4gICAgbGV0IGdlb21ldHJ5OiBvaW1vLkdlb21ldHJ5ID0gbmV3IG9pbW8uQm94R2VvbWV0cnkoc2NhbGUpO1xyXG4gICAgc2hhcGVjLmdlb21ldHJ5ID0gZ2VvbWV0cnk7XHJcbiAgICBsZXQgbWFzc0RhdGE6IG9pbW8uTWFzc0RhdGEgPSBuZXcgb2ltby5NYXNzRGF0YSgpO1xyXG4gICAgbWFzc0RhdGEubWFzcyA9IDE7XHJcblxyXG4gICAgbGV0IGJvZHljOiBvaW1vLlJpZ2lkQm9keUNvbmZpZyA9IG5ldyBvaW1vLlJpZ2lkQm9keUNvbmZpZygpO1xyXG4gICAgYm9keWMudHlwZSA9IGR5bmFtaWMgPyBvaW1vLlJpZ2lkQm9keVR5cGUuRFlOQU1JQyA6IG9pbW8uUmlnaWRCb2R5VHlwZS5TVEFUSUM7XHJcbiAgICBib2R5Yy5wb3NpdGlvbiA9IG5ldyBvaW1vLlZlYzMobm9kZS5tdHhMb2NhbC50cmFuc2xhdGlvbi54LCBub2RlLm10eExvY2FsLnRyYW5zbGF0aW9uLnksIG5vZGUubXR4TG9jYWwudHJhbnNsYXRpb24ueik7XHJcbiAgICBib2R5Yy5yb3RhdGlvbi5mcm9tRXVsZXJYeXoobmV3IG9pbW8uVmVjMyhub2RlLm10eExvY2FsLnJvdGF0aW9uLngsIG5vZGUubXR4TG9jYWwucm90YXRpb24ueSwgbm9kZS5tdHhMb2NhbC5yb3RhdGlvbi56KSk7XHJcbiAgICBsZXQgcmI6IG9pbW8uUmlnaWRCb2R5ID0gbmV3IG9pbW8uUmlnaWRCb2R5KGJvZHljKTtcclxuICAgIHJiLmFkZFNoYXBlKG5ldyBvaW1vLlNoYXBlKHNoYXBlYykpO1xyXG4gICAgcmIuc2V0TWFzc0RhdGEobWFzc0RhdGEpO1xyXG4gICAgcmIuZ2V0U2hhcGVMaXN0KCkuc2V0UmVzdGl0dXRpb24oMCk7XHJcbiAgICByYi5nZXRTaGFwZUxpc3QoKS5zZXRGcmljdGlvbigxKTtcclxuICAgIGJvZGllc1tub10gPSByYjtcclxuICAgIHdvcmxkLmFkZFJpZ2lkQm9keShyYik7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBhcHBseVBoeXNpY3NCb2R5KF9jbXBUcmFuc2Zvcm06IGYuQ29tcG9uZW50VHJhbnNmb3JtLCBubzogbnVtYmVyKTogdm9pZCB7XHJcbiAgICBsZXQgbm9kZTogZi5Ob2RlID0gX2NtcFRyYW5zZm9ybS5nZXRDb250YWluZXIoKTtcclxuICAgIGxldCB0bXBQb3NpdGlvbjogZi5WZWN0b3IzID0gbmV3IGYuVmVjdG9yMyhib2RpZXNbbm9dLmdldFBvc2l0aW9uKCkueCwgYm9kaWVzW25vXS5nZXRQb3NpdGlvbigpLnksIGJvZGllc1tub10uZ2V0UG9zaXRpb24oKS56KTtcclxuXHJcbiAgICBsZXQgcm90TXV0YXRvcjogZi5NdXRhdG9yID0ge307XHJcbiAgICBsZXQgdG1wUm90YXRpb246IGYuVmVjdG9yMyA9IG1ha2VSb3RhdGlvbkZyb21RdWF0ZXJuaW9uKGJvZGllc1tub10uZ2V0T3JpZW50YXRpb24oKSk7XHJcbiAgICByb3RNdXRhdG9yW1wicm90YXRpb25cIl0gPSB0bXBSb3RhdGlvbjtcclxuICAgIHJvdE11dGF0b3JbXCJ0cmFuc2xhdGlvblwiXSA9IHRtcFBvc2l0aW9uO1xyXG4gICAgbm9kZS5tdHhMb2NhbC5tdXRhdGUocm90TXV0YXRvcik7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiByYXljYXN0TWF0Q2hhbmdlKCk6IHZvaWQge1xyXG4gICAgbGV0IHJheTogb2ltby5SYXlDYXN0Q2xvc2VzdCA9IG5ldyBvaW1vLlJheUNhc3RDbG9zZXN0KCk7XHJcbiAgICBsZXQgYmVnaW46IG9pbW8uVmVjMyA9IG5ldyBvaW1vLlZlYzMoLSA1LCAwLjMsIDApO1xyXG4gICAgbGV0IGVuZDogb2ltby5WZWMzID0gZ2V0UmF5RW5kUG9pbnQoYmVnaW4sIG5ldyBmLlZlY3RvcjMoMSwgMCwgMCksIDEwKTtcclxuICAgIHJheS5jbGVhcigpO1xyXG4gICAgd29ybGQucmF5Q2FzdChiZWdpbiwgZW5kLCByYXkpO1xyXG4gICAgaWYgKHJheS5oaXQpXHJcbiAgICAgIGN1YmVzWzBdLmdldENvbXBvbmVudChmLkNvbXBvbmVudE1hdGVyaWFsKS5tYXRlcmlhbCA9IG1hdEhpdDtcclxuICAgIGVsc2Uge1xyXG4gICAgICBjdWJlc1swXS5nZXRDb21wb25lbnQoZi5Db21wb25lbnRNYXRlcmlhbCkubWF0ZXJpYWwgPSBtYXROb3JtYWw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBtYWtlUm90YXRpb25Gcm9tUXVhdGVybmlvbihxOiBhbnkpOiBmLlZlY3RvcjMge1xyXG4gICAgbGV0IGFuZ2xlczogZi5WZWN0b3IzID0gbmV3IGYuVmVjdG9yMygpO1xyXG5cclxuICAgIC8vIHJvbGwgKHgtYXhpcyByb3RhdGlvbilcclxuICAgIGxldCBzaW5yX2Nvc3A6IG51bWJlciA9IDIgKiAocS53ICogcS54ICsgcS55ICogcS56KTtcclxuICAgIGxldCBjb3NyX2Nvc3A6IG51bWJlciA9IDEgLSAyICogKHEueCAqIHEueCArIHEueSAqIHEueSk7XHJcbiAgICBhbmdsZXMueCA9IE1hdGguYXRhbjIoc2lucl9jb3NwLCBjb3NyX2Nvc3ApICogNjA7XHJcblxyXG4gICAgLy8gcGl0Y2ggKHktYXhpcyByb3RhdGlvbilcclxuICAgIGxldCBzaW5wOiBudW1iZXIgPSAyICogKHEudyAqIHEueSAtIHEueiAqIHEueCk7XHJcbiAgICBpZiAoTWF0aC5hYnMoc2lucCkgPj0gMSlcclxuICAgICAgYW5nbGVzLnkgPSBjb3B5c2lnbihNYXRoLlBJIC8gMiwgc2lucCkgKiA2MDsgLy8gdXNlIDkwIGRlZ3JlZXMgaWYgb3V0IG9mIHJhbmdlXHJcbiAgICBlbHNlXHJcbiAgICAgIGFuZ2xlcy55ID0gTWF0aC5hc2luKHNpbnApO1xyXG5cclxuICAgIC8vIHlhdyAoei1heGlzIHJvdGF0aW9uKVxyXG4gICAgbGV0IHNpbnlfY29zcDogbnVtYmVyID0gMiAqIChxLncgKiBxLnogKyBxLnggKiBxLnkpO1xyXG4gICAgbGV0IGNvc3lfY29zcDogbnVtYmVyID0gMSAtIDIgKiAocS55ICogcS55ICsgcS56ICogcS56KTtcclxuICAgIGFuZ2xlcy56ID0gTWF0aC5hdGFuMihzaW55X2Nvc3AsIGNvc3lfY29zcCkgKiA2MDtcclxuICAgIHJldHVybiBhbmdsZXM7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBjb3B5c2lnbihhOiBudW1iZXIsIGI6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICByZXR1cm4gYiA8IDAgPyAtTWF0aC5hYnMoYSkgOiBNYXRoLmFicyhhKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdldFJheUVuZFBvaW50KHN0YXJ0OiBmLlZlY3RvcjMsIGRpcmVjdGlvbjogZi5WZWN0b3IzLCBsZW5ndGg6IG51bWJlcik6IGYuVmVjdG9yMyB7XHJcbiAgICBsZXQgZW5kcG9pbnQ6IGYuVmVjdG9yMyA9IGYuVmVjdG9yMy5aRVJPKCk7XHJcbiAgICBlbmRwb2ludC5hZGQoc3RhcnQpO1xyXG4gICAgbGV0IGVuZERpcmVjdGlvbjogZi5WZWN0b3IzID0gZGlyZWN0aW9uO1xyXG4gICAgZW5kRGlyZWN0aW9uLnNjYWxlKGxlbmd0aCk7XHJcbiAgICBlbmRwb2ludC5hZGQoZW5kRGlyZWN0aW9uKTtcclxuICAgIHJldHVybiBlbmRwb2ludDtcclxuXHJcbiAgfVxyXG5cclxufSJdfQ==