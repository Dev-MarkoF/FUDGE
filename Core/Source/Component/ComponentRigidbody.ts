namespace FudgeCore {
  /**
     * Acts as the physical representation of the [[Node]] it's attached to.
     * It's the connection between the Fudge Rendered World and the Physics World
     * @authors Marko Fehrenbach, HFU, 2020
     */
  export class ComponentRigidbody extends Component {

    /**
     * Testfunction to show it's there
     */
    public test(): void {
      Debug.log("Hi i'm the rigidbody component");
    }
  }
}