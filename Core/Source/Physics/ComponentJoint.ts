namespace FudgeCore {
  /**
     * Acts as the physical representation of a connection between two [[Node]]'s.
     * The type of conncetion is defined by the subclasses like prismatic joint, cylinder joint etc.
     * A Rigidbody on the [[Node]] that this component is added to is needed. Setting the connectedRigidbody and
     * initializing the connection creates a physical connection between them. This differs from a connection through hierarchy
     * in the node structure of fudge. 
     * @authors Marko Fehrenbach, HFU, 2020
     */
  export abstract class ComponentJoint extends Component {
    public attachedRigidbody: ComponentRigidbody;
    public connectedRigidbody: ComponentRigidbody;

    constructor(_attachedRigidbody: ComponentRigidbody = null, _connectedRigidbody: ComponentRigidbody) {
      super();
      //The node either already has a attachedRigidbody or these components will create own. Or they will notify that a rigidbody is needed 
    }

    //needs to be called when the two necessary main variables are set. Can't create a connection with only 1 RB. But could possibly be done by
    //the connection itself on gamestart? And changes are saved seperatly and then used for the connection creation at the gamestart?
    public abstract initializeConnection(): void;

    public abstract addConstraintToWorld(): void;

    public abstract removeConstraintFromWorld(): void;

    public abstract getOimoJoint(): OIMO.Joint;

  }

}