namespace FudgeCore {
  /**
     * A physical connection between two bodies with a defined axe movement.
     * Used to create a sliding joint along one axis. Two RigidBodies need to be defined to use it.
     * @authors Marko Fehrenbach, HFU, 2020
     */
  export class ComponentJointPrismatic extends ComponentJoint {
    public static readonly iSubclass: number = Component.registerSubclass(ComponentJointPrismatic);

    get axis(): Vector3 {
      return new Vector3(this.jointAxis.x, this.jointAxis.y, this.jointAxis.z);
    }

    private config: OIMO.PrismaticJointConfig = new OIMO.PrismaticJointConfig();
    private translationalMotor: OIMO.TranslationalLimitMotor;
    private springDamper: OIMO.SpringDamper;
    private jointAnchor: OIMO.Vec3;
    private jointAxis: OIMO.Vec3;


    private oimoJoint: OIMO.PrismaticJoint;

    constructor(_attachedRigidbody: ComponentRigidbody = null, _connectedRigidbody: ComponentRigidbody = null, _axis: Vector3 = new Vector3(0, 1, 0), _anchor: Vector3 = _attachedRigidbody.getPosition()) {
      super(_attachedRigidbody, _connectedRigidbody);
      this.jointAxis = new OIMO.Vec3(_axis.x, _axis.y, _axis.z);
      this.jointAnchor = _anchor != null ? new OIMO.Vec3(0, 0, 0) : new OIMO.Vec3(_anchor.x, _anchor.y, _anchor.z);
      let springDamper: OIMO.SpringDamper = new OIMO.SpringDamper().setSpring(3, 0.2);
      let limitMotor: OIMO.TranslationalLimitMotor = new OIMO.TranslationalLimitMotor().setLimits(0, 0);
      this.springDamper = springDamper;
      this.translationalMotor = limitMotor;

      /*Tell the physics that there is a new joint? and on the physics start the actual joint is first created? Values can be set but the
        actual constraint ain't existent until the game starts?
      */
      this.addEventListener(EVENT.COMPONENT_ADD, this.superAdd);
      this.addEventListener(EVENT.COMPONENT_REMOVE, this.superRemove);
    }

    /**
     * Initializing and connecting the two rigidbodies with the configured joint properties
     * is automatically called by the physics system. No user interaction needed.
     */
    public connect(): void {
      this.constructJoint();
    }

    public getOimoJoint(): OIMO.Joint {
      return this.oimoJoint;
    }

    private constructJoint(): void {
      this.config.init(this.attachedRigidbody.getOimoRigidbody(), this.connectedRigidbody.getOimoRigidbody(), this.jointAnchor, this.jointAxis);
      if (this.springDamper != null) this.config.springDamper = this.springDamper;
      if (this.translationalMotor != null) this.config.limitMotor = this.translationalMotor;
      var j: OIMO.PrismaticJoint = new OIMO.PrismaticJoint(this.config);
      this.oimoJoint = j;
    }

    private superAdd(): void {
      this.addConstraintToWorld(this);
    }

    private superRemove(): void {
      this.removeConstraintFromWorld(this);
    }

  }
}