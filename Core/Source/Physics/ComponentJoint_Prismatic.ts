namespace FudgeCore {
  /**
     * A physical connection between two bodies with a defined axe movement.
     * Used to create a sliding joint along one axis. Two RigidBodies need to be defined to use it.
     * @authors Marko Fehrenbach, HFU, 2020
     */
  export class ComponentJointPrismatic extends ComponentJoint {
    public static readonly iSubclass: number = Component.registerSubclass(ComponentJointPrismatic);

    //#region Get/Set transfor of fudge properties to the physics engine
    /**
     * The axis connecting the the two [[Node]]s e.g. Vector3(0,1,0) to have a upward connection.
     *  When changed after initialization the joint needs to be reconnected.
     */
    get axis(): Vector3 {
      return new Vector3(this.jointAxis.x, this.jointAxis.y, this.jointAxis.z);
    }
    set axis(_value: Vector3) {
      this.jointAxis = new OIMO.Vec3(_value.x, _value.y, _value.z);
    }

    /**
     * The exact position where the two [[Node]]s are connected. When changed after initialization the joint needs to be reconnected.
     */
    get anchor(): Vector3 {
      return new Vector3(this.jointAnchor.x, this.jointAnchor.y, this.jointAnchor.z);
    }
    set anchor(_value: Vector3) {
      this.jointAnchor = new OIMO.Vec3(_value.x, _value.y, _value.z);
    }

    /**
     * The damping of the spring. 1 equals completly damped.
     */
    get springDamping(): number {
      return this.jointSpringDampingRatio;
    }
    set springDamping(_value: number) {
      this.jointSpringDampingRatio = _value;
      if (this.oimoJoint != null) this.oimoJoint.getSpringDamper().dampingRatio = this.jointSpringDampingRatio;
    }

    /**
     * The frequency of the spring in Hz. At 0 the spring is rigid, equals no spring.
    */
    get springFrequency(): number {
      return this.jointSpringFrequency;
    }
    set springFrequency(_value: number) {
      this.jointSpringFrequency = _value;
      if (this.oimoJoint != null) this.oimoJoint.getSpringDamper().frequency = this.jointSpringFrequency;
    }

    /**
     * The amount of force needed to break the JOINT, in Newton. 0 equals unbreakable (default) 
    */
    get breakForce(): number {
      return this.jointBreakForce;
    }
    set breakForce(_value: number) {
      this.jointBreakForce = _value;
      if (this.oimoJoint != null) this.oimoJoint.setBreakForce(this.jointBreakForce);
    }

    /**
       * The amount of force needed to break the JOINT, while rotating, in Newton. 0 equals unbreakable (default) 
      */
    get breakTorque(): number {
      return this.jointBreakTorque;
    }
    set breakTorque(_value: number) {
      this.jointBreakTorque = _value;
      if (this.oimoJoint != null) this.oimoJoint.setBreakTorque(this.jointBreakTorque);
    }

    /**
      * The Upper Limit of movement along the axis of this joint. The limiter is disable if lowerLimit > upperLimit.
     */
    get motorLimitUpper(): number {
      return this.jointMotorLimitUpper;
    }
    set motorLimitUpper(_value: number) {
      this.jointMotorLimitUpper = _value;
      if (this.oimoJoint != null) this.oimoJoint.getLimitMotor().upperLimit = this.jointMotorLimitUpper;
    }
    /**
      * The Lower Limit of movement along the axis of this joint. The limiter is disable if lowerLimit > upperLimit.
     */
    get motorLimitLower(): number {
      return this.jointMotorLimitUpper;
    }
    set motorLimitLower(_value: number) {
      this.jointMotorLimitLower = _value;
      if (this.oimoJoint != null) this.oimoJoint.getLimitMotor().lowerLimit = this.jointMotorLimitLower;
    }
    /**
      * The target speed of the motor in m/s.
     */
    get motorSpeed(): number {
      return this.jointMotorSpeed;
    }
    set motorSpeed(_value: number) {
      this.jointMotorSpeed = _value;
      if (this.oimoJoint != null) this.oimoJoint.getLimitMotor().motorSpeed = this.jointMotorSpeed;
    }
    /**
      * The maximum motor force in Newton. force <= 0 equals disabled. 
     */
    get motorForce(): number {
      return this.jointMotorForce;
    }
    set motorForce(_value: number) {
      this.jointMotorForce = _value;
      if (this.oimoJoint != null) this.oimoJoint.getLimitMotor().motorForce = this.jointMotorForce;
    }

    /**
      * If the two connected RigidBodies collide with eath other. (Default = false)
     */
    get internalCollision(): boolean {
      return this.jointInternalCollision;
    }
    set internalCollision(_value: boolean) {
      this.jointInternalCollision = _value;
      if (this.oimoJoint != null) this.oimoJoint.setAllowCollision(this.jointInternalCollision);
    }
    //#endregion

    private jointSpringDampingRatio: number = 0;
    private jointSpringFrequency: number = 0;

    private jointMotorLimitUpper: number = 0;
    private jointMotorLimitLower: number = 0;
    private jointMotorForce: number = 0;
    private jointMotorSpeed: number = 0;

    private jointBreakForce: number = 0;
    private jointBreakTorque: number = 0;

    private config: OIMO.PrismaticJointConfig = new OIMO.PrismaticJointConfig();
    private translationalMotor: OIMO.TranslationalLimitMotor;
    private springDamper: OIMO.SpringDamper;
    private jointAnchor: OIMO.Vec3;
    private jointAxis: OIMO.Vec3;

    private jointInternalCollision: boolean;

    private oimoJoint: OIMO.PrismaticJoint;


    constructor(_attachedRigidbody: ComponentRigidbody = null, _connectedRigidbody: ComponentRigidbody = null, _axis: Vector3 = new Vector3(0, 1, 0), _anchor: Vector3 = _attachedRigidbody.getPosition()) {
      super(_attachedRigidbody, _connectedRigidbody);
      this.jointAxis = new OIMO.Vec3(_axis.x, _axis.y, _axis.z);
      this.jointAnchor = _anchor != null ? new OIMO.Vec3(0, 0, 0) : new OIMO.Vec3(_anchor.x, _anchor.y, _anchor.z);

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
      if (this.connected == false) {
        this.constructJoint();
        this.connected = true;
      }
    }

    public getOimoJoint(): OIMO.Joint {
      return this.oimoJoint;
    }

    private constructJoint(): void {
      this.springDamper = new OIMO.SpringDamper().setSpring(this.jointSpringFrequency, this.jointSpringDampingRatio);
      this.translationalMotor = new OIMO.TranslationalLimitMotor().setLimits(this.jointMotorLimitLower, this.jointMotorLimitUpper);
      this.translationalMotor.setMotor(this.jointMotorSpeed, this.jointMotorForce);
      this.config = new OIMO.PrismaticJointConfig();
      this.config.init(this.attachedRB.getOimoRigidbody(), this.connectedRB.getOimoRigidbody(), this.jointAnchor, this.jointAxis);
      this.config.springDamper = this.springDamper;
      this.config.limitMotor = this.translationalMotor;
      var j: OIMO.PrismaticJoint = new OIMO.PrismaticJoint(this.config);
      j.setBreakForce(this.breakForce);
      j.setBreakTorque(this.breakTorque);
      j.setAllowCollision(this.jointInternalCollision);
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