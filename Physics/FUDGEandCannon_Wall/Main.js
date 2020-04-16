"use strict";
///<reference types="../../Core/Build/FudgeCore.js"/>
///<reference types="../Physics_Library/cannon.min.js"/>
var FudgePhysics_Communication;
///<reference types="../../Core/Build/FudgeCore.js"/>
///<reference types="../Physics_Library/cannon.min.js"/>
(function (FudgePhysics_Communication) {
    var f = FudgeCore;
    var c = CANNON;
    window.addEventListener("load", init);
    const app = document.querySelector("canvas");
    let viewPort;
    let hierarchy;
    let fps;
    const times = [];
    let cubes = new Array();
    let fpsDisplay = document.querySelector("h2#FPS");
    let bodies = new Array();
    let bodiesNo = 0;
    let world = new c.World();
    function init(_event) {
        f.Debug.log(app);
        f.RenderManager.initialize();
        hierarchy = new f.Node("Scene");
        let ground = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube());
        let cmpGroundMesh = ground.getComponent(f.ComponentTransform);
        cmpGroundMesh.local.scale(new f.Vector3(50, 0.3, 50));
        hierarchy.appendChild(ground);
        //CANNON Physics Ground/Settings
        world.gravity = new CANNON.Vec3(0, -9.81, 0);
        world.allowSleep = true;
        initializePhysicsBody(ground.getComponent(f.ComponentTransform), 0, 0);
        //Wall Creation
        let cubeNo = 0;
        for (let a = 0; a < 10; a++) {
            for (let b = 0; b < 10; b++) {
                cubes[cubeNo] = createCompleteMeshNode("Cube_" + cubeNo.toString(), new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
                //cubes[cubeNo].mtxWorld.rotateX(45);
                let cmpCubeTransform = cubes[cubeNo].getComponent(f.ComponentTransform);
                cmpCubeTransform.local.translate(new f.Vector3(-5 + b, a + 5, 0));
                hierarchy.appendChild(cubes[cubeNo]);
                //Physics
                f.Debug.log(cmpCubeTransform.getContainer().name);
                initializePhysicsBody(cmpCubeTransform, 1, 1 + cubeNo);
                cubeNo++;
            }
        }
        //EndWall Creation
        let cmpLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
        cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
        hierarchy.addComponent(cmpLight);
        let cmpCamera = new f.ComponentCamera();
        cmpCamera.backgroundColor = f.Color.CSS("GREY");
        cmpCamera.pivot.translate(new f.Vector3(2, 5, 25));
        cmpCamera.pivot.lookAt(f.Vector3.ZERO());
        viewPort = new f.Viewport();
        viewPort.initialize("Viewport", hierarchy, cmpCamera, app);
        viewPort.showSceneGraph();
        f.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, update);
        f.Loop.start(f.LOOP_MODE.TIME_GAME, 60);
    }
    function update() {
        //Physics CANNON
        world.step(f.Loop.timeFrameGame / 1000);
        for (let i = 1; i < bodies.length; i++) {
            applyPhysicsBody(cubes[i - 1].getComponent(f.ComponentTransform), i);
        }
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
    function initializePhysicsBody(_cmpTransform, massVal, no) {
        let node = _cmpTransform.getContainer();
        let scale = new CANNON.Vec3(_cmpTransform.local.scaling.x / 2, _cmpTransform.local.scaling.y / 2, _cmpTransform.local.scaling.z / 2);
        let pos = new CANNON.Vec3(_cmpTransform.local.translation.x, _cmpTransform.local.translation.y, _cmpTransform.local.translation.z);
        let rotation = new CANNON.Quaternion();
        rotation.setFromEuler(node.mtxWorld.rotation.x, node.mtxWorld.rotation.y, node.mtxWorld.rotation.z);
        let mat = new CANNON.Material();
        mat.friction = 1;
        mat.restitution = 0;
        bodies[no] = new CANNON.Body({
            mass: massVal,
            position: pos,
            quaternion: rotation,
            shape: new CANNON.Box(scale),
            material: mat,
            allowSleep: true,
            sleepSpeedLimit: 0.25,
            sleepTimeLimit: 1 // Body falls asleep after 1s of sleepiness
        });
        world.addBody(bodies[no]);
    }
    function applyPhysicsBody(_cmpTransform, no) {
        let node = _cmpTransform.getContainer();
        let tmpPosition = new f.Vector3(bodies[no].position.x, bodies[no].position.y, bodies[no].position.z);
        let mutator = {};
        let tmpRotation = makeRotationFromQuaternion(bodies[no].quaternion, node.mtxLocal.rotation);
        mutator["rotation"] = tmpRotation;
        node.mtxLocal.mutate(mutator);
        mutator["translation"] = tmpPosition;
        node.mtxLocal.mutate(mutator);
    }
    function makeRotationFromQuaternion(q, targetAxis = new f.Vector3(1, 1, 1)) {
        let angles = new f.Vector3();
        // roll (x-axis rotation)
        let sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
        let cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
        angles.x = Math.atan2(sinr_cosp, cosr_cosp) * 60; //f.Loop.getFpsRealAverage(); //*Framerate? //* 60;
        // pitch (y-axis rotation)
        let sinp = 2 * (q.w * q.y - q.z * q.x);
        if (Math.abs(sinp) >= 1)
            angles.y = copysign(Math.PI / 2, sinp) * 60; //f.Loop.getFpsRealAverage(); // use 90 degrees if out of range
        else
            angles.y = Math.asin(sinp) * 60; //f.Loop.getFpsRealAverage();
        // yaw (z-axis rotation)
        let siny_cosp = 2 * (q.w * q.z + q.x * q.y);
        let cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
        angles.z = Math.atan2(siny_cosp, cosy_cosp) * 60; //f.Loop.getFpsRealAverage();
        //f.Debug.log(angles);
        return angles;
    }
    function copysign(a, b) {
        return b < 0 ? -Math.abs(a) : Math.abs(a);
    }
})(FudgePhysics_Communication || (FudgePhysics_Communication = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFEQUFxRDtBQUNyRCx3REFBd0Q7QUFFeEQsSUFBVSwwQkFBMEIsQ0FrTG5DO0FBckxELHFEQUFxRDtBQUNyRCx3REFBd0Q7QUFFeEQsV0FBVSwwQkFBMEI7SUFDbEMsSUFBTyxDQUFDLEdBQUcsU0FBUyxDQUFDO0lBQ3JCLElBQU8sQ0FBQyxHQUFHLE1BQU0sQ0FBQztJQUdsQixNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3RDLE1BQU0sR0FBRyxHQUFzQixRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2hFLElBQUksUUFBb0IsQ0FBQztJQUN6QixJQUFJLFNBQWlCLENBQUM7SUFDdEIsSUFBSSxHQUFXLENBQUM7SUFDaEIsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO0lBQzNCLElBQUksS0FBSyxHQUFhLElBQUksS0FBSyxFQUFFLENBQUM7SUFDbEMsSUFBSSxVQUFVLEdBQWdCLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDL0QsSUFBSSxNQUFNLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUN6QixJQUFJLFFBQVEsR0FBVyxDQUFDLENBQUM7SUFFekIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7SUFFMUIsU0FBUyxJQUFJLENBQUMsTUFBYTtRQUN6QixDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQixDQUFDLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQzdCLFNBQVMsR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFaEMsSUFBSSxNQUFNLEdBQVcsc0JBQXNCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FB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QUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BELElBQUksU0FBUyxHQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEQsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyw2QkFBNkI7UUFDL0Usc0JBQXNCO1FBQ3RCLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFHRCxTQUFTLFFBQVEsQ0FBQyxDQUFTLEVBQUUsQ0FBUztRQUNwQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1QyxDQUFDO0FBRUgsQ0FBQyxFQWxMUywwQkFBMEIsS0FBMUIsMEJBQTBCLFFBa0xuQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLzxyZWZlcmVuY2UgdHlwZXM9XCIuLi8uLi9Db3JlL0J1aWxkL0Z1ZGdlQ29yZS5qc1wiLz5cclxuLy8vPHJlZmVyZW5jZSB0eXBlcz1cIi4uL1BoeXNpY3NfTGlicmFyeS9jYW5ub24ubWluLmpzXCIvPlxyXG5cclxubmFtZXNwYWNlIEZ1ZGdlUGh5c2ljc19Db21tdW5pY2F0aW9uIHtcclxuICBpbXBvcnQgZiA9IEZ1ZGdlQ29yZTtcclxuICBpbXBvcnQgYyA9IENBTk5PTjtcclxuXHJcblxyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBpbml0KTtcclxuICBjb25zdCBhcHA6IEhUTUxDYW52YXNFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImNhbnZhc1wiKTtcclxuICBsZXQgdmlld1BvcnQ6IGYuVmlld3BvcnQ7XHJcbiAgbGV0IGhpZXJhcmNoeTogZi5Ob2RlO1xyXG4gIGxldCBmcHM6IG51bWJlcjtcclxuICBjb25zdCB0aW1lczogbnVtYmVyW10gPSBbXTtcclxuICBsZXQgY3ViZXM6IGYuTm9kZVtdID0gbmV3IEFycmF5KCk7XHJcbiAgbGV0IGZwc0Rpc3BsYXk6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImgyI0ZQU1wiKTtcclxuICBsZXQgYm9kaWVzID0gbmV3IEFycmF5KCk7XHJcbiAgbGV0IGJvZGllc05vOiBudW1iZXIgPSAwO1xyXG5cclxuICBsZXQgd29ybGQgPSBuZXcgYy5Xb3JsZCgpO1xyXG5cclxuICBmdW5jdGlvbiBpbml0KF9ldmVudDogRXZlbnQpOiB2b2lkIHtcclxuICAgIGYuRGVidWcubG9nKGFwcCk7XHJcbiAgICBmLlJlbmRlck1hbmFnZXIuaW5pdGlhbGl6ZSgpO1xyXG4gICAgaGllcmFyY2h5ID0gbmV3IGYuTm9kZShcIlNjZW5lXCIpO1xyXG5cclxuICAgIGxldCBncm91bmQ6IGYuTm9kZSA9IGNyZWF0ZUNvbXBsZXRlTWVzaE5vZGUoXCJHcm91bmRcIiwgbmV3IGYuTWF0ZXJpYWwoXCJHcm91bmRcIiwgZi5TaGFkZXJGbGF0LCBuZXcgZi5Db2F0Q29sb3JlZChuZXcgZi5Db2xvcigwLjIsIDAuMiwgMC4yLCAxKSkpLCBuZXcgZi5NZXNoQ3ViZSgpKTtcclxuICAgIGxldCBjbXBHcm91bmRNZXNoOiBmLkNvbXBvbmVudFRyYW5zZm9ybSA9IGdyb3VuZC5nZXRDb21wb25lbnQoZi5Db21wb25lbnRUcmFuc2Zvcm0pO1xyXG5cclxuICAgIGNtcEdyb3VuZE1lc2gubG9jYWwuc2NhbGUobmV3IGYuVmVjdG9yMyg1MCwgMC4zLCA1MCkpO1xyXG4gICAgaGllcmFyY2h5LmFwcGVuZENoaWxkKGdyb3VuZCk7XHJcblxyXG4gICAgLy9DQU5OT04gUGh5c2ljcyBHcm91bmQvU2V0dGluZ3NcclxuICAgIHdvcmxkLmdyYXZpdHkgPSBuZXcgQ0FOTk9OLlZlYzMoMCwgLTkuODEsIDApO1xyXG4gICAgd29ybGQuYWxsb3dTbGVlcCA9IHRydWU7XHJcbiAgICBpbml0aWFsaXplUGh5c2ljc0JvZHkoZ3JvdW5kLmdldENvbXBvbmVudChmLkNvbXBvbmVudFRyYW5zZm9ybSksIDAsIDApO1xyXG5cclxuXHJcbiAgICAvL1dhbGwgQ3JlYXRpb25cclxuICAgIGxldCBjdWJlTm8gPSAwO1xyXG4gICAgZm9yIChsZXQgYTogbnVtYmVyID0gMDsgYSA8IDEwOyBhKyspIHtcclxuICAgICAgZm9yIChsZXQgYjogbnVtYmVyID0gMDsgYiA8IDEwOyBiKyspIHtcclxuICAgICAgICBjdWJlc1tjdWJlTm9dID0gY3JlYXRlQ29tcGxldGVNZXNoTm9kZShcIkN1YmVfXCIgKyBjdWJlTm8udG9TdHJpbmcoKSwgbmV3IGYuTWF0ZXJpYWwoXCJDdWJlXCIsIGYuU2hhZGVyRmxhdCwgbmV3IGYuQ29hdENvbG9yZWQobmV3IGYuQ29sb3IoMSwgMCwgMCwgMSkpKSwgbmV3IGYuTWVzaEN1YmUoKSk7XHJcbiAgICAgICAgLy9jdWJlc1tjdWJlTm9dLm10eFdvcmxkLnJvdGF0ZVgoNDUpO1xyXG4gICAgICAgIGxldCBjbXBDdWJlVHJhbnNmb3JtOiBmLkNvbXBvbmVudFRyYW5zZm9ybSA9IGN1YmVzW2N1YmVOb10uZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50VHJhbnNmb3JtKTtcclxuICAgICAgICBjbXBDdWJlVHJhbnNmb3JtLmxvY2FsLnRyYW5zbGF0ZShuZXcgZi5WZWN0b3IzKC01ICsgYiwgYSArIDUsIDApKTtcclxuICAgICAgICBoaWVyYXJjaHkuYXBwZW5kQ2hpbGQoY3ViZXNbY3ViZU5vXSk7XHJcbiAgICAgICAgLy9QaHlzaWNzXHJcbiAgICAgICAgZi5EZWJ1Zy5sb2coY21wQ3ViZVRyYW5zZm9ybS5nZXRDb250YWluZXIoKS5uYW1lKTtcclxuICAgICAgICBpbml0aWFsaXplUGh5c2ljc0JvZHkoY21wQ3ViZVRyYW5zZm9ybSwgMSwgMSArIGN1YmVObyk7XHJcbiAgICAgICAgY3ViZU5vKys7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vRW5kV2FsbCBDcmVhdGlvblxyXG5cclxuICAgIGxldCBjbXBMaWdodDogZi5Db21wb25lbnRMaWdodCA9IG5ldyBmLkNvbXBvbmVudExpZ2h0KG5ldyBmLkxpZ2h0RGlyZWN0aW9uYWwoZi5Db2xvci5DU1MoXCJXSElURVwiKSkpO1xyXG4gICAgY21wTGlnaHQucGl2b3QubG9va0F0KG5ldyBmLlZlY3RvcjMoMC41LCAtMSwgLTAuOCkpO1xyXG4gICAgaGllcmFyY2h5LmFkZENvbXBvbmVudChjbXBMaWdodCk7XHJcblxyXG4gICAgbGV0IGNtcENhbWVyYTogZi5Db21wb25lbnRDYW1lcmEgPSBuZXcgZi5Db21wb25lbnRDYW1lcmEoKTtcclxuICAgIGNtcENhbWVyYS5iYWNrZ3JvdW5kQ29sb3IgPSBmLkNvbG9yLkNTUyhcIkdSRVlcIik7XHJcbiAgICBjbXBDYW1lcmEucGl2b3QudHJhbnNsYXRlKG5ldyBmLlZlY3RvcjMoMiwgNSwgMjUpKTtcclxuICAgIGNtcENhbWVyYS5waXZvdC5sb29rQXQoZi5WZWN0b3IzLlpFUk8oKSk7XHJcblxyXG5cclxuICAgIHZpZXdQb3J0ID0gbmV3IGYuVmlld3BvcnQoKTtcclxuICAgIHZpZXdQb3J0LmluaXRpYWxpemUoXCJWaWV3cG9ydFwiLCBoaWVyYXJjaHksIGNtcENhbWVyYSwgYXBwKTtcclxuXHJcbiAgICB2aWV3UG9ydC5zaG93U2NlbmVHcmFwaCgpO1xyXG5cclxuICAgIGYuTG9vcC5hZGRFdmVudExpc3RlbmVyKGYuRVZFTlQuTE9PUF9GUkFNRSwgdXBkYXRlKTtcclxuICAgIGYuTG9vcC5zdGFydChmLkxPT1BfTU9ERS5USU1FX0dBTUUsIDYwKTtcclxuICB9XHJcblxyXG5cclxuICBmdW5jdGlvbiB1cGRhdGUoKTogdm9pZCB7XHJcblxyXG4gICAgLy9QaHlzaWNzIENBTk5PTlxyXG4gICAgd29ybGQuc3RlcChmLkxvb3AudGltZUZyYW1lR2FtZSAvIDEwMDApO1xyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMTsgaSA8IGJvZGllcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBhcHBseVBoeXNpY3NCb2R5KGN1YmVzW2kgLSAxXS5nZXRDb21wb25lbnQoZi5Db21wb25lbnRUcmFuc2Zvcm0pLCBpKTtcclxuICAgIH1cclxuICAgIC8vRW5kUGh5c2ljc1xyXG5cclxuICAgIHZpZXdQb3J0LmRyYXcoKTtcclxuICAgIG1lYXN1cmVGUFMoKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIG1lYXN1cmVGUFMoKTogdm9pZCB7XHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcclxuICAgICAgY29uc3Qgbm93ID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcbiAgICAgIHdoaWxlICh0aW1lcy5sZW5ndGggPiAwICYmIHRpbWVzWzBdIDw9IG5vdyAtIDEwMDApIHtcclxuICAgICAgICB0aW1lcy5zaGlmdCgpO1xyXG4gICAgICB9XHJcbiAgICAgIHRpbWVzLnB1c2gobm93KTtcclxuICAgICAgZnBzID0gdGltZXMubGVuZ3RoO1xyXG4gICAgICBmcHNEaXNwbGF5LnRleHRDb250ZW50ID0gXCJGUFM6IFwiICsgZnBzLnRvU3RyaW5nKCk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGNyZWF0ZUNvbXBsZXRlTWVzaE5vZGUoX25hbWU6IHN0cmluZywgX21hdGVyaWFsOiBmLk1hdGVyaWFsLCBfbWVzaDogZi5NZXNoKTogZi5Ob2RlIHtcclxuICAgIGxldCBub2RlOiBmLk5vZGUgPSBuZXcgZi5Ob2RlKF9uYW1lKTtcclxuICAgIGxldCBjbXBNZXNoOiBmLkNvbXBvbmVudE1lc2ggPSBuZXcgZi5Db21wb25lbnRNZXNoKF9tZXNoKTtcclxuICAgIGxldCBjbXBNYXRlcmlhbDogZi5Db21wb25lbnRNYXRlcmlhbCA9IG5ldyBmLkNvbXBvbmVudE1hdGVyaWFsKF9tYXRlcmlhbCk7XHJcblxyXG4gICAgbGV0IGNtcFRyYW5zZm9ybTogZi5Db21wb25lbnRUcmFuc2Zvcm0gPSBuZXcgZi5Db21wb25lbnRUcmFuc2Zvcm0oKTtcclxuICAgIG5vZGUuYWRkQ29tcG9uZW50KGNtcE1lc2gpO1xyXG4gICAgbm9kZS5hZGRDb21wb25lbnQoY21wTWF0ZXJpYWwpO1xyXG4gICAgbm9kZS5hZGRDb21wb25lbnQoY21wVHJhbnNmb3JtKTtcclxuXHJcbiAgICByZXR1cm4gbm9kZTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGluaXRpYWxpemVQaHlzaWNzQm9keShfY21wVHJhbnNmb3JtOiBmLkNvbXBvbmVudFRyYW5zZm9ybSwgbWFzc1ZhbDogbnVtYmVyLCBubzogbnVtYmVyKSB7XHJcbiAgICBsZXQgbm9kZTogZi5Ob2RlID0gX2NtcFRyYW5zZm9ybS5nZXRDb250YWluZXIoKTtcclxuICAgIGxldCBzY2FsZTogQ0FOTk9OLlZlYzMgPSBuZXcgQ0FOTk9OLlZlYzMoX2NtcFRyYW5zZm9ybS5sb2NhbC5zY2FsaW5nLnggLyAyLCBfY21wVHJhbnNmb3JtLmxvY2FsLnNjYWxpbmcueSAvIDIsIF9jbXBUcmFuc2Zvcm0ubG9jYWwuc2NhbGluZy56IC8gMik7XHJcbiAgICBsZXQgcG9zOiBDQU5OT04uVmVjMyA9IG5ldyBDQU5OT04uVmVjMyhfY21wVHJhbnNmb3JtLmxvY2FsLnRyYW5zbGF0aW9uLngsIF9jbXBUcmFuc2Zvcm0ubG9jYWwudHJhbnNsYXRpb24ueSwgX2NtcFRyYW5zZm9ybS5sb2NhbC50cmFuc2xhdGlvbi56KTtcclxuICAgIGxldCByb3RhdGlvbjogQ0FOTk9OLlF1YXRlcm5pb24gPSBuZXcgQ0FOTk9OLlF1YXRlcm5pb24oKTtcclxuICAgIHJvdGF0aW9uLnNldEZyb21FdWxlcihub2RlLm10eFdvcmxkLnJvdGF0aW9uLngsIG5vZGUubXR4V29ybGQucm90YXRpb24ueSwgbm9kZS5tdHhXb3JsZC5yb3RhdGlvbi56KTtcclxuXHJcbiAgICBsZXQgbWF0OiBDQU5OT04uTWF0ZXJpYWwgPSBuZXcgQ0FOTk9OLk1hdGVyaWFsKCk7XHJcbiAgICBtYXQuZnJpY3Rpb24gPSAxO1xyXG4gICAgbWF0LnJlc3RpdHV0aW9uID0gMDtcclxuXHJcbiAgICBib2RpZXNbbm9dID0gbmV3IENBTk5PTi5Cb2R5KHtcclxuICAgICAgbWFzczogbWFzc1ZhbCwgLy8ga2dcclxuICAgICAgcG9zaXRpb246IHBvcywgLy8gbVxyXG4gICAgICBxdWF0ZXJuaW9uOiByb3RhdGlvbixcclxuICAgICAgc2hhcGU6IG5ldyBDQU5OT04uQm94KHNjYWxlKSxcclxuICAgICAgbWF0ZXJpYWw6IG1hdCxcclxuICAgICAgYWxsb3dTbGVlcDogdHJ1ZSxcclxuICAgICAgc2xlZXBTcGVlZExpbWl0OiAwLjI1LCAvLyBCb2R5IHdpbGwgZmVlbCBzbGVlcHkgaWYgc3BlZWQ8MSAoc3BlZWQgPT0gbm9ybSBvZiB2ZWxvY2l0eSlcclxuICAgICAgc2xlZXBUaW1lTGltaXQ6IDEgLy8gQm9keSBmYWxscyBhc2xlZXAgYWZ0ZXIgMXMgb2Ygc2xlZXBpbmVzc1xyXG4gICAgfSk7XHJcbiAgICB3b3JsZC5hZGRCb2R5KGJvZGllc1tub10pO1xyXG4gIH1cclxuXHJcblxyXG4gIGZ1bmN0aW9uIGFwcGx5UGh5c2ljc0JvZHkoX2NtcFRyYW5zZm9ybTogZi5Db21wb25lbnRUcmFuc2Zvcm0sIG5vOiBudW1iZXIpOiB2b2lkIHtcclxuICAgIGxldCBub2RlOiBmLk5vZGUgPSBfY21wVHJhbnNmb3JtLmdldENvbnRhaW5lcigpO1xyXG4gICAgbGV0IHRtcFBvc2l0aW9uOiBmLlZlY3RvcjMgPSBuZXcgZi5WZWN0b3IzKGJvZGllc1tub10ucG9zaXRpb24ueCwgYm9kaWVzW25vXS5wb3NpdGlvbi55LCBib2RpZXNbbm9dLnBvc2l0aW9uLnopO1xyXG5cclxuICAgIGxldCBtdXRhdG9yOiBmLk11dGF0b3IgPSB7fTtcclxuICAgIGxldCB0bXBSb3RhdGlvbjogZi5WZWN0b3IzID0gbWFrZVJvdGF0aW9uRnJvbVF1YXRlcm5pb24oYm9kaWVzW25vXS5xdWF0ZXJuaW9uLCBub2RlLm10eExvY2FsLnJvdGF0aW9uKTtcclxuXHJcbiAgICBtdXRhdG9yW1wicm90YXRpb25cIl0gPSB0bXBSb3RhdGlvbjtcclxuICAgIG5vZGUubXR4TG9jYWwubXV0YXRlKG11dGF0b3IpO1xyXG4gICAgbXV0YXRvcltcInRyYW5zbGF0aW9uXCJdID0gdG1wUG9zaXRpb247XHJcbiAgICBub2RlLm10eExvY2FsLm11dGF0ZShtdXRhdG9yKTtcclxuXHJcbiAgfVxyXG5cclxuXHJcbiAgZnVuY3Rpb24gbWFrZVJvdGF0aW9uRnJvbVF1YXRlcm5pb24ocTogYW55LCB0YXJnZXRBeGlzOiBmLlZlY3RvcjMgPSBuZXcgZi5WZWN0b3IzKDEsIDEsIDEpKTogZi5WZWN0b3IzIHtcclxuICAgIGxldCBhbmdsZXM6IGYuVmVjdG9yMyA9IG5ldyBmLlZlY3RvcjMoKTtcclxuXHJcbiAgICAvLyByb2xsICh4LWF4aXMgcm90YXRpb24pXHJcbiAgICBsZXQgc2lucl9jb3NwOiBudW1iZXIgPSAyICogKHEudyAqIHEueCArIHEueSAqIHEueik7XHJcbiAgICBsZXQgY29zcl9jb3NwOiBudW1iZXIgPSAxIC0gMiAqIChxLnggKiBxLnggKyBxLnkgKiBxLnkpO1xyXG4gICAgYW5nbGVzLnggPSBNYXRoLmF0YW4yKHNpbnJfY29zcCwgY29zcl9jb3NwKSAqIDYwOyAvL2YuTG9vcC5nZXRGcHNSZWFsQXZlcmFnZSgpOyAvLypGcmFtZXJhdGU/IC8vKiA2MDtcclxuXHJcbiAgICAvLyBwaXRjaCAoeS1heGlzIHJvdGF0aW9uKVxyXG4gICAgbGV0IHNpbnA6IG51bWJlciA9IDIgKiAocS53ICogcS55IC0gcS56ICogcS54KTtcclxuICAgIGlmIChNYXRoLmFicyhzaW5wKSA+PSAxKVxyXG4gICAgICBhbmdsZXMueSA9IGNvcHlzaWduKE1hdGguUEkgLyAyLCBzaW5wKSAqIDYwOyAvL2YuTG9vcC5nZXRGcHNSZWFsQXZlcmFnZSgpOyAvLyB1c2UgOTAgZGVncmVlcyBpZiBvdXQgb2YgcmFuZ2VcclxuICAgIGVsc2VcclxuICAgICAgYW5nbGVzLnkgPSBNYXRoLmFzaW4oc2lucCkgKiA2MDsgLy9mLkxvb3AuZ2V0RnBzUmVhbEF2ZXJhZ2UoKTtcclxuXHJcbiAgICAvLyB5YXcgKHotYXhpcyByb3RhdGlvbilcclxuICAgIGxldCBzaW55X2Nvc3A6IG51bWJlciA9IDIgKiAocS53ICogcS56ICsgcS54ICogcS55KTtcclxuICAgIGxldCBjb3N5X2Nvc3A6IG51bWJlciA9IDEgLSAyICogKHEueSAqIHEueSArIHEueiAqIHEueik7XHJcbiAgICBhbmdsZXMueiA9IE1hdGguYXRhbjIoc2lueV9jb3NwLCBjb3N5X2Nvc3ApICogNjA7IC8vZi5Mb29wLmdldEZwc1JlYWxBdmVyYWdlKCk7XHJcbiAgICAvL2YuRGVidWcubG9nKGFuZ2xlcyk7XHJcbiAgICByZXR1cm4gYW5nbGVzO1xyXG4gIH1cclxuXHJcblxyXG4gIGZ1bmN0aW9uIGNvcHlzaWduKGE6IG51bWJlciwgYjogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgIHJldHVybiBiIDwgMCA/IC1NYXRoLmFicyhhKSA6IE1hdGguYWJzKGEpO1xyXG4gIH1cclxuXHJcbn0iXX0=