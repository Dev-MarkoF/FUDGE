/// <reference path="../../../../Core/Build/Fudge.d.ts"/>
/// <reference path="../../../../UserInterface/Build/FudgeUI.d.ts"/>

namespace UI {
    // import ƒ = Fudge;
    import ƒui = FudgeUserInterface;
    export class CameraUI extends ƒui.UIMutable {
        protected root: HTMLFormElement;
        public constructor(container: GoldenLayout.Container, state: Object, _camera: ƒ.ComponentCamera) {
            super(_camera);
            this.root = document.createElement("form");
            ƒui.UIGenerator.createFromMutable(<ƒ.Mutable>_camera, this.root);
            this.root.addEventListener("input", this.mutateOnInput);
            this.root.querySelector("#_r").textContent = "Red";
        
            container.getElement().html(this.root);
        }
    }
}