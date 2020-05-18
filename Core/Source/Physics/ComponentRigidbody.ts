///<reference path="../../../Physics/OIMOPhysics.d.ts"/>

namespace FudgeCore {
  /**
     * Acts as the physical representation of the [[Node]] it's attached to.
     * It's the connection between the Fudge Rendered world and the Physics world
     * @authors Marko Fehrenbach, HFU, 2020
     */
  export class ComponentRigidbody extends Component {
    public static readonly iSubclass: number = Component.registerSubclass(ComponentRigidbody);

    get physicsType(): PHYSICS_TYPE {
      return this.rbType;
    }
    set physicsType(_value: PHYSICS_TYPE) {
      this.rbType = _value;
      this.rigidbody.setType(this.rbType);
    }

    get colliderType(): COLLIDER_TYPE {
      return this.colType;
    }

    set colliderType(_value: COLLIDER_TYPE) {
      this.colType = _value;
      //Should recreate collider, currently does nothing
    }

    get collisionGroup(): PHYSICS_GROUP {
      return this.colGroup;
    }

    set collisionGroup(_value: PHYSICS_GROUP) {
      this.colGroup = _value;
      if (this.rigidbody != null)
        this.rigidbody.getShapeList().setCollisionGroup(this.colGroup);
    }


    public offsetPosition: Vector3 = Vector3.ZERO();
    public offsetRotation: Vector3 = Vector3.ZERO();
    public offsetScaling: Vector3 = Vector3.ONE();

    /**
   * Returns the physical weight of the [[Node]]
   */
    get mass(): number {
      return this.rigidbody.getMass();
    }
    /**
  * Setting the physical weight of the [[Node]] in kg
  */
    set mass(_value: number) {
      this.massData.mass = _value;
      if (this.rigidbody != null)
        this.rigidbody.setMassData(this.massData);
    }

    get linearDamping(): number {
      return this.rigidbody.getLinearDamping();
    }
    set linearDamping(_value: number) {
      this.rigidbody.setLinearDamping(_value);
    }

    get angularDamping(): number {
      return this.rigidbody.getAngularDamping();
    }
    set angularDamping(_value: number) {
      this.rigidbody.setAngularDamping(_value);
    }

    private rigidbody: OIMO.RigidBody;
    private massData: OIMO.MassData = new OIMO.MassData();
    private collider: OIMO.Shape;
    private colliderInfo: OIMO.ShapeConfig;
    private rigidbodyInfo: OIMO.RigidBodyConfig = new OIMO.RigidBodyConfig();
    private contactNumPrev: Number = 0;
    private contactNumCurrent: Number = 0;
    private contacts: OIMO.Contact[] = new Array();
    private rbType: PHYSICS_TYPE = PHYSICS_TYPE.DYNAMIC;
    private colType: COLLIDER_TYPE = COLLIDER_TYPE.BOX;
    private colGroup: PHYSICS_GROUP = PHYSICS_GROUP.DEFAULT;

    constructor(_mass: number = 1, _type: PHYSICS_TYPE = PHYSICS_TYPE.DYNAMIC, _colliderType: COLLIDER_TYPE = COLLIDER_TYPE.BOX, _group: PHYSICS_GROUP = PHYSICS_GROUP.DEFAULT, _transform: Matrix4x4 = null) {
      super();
      this.collisionGroup = _group;
      this.colliderType = _colliderType;
      this.mass = _mass;
      this.createRigidbody(_mass, _type, this.colliderType, _transform, this.collisionGroup);
      this.addEventListener(EVENT.COMPONENT_ADD, this.addRigidbodyToWorld);
      this.addEventListener(EVENT.COMPONENT_REMOVE, this.removeRigidbodyFromWorld);
    }


    /**
    * Returns the rigidbody in the form the physics engine is using it, should not be used unless a functionality
    * is not provided through the FUDGE Integration.
    */
    public getOimoRigidbody(): OIMO.RigidBody {
      return this.rigidbody;
    }

    public checkContacts(): void {
      this.contactNumCurrent = this.rigidbody._numContactLinks;
      if (this.contactNumCurrent != this.contactNumPrev) {
        if (this.contactNumCurrent >= this.contactNumPrev) {
          Debug.log("More Contacts"); //Go through list add new contacts -> check up on prev/next array functionality in javascript
          Debug.log(this.rigidbody._contactLinkListLast);
        }
        else {
          Debug.log("Less Contacts"); //Go through list remove leaving contacts
        }
        Debug.log(this.contacts);
      }
      this.contactNumPrev = this.contactNumCurrent;
    }

    /**
   * Removes and recreates the Rigidbody from the world matrix of the [[Node]]
   */
    public updateFromWorld(): void {
      // let local: Matrix4x4 = super.getContainer().mtxWorld;
      // let position: Vector3 = local.translation;
      // let rotation: Vector3 = local.rotation;
      // let scaling: Vector3 = local.scaling;
      // this.rigidbody.setPosition(new OIMO.Vec3(position.x, position.y, position.z));
      // this.rigidbody.setRotationXyz(new OIMO.Vec3(rotation.x, rotation.y, rotation.z));
      // //this.rigidbody.removeShape(this.collider);;
      // this.createCollider(new OIMO.Vec3(scaling.x, scaling.y, scaling.z), this.colliderType);
      // this.collider = new OIMO.Shape(this.colliderInfo);
      // this.rigidbody.addShape(this.collider);
      // this.rigidbody.removeShape(this.rigidbody.getShapeList());
      this.removeRigidbodyFromWorld();
      this.createRigidbody(this.mass, this.physicsType, this.colliderType, null, this.collisionGroup);
      this.addRigidbodyToWorld();
    }


    /**
   * Get the friction of the rigidbody, which is the factor of sliding resistance of this rigidbody on surfaces
   */
    public getFriction(): number {
      return this.rigidbody.getShapeList().getFriction();
    }


    /**
   * Set the friction of the rigidbody, which is the factor of  sliding resistance of this rigidbody on surfaces
   */
    public setFriction(_friction: number): void {
      this.rigidbody.getShapeList().setFriction(_friction);
    }

    /**
 * Get the restitution of the rigidbody, which is the factor of bounciness of this rigidbody on surfaces
 */
    public getRestitution(): number {
      return this.rigidbody.getShapeList().getRestitution();
    }

    /**
   * Set the restitution of the rigidbody, which is the factor of bounciness of this rigidbody on surfaces
   */
    public setRestitution(_restitution: number): void {
      this.rigidbody.getShapeList().setRestitution(_restitution);
    }

    /**
   * Get the current POSITION of the [[Node]] in the physical space
   */
    public getPosition(): Vector3 {
      let tmpPos: OIMO.Vec3 = this.rigidbody.getPosition();
      return new Vector3(tmpPos.x, tmpPos.y, tmpPos.z);
    }

    /**
  * Sets the current POSITION of the [[Node]] in the physical space
  */
    public setPosition(_value: Vector3): void {
      this.rigidbody.setPosition(new OIMO.Vec3(_value.x, _value.y, _value.z));
    }

    /**
     * Get the current ROTATION of the [[Node]] in the physical space
     */
    public getRotation(): Vector3 {
      let orientation: OIMO.Quat = this.rigidbody.getOrientation();
      let tmpQuat: Quaternion = new Quaternion(orientation.x, orientation.y, orientation.z, orientation.w);
      return tmpQuat.toDegrees();
    }


    /**
     * Sets the current ROTATION of the [[Node]] in the physical space, in degree.
     */
    public setRotation(_value: Vector3): void {
      let radians: OIMO.Vec3 = new OIMO.Vec3(_value.x * (Math.PI / 180), _value.y * (Math.PI / 180), _value.z * (Math.PI / 180));
      this.rigidbody.setRotationXyz(radians);
    }

    //#region Velocity and Forces

    /**
    * Get the current VELOCITY of the [[Node]]
    */
    public getVelocity(): Vector3 {
      let velocity: OIMO.Vec3 = this.rigidbody.getLinearVelocity();
      return new Vector3(velocity.x, velocity.y, velocity.z);
    }


    /**
     * Sets the current VELOCITY of the [[Node]]
     */
    public setVelocity(_value: Vector3): void {
      let velocity: OIMO.Vec3 = new OIMO.Vec3(_value.x, _value.y, _value.z);
      this.rigidbody.setLinearVelocity(velocity);
    }


    /**
     * Applies a continous FORCE at the center of the RIGIDBODY in the three dimensions. Considering the rigidbody's MASS.
     * The force is measured in newton, 1kg needs about 10 Newton to fight against gravity.
     */
    public applyForce(_force: Vector3): void {
      this.rigidbody.applyForceToCenter(new OIMO.Vec3(_force.x, _force.y, _force.z));
    }

    /**
    * Applies a continous FORCE at a specific point in the world to the RIGIDBODY in the three dimensions. Considering the rigidbody's MASS
    */
    public applyForceAtPoint(_force: Vector3, _worldPoint: Vector3): void {
      this.rigidbody.applyForce(new OIMO.Vec3(_force.x, _force.y, _force.z), new OIMO.Vec3(_worldPoint.x, _worldPoint.y, _worldPoint.z));
    }

    /**
    * Applies a continous ROTATIONAL FORCE (Torque) to the RIGIDBODY in the three dimensions. Considering the rigidbody's MASS
    */
    public applyTorque(_rotationalForce: Vector3): void {
      this.rigidbody.applyTorque(new OIMO.Vec3(_rotationalForce.x, _rotationalForce.y, _rotationalForce.z));
    }

    /**
    * Applies a instant FORCE at a point/rigidbodycenter to the RIGIDBODY in the three dimensions. Considering the rigidbod's MASS
    * Influencing the angular speed and the linear speed. 
    */
    public applyImpulseAtPoint(_impulse: Vector3, _worldPoint: Vector3 = null): void {
      _worldPoint = _worldPoint != null ? _worldPoint : this.getPosition();
      this.rigidbody.applyImpulse(new OIMO.Vec3(_impulse.x, _impulse.y, _impulse.z), new OIMO.Vec3(_worldPoint.x, _worldPoint.y, _worldPoint.z));
    }

    /**
    * Applies a instant FORCE to the RIGIDBODY in the three dimensions. Considering the rigidbody's MASS
    * Only influencing it's speed not rotation.
    */
    public applyLinearImpulse(_impulse: Vector3): void {
      this.rigidbody.applyLinearImpulse(new OIMO.Vec3(_impulse.x, _impulse.y, _impulse.z));
    }

    /**
   * Applies a instant ROTATIONAL-FORCE to the RIGIDBODY in the three dimensions. Considering the rigidbody's MASS
   * Only influencing it's rotation.
   */
    public applyAngularImpulse(_rotationalImpulse: Vector3): void {
      this.rigidbody.applyAngularImpulse(new OIMO.Vec3(_rotationalImpulse.x, _rotationalImpulse.y, _rotationalImpulse.z));
    }

    /**
   * Changing the VELOCITY of the RIGIDBODY. Only influencing the linear speed not angular
   */
    public addVelocity(_value: Vector3): void {
      this.rigidbody.addLinearVelocity(new OIMO.Vec3(_value.x, _value.y, _value.z));
    }

    /**
   * Changing the VELOCITY of the RIGIDBODY. Only influencing the angular speed not the linear
   */
    public addAngularVelocity(_value: Vector3): void {
      this.rigidbody.addAngularVelocity(new OIMO.Vec3(_value.x, _value.y, _value.z));
    }

    //#endregion

    //#events
    public reactToEvent(_eventType: EVENT_PHYSICS, _other: ComponentRigidbody): void {
      // Debug.log(_eventType + " / " + this.getContainer().name);
    }

    /**
     * Sends a ray through this specific body ignoring the rest of the world and checks if this body was hit by the ray,
     * returning info about the hit.
     */
    public raycastThisBody(_origin: Vector3, _direction: Vector3, _length: number): RayHitInfo {
      let hitInfo: RayHitInfo = new RayHitInfo();
      let geometry: OIMO.Geometry = this.rigidbody.getShapeList().getGeometry();
      let transform: OIMO.Transform = this.rigidbody.getTransform();
      let endpoint: Vector3 = Vector3.ZERO();
      endpoint.add(_origin);
      let endDirection: Vector3 = _direction;
      endDirection.scale(_length);
      endpoint.add(endDirection);
      let oimoRay: OIMO.RayCastHit;
      let hit: boolean = geometry.rayCast(new OIMO.Vec3(_origin.x, _origin.y, _origin.z), new OIMO.Vec3(endpoint.x, endpoint.y, endpoint.z), transform, oimoRay);
      if (hit) {
        hitInfo.hit = true;
        hitInfo.hitPoint = new Vector3(oimoRay.position.x, oimoRay.position.y, oimoRay.position.z);
        hitInfo.hitNormal = new Vector3(oimoRay.normal.x, oimoRay.normal.y, oimoRay.normal.z);
        let dx: number = _origin.x - hitInfo.hitPoint.x;
        let dy: number = _origin.y - hitInfo.hitPoint.y;
        let dz: number = _origin.z - hitInfo.hitPoint.z;
        hitInfo.hitDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        hitInfo.rigidbodyComponent = this;
      }
      return hitInfo;
    }


    private addRigidbodyToWorld(): void {
      Physics.world.addRigidbody(this.rigidbody, this);
    }

    private removeRigidbodyFromWorld(): void {
      Physics.world.removeRigidbody(this.rigidbody, this);
    }

    private createRigidbody(_mass: number, _type: PHYSICS_TYPE, _colliderType: COLLIDER_TYPE, _transform: Matrix4x4, _collisionGroup: PHYSICS_GROUP = PHYSICS_GROUP.DEFAULT): void {
      let tmpTransform: Matrix4x4 = _transform == null ? super.getContainer() != null ? super.getContainer().mtxWorld : Matrix4x4.IDENTITY() : _transform;

      let scale: OIMO.Vec3 = new OIMO.Vec3((tmpTransform.scaling.x * this.offsetScaling.x) / 2, (tmpTransform.scaling.y * this.offsetScaling.y) / 2, (tmpTransform.scaling.z * this.offsetScaling.z) / 2);
      let position: OIMO.Vec3 = new OIMO.Vec3(tmpTransform.translation.x + this.offsetPosition.x, tmpTransform.translation.y + this.offsetPosition.y, tmpTransform.translation.z + this.offsetPosition.z);
      let rotation: OIMO.Vec3 = new OIMO.Vec3(tmpTransform.rotation.x + this.offsetRotation.x, tmpTransform.rotation.y + this.offsetRotation.y, tmpTransform.rotation.z + this.offsetRotation.z);

      this.createCollider(scale, _colliderType);

      this.massData.mass = _type != PHYSICS_TYPE.STATIC ? _mass : 0;
      this.rigidbodyInfo.type = _type;
      this.rigidbodyInfo.position = position;
      this.rigidbodyInfo.rotation.fromEulerXyz(new OIMO.Vec3(rotation.x, rotation.y, rotation.z));
      this.rigidbody = new OIMO.RigidBody(this.rigidbodyInfo);
      this.collider = new OIMO.Shape(this.colliderInfo);
      this.collider.userData = this;
      this.collider.setCollisionGroup(_collisionGroup);
      if (_collisionGroup == PHYSICS_GROUP.TRIGGER)
        this.collider.setCollisionMask(PHYSICS_GROUP.TRIGGER);
      else
        this.collider.setCollisionMask(PHYSICS_GROUP.DEFAULT | PHYSICS_GROUP.GROUP_1 | PHYSICS_GROUP.GROUP_2 | PHYSICS_GROUP.GROUP_3 | PHYSICS_GROUP.GROUP_4);
      this.rigidbody.addShape(this.collider);
      this.rigidbody.setMassData(this.massData);
    }

    private createCollider(_scale: OIMO.Vec3, _colliderType: COLLIDER_TYPE): void {
      let shapeConf: OIMO.ShapeConfig = new OIMO.ShapeConfig();
      let geometry: OIMO.Geometry;
      this.colliderType = _colliderType;
      switch (_colliderType) {
        case COLLIDER_TYPE.BOX:
          geometry = new OIMO.BoxGeometry(_scale);
          break;
        case COLLIDER_TYPE.SPHERE:
          geometry = new OIMO.SphereGeometry(_scale.x);
          break;
        case COLLIDER_TYPE.CAPSULE:
          geometry = new OIMO.CapsuleGeometry(_scale.x, _scale.y);
          break;
        case COLLIDER_TYPE.CYLINDER:
          geometry = new OIMO.CylinderGeometry(_scale.x, _scale.y);
          break;
      }
      shapeConf.geometry = geometry;
      this.colliderInfo = shapeConf;
    }

  }
}