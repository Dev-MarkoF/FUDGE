namespace FudgeCore {
  /**
     * Acts as the physical representation of the [[Node]] it's attached to.
     * It's the connection between the Fudge Rendered World and the Physics World
     * @authors Marko Fehrenbach, HFU, 2020
     */
  export class ComponentRigidbody extends Component {

    constructor() {
      super();
      this.addEventListener(EVENT.COMPONENT_ADD, this.addRigidbodyToWorld);
      this.addEventListener(EVENT.COMPONENT_REMOVE, this.removeRigidbodyFromWorld);
    }

    /**
     * Testfunction to show it's there
     */
    public test(): void {
      Debug.log("Hi i'm the rigidbody component");
    }

    private addRigidbodyToWorld(): void {
      Debug.log("Add this to the physical world");
    }

    private removeRigidbodyFromWorld(): void {
      Debug.log("Remove this from the physical world");
    }



    //Basic-TODO: Needs to add/remove itself from the world when created or removed
    //Basic-TODO: Needs to hold information about the collider shape, the weight and such
    //Basic-TODO: Needs set/get functions to change properties of the rb in the physics engine world (eg. static/dynamic/kinematic and such) 
  }
}