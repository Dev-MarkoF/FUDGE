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
      let oimoType: number;
      switch (this.rbType) {
        case PHYSICS_TYPE.DYNAMIC:
          oimoType = OIMO.RigidBodyType.DYNAMIC;
          break;
        case PHYSICS_TYPE.STATIC:
          oimoType = OIMO.RigidBodyType.STATIC;
          break;
        case PHYSICS_TYPE.KINEMATIC:
          oimoType = OIMO.RigidBodyType.KINEMATIC;
          break;
      }
      this.rigidbody.setType(oimoType);
    }

    get colliderType(): COLLIDER_TYPE {
      return this.colType;
    }

    set colliderType(_value: COLLIDER_TYPE) {
      if (_value != this.colType && this.rigidbody != null)
        this.updateFromWorld();
      this.colType = _value;
    }

    get collisionGroup(): PHYSICS_GROUP {
      return this.colGroup;
    }

    set collisionGroup(_value: PHYSICS_GROUP) {
      if (_value != PHYSICS_GROUP.TRIGGER && this.colGroup == PHYSICS_GROUP.TRIGGER)
        Physics.world.unregisterTrigger(this);
      if (_value == PHYSICS_GROUP.TRIGGER)
        Physics.world.registerTrigger(this);

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
      this.linDamping = _value;
      this.rigidbody.setLinearDamping(_value);
    }

    get angularDamping(): number {
      return this.rigidbody.getAngularDamping();
    }
    set angularDamping(_value: number) {
      this.angDamping = _value;
      this.rigidbody.setAngularDamping(_value);
    }

    get rotationInfluenceFactor(): Vector3 {
      return this.rotationalInfluenceFactor;
    }
    set rotationInfluenceFactor(_influence: Vector3) {
      this.rotationalInfluenceFactor = _influence;
      this.rigidbody.setRotationFactor(new OIMO.Vec3(this.rotationalInfluenceFactor.x, this.rotationalInfluenceFactor.y, this.rotationalInfluenceFactor.z));
    }

    public collisions: ComponentRigidbody[] = new Array();
    public triggers: ComponentRigidbody[] = new Array();
    public bodiesInTrigger: ComponentRigidbody[] = new Array();

    private rigidbody: OIMO.RigidBody;
    private massData: OIMO.MassData = new OIMO.MassData();
    private collider: OIMO.Shape;
    private colliderInfo: OIMO.ShapeConfig;
    private rigidbodyInfo: OIMO.RigidBodyConfig = new OIMO.RigidBodyConfig();
    private rbType: PHYSICS_TYPE = PHYSICS_TYPE.DYNAMIC;
    private colType: COLLIDER_TYPE = COLLIDER_TYPE.CUBE;
    private colGroup: PHYSICS_GROUP = PHYSICS_GROUP.DEFAULT;
    private restitution: number = 0.2;
    private friction: number = 0.5;
    private linDamping: number = 0.1;
    private angDamping: number = 0.1;
    private rotationalInfluenceFactor: Vector3 = Vector3.ONE();

    constructor(_mass: number = 1, _type: PHYSICS_TYPE = PHYSICS_TYPE.DYNAMIC, _colliderType: COLLIDER_TYPE = COLLIDER_TYPE.CUBE, _group: PHYSICS_GROUP = PHYSICS_GROUP.DEFAULT, _transform: Matrix4x4 = null) {
      super();
      this.rbType = _type;
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

    /**
   * Checking for Collision with other Colliders and dispatches a custom event with information about the collider.
   * Automatically called in the RenderManager, no interaction needed.
   */
    public checkCollisionEvents(): void {
      let list: OIMO.ContactLink = this.rigidbody.getContactLinkList();
      let objHit: ComponentRigidbody;
      let objHit2: ComponentRigidbody;
      let event: Event;
      //ADD
      for (let i: number = 0; i < this.rigidbody.getNumContectLinks(); i++) {
        objHit = list.getContact().getShape1().userData;
        if (objHit == null)
          return;
        objHit2 = list.getContact().getShape2().userData;
        if (objHit2 == null)
          return;
        if (objHit.getOimoRigidbody() != this.getOimoRigidbody() && this.collisions.indexOf(objHit) == -1) {
          this.collisions.push(objHit);
          event = new CustomEvent(EVENT_PHYSICS.COLLISION_ENTER, { detail: objHit });
          this.dispatchEvent(event);
        }
        if (objHit2 != this && this.collisions.indexOf(objHit2) == -1) {
          this.collisions.push(objHit2);
          event = new CustomEvent(EVENT_PHYSICS.COLLISION_ENTER, { detail: objHit2 });
          this.dispatchEvent(event);
        }
        list = list.getNext();
      }
      //REMOVE
      this.collisions.forEach((value: ComponentRigidbody) => { //Every Collider in the list is checked if the collision is still happening
        let isColliding: boolean = false;
        list = this.rigidbody.getContactLinkList();
        for (let i: number = 0; i < this.rigidbody.getNumContectLinks(); i++) {
          objHit = list.getContact().getShape1().userData;
          objHit2 = list.getContact().getShape2().userData;
          if (value == objHit || value == objHit2) {
            isColliding = true;
          }
          list = list.getNext();
        }
        if (isColliding == false) {
          let index: number = this.collisions.indexOf(value);
          this.collisions.splice(index);
          event = new CustomEvent(EVENT_PHYSICS.COLLISION_EXIT, { detail: value });
          this.dispatchEvent(event);
        }
      });
    }

    /**
      * Checking for Collision with Triggers with a overlapping test, dispatching a custom event with information about the trigger,
      * or triggered [[Node]]. Automatically called in the RenderManager, no interaction needed.
      */
    public checkTriggerEvents(): void {
      let possibleTriggers: ComponentRigidbody[] = Physics.world.getTriggerList();
      let event: Event;
      //ADD
      possibleTriggers.forEach((value: ComponentRigidbody) => {
        let overlapping: boolean = this.collidesWith(this.getOimoRigidbody(), value.getOimoRigidbody());
        if (overlapping && this.triggers.indexOf(value) == -1) {
          this.triggers.push(value);
          event = new CustomEvent(EVENT_PHYSICS.TRIGGER_ENTER, { detail: value });
          this.dispatchEvent(event);
        }
      });
      //REMOVE
      this.triggers.forEach((value: ComponentRigidbody) => { //Every Collider in the list is checked if the collision is still happening
        let isTriggering: boolean = this.collidesWith(this.getOimoRigidbody(), value.getOimoRigidbody());
        if (isTriggering == false) {
          let index: number = this.collisions.indexOf(value);
          this.triggers.splice(index);
          event = new CustomEvent(EVENT_PHYSICS.TRIGGER_EXIT, { detail: value });
          this.dispatchEvent(event);
        }
      });
      if (this.colGroup == PHYSICS_GROUP.TRIGGER) {
        this.checkBodiesInTrigger();
      }
    }

    /**
   * Checks that the Rigidbody is positioned correctly and recreates the Collider with new scale/position/rotation
   */
    public updateFromWorld(): void {
      let worldTransform: Matrix4x4 = super.getContainer() != null ? super.getContainer().mtxWorld : Matrix4x4.IDENTITY();
      let position: Vector3 = worldTransform.translation;
      let rotation: Vector3 = worldTransform.rotation;
      // Debug.log("Obj: " + super.getContainer().name + " rot: " + rotation);
      // Debug.log("Obj: " + super.getContainer().name + " rotMatrix: " + worldTransform.getEulerAngles());
      let scaling: Vector3 = worldTransform.scaling;
      this.createCollider(new OIMO.Vec3(scaling.x / 2, scaling.y / 2, scaling.z / 2), this.colliderType);
      this.collider = new OIMO.Shape(this.colliderInfo);
      let oldCollider: OIMO.Shape = this.rigidbody.getShapeList();
      this.rigidbody.addShape(this.collider);
      this.rigidbody.removeShape(oldCollider);
      this.collider.userData = this;
      this.collider.setCollisionGroup(this.collisionGroup);
      if (this.collisionGroup == PHYSICS_GROUP.TRIGGER)
        this.collider.setCollisionMask(PHYSICS_GROUP.TRIGGER);
      else
        this.collider.setCollisionMask(PHYSICS_GROUP.DEFAULT | PHYSICS_GROUP.GROUP_1 | PHYSICS_GROUP.GROUP_2 | PHYSICS_GROUP.GROUP_3 | PHYSICS_GROUP.GROUP_4);
      if (this.rigidbody.getShapeList() != null) {
        this.rigidbody.getShapeList().setRestitution(this.restitution);
        this.rigidbody.getShapeList().setFriction(this.friction);
      }
      this.rigidbody.setMassData(this.massData);
      this.setPosition(position);
      this.setRotation(rotation);
    }

    /**
   * Get the friction of the rigidbody, which is the factor of sliding resistance of this rigidbody on surfaces
   */
    public getFriction(): number {
      return this.friction;
    }

    /**
   * Set the friction of the rigidbody, which is the factor of  sliding resistance of this rigidbody on surfaces
   */
    public setFriction(_friction: number): void {
      this.friction = _friction;
      if (this.rigidbody.getShapeList() != null)
        this.rigidbody.getShapeList().setFriction(this.friction);
    }

    /**
 * Get the restitution of the rigidbody, which is the factor of bounciness of this rigidbody on surfaces
 */
    public getRestitution(): number {
      return this.restitution;
    }

    /**
   * Set the restitution of the rigidbody, which is the factor of bounciness of this rigidbody on surfaces
   */
    public setRestitution(_restitution: number): void {
      this.restitution = _restitution;
      if (this.rigidbody.getShapeList() != null)
        this.rigidbody.getShapeList().setRestitution(this.restitution);
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
      this.rigidbody.setRotation(new OIMO.Mat3().fromEulerXyz(new OIMO.Vec3(_value.x, _value.y, _value.z)));
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

    private createRigidbody(_mass: number, _type: PHYSICS_TYPE, _colliderType: COLLIDER_TYPE, _transform: Matrix4x4, _collisionGroup: PHYSICS_GROUP = PHYSICS_GROUP.DEFAULT): void {
      let oimoType: number; //Need the conversion from simple enum to oimo because if enum is defined as Oimo.RigidyBodyType you have to include Oimo to use FUDGE at all
      switch (_type) {
        case PHYSICS_TYPE.DYNAMIC:
          oimoType = OIMO.RigidBodyType.DYNAMIC;
          break;
        case PHYSICS_TYPE.STATIC:
          oimoType = OIMO.RigidBodyType.STATIC;
          break;
        case PHYSICS_TYPE.KINEMATIC:
          oimoType = OIMO.RigidBodyType.KINEMATIC;
          break;
      }
      let tmpTransform: Matrix4x4 = _transform == null ? super.getContainer() != null ? super.getContainer().mtxWorld : Matrix4x4.IDENTITY() : _transform;

      let scale: OIMO.Vec3 = new OIMO.Vec3((tmpTransform.scaling.x * this.offsetScaling.x) / 2, (tmpTransform.scaling.y * this.offsetScaling.y) / 2, (tmpTransform.scaling.z * this.offsetScaling.z) / 2);
      let position: OIMO.Vec3 = new OIMO.Vec3(tmpTransform.translation.x + this.offsetPosition.x, tmpTransform.translation.y + this.offsetPosition.y, tmpTransform.translation.z + this.offsetPosition.z);
      let rotation: OIMO.Vec3 = new OIMO.Vec3(tmpTransform.rotation.x + this.offsetRotation.x, tmpTransform.rotation.y + this.offsetRotation.y, tmpTransform.rotation.z + this.offsetRotation.z);
      this.createCollider(scale, _colliderType);

      this.massData.mass = _type != PHYSICS_TYPE.STATIC ? _mass : 0;
      this.rigidbodyInfo.type = oimoType;
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
      this.rigidbody.getShapeList().setRestitution(this.restitution);
      this.rigidbody.getShapeList().setFriction(this.friction);
      this.rigidbody.setLinearDamping(this.linDamping);
      this.rigidbody.setAngularDamping(this.angDamping);
      this.rigidbody.setRotationFactor(new OIMO.Vec3(this.rotationalInfluenceFactor.x, this.rotationalInfluenceFactor.y, this.rotationalInfluenceFactor.z));
    }

    private createCollider(_scale: OIMO.Vec3, _colliderType: COLLIDER_TYPE): void {
      let shapeConf: OIMO.ShapeConfig = new OIMO.ShapeConfig();
      let geometry: OIMO.Geometry;
      if (this.colliderType != _colliderType)
        this.colliderType = _colliderType;
      switch (_colliderType) {
        case COLLIDER_TYPE.CUBE:
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

    private addRigidbodyToWorld(): void {
      Physics.world.addRigidbody(this);
    }

    private removeRigidbodyFromWorld(): void {
      Physics.world.removeRigidbody(this);
    }


    //#region private EVENT functions
    private collidesWith(triggerRigidbody: OIMO.RigidBody, secondRigidbody: OIMO.RigidBody): boolean {
      let shape1: OIMO.Aabb = triggerRigidbody.getShapeList().getAabb();
      let shape2: OIMO.Aabb = secondRigidbody.getShapeList().getAabb();
      let colliding: boolean = shape1.overlap(shape2);
      return colliding;
    }

    private checkBodiesInTrigger(): void {
      let possibleBodies: ComponentRigidbody[] = Physics.world.getBodyList();
      let event: Event;
      //ADD
      possibleBodies.forEach((value: ComponentRigidbody) => {
        let overlapping: boolean = this.collidesWith(this.getOimoRigidbody(), value.getOimoRigidbody());
        if (overlapping && this.bodiesInTrigger.indexOf(value) == -1) {
          this.bodiesInTrigger.push(value);
          event = new CustomEvent(EVENT_PHYSICS.TRIGGER_ENTER, { detail: value });
          this.dispatchEvent(event);
        }
      });
      //REMOVE
      this.bodiesInTrigger.forEach((value: ComponentRigidbody) => { //Every Collider in the list is checked if the collision is still happening
        let isTriggering: boolean = this.collidesWith(this.getOimoRigidbody(), value.getOimoRigidbody());
        if (isTriggering == false) {
          let index: number = this.collisions.indexOf(value);
          this.bodiesInTrigger.splice(index);
          event = new CustomEvent(EVENT_PHYSICS.TRIGGER_EXIT, { detail: value });
          this.dispatchEvent(event);
        }
      });
    }
    //#endregion

  }
}