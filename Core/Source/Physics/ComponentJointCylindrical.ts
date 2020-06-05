namespace FudgeCore {
  /**
     * A physical connection between two bodies with a defined axe of rotation and rotation. Two Degrees of Freedom in the defined axis.
     * Two RigidBodies need to be defined to use it. For actual rotating a upper/lower limit need to be set otherwise it's just a holding connection.
     * A motor can be defined for rotation and translation, along with spring settings.
     * @authors Marko Fehrenbach, HFU, 2020
     */
  export class ComponentJointCylindrical extends ComponentJoint {
    public static readonly iSubclass: number = Component.registerSubclass(ComponentJointCylindrical);

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
      this.disconnect();
      this.dirtyStatus();
    }

    /**
     * The exact position where the two [[Node]]s are connected. When changed after initialization the joint needs to be reconnected.
     */
    get anchor(): Vector3 {
      return new Vector3(this.jointAnchor.x, this.jointAnchor.y, this.jointAnchor.z);
    }
    set anchor(_value: Vector3) {
      this.jointAnchor = new OIMO.Vec3(_value.x, _value.y, _value.z);
      this.disconnect();
      this.dirtyStatus();
    }

    /**
     * The damping of the spring. 1 equals completly damped.
     */
    get springDamping(): number {
      return this.jointSpringDampingRatio;
    }
    set springDamping(_value: number) {
      this.jointSpringDampingRatio = _value;
      if (this.oimoJoint != null) this.oimoJoint.getTranslationalSpringDamper().dampingRatio = this.jointSpringDampingRatio;
    }

    /**
     * The frequency of the spring in Hz. At 0 the spring is rigid, equals no spring. The smaller the value the less restrictive is the spring.
    */
    get springFrequency(): number {
      return this.jointSpringFrequency;
    }
    set springFrequency(_value: number) {
      this.jointSpringFrequency = _value;
      if (this.oimoJoint != null) this.oimoJoint.getTranslationalSpringDamper().frequency = this.jointSpringFrequency;
    }

    /**
    * The damping of the spring. 1 equals completly damped. Influencing TORQUE / ROTATION
    */
    get rotationSpringDamping(): number {
      return this.jointRotationSpringDampingRatio;
    }
    set rotationSpringDamping(_value: number) {
      this.jointRotationSpringDampingRatio = _value;
      if (this.oimoJoint != null) this.oimoJoint.getRotationalSpringDamper().dampingRatio = this.jointRotationSpringDampingRatio;
    }

    /**
     * The frequency of the spring in Hz. At 0 the spring is rigid, equals no spring. Influencing TORQUE / ROTATION
    */
    get rotationSpringFrequency(): number {
      return this.jointRotationSpringFrequency;
    }
    set rotationSpringFrequency(_value: number) {
      this.jointRotationSpringFrequency = _value;
      if (this.oimoJoint != null) this.oimoJoint.getRotationalSpringDamper().frequency = this.jointRotationSpringFrequency;
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
      * The Upper Limit of movement along the axis of this joint. The limiter is disable if lowerLimit > upperLimit. Axis-Angle measured in Degree.
     */
    get rotationalMotorLimitUpper(): number {
      return this.jointRotationMotorLimitUpper * 180 / Math.PI;
    }
    set rotationalMotorLimitUpper(_value: number) {
      this.jointRotationMotorLimitUpper = _value * Math.PI / 180;
      if (this.oimoJoint != null) this.oimoJoint.getRotationalLimitMotor().upperLimit = this.jointRotationMotorLimitUpper;
    }
    /**
      * The Lower Limit of movement along the axis of this joint. The limiter is disable if lowerLimit > upperLimit. Axis Angle measured in Degree.
     */
    get rotationalMotorLimitLower(): number {
      return this.jointRotationMotorLimitLower * 180 / Math.PI;
    }
    set rotationalMotorLimitLower(_value: number) {
      this.jointRotationMotorLimitLower = _value * Math.PI / 180;
      if (this.oimoJoint != null) this.oimoJoint.getRotationalLimitMotor().lowerLimit = this.jointRotationMotorLimitLower;
    }
    /**
      * The target rotational speed of the motor in m/s. 
     */
    get rotationalMotorSpeed(): number {
      return this.jointRotationMotorSpeed;
    }
    set rotationalMotorSpeed(_value: number) {
      this.jointRotationMotorSpeed = _value;
      if (this.oimoJoint != null) this.oimoJoint.getRotationalLimitMotor().motorSpeed = this.jointRotationMotorSpeed;
    }
    /**
      * The maximum motor torque in Newton. force <= 0 equals disabled. 
     */
    get rotationalMotorTorque(): number {
      return this.jointRotationMotorTorque;
    }
    set rotationalMotorTorque(_value: number) {
      this.jointRotationMotorTorque = _value;
      if (this.oimoJoint != null) this.oimoJoint.getRotationalLimitMotor().motorTorque = this.jointRotationMotorTorque;
    }

    /**
      * The Upper Limit of movement along the axis of this joint. The limiter is disable if lowerLimit > upperLimit. 
     */
    get translationMotorLimitUpper(): number {
      return this.jointMotorLimitUpper;
    }
    set translationMotorLimitUpper(_value: number) {
      this.jointMotorLimitUpper = _value;
      if (this.oimoJoint != null) this.oimoJoint.getTranslationalLimitMotor().upperLimit = this.jointMotorLimitUpper;
    }
    /**
      * The Lower Limit of movement along the axis of this joint. The limiter is disable if lowerLimit > upperLimit. 
     */
    get translationMotorLimitLower(): number {
      return this.jointMotorLimitUpper;
    }
    set translationMotorLimitLower(_value: number) {
      this.jointMotorLimitLower = _value;
      if (this.oimoJoint != null) this.oimoJoint.getTranslationalLimitMotor().lowerLimit = this.jointMotorLimitLower;
    }
    /**
      * The target speed of the motor in m/s.
     */
    get translationMotorSpeed(): number {
      return this.jointMotorSpeed;
    }
    set translationMotorSpeed(_value: number) {
      this.jointMotorSpeed = _value;
      if (this.oimoJoint != null) this.oimoJoint.getTranslationalLimitMotor().motorSpeed = this.jointMotorSpeed;
    }
    /**
      * The maximum motor force in Newton. force <= 0 equals disabled. 
     */
    get translationMotorForce(): number {
      return this.jointMotorForce;
    }
    set translationMotorForce(_value: number) {
      this.jointMotorForce = _value;
      if (this.oimoJoint != null) this.oimoJoint.getTranslationalLimitMotor().motorForce = this.jointMotorForce;
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

    private jointRotationSpringDampingRatio: number = 0;
    private jointRotationSpringFrequency: number = 0;

    private jointMotorLimitUpper: number = 0;
    private jointMotorLimitLower: number = 0;
    private jointMotorForce: number = 0;
    private jointMotorSpeed: number = 0;

    private jointRotationMotorLimitUpper: number = 0;
    private jointRotationMotorLimitLower: number = 0;
    private jointRotationMotorTorque: number = 0;
    private jointRotationMotorSpeed: number = 0;

    private jointBreakForce: number = 0;
    private jointBreakTorque: number = 0;

    private config: OIMO.CylindricalJointConfig = new OIMO.CylindricalJointConfig();
    private rotationalMotor: OIMO.RotationalLimitMotor;
    private translationMotor: OIMO.TranslationalLimitMotor;
    private springDamper: OIMO.SpringDamper;
    private rotationSpringDamper: OIMO.SpringDamper;
    private jointAnchor: OIMO.Vec3;
    private jointAxis: OIMO.Vec3;

    private jointInternalCollision: boolean;

    private oimoJoint: OIMO.CylindricalJoint;


    constructor(_attachedRigidbody: ComponentRigidbody = null, _connectedRigidbody: ComponentRigidbody = null, _axis: Vector3 = new Vector3(0, 1, 0), _anchor: Vector3 = new Vector3(0, 0, 0)) {
      super(_attachedRigidbody, _connectedRigidbody);
      this.jointAxis = new OIMO.Vec3(_axis.x, _axis.y, _axis.z);
      this.jointAnchor = new OIMO.Vec3(_anchor.x, _anchor.y, _anchor.z);

      /*Tell the physics that there is a new joint? and on the physics start the actual joint is first created? Values can be set but the
        actual constraint ain't existent until the game starts?
      */
      this.addEventListener(EVENT.COMPONENT_ADD, this.dirtyStatus);
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
        this.superAdd();
      }
    }

    /**
     * Disconnecting the two rigidbodies and removing them from the physics system,
     * is automatically called by the physics system. No user interaction needed.
     */
    public disconnect(): void {
      if (this.connected == true) {
        this.superRemove();
        this.connected = false;
      }
    }

    /**
     * Returns the original Joint used by the physics engine. Used internally no user interaction needed.
     * Only to be used when functionality that is not added within Fudge is needed.
    */
    public getOimoJoint(): OIMO.Joint {
      return this.oimoJoint;
    }

    private constructJoint(): void {
      this.springDamper = new OIMO.SpringDamper().setSpring(this.jointSpringFrequency, this.jointSpringDampingRatio);
      this.rotationSpringDamper = new OIMO.SpringDamper().setSpring(this.jointRotationSpringFrequency, this.rotationSpringDamping);

      this.translationMotor = new OIMO.TranslationalLimitMotor().setLimits(this.jointMotorLimitLower, this.jointMotorLimitUpper);
      this.translationMotor.setMotor(this.jointMotorSpeed, this.jointMotorForce);
      this.rotationalMotor = new OIMO.RotationalLimitMotor().setLimits(this.jointRotationMotorLimitLower, this.jointRotationMotorLimitUpper);
      this.rotationalMotor.setMotor(this.jointRotationMotorSpeed, this.jointRotationMotorTorque);

      this.config = new OIMO.CylindricalJointConfig();
      this.config.init(this.attachedRB.getOimoRigidbody(), this.connectedRB.getOimoRigidbody(), this.jointAnchor, this.jointAxis);
      this.config.translationalSpringDamper = this.springDamper;
      this.config.translationalLimitMotor = this.translationMotor;
      this.config.rotationalLimitMotor = this.rotationalMotor;
      this.config.rotationalSpringDamper = this.rotationSpringDamper;

      var j: OIMO.CylindricalJoint = new OIMO.CylindricalJoint(this.config);
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

    private dirtyStatus(): void {
      Physics.world.changeJointStatus(this);
    }

  }
}