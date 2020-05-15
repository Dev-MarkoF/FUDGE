"use strict";
///<reference types="../../../../Core/Build/FudgeCore.js"/>
var f = FudgeCore;
var FudgePhysics_Communication;
(function (FudgePhysics_Communication) {
    window.addEventListener("load", init);
    const app = document.querySelector("canvas");
    let viewPort;
    let hierarchy;
    let fps;
    const times = [];
    let cubes = new Array();
    let fpsDisplay = document.querySelector("h2#FPS");
    function init(_event) {
        f.Debug.log(app);
        f.RenderManager.initialize();
        f.Physics.initializePhysics();
        hierarchy = new f.Node("Scene");
        let ground = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube(), 0, f.PHYSICS_TYPE.STATIC);
        let cmpGroundMesh = ground.getComponent(f.ComponentTransform);
        hierarchy.appendChild(ground);
        cubes[0] = createCompleteMeshNode("Cube_1", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC);
        let cmpCubeTransform = cubes[0].getComponent(f.ComponentTransform);
        hierarchy.appendChild(cubes[0]);
        cubes[1] = createCompleteMeshNode("Cube_2", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC);
        let cmpCubeTransform2 = cubes[1].getComponent(f.ComponentTransform);
        hierarchy.appendChild(cubes[1]);
        cmpCubeTransform2.local.translate(new f.Vector3(0, 3.5, 0.41));
        let cmpLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
        cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
        hierarchy.addComponent(cmpLight);
        let cmpCamera = new f.ComponentCamera();
        cmpCamera.backgroundColor = f.Color.CSS("GREY");
        cmpCamera.pivot.translate(new f.Vector3(2, 2, 10));
        cmpCamera.pivot.lookAt(f.Vector3.ZERO());
        f.Debug.log(cubes[1].getComponent(f.ComponentRigidbody).getContainer());
        cubes[1].getComponent(f.ComponentRigidbody).updateFromTransform();
        viewPort = new f.Viewport();
        viewPort.initialize("Viewport", hierarchy, cmpCamera, app);
        viewPort.showSceneGraph();
        f.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, update);
        f.Loop.start();
    }
    let origin = new f.Vector3(-5, 0.25, 0);
    let direction = new f.Vector3(1, 0, 0);
    let hitInfo = new f.RayHitInfo();
    function update() {
        //Physics 
        f.Physics.world.simulate();
        //f.Debug.log(cubes[0].getComponent(f.ComponentRigidbody).getPosition());
        //EndPhysics
        hitInfo = f.Physics.raycast(origin, direction, 10);
        f.Debug.log(hitInfo);
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
    let i = 0;
    function createCompleteMeshNode(_name, _material, _mesh, _mass, _physicsType) {
        let node = new f.Node(_name);
        let cmpMesh = new f.ComponentMesh(_mesh);
        let cmpMaterial = new f.ComponentMaterial(_material);
        let cmpTransform = new f.ComponentTransform();
        if (i == 0)
            cmpTransform.local.scale(new f.Vector3(10, 0.3, 10));
        if (i == 1)
            cmpTransform.local.translate(new f.Vector3(0, 2, 0));
        // if (i == 2)
        // cmpTransform.local.translate(new f.Vector3(0, 3.5, 0.41));
        let cmpRigidbody = new f.ComponentRigidbody(_mass, _physicsType, f.COLLIDER_TYPE.BOX, cmpTransform);
        cmpRigidbody.setFriction(1);
        cmpRigidbody.setRestitution(0);
        node.addComponent(cmpMesh);
        node.addComponent(cmpMaterial);
        node.addComponent(cmpTransform);
        node.addComponent(cmpRigidbody);
        i++;
        return node;
    }
})(FudgePhysics_Communication || (FudgePhysics_Communication = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDJEQUEyRDtBQUMzRCxJQUFPLENBQUMsR0FBRyxTQUFTLENBQUM7QUFJckIsSUFBVSwwQkFBMEIsQ0ErR25DO0FBL0dELFdBQVUsMEJBQTBCO0lBRWxDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdEMsTUFBTSxHQUFHLEdBQXNCLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDaEUsSUFBSSxRQUFvQixDQUFDO0lBQ3pCLElBQUksU0FBaUIsQ0FBQztJQUN0QixJQUFJLEdBQVcsQ0FBQztJQUNoQixNQUFNLEtBQUssR0FBYSxFQUFFLENBQUM7SUFDM0IsSUFBSSxLQUFLLEdBQWEsSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUNsQyxJQUFJLFVBQVUsR0FBZ0IsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUsvRCxTQUFTLElBQUksQ0FBQyxNQUFhO1FBQ3pCLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDN0IsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzlCLFNBQVMsR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFaEMsSUFBSSxNQUFNLEdBQVcsc0JBQXNCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFB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QUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV2RCxjQUFjO1FBQ2QsNkRBQTZEO1FBRTdELElBQUksWUFBWSxHQUF5QixJQUFJLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzFILFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUIsWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNCLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2hDLENBQUMsRUFBRSxDQUFDO1FBRUosT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0FBRUgsQ0FBQyxFQS9HUywwQkFBMEIsS0FBMUIsMEJBQTBCLFFBK0duQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLzxyZWZlcmVuY2UgdHlwZXM9XCIuLi8uLi8uLi8uLi9Db3JlL0J1aWxkL0Z1ZGdlQ29yZS5qc1wiLz5cclxuaW1wb3J0IGYgPSBGdWRnZUNvcmU7XHJcblxyXG5cclxuXHJcbm5hbWVzcGFjZSBGdWRnZVBoeXNpY3NfQ29tbXVuaWNhdGlvbiB7XHJcblxyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBpbml0KTtcclxuICBjb25zdCBhcHA6IEhUTUxDYW52YXNFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImNhbnZhc1wiKTtcclxuICBsZXQgdmlld1BvcnQ6IGYuVmlld3BvcnQ7XHJcbiAgbGV0IGhpZXJhcmNoeTogZi5Ob2RlO1xyXG4gIGxldCBmcHM6IG51bWJlcjtcclxuICBjb25zdCB0aW1lczogbnVtYmVyW10gPSBbXTtcclxuICBsZXQgY3ViZXM6IGYuTm9kZVtdID0gbmV3IEFycmF5KCk7XHJcbiAgbGV0IGZwc0Rpc3BsYXk6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImgyI0ZQU1wiKTtcclxuXHJcblxyXG5cclxuXHJcbiAgZnVuY3Rpb24gaW5pdChfZXZlbnQ6IEV2ZW50KTogdm9pZCB7XHJcbiAgICBmLkRlYnVnLmxvZyhhcHApO1xyXG4gICAgZi5SZW5kZXJNYW5hZ2VyLmluaXRpYWxpemUoKTtcclxuICAgIGYuUGh5c2ljcy5pbml0aWFsaXplUGh5c2ljcygpO1xyXG4gICAgaGllcmFyY2h5ID0gbmV3IGYuTm9kZShcIlNjZW5lXCIpO1xyXG5cclxuICAgIGxldCBncm91bmQ6IGYuTm9kZSA9IGNyZWF0ZUNvbXBsZXRlTWVzaE5vZGUoXCJHcm91bmRcIiwgbmV3IGYuTWF0ZXJpYWwoXCJHcm91bmRcIiwgZi5TaGFkZXJGbGF0LCBuZXcgZi5Db2F0Q29sb3JlZChuZXcgZi5Db2xvcigwLjIsIDAuMiwgMC4yLCAxKSkpLCBuZXcgZi5NZXNoQ3ViZSgpLCAwLCBmLlBIWVNJQ1NfVFlQRS5TVEFUSUMpO1xyXG4gICAgbGV0IGNtcEdyb3VuZE1lc2g6IGYuQ29tcG9uZW50VHJhbnNmb3JtID0gZ3JvdW5kLmdldENvbXBvbmVudChmLkNvbXBvbmVudFRyYW5zZm9ybSk7XHJcblxyXG4gICAgaGllcmFyY2h5LmFwcGVuZENoaWxkKGdyb3VuZCk7XHJcblxyXG4gICAgY3ViZXNbMF0gPSBjcmVhdGVDb21wbGV0ZU1lc2hOb2RlKFwiQ3ViZV8xXCIsIG5ldyBmLk1hdGVyaWFsKFwiQ3ViZVwiLCBmLlNoYWRlckZsYXQsIG5ldyBmLkNvYXRDb2xvcmVkKG5ldyBmLkNvbG9yKDEsIDAsIDAsIDEpKSksIG5ldyBmLk1lc2hDdWJlKCksIDEsIGYuUEhZU0lDU19UWVBFLkRZTkFNSUMpO1xyXG4gICAgbGV0IGNtcEN1YmVUcmFuc2Zvcm06IGYuQ29tcG9uZW50VHJhbnNmb3JtID0gY3ViZXNbMF0uZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50VHJhbnNmb3JtKTtcclxuICAgIGhpZXJhcmNoeS5hcHBlbmRDaGlsZChjdWJlc1swXSk7XHJcblxyXG4gICAgY3ViZXNbMV0gPSBjcmVhdGVDb21wbGV0ZU1lc2hOb2RlKFwiQ3ViZV8yXCIsIG5ldyBmLk1hdGVyaWFsKFwiQ3ViZVwiLCBmLlNoYWRlckZsYXQsIG5ldyBmLkNvYXRDb2xvcmVkKG5ldyBmLkNvbG9yKDEsIDAsIDAsIDEpKSksIG5ldyBmLk1lc2hDdWJlKCksIDEsIGYuUEhZU0lDU19UWVBFLkRZTkFNSUMpO1xyXG4gICAgbGV0IGNtcEN1YmVUcmFuc2Zvcm0yOiBmLkNvbXBvbmVudFRyYW5zZm9ybSA9IGN1YmVzWzFdLmdldENvbXBvbmVudChmLkNvbXBvbmVudFRyYW5zZm9ybSk7XHJcbiAgICBoaWVyYXJjaHkuYXBwZW5kQ2hpbGQoY3ViZXNbMV0pO1xyXG4gICAgY21wQ3ViZVRyYW5zZm9ybTIubG9jYWwudHJhbnNsYXRlKG5ldyBmLlZlY3RvcjMoMCwgMy41LCAwLjQxKSk7XHJcblxyXG4gICAgbGV0IGNtcExpZ2h0OiBmLkNvbXBvbmVudExpZ2h0ID0gbmV3IGYuQ29tcG9uZW50TGlnaHQobmV3IGYuTGlnaHREaXJlY3Rpb25hbChmLkNvbG9yLkNTUyhcIldISVRFXCIpKSk7XHJcbiAgICBjbXBMaWdodC5waXZvdC5sb29rQXQobmV3IGYuVmVjdG9yMygwLjUsIC0xLCAtMC44KSk7XHJcbiAgICBoaWVyYXJjaHkuYWRkQ29tcG9uZW50KGNtcExpZ2h0KTtcclxuXHJcbiAgICBsZXQgY21wQ2FtZXJhOiBmLkNvbXBvbmVudENhbWVyYSA9IG5ldyBmLkNvbXBvbmVudENhbWVyYSgpO1xyXG4gICAgY21wQ2FtZXJhLmJhY2tncm91bmRDb2xvciA9IGYuQ29sb3IuQ1NTKFwiR1JFWVwiKTtcclxuICAgIGNtcENhbWVyYS5waXZvdC50cmFuc2xhdGUobmV3IGYuVmVjdG9yMygyLCAyLCAxMCkpO1xyXG4gICAgY21wQ2FtZXJhLnBpdm90Lmxvb2tBdChmLlZlY3RvcjMuWkVSTygpKTtcclxuXHJcbiAgICBmLkRlYnVnLmxvZyhjdWJlc1sxXS5nZXRDb21wb25lbnQoZi5Db21wb25lbnRSaWdpZGJvZHkpLmdldENvbnRhaW5lcigpKTtcclxuICAgIGN1YmVzWzFdLmdldENvbXBvbmVudChmLkNvbXBvbmVudFJpZ2lkYm9keSkudXBkYXRlRnJvbVRyYW5zZm9ybSgpO1xyXG5cclxuXHJcbiAgICB2aWV3UG9ydCA9IG5ldyBmLlZpZXdwb3J0KCk7XHJcbiAgICB2aWV3UG9ydC5pbml0aWFsaXplKFwiVmlld3BvcnRcIiwgaGllcmFyY2h5LCBjbXBDYW1lcmEsIGFwcCk7XHJcblxyXG4gICAgdmlld1BvcnQuc2hvd1NjZW5lR3JhcGgoKTtcclxuICAgIGYuTG9vcC5hZGRFdmVudExpc3RlbmVyKGYuRVZFTlQuTE9PUF9GUkFNRSwgdXBkYXRlKTtcclxuICAgIGYuTG9vcC5zdGFydCgpO1xyXG4gIH1cclxuXHJcblxyXG4gIGxldCBvcmlnaW46IGYuVmVjdG9yMyA9IG5ldyBmLlZlY3RvcjMoLTUsIDAuMjUsIDApO1xyXG4gIGxldCBkaXJlY3Rpb246IGYuVmVjdG9yMyA9IG5ldyBmLlZlY3RvcjMoMSwgMCwgMCk7XHJcbiAgbGV0IGhpdEluZm86IGYuUmF5SGl0SW5mbyA9IG5ldyBmLlJheUhpdEluZm8oKTtcclxuICBmdW5jdGlvbiB1cGRhdGUoKTogdm9pZCB7XHJcblxyXG4gICAgLy9QaHlzaWNzIFxyXG4gICAgZi5QaHlzaWNzLndvcmxkLnNpbXVsYXRlKCk7XHJcbiAgICAvL2YuRGVidWcubG9nKGN1YmVzWzBdLmdldENvbXBvbmVudChmLkNvbXBvbmVudFJpZ2lkYm9keSkuZ2V0UG9zaXRpb24oKSk7XHJcbiAgICAvL0VuZFBoeXNpY3NcclxuICAgIGhpdEluZm8gPSBmLlBoeXNpY3MucmF5Y2FzdChvcmlnaW4sIGRpcmVjdGlvbiwgMTApO1xyXG4gICAgZi5EZWJ1Zy5sb2coaGl0SW5mbyk7XHJcbiAgICB2aWV3UG9ydC5kcmF3KCk7XHJcbiAgICBtZWFzdXJlRlBTKCk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBtZWFzdXJlRlBTKCk6IHZvaWQge1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XHJcbiAgICAgIGNvbnN0IG5vdyA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgICB3aGlsZSAodGltZXMubGVuZ3RoID4gMCAmJiB0aW1lc1swXSA8PSBub3cgLSAxMDAwKSB7XHJcbiAgICAgICAgdGltZXMuc2hpZnQoKTtcclxuICAgICAgfVxyXG4gICAgICB0aW1lcy5wdXNoKG5vdyk7XHJcbiAgICAgIGZwcyA9IHRpbWVzLmxlbmd0aDtcclxuICAgICAgZnBzRGlzcGxheS50ZXh0Q29udGVudCA9IFwiRlBTOiBcIiArIGZwcy50b1N0cmluZygpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBsZXQgaTogbnVtYmVyID0gMDtcclxuICBmdW5jdGlvbiBjcmVhdGVDb21wbGV0ZU1lc2hOb2RlKF9uYW1lOiBzdHJpbmcsIF9tYXRlcmlhbDogZi5NYXRlcmlhbCwgX21lc2g6IGYuTWVzaCwgX21hc3M6IG51bWJlciwgX3BoeXNpY3NUeXBlOiBmLlBIWVNJQ1NfVFlQRSk6IGYuTm9kZSB7XHJcbiAgICBsZXQgbm9kZTogZi5Ob2RlID0gbmV3IGYuTm9kZShfbmFtZSk7XHJcbiAgICBsZXQgY21wTWVzaDogZi5Db21wb25lbnRNZXNoID0gbmV3IGYuQ29tcG9uZW50TWVzaChfbWVzaCk7XHJcbiAgICBsZXQgY21wTWF0ZXJpYWw6IGYuQ29tcG9uZW50TWF0ZXJpYWwgPSBuZXcgZi5Db21wb25lbnRNYXRlcmlhbChfbWF0ZXJpYWwpO1xyXG5cclxuICAgIGxldCBjbXBUcmFuc2Zvcm06IGYuQ29tcG9uZW50VHJhbnNmb3JtID0gbmV3IGYuQ29tcG9uZW50VHJhbnNmb3JtKCk7XHJcbiAgICBpZiAoaSA9PSAwKVxyXG4gICAgICBjbXBUcmFuc2Zvcm0ubG9jYWwuc2NhbGUobmV3IGYuVmVjdG9yMygxMCwgMC4zLCAxMCkpO1xyXG5cclxuICAgIGlmIChpID09IDEpXHJcbiAgICAgIGNtcFRyYW5zZm9ybS5sb2NhbC50cmFuc2xhdGUobmV3IGYuVmVjdG9yMygwLCAyLCAwKSk7XHJcblxyXG4gICAgLy8gaWYgKGkgPT0gMilcclxuICAgIC8vIGNtcFRyYW5zZm9ybS5sb2NhbC50cmFuc2xhdGUobmV3IGYuVmVjdG9yMygwLCAzLjUsIDAuNDEpKTtcclxuXHJcbiAgICBsZXQgY21wUmlnaWRib2R5OiBmLkNvbXBvbmVudFJpZ2lkYm9keSA9IG5ldyBmLkNvbXBvbmVudFJpZ2lkYm9keShfbWFzcywgX3BoeXNpY3NUeXBlLCBmLkNPTExJREVSX1RZUEUuQk9YLCBjbXBUcmFuc2Zvcm0pO1xyXG4gICAgY21wUmlnaWRib2R5LnNldEZyaWN0aW9uKDEpO1xyXG4gICAgY21wUmlnaWRib2R5LnNldFJlc3RpdHV0aW9uKDApO1xyXG4gICAgbm9kZS5hZGRDb21wb25lbnQoY21wTWVzaCk7XHJcbiAgICBub2RlLmFkZENvbXBvbmVudChjbXBNYXRlcmlhbCk7XHJcbiAgICBub2RlLmFkZENvbXBvbmVudChjbXBUcmFuc2Zvcm0pO1xyXG4gICAgbm9kZS5hZGRDb21wb25lbnQoY21wUmlnaWRib2R5KTtcclxuICAgIGkrKztcclxuXHJcbiAgICByZXR1cm4gbm9kZTtcclxuICB9XHJcblxyXG59Il19