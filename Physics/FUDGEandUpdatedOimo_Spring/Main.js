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
    let floorSpring;
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
        cmpCubeTransform.local.translate(new f.Vector3(0, 1.5, 0));
        //cubes[0].mtxLocal.rotateX(45);
        hierarchy.appendChild(cubes[0]);
        cubes[1] = createCompleteMeshNode("Cube_2", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
        let cmpCubeTransform2 = cubes[1].getComponent(f.ComponentTransform);
        cmpCubeTransform2.local.translate(new f.Vector3(0, 3.5, 0.4));
        hierarchy.appendChild(cubes[1]);
        cubes[2] = createCompleteMeshNode("Cube_3", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
        let cmpCubeTransform3 = cubes[2].getComponent(f.ComponentTransform);
        cmpCubeTransform3.local.translate(new f.Vector3(0, 7, 0.4));
        hierarchy.appendChild(cubes[2]);
        cubes[3] = createCompleteMeshNode("Cube_4", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
        let cmpCubeTransform4 = cubes[3].getComponent(f.ComponentTransform);
        cmpCubeTransform4.local.translate(new f.Vector3(0, 15, 0.4));
        hierarchy.appendChild(cubes[3]);
        let cmpLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
        cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
        hierarchy.addComponent(cmpLight);
        let cmpCamera = new f.ComponentCamera();
        cmpCamera.backgroundColor = f.Color.CSS("GREY");
        cmpCamera.pivot.translate(new f.Vector3(2, 2, 15));
        cmpCamera.pivot.lookAt(f.Vector3.ZERO());
        //Physics OIMO
        initializePhysicsBody(ground.getComponent(f.ComponentTransform), false, 0);
        initializePhysicsBody(cmpCubeTransform, true, 1);
        initializePhysicsBody(cmpCubeTransform2, true, 2);
        initializePhysicsBody(cmpCubeTransform3, true, 3);
        initializePhysicsBody(cmpCubeTransform4, true, 4);
        floorSpring = addPrismaticJoint(bodies[0], bodies[1]);
        floorSpring.setBreakForce(100);
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
        applyPhysicsBody(cubes[2].getComponent(f.ComponentTransform), 3);
        applyPhysicsBody(cubes[3].getComponent(f.ComponentTransform), 4);
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
    function addPrismaticJoint(rb1, rb2) {
        let axis = new oimo.Vec3(0, 1, 0);
        let anchor = rb1.getPosition();
        let jc = new oimo.PrismaticJointConfig();
        jc.init(rb1, rb2, anchor, axis);
        let springDamper = new oimo.SpringDamper().setSpring(3, 0.2);
        let limitMotor = new oimo.TranslationalLimitMotor().setLimits(0, 0);
        jc.springDamper = springDamper;
        jc.limitMotor = limitMotor;
        let j = new oimo.PrismaticJoint(jc);
        world.addJoint(j);
        return j;
    }
})(FudgePhysics_Communication || (FudgePhysics_Communication = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFEQUFxRDtBQUNyRCx5REFBeUQ7QUFDekQsSUFBTyxDQUFDLEdBQUcsU0FBUyxDQUFDO0FBRXJCLHdEQUF3RDtBQUt4RCxJQUFVLDBCQUEwQixDQXNObkM7QUEzTkQsd0RBQXdEO0FBS3hELFdBQVUsMEJBQTBCO0lBQ2xDLElBQU8sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUE7SUFFekIsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN0QyxNQUFNLEdBQUcsR0FBc0IsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNoRSxJQUFJLFFBQW9CLENBQUM7SUFDekIsSUFBSSxTQUFpQixDQUFDO0lBQ3RCLElBQUksR0FBVyxDQUFDO0lBQ2hCLE1BQU0sS0FBSyxHQUFhLEVBQUUsQ0FBQztJQUMzQixJQUFJLEtBQUssR0FBYSxJQUFJLEtBQUssRUFBRSxDQUFDO0lBQ2xDLElBQUksVUFBVSxHQUFnQixRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQy9ELElBQUksTUFBTSxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7SUFDekIsSUFBSSxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDN0IsSUFBSSxXQUF1QixDQUFDO0lBRTVCLElBQUksTUFBTSxHQUFlLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1RyxJQUFJLFNBQVMsR0FBZSxJQUFJLENBQUMsQ0FBQyxRQUFRLENB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UUFDekIsSUFBSSxTQUFTLEdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BELElBQUksU0FBUyxHQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEQsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFakQsMEJBQTBCO1FBQzFCLElBQUksSUFBSSxHQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztZQUNyQixNQUFNLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxpQ0FBaUM7O1lBRTlFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUU3Qix3QkFBd0I7UUFDeEIsSUFBSSxTQUFTLEdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BELElBQUksU0FBUyxHQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEQsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDakQsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVELFNBQVMsUUFBUSxDQUFDLENBQVMsRUFBRSxDQUFTO1FBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFRCxTQUFTLGNBQWMsQ0FBQyxLQUFnQixFQUFFLFNBQW9CLEVBQUUsTUFBYztRQUM1RSxJQUFJLFFBQVEsR0FBYyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzNDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEIsSUFBSSxZQUFZLEdBQWMsU0FBUyxDQUFDO1FBQ3hDLFlBQVksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsUUFBUSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMzQixPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBRUQsU0FBUyxpQkFBaUIsQ0FBQyxHQUFtQixFQUFFLEdBQW1CO1FBQ2pFLElBQUksSUFBSSxHQUFjLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzdDLElBQUksTUFBTSxHQUFjLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUMxQyxJQUFJLEVBQUUsR0FBOEIsSUFBSSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUNwRSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hDLElBQUksWUFBWSxHQUFzQixJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2hGLElBQUksVUFBVSxHQUFpQyxJQUFJLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEcsRUFBRSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7UUFDL0IsRUFBRSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFDM0IsSUFBSSxDQUFDLEdBQXdCLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN6RCxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xCLE9BQU8sQ0FBQyxDQUFDO0lBQ1gsQ0FBQztBQUdILENBQUMsRUF0TlMsMEJBQTBCLEtBQTFCLDBCQUEwQixRQXNObkMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy88cmVmZXJlbmNlIHR5cGVzPVwiLi4vLi4vQ29yZS9CdWlsZC9GdWRnZUNvcmUuanNcIi8+XHJcbi8vLzxyZWZlcmVuY2UgdHlwZXM9XCIuLi9QaHlzaWNzX0xpYnJhcnkvT2ltb1BoeXNpY3MuanNcIi8+XHJcbmltcG9ydCBmID0gRnVkZ2VDb3JlO1xyXG5cclxuLy9pbXBvcnQgeyBvaW1vIH0gZnJvbSBcIi4uL1BoeXNpY3NfTGlicmFyeS9PaW1vUGh5c2ljc1wiO1xyXG5cclxuXHJcblxyXG5cclxubmFtZXNwYWNlIEZ1ZGdlUGh5c2ljc19Db21tdW5pY2F0aW9uIHtcclxuICBpbXBvcnQgb2ltbyA9IHdpbmRvdy5PSU1PXHJcblxyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBpbml0KTtcclxuICBjb25zdCBhcHA6IEhUTUxDYW52YXNFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImNhbnZhc1wiKTtcclxuICBsZXQgdmlld1BvcnQ6IGYuVmlld3BvcnQ7XHJcbiAgbGV0IGhpZXJhcmNoeTogZi5Ob2RlO1xyXG4gIGxldCBmcHM6IG51bWJlcjtcclxuICBjb25zdCB0aW1lczogbnVtYmVyW10gPSBbXTtcclxuICBsZXQgY3ViZXM6IGYuTm9kZVtdID0gbmV3IEFycmF5KCk7XHJcbiAgbGV0IGZwc0Rpc3BsYXk6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImgyI0ZQU1wiKTtcclxuICBsZXQgYm9kaWVzID0gbmV3IEFycmF5KCk7XHJcbiAgbGV0IHdvcmxkID0gbmV3IG9pbW8uV29ybGQoKTtcclxuICBsZXQgZmxvb3JTcHJpbmc6IG9pbW8uam9pbnQ7XHJcblxyXG4gIGxldCBtYXRIaXQ6IGYuTWF0ZXJpYWwgPSBuZXcgZi5NYXRlcmlhbChcIkdyb3VuZFwiLCBmLlNoYWRlckZsYXQsIG5ldyBmLkNvYXRDb2xvcmVkKG5ldyBmLkNvbG9yKDAsIDEsIDAsIDEpKSk7XHJcbiAgbGV0IG1hdE5vcm1hbDogZi5NYXRlcmlhbCA9IG5ldyBmLk1hdGVyaWFsKFwiR3JvdW5kXCIsIGYuU2hhZGVyRmxhdCwgbmV3IGYuQ29hdENvbG9yZWQobmV3IGYuQ29sb3IoMSwgMCwgMCwgMSkpKTtcclxuXHJcbiAgZnVuY3Rpb24gaW5pdChfZXZlbnQ6IEV2ZW50KTogdm9pZCB7XHJcbiAgICBmLkRlYnVnLmxvZyhhcHApO1xyXG4gICAgZi5SZW5kZXJNYW5hZ2VyLmluaXRpYWxpemUoKTtcclxuICAgIGhpZXJhcmNoeSA9IG5ldyBmLk5vZGUoXCJTY2VuZVwiKTtcclxuXHJcbiAgICBsZXQgZ3JvdW5kOiBmLk5vZGUgPSBjcmVhdGVDb21wbGV0ZU1lc2hOb2RlKFwiR3JvdW5kXCIsIG5ldyBmLk1hdGVyaWFsKFwiR3JvdW5kXCIsIGYuU2hhZGVyRmxhdCwgbmV3IGYuQ29hdENvbG9yZWQobmV3IGYuQ29sb3IoMC4yLCAwLjIsIDAuMiwgMSkpKSwgbmV3IGYuTWVzaEN1YmUoKSk7XHJcbiAgICBsZXQgY21wR3JvdW5kTWVzaDogZi5Db21wb25lbnRUcmFuc2Zvcm0gPSBncm91bmQuZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50VHJhbnNmb3JtKTtcclxuXHJcbiAgICBjbXBHcm91bmRNZXNoLmxvY2FsLnNjYWxlKG5ldyBmLlZlY3RvcjMoMTAsIDAuMywgMTApKTtcclxuICAgIGhpZXJhcmNoeS5hcHBlbmRDaGlsZChncm91bmQpO1xyXG5cclxuICAgIGN1YmVzWzBdID0gY3JlYXRlQ29tcGxldGVNZXNoTm9kZShcIkN1YmVfMVwiLCBuZXcgZi5NYXRlcmlhbChcIkN1YmVcIiwgZi5TaGFkZXJGbGF0LCBuZXcgZi5Db2F0Q29sb3JlZChuZXcgZi5Db2xvcigxLCAwLCAwLCAxKSkpLCBuZXcgZi5NZXNoQ3ViZSgpKTtcclxuICAgIGxldCBjbXBDdWJlVHJhbnNmb3JtOiBmLkNvbXBvbmVudFRyYW5zZm9ybSA9IGN1YmVzWzBdLmdldENvbXBvbmVudChmLkNvbXBvbmVudFRyYW5zZm9ybSk7XHJcbiAgICBjbXBDdWJlVHJhbnNmb3JtLmxvY2FsLnRyYW5zbGF0ZShuZXcgZi5WZWN0b3IzKDAsIDEuNSwgMCkpO1xyXG4gICAgLy9jdWJlc1swXS5tdHhMb2NhbC5yb3RhdGVYKDQ1KTtcclxuICAgIGhpZXJhcmNoeS5hcHBlbmRDaGlsZChjdWJlc1swXSk7XHJcblxyXG4gICAgY3ViZXNbMV0gPSBjcmVhdGVDb21wbGV0ZU1lc2hOb2RlKFwiQ3ViZV8yXCIsIG5ldyBmLk1hdGVyaWFsKFwiQ3ViZVwiLCBmLlNoYWRlckZsYXQsIG5ldyBmLkNvYXRDb2xvcmVkKG5ldyBmLkNvbG9yKDEsIDAsIDAsIDEpKSksIG5ldyBmLk1lc2hDdWJlKCkpO1xyXG4gICAgbGV0IGNtcEN1YmVUcmFuc2Zvcm0yOiBmLkNvbXBvbmVudFRyYW5zZm9ybSA9IGN1YmVzWzFdLmdldENvbXBvbmVudChmLkNvbXBvbmVudFRyYW5zZm9ybSk7XHJcbiAgICBjbXBDdWJlVHJhbnNmb3JtMi5sb2NhbC50cmFuc2xhdGUobmV3IGYuVmVjdG9yMygwLCAzLjUsIDAuNCkpO1xyXG4gICAgaGllcmFyY2h5LmFwcGVuZENoaWxkKGN1YmVzWzFdKTtcclxuXHJcbiAgICBjdWJlc1syXSA9IGNyZWF0ZUNvbXBsZXRlTWVzaE5vZGUoXCJDdWJlXzNcIiwgbmV3IGYuTWF0ZXJpYWwoXCJDdWJlXCIsIGYuU2hhZGVyRmxhdCwgbmV3IGYuQ29hdENvbG9yZWQobmV3IGYuQ29sb3IoMSwgMCwgMCwgMSkpKSwgbmV3IGYuTWVzaEN1YmUoKSk7XHJcbiAgICBsZXQgY21wQ3ViZVRyYW5zZm9ybTM6IGYuQ29tcG9uZW50VHJhbnNmb3JtID0gY3ViZXNbMl0uZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50VHJhbnNmb3JtKTtcclxuICAgIGNtcEN1YmVUcmFuc2Zvcm0zLmxvY2FsLnRyYW5zbGF0ZShuZXcgZi5WZWN0b3IzKDAsIDcsIDAuNCkpO1xyXG4gICAgaGllcmFyY2h5LmFwcGVuZENoaWxkKGN1YmVzWzJdKTtcclxuXHJcbiAgICBjdWJlc1szXSA9IGNyZWF0ZUNvbXBsZXRlTWVzaE5vZGUoXCJDdWJlXzRcIiwgbmV3IGYuTWF0ZXJpYWwoXCJDdWJlXCIsIGYuU2hhZGVyRmxhdCwgbmV3IGYuQ29hdENvbG9yZWQobmV3IGYuQ29sb3IoMSwgMCwgMCwgMSkpKSwgbmV3IGYuTWVzaEN1YmUoKSk7XHJcbiAgICBsZXQgY21wQ3ViZVRyYW5zZm9ybTQ6IGYuQ29tcG9uZW50VHJhbnNmb3JtID0gY3ViZXNbM10uZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50VHJhbnNmb3JtKTtcclxuICAgIGNtcEN1YmVUcmFuc2Zvcm00LmxvY2FsLnRyYW5zbGF0ZShuZXcgZi5WZWN0b3IzKDAsIDE1LCAwLjQpKTtcclxuICAgIGhpZXJhcmNoeS5hcHBlbmRDaGlsZChjdWJlc1szXSk7XHJcblxyXG4gICAgbGV0IGNtcExpZ2h0OiBmLkNvbXBvbmVudExpZ2h0ID0gbmV3IGYuQ29tcG9uZW50TGlnaHQobmV3IGYuTGlnaHREaXJlY3Rpb25hbChmLkNvbG9yLkNTUyhcIldISVRFXCIpKSk7XHJcbiAgICBjbXBMaWdodC5waXZvdC5sb29rQXQobmV3IGYuVmVjdG9yMygwLjUsIC0xLCAtMC44KSk7XHJcbiAgICBoaWVyYXJjaHkuYWRkQ29tcG9uZW50KGNtcExpZ2h0KTtcclxuXHJcbiAgICBsZXQgY21wQ2FtZXJhOiBmLkNvbXBvbmVudENhbWVyYSA9IG5ldyBmLkNvbXBvbmVudENhbWVyYSgpO1xyXG4gICAgY21wQ2FtZXJhLmJhY2tncm91bmRDb2xvciA9IGYuQ29sb3IuQ1NTKFwiR1JFWVwiKTtcclxuICAgIGNtcENhbWVyYS5waXZvdC50cmFuc2xhdGUobmV3IGYuVmVjdG9yMygyLCAyLCAxNSkpO1xyXG4gICAgY21wQ2FtZXJhLnBpdm90Lmxvb2tBdChmLlZlY3RvcjMuWkVSTygpKTtcclxuXHJcbiAgICAvL1BoeXNpY3MgT0lNT1xyXG4gICAgaW5pdGlhbGl6ZVBoeXNpY3NCb2R5KGdyb3VuZC5nZXRDb21wb25lbnQoZi5Db21wb25lbnRUcmFuc2Zvcm0pLCBmYWxzZSwgMCk7XHJcbiAgICBpbml0aWFsaXplUGh5c2ljc0JvZHkoY21wQ3ViZVRyYW5zZm9ybSwgdHJ1ZSwgMSk7XHJcbiAgICBpbml0aWFsaXplUGh5c2ljc0JvZHkoY21wQ3ViZVRyYW5zZm9ybTIsIHRydWUsIDIpO1xyXG4gICAgaW5pdGlhbGl6ZVBoeXNpY3NCb2R5KGNtcEN1YmVUcmFuc2Zvcm0zLCB0cnVlLCAzKTtcclxuICAgIGluaXRpYWxpemVQaHlzaWNzQm9keShjbXBDdWJlVHJhbnNmb3JtNCwgdHJ1ZSwgNCk7XHJcbiAgICBmbG9vclNwcmluZyA9IGFkZFByaXNtYXRpY0pvaW50KGJvZGllc1swXSwgYm9kaWVzWzFdKTtcclxuICAgIGZsb29yU3ByaW5nLnNldEJyZWFrRm9yY2UoMTAwKTtcclxuICAgIC8vRW5kUGh5c2ljc1xyXG5cclxuICAgIHZpZXdQb3J0ID0gbmV3IGYuVmlld3BvcnQoKTtcclxuICAgIHZpZXdQb3J0LmluaXRpYWxpemUoXCJWaWV3cG9ydFwiLCBoaWVyYXJjaHksIGNtcENhbWVyYSwgYXBwKTtcclxuXHJcbiAgICB2aWV3UG9ydC5zaG93U2NlbmVHcmFwaCgpO1xyXG5cclxuICAgIGYuTG9vcC5hZGRFdmVudExpc3RlbmVyKGYuRVZFTlQuTE9PUF9GUkFNRSwgdXBkYXRlKTtcclxuICAgIGYuTG9vcC5zdGFydCgpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdXBkYXRlKCk6IHZvaWQge1xyXG5cclxuICAgIC8vUGh5c2ljcyBPSU1PXHJcbiAgICB3b3JsZC5zdGVwKGYuTG9vcC50aW1lRnJhbWVHYW1lIC8gMTAwMCk7XHJcbiAgICBhcHBseVBoeXNpY3NCb2R5KGN1YmVzWzBdLmdldENvbXBvbmVudChmLkNvbXBvbmVudFRyYW5zZm9ybSksIDEpO1xyXG4gICAgYXBwbHlQaHlzaWNzQm9keShjdWJlc1sxXS5nZXRDb21wb25lbnQoZi5Db21wb25lbnRUcmFuc2Zvcm0pLCAyKTtcclxuICAgIGFwcGx5UGh5c2ljc0JvZHkoY3ViZXNbMl0uZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50VHJhbnNmb3JtKSwgMyk7XHJcbiAgICBhcHBseVBoeXNpY3NCb2R5KGN1YmVzWzNdLmdldENvbXBvbmVudChmLkNvbXBvbmVudFRyYW5zZm9ybSksIDQpO1xyXG4gICAgLy9FbmRQaHlzaWNzXHJcbiAgICByYXljYXN0TWF0Q2hhbmdlKCk7XHJcblxyXG4gICAgdmlld1BvcnQuZHJhdygpO1xyXG4gICAgbWVhc3VyZUZQUygpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gbWVhc3VyZUZQUygpOiB2b2lkIHtcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG4gICAgICBjb25zdCBub3cgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuICAgICAgd2hpbGUgKHRpbWVzLmxlbmd0aCA+IDAgJiYgdGltZXNbMF0gPD0gbm93IC0gMTAwMCkge1xyXG4gICAgICAgIHRpbWVzLnNoaWZ0KCk7XHJcbiAgICAgIH1cclxuICAgICAgdGltZXMucHVzaChub3cpO1xyXG4gICAgICBmcHMgPSB0aW1lcy5sZW5ndGg7XHJcbiAgICAgIGZwc0Rpc3BsYXkudGV4dENvbnRlbnQgPSBcIkZQUzogXCIgKyBmcHMudG9TdHJpbmcoKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY3JlYXRlQ29tcGxldGVNZXNoTm9kZShfbmFtZTogc3RyaW5nLCBfbWF0ZXJpYWw6IGYuTWF0ZXJpYWwsIF9tZXNoOiBmLk1lc2gpOiBmLk5vZGUge1xyXG4gICAgbGV0IG5vZGU6IGYuTm9kZSA9IG5ldyBmLk5vZGUoX25hbWUpO1xyXG4gICAgbGV0IGNtcE1lc2g6IGYuQ29tcG9uZW50TWVzaCA9IG5ldyBmLkNvbXBvbmVudE1lc2goX21lc2gpO1xyXG4gICAgbGV0IGNtcE1hdGVyaWFsOiBmLkNvbXBvbmVudE1hdGVyaWFsID0gbmV3IGYuQ29tcG9uZW50TWF0ZXJpYWwoX21hdGVyaWFsKTtcclxuXHJcbiAgICBsZXQgY21wVHJhbnNmb3JtOiBmLkNvbXBvbmVudFRyYW5zZm9ybSA9IG5ldyBmLkNvbXBvbmVudFRyYW5zZm9ybSgpO1xyXG4gICAgbm9kZS5hZGRDb21wb25lbnQoY21wTWVzaCk7XHJcbiAgICBub2RlLmFkZENvbXBvbmVudChjbXBNYXRlcmlhbCk7XHJcbiAgICBub2RlLmFkZENvbXBvbmVudChjbXBUcmFuc2Zvcm0pO1xyXG5cclxuICAgIHJldHVybiBub2RlO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gaW5pdGlhbGl6ZVBoeXNpY3NCb2R5KF9jbXBUcmFuc2Zvcm06IGYuQ29tcG9uZW50VHJhbnNmb3JtLCBkeW5hbWljOiBib29sZWFuLCBubzogbnVtYmVyKSB7XHJcbiAgICBsZXQgbm9kZTogZi5Ob2RlID0gX2NtcFRyYW5zZm9ybS5nZXRDb250YWluZXIoKTtcclxuICAgIGxldCBzY2FsZTogb2ltby5WZWMzID0gbmV3IG9pbW8uVmVjMyhub2RlLm10eExvY2FsLnNjYWxpbmcueCAvIDIsIG5vZGUubXR4TG9jYWwuc2NhbGluZy55IC8gMiwgbm9kZS5tdHhMb2NhbC5zY2FsaW5nLnogLyAyKTtcclxuICAgIGxldCBzaGFwZWM6IG9pbW8uU2hhcGVDb25maWcgPSBuZXcgb2ltby5TaGFwZUNvbmZpZygpO1xyXG4gICAgbGV0IGdlb21ldHJ5OiBvaW1vLkdlb21ldHJ5ID0gbmV3IG9pbW8uQm94R2VvbWV0cnkoc2NhbGUpO1xyXG4gICAgc2hhcGVjLmdlb21ldHJ5ID0gZ2VvbWV0cnk7XHJcbiAgICBsZXQgbWFzc0RhdGE6IG9pbW8uTWFzc0RhdGEgPSBuZXcgb2ltby5NYXNzRGF0YSgpO1xyXG4gICAgbWFzc0RhdGEubWFzcyA9IDE7XHJcblxyXG4gICAgbGV0IGJvZHljOiBvaW1vLlJpZ2lkQm9keUNvbmZpZyA9IG5ldyBvaW1vLlJpZ2lkQm9keUNvbmZpZygpO1xyXG4gICAgYm9keWMudHlwZSA9IGR5bmFtaWMgPyBvaW1vLlJpZ2lkQm9keVR5cGUuRFlOQU1JQyA6IG9pbW8uUmlnaWRCb2R5VHlwZS5TVEFUSUM7XHJcbiAgICBib2R5Yy5wb3NpdGlvbiA9IG5ldyBvaW1vLlZlYzMobm9kZS5tdHhMb2NhbC50cmFuc2xhdGlvbi54LCBub2RlLm10eExvY2FsLnRyYW5zbGF0aW9uLnksIG5vZGUubXR4TG9jYWwudHJhbnNsYXRpb24ueik7XHJcbiAgICBib2R5Yy5yb3RhdGlvbi5mcm9tRXVsZXJYeXoobmV3IG9pbW8uVmVjMyhub2RlLm10eExvY2FsLnJvdGF0aW9uLngsIG5vZGUubXR4TG9jYWwucm90YXRpb24ueSwgbm9kZS5tdHhMb2NhbC5yb3RhdGlvbi56KSk7XHJcbiAgICBsZXQgcmI6IG9pbW8uUmlnaWRCb2R5ID0gbmV3IG9pbW8uUmlnaWRCb2R5KGJvZHljKTtcclxuICAgIHJiLmFkZFNoYXBlKG5ldyBvaW1vLlNoYXBlKHNoYXBlYykpO1xyXG4gICAgcmIuc2V0TWFzc0RhdGEobWFzc0RhdGEpO1xyXG4gICAgcmIuZ2V0U2hhcGVMaXN0KCkuc2V0UmVzdGl0dXRpb24oMCk7XHJcbiAgICByYi5nZXRTaGFwZUxpc3QoKS5zZXRGcmljdGlvbigxKTtcclxuICAgIGJvZGllc1tub10gPSByYjtcclxuICAgIHdvcmxkLmFkZFJpZ2lkQm9keShyYik7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBhcHBseVBoeXNpY3NCb2R5KF9jbXBUcmFuc2Zvcm06IGYuQ29tcG9uZW50VHJhbnNmb3JtLCBubzogbnVtYmVyKTogdm9pZCB7XHJcbiAgICBsZXQgbm9kZTogZi5Ob2RlID0gX2NtcFRyYW5zZm9ybS5nZXRDb250YWluZXIoKTtcclxuICAgIGxldCB0bXBQb3NpdGlvbjogZi5WZWN0b3IzID0gbmV3IGYuVmVjdG9yMyhib2RpZXNbbm9dLmdldFBvc2l0aW9uKCkueCwgYm9kaWVzW25vXS5nZXRQb3NpdGlvbigpLnksIGJvZGllc1tub10uZ2V0UG9zaXRpb24oKS56KTtcclxuXHJcbiAgICBsZXQgcm90TXV0YXRvcjogZi5NdXRhdG9yID0ge307XHJcbiAgICBsZXQgdG1wUm90YXRpb246IGYuVmVjdG9yMyA9IG1ha2VSb3RhdGlvbkZyb21RdWF0ZXJuaW9uKGJvZGllc1tub10uZ2V0T3JpZW50YXRpb24oKSk7XHJcbiAgICByb3RNdXRhdG9yW1wicm90YXRpb25cIl0gPSB0bXBSb3RhdGlvbjtcclxuICAgIHJvdE11dGF0b3JbXCJ0cmFuc2xhdGlvblwiXSA9IHRtcFBvc2l0aW9uO1xyXG4gICAgbm9kZS5tdHhMb2NhbC5tdXRhdGUocm90TXV0YXRvcik7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiByYXljYXN0TWF0Q2hhbmdlKCk6IHZvaWQge1xyXG4gICAgbGV0IHJheTogb2ltby5SYXlDYXN0Q2xvc2VzdCA9IG5ldyBvaW1vLlJheUNhc3RDbG9zZXN0KCk7XHJcbiAgICBsZXQgYmVnaW46IG9pbW8uVmVjMyA9IG5ldyBvaW1vLlZlYzMoLSA1LCAwLjMsIDApO1xyXG4gICAgbGV0IGVuZDogb2ltby5WZWMzID0gZ2V0UmF5RW5kUG9pbnQoYmVnaW4sIG5ldyBmLlZlY3RvcjMoMSwgMCwgMCksIDEwKTtcclxuICAgIHJheS5jbGVhcigpO1xyXG4gICAgd29ybGQucmF5Q2FzdChiZWdpbiwgZW5kLCByYXkpO1xyXG4gICAgaWYgKHJheS5oaXQpXHJcbiAgICAgIGN1YmVzWzBdLmdldENvbXBvbmVudChmLkNvbXBvbmVudE1hdGVyaWFsKS5tYXRlcmlhbCA9IG1hdEhpdDtcclxuICAgIGVsc2Uge1xyXG4gICAgICBjdWJlc1swXS5nZXRDb21wb25lbnQoZi5Db21wb25lbnRNYXRlcmlhbCkubWF0ZXJpYWwgPSBtYXROb3JtYWw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBtYWtlUm90YXRpb25Gcm9tUXVhdGVybmlvbihxOiBhbnkpOiBmLlZlY3RvcjMge1xyXG4gICAgbGV0IGFuZ2xlczogZi5WZWN0b3IzID0gbmV3IGYuVmVjdG9yMygpO1xyXG5cclxuICAgIC8vIHJvbGwgKHgtYXhpcyByb3RhdGlvbilcclxuICAgIGxldCBzaW5yX2Nvc3A6IG51bWJlciA9IDIgKiAocS53ICogcS54ICsgcS55ICogcS56KTtcclxuICAgIGxldCBjb3NyX2Nvc3A6IG51bWJlciA9IDEgLSAyICogKHEueCAqIHEueCArIHEueSAqIHEueSk7XHJcbiAgICBhbmdsZXMueCA9IE1hdGguYXRhbjIoc2lucl9jb3NwLCBjb3NyX2Nvc3ApICogNjA7XHJcblxyXG4gICAgLy8gcGl0Y2ggKHktYXhpcyByb3RhdGlvbilcclxuICAgIGxldCBzaW5wOiBudW1iZXIgPSAyICogKHEudyAqIHEueSAtIHEueiAqIHEueCk7XHJcbiAgICBpZiAoTWF0aC5hYnMoc2lucCkgPj0gMSlcclxuICAgICAgYW5nbGVzLnkgPSBjb3B5c2lnbihNYXRoLlBJIC8gMiwgc2lucCkgKiA2MDsgLy8gdXNlIDkwIGRlZ3JlZXMgaWYgb3V0IG9mIHJhbmdlXHJcbiAgICBlbHNlXHJcbiAgICAgIGFuZ2xlcy55ID0gTWF0aC5hc2luKHNpbnApO1xyXG5cclxuICAgIC8vIHlhdyAoei1heGlzIHJvdGF0aW9uKVxyXG4gICAgbGV0IHNpbnlfY29zcDogbnVtYmVyID0gMiAqIChxLncgKiBxLnogKyBxLnggKiBxLnkpO1xyXG4gICAgbGV0IGNvc3lfY29zcDogbnVtYmVyID0gMSAtIDIgKiAocS55ICogcS55ICsgcS56ICogcS56KTtcclxuICAgIGFuZ2xlcy56ID0gTWF0aC5hdGFuMihzaW55X2Nvc3AsIGNvc3lfY29zcCkgKiA2MDtcclxuICAgIHJldHVybiBhbmdsZXM7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBjb3B5c2lnbihhOiBudW1iZXIsIGI6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICByZXR1cm4gYiA8IDAgPyAtTWF0aC5hYnMoYSkgOiBNYXRoLmFicyhhKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdldFJheUVuZFBvaW50KHN0YXJ0OiBmLlZlY3RvcjMsIGRpcmVjdGlvbjogZi5WZWN0b3IzLCBsZW5ndGg6IG51bWJlcik6IGYuVmVjdG9yMyB7XHJcbiAgICBsZXQgZW5kcG9pbnQ6IGYuVmVjdG9yMyA9IGYuVmVjdG9yMy5aRVJPKCk7XHJcbiAgICBlbmRwb2ludC5hZGQoc3RhcnQpO1xyXG4gICAgbGV0IGVuZERpcmVjdGlvbjogZi5WZWN0b3IzID0gZGlyZWN0aW9uO1xyXG4gICAgZW5kRGlyZWN0aW9uLnNjYWxlKGxlbmd0aCk7XHJcbiAgICBlbmRwb2ludC5hZGQoZW5kRGlyZWN0aW9uKTtcclxuICAgIHJldHVybiBlbmRwb2ludDtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGFkZFByaXNtYXRpY0pvaW50KHJiMTogb2ltby5SaWdpZEJvZHksIHJiMjogb2ltby5SaWdpZEJvZHkpOiBvaW1vLlByaXNtYXRpY0pvaW50IHtcclxuICAgIGxldCBheGlzOiBvaW1vLlZlYzMgPSBuZXcgb2ltby5WZWMzKDAsIDEsIDApO1xyXG4gICAgbGV0IGFuY2hvcjogb2ltby5WZWMzID0gcmIxLmdldFBvc2l0aW9uKCk7XHJcbiAgICBsZXQgamM6IG9pbW8uUHJpc21hdGljSm9pbnRDb25maWcgPSBuZXcgb2ltby5QcmlzbWF0aWNKb2ludENvbmZpZygpO1xyXG4gICAgamMuaW5pdChyYjEsIHJiMiwgYW5jaG9yLCBheGlzKTtcclxuICAgIGxldCBzcHJpbmdEYW1wZXI6IG9pbW8uU3ByaW5nRGFtcGVyID0gbmV3IG9pbW8uU3ByaW5nRGFtcGVyKCkuc2V0U3ByaW5nKDMsIDAuMik7XHJcbiAgICBsZXQgbGltaXRNb3Rvcjogb2ltby5UcmFuc2xhdGlvbmFsTGltaXRNb3RvciA9IG5ldyBvaW1vLlRyYW5zbGF0aW9uYWxMaW1pdE1vdG9yKCkuc2V0TGltaXRzKDAsIDApO1xyXG4gICAgamMuc3ByaW5nRGFtcGVyID0gc3ByaW5nRGFtcGVyO1xyXG4gICAgamMubGltaXRNb3RvciA9IGxpbWl0TW90b3I7XHJcbiAgICBsZXQgajogb2ltby5QcmlzbWF0aWNKb2ludCA9IG5ldyBvaW1vLlByaXNtYXRpY0pvaW50KGpjKTtcclxuICAgIHdvcmxkLmFkZEpvaW50KGopO1xyXG4gICAgcmV0dXJuIGo7XHJcbiAgfVxyXG5cclxuXHJcbn0iXX0=