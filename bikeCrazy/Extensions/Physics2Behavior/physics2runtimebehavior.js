var gdjs;
(function(gdjs2) {
  class Physics2SharedData {
    constructor(runtimeScene, sharedData) {
      this.frameTime = 0;
      this.stepped = false;
      this.timeScale = 1;
      this._nextJointId = 1;
      this.joints = {};
      this.gravityX = sharedData.gravityX;
      this.gravityY = sharedData.gravityY;
      this.scaleX = sharedData.scaleX === 0 ? 100 : sharedData.scaleX;
      this.scaleY = sharedData.scaleY === 0 ? 100 : sharedData.scaleY;
      this.invScaleX = 1 / this.scaleX;
      this.invScaleY = 1 / this.scaleY;
      this.timeStep = 1 / 60;
      this.world = new Box2D.b2World(new Box2D.b2Vec2(this.gravityX, this.gravityY), true);
      this.staticBody = this.world.CreateBody(new Box2D.b2BodyDef());
      this.contactListener = new Box2D.JSContactListener();
      this.contactListener.BeginContact = function(contactPtr) {
        const contact = Box2D.wrapPointer(contactPtr, Box2D.b2Contact);
        if (contact.GetFixtureA().GetBody() === null || contact.GetFixtureB().GetBody() === null) {
          return;
        }
        const behaviorA = contact.GetFixtureA().GetBody().gdjsAssociatedBehavior;
        const behaviorB = contact.GetFixtureB().GetBody().gdjsAssociatedBehavior;
        behaviorA.currentContacts.push(behaviorB);
        behaviorB.currentContacts.push(behaviorA);
      };
      this.contactListener.EndContact = function(contactPtr) {
        const contact = Box2D.wrapPointer(contactPtr, Box2D.b2Contact);
        if (contact.GetFixtureA().GetBody() === null || contact.GetFixtureB().GetBody() === null) {
          return;
        }
        const behaviorA = contact.GetFixtureA().GetBody().gdjsAssociatedBehavior;
        const behaviorB = contact.GetFixtureB().GetBody().gdjsAssociatedBehavior;
        let i = behaviorA.currentContacts.indexOf(behaviorB);
        if (i !== -1) {
          behaviorA.currentContacts.splice(i, 1);
        }
        i = behaviorB.currentContacts.indexOf(behaviorA);
        if (i !== -1) {
          behaviorB.currentContacts.splice(i, 1);
        }
      };
      this.contactListener.PreSolve = function() {
      };
      this.contactListener.PostSolve = function() {
      };
      this.world.SetContactListener(this.contactListener);
    }
    static getSharedData(runtimeScene, behaviorName) {
      if (!runtimeScene.physics2SharedData) {
        const initialData = runtimeScene.getInitialSharedDataForBehavior(behaviorName);
        runtimeScene.physics2SharedData = new gdjs2.Physics2SharedData(runtimeScene, initialData);
      }
      return runtimeScene.physics2SharedData;
    }
    step(deltaTime) {
      this.frameTime += deltaTime;
      if (this.frameTime >= this.timeStep) {
        let numberOfSteps = Math.floor(this.frameTime / this.timeStep);
        this.frameTime -= numberOfSteps * this.timeStep;
        if (numberOfSteps > 5) {
          numberOfSteps = 5;
        }
        for (let i = 0; i < numberOfSteps; i++) {
          this.world.Step(this.timeStep * this.timeScale, 8, 10);
        }
        this.world.ClearForces();
      }
      this.stepped = true;
    }
    clearBodyJoints(body) {
      for (const jointId in this.joints) {
        if (this.joints.hasOwnProperty(jointId)) {
          if (this.joints[jointId].GetBodyA() === body || this.joints[jointId].GetBodyB() === body) {
            this.removeJoint(jointId);
          }
        }
      }
    }
    addJoint(joint) {
      this.joints[this._nextJointId.toString(10)] = joint;
      return this._nextJointId++;
    }
    getJoint(jointId) {
      jointId = jointId.toString(10);
      if (this.joints.hasOwnProperty(jointId)) {
        return this.joints[jointId];
      }
      return null;
    }
    getJointId(joint) {
      for (const jointId in this.joints) {
        if (this.joints.hasOwnProperty(jointId)) {
          if (this.joints[jointId] === joint) {
            return parseInt(jointId, 10);
          }
        }
      }
      return 0;
    }
    removeJoint(jointId) {
      jointId = jointId.toString(10);
      if (this.joints.hasOwnProperty(jointId)) {
        const joint = this.joints[jointId];
        if (joint.GetType() === Box2D.e_revoluteJoint || joint.GetType() === Box2D.e_prismaticJoint) {
          for (const jId in this.joints) {
            if (this.joints.hasOwnProperty(jId)) {
              if (this.joints[jId].GetType() === Box2D.e_gearJoint && (Box2D.getPointer(this.joints[jId].GetJoint1()) === Box2D.getPointer(joint) || Box2D.getPointer(this.joints[jId].GetJoint2()) === Box2D.getPointer(joint))) {
                this.removeJoint(parseInt(jId, 10));
              }
            }
          }
        }
        this.world.DestroyJoint(joint);
        delete this.joints[jointId];
      }
    }
  }
  gdjs2.Physics2SharedData = Physics2SharedData;
  gdjs2.registerRuntimeSceneUnloadedCallback(function(runtimeScene) {
    if (runtimeScene.physics2SharedData && runtimeScene.physics2SharedData.world) {
      Box2D.destroy(runtimeScene.physics2SharedData.world);
    }
  });
  class Physics2RuntimeBehavior extends gdjs2.RuntimeBehavior {
    constructor(runtimeScene, behaviorData, owner) {
      super(runtimeScene, behaviorData, owner);
      this.shapeScale = 1;
      this._body = null;
      this._objectOldX = 0;
      this._objectOldY = 0;
      this._objectOldAngle = 0;
      this._objectOldWidth = 0;
      this._objectOldHeight = 0;
      this._verticesBuffer = 0;
      this.bodyType = behaviorData.bodyType;
      this.bullet = behaviorData.bullet;
      this.fixedRotation = behaviorData.fixedRotation;
      this.canSleep = behaviorData.canSleep;
      this.shape = behaviorData.shape;
      this.shapeDimensionA = behaviorData.shapeDimensionA;
      this.shapeDimensionB = behaviorData.shapeDimensionB;
      this.shapeOffsetX = behaviorData.shapeOffsetX;
      this.shapeOffsetY = behaviorData.shapeOffsetY;
      this.polygonOrigin = behaviorData.polygonOrigin;
      this.polygon = this.shape === "Polygon" ? Physics2RuntimeBehavior.getPolygon(behaviorData.vertices) : null;
      this.density = behaviorData.density;
      this.friction = behaviorData.friction;
      this.restitution = behaviorData.restitution;
      this.linearDamping = behaviorData.linearDamping;
      this.angularDamping = behaviorData.angularDamping;
      this.gravityScale = behaviorData.gravityScale;
      this.layers = behaviorData.layers;
      this.masks = behaviorData.masks;
      this.currentContacts = this.currentContacts || [];
      this.currentContacts.length = 0;
      this._sharedData = Physics2SharedData.getSharedData(runtimeScene, behaviorData.name);
      this._tempb2Vec2 = new Box2D.b2Vec2();
      this._tempb2Vec2Sec = new Box2D.b2Vec2();
    }
    b2Vec2(x, y) {
      this._tempb2Vec2.set_x(x);
      this._tempb2Vec2.set_y(y);
      return this._tempb2Vec2;
    }
    b2Vec2Sec(x, y) {
      this._tempb2Vec2Sec.set_x(x);
      this._tempb2Vec2Sec.set_y(y);
      return this._tempb2Vec2Sec;
    }
    updateFromBehaviorData(oldBehaviorData, newBehaviorData) {
      if (oldBehaviorData.bullet !== newBehaviorData.bullet) {
        this.setBullet(newBehaviorData.bullet);
      }
      if (oldBehaviorData.fixedRotation !== newBehaviorData.fixedRotation) {
        this.setFixedRotation(newBehaviorData.fixedRotation);
      }
      if (oldBehaviorData.canSleep !== newBehaviorData.canSleep) {
        this.setSleepingAllowed(newBehaviorData.canSleep);
      }
      if (oldBehaviorData.shapeDimensionA !== newBehaviorData.shapeDimensionA) {
        this.shapeDimensionA = newBehaviorData.shapeDimensionA;
        this.recreateShape();
      }
      if (oldBehaviorData.shapeDimensionB !== newBehaviorData.shapeDimensionB) {
        this.shapeDimensionB = newBehaviorData.shapeDimensionB;
        this.recreateShape();
      }
      if (oldBehaviorData.shapeOffsetX !== newBehaviorData.shapeOffsetX) {
        this.shapeOffsetX = newBehaviorData.shapeOffsetX;
        this.recreateShape();
      }
      if (oldBehaviorData.shapeOffsetY !== newBehaviorData.shapeOffsetY) {
        this.shapeOffsetY = newBehaviorData.shapeOffsetY;
        this.recreateShape();
      }
      if (oldBehaviorData.polygonOrigin !== newBehaviorData.polygonOrigin) {
        this.polygonOrigin = newBehaviorData.polygonOrigin;
        this.recreateShape();
      }
      if (oldBehaviorData.density !== newBehaviorData.density) {
        this.setDensity(newBehaviorData.density);
      }
      if (oldBehaviorData.friction !== newBehaviorData.friction) {
        this.setFriction(newBehaviorData.friction);
      }
      if (oldBehaviorData.restitution !== newBehaviorData.restitution) {
        this.setRestitution(newBehaviorData.restitution);
      }
      if (oldBehaviorData.linearDamping !== newBehaviorData.linearDamping) {
        this.setLinearDamping(newBehaviorData.linearDamping);
      }
      if (oldBehaviorData.angularDamping !== newBehaviorData.angularDamping) {
        this.setAngularDamping(newBehaviorData.angularDamping);
      }
      if (oldBehaviorData.gravityScale !== newBehaviorData.gravityScale) {
        this.setGravityScale(newBehaviorData.gravityScale);
      }
      if (oldBehaviorData.layers !== newBehaviorData.layers) {
        return false;
      }
      if (oldBehaviorData.masks !== newBehaviorData.masks) {
        return false;
      }
      if (oldBehaviorData.vertices !== newBehaviorData.vertices) {
        return false;
      }
      if (oldBehaviorData.bodyType !== newBehaviorData.bodyType) {
        return false;
      }
      if (oldBehaviorData.shape !== newBehaviorData.shape) {
        return false;
      }
      return true;
    }
    onDeActivate() {
      if (this._body !== null) {
        this._sharedData.clearBodyJoints(this._body);
        if (this._verticesBuffer) {
          Box2D._free(this._verticesBuffer);
          this._verticesBuffer = 0;
        }
        this._sharedData.world.DestroyBody(this._body);
        this._body = null;
      }
    }
    onDestroy() {
      this.onDeActivate();
    }
    static getPolygon(verticesData) {
      if (!verticesData) {
        return null;
      }
      const polygon = new gdjs2.Polygon();
      const maxVertices = 8;
      for (let i = 0, len = verticesData.length; i < Math.min(len, maxVertices); i++) {
        polygon.vertices.push([verticesData[i].x, verticesData[i].y]);
      }
      return polygon;
    }
    static isPolygonConvex(polygon) {
      if (!polygon.isConvex()) {
        return false;
      }
      let alignedX = true;
      let alignedY = true;
      for (let i = 0; i < polygon.vertices.length - 1; ++i) {
        for (let j = i + 1; j < polygon.vertices.length; ++j) {
          if (polygon.vertices[i][0] === polygon.vertices[j][0] && polygon.vertices[i][1] === polygon.vertices[j][1]) {
            return false;
          }
        }
        if (polygon.vertices[i][0] !== polygon.vertices[i + 1][0]) {
          alignedX = false;
        }
        if (polygon.vertices[i][1] !== polygon.vertices[i + 1][1]) {
          alignedY = false;
        }
      }
      if (alignedX || alignedY) {
        return false;
      }
      return true;
    }
    createShape() {
      const offsetX = this.shapeOffsetX ? this.shapeOffsetX * this.shapeScale * this._sharedData.invScaleX : 0;
      const offsetY = this.shapeOffsetY ? this.shapeOffsetY * this.shapeScale * this._sharedData.invScaleY : 0;
      let shape;
      if (this.shape === "Circle") {
        shape = new Box2D.b2CircleShape();
        if (this.shapeDimensionA > 0) {
          shape.set_m_radius(this.shapeDimensionA * this.shapeScale * this._sharedData.invScaleX);
        } else {
          const radius = (this.owner.getWidth() * this._sharedData.invScaleX + this.owner.getHeight() * this._sharedData.invScaleY) / 4;
          shape.set_m_radius(radius > 0 ? radius : 1);
        }
        shape.set_m_p(this.b2Vec2(offsetX, offsetY));
      } else {
        if (this.shape === "Polygon") {
          shape = new Box2D.b2PolygonShape();
          if (!this.polygon || !Physics2RuntimeBehavior.isPolygonConvex(this.polygon)) {
            let width = (this.owner.getWidth() > 0 ? this.owner.getWidth() : 1) * this._sharedData.invScaleX;
            let height = (this.owner.getHeight() > 0 ? this.owner.getHeight() : 1) * this._sharedData.invScaleY;
            shape.SetAsBox(width / 2, height / 2, this.b2Vec2(offsetX, offsetY), 0);
          } else {
            let originOffsetX = 0;
            let originOffsetY = 0;
            if (this.polygonOrigin === "Origin") {
              originOffsetX = (this.owner.getWidth() > 0 ? -this.owner.getWidth() / 2 : 0) + (this.owner.getX() - this.owner.getDrawableX());
              originOffsetY = (this.owner.getHeight() > 0 ? -this.owner.getHeight() / 2 : 0) + (this.owner.getY() - this.owner.getDrawableY());
            } else {
              if (this.polygonOrigin === "TopLeft") {
                originOffsetX = this.owner.getWidth() > 0 ? -this.owner.getWidth() / 2 : 0;
                originOffsetY = this.owner.getHeight() > 0 ? -this.owner.getHeight() / 2 : 0;
              }
            }
            if (!this._verticesBuffer) {
              const buffer = Box2D._malloc(this.polygon.vertices.length * 8, "float", Box2D.ALLOC_STACK);
              this._verticesBuffer = buffer;
            }
            let offset = 0;
            for (let i = 0, len = this.polygon.vertices.length; i < len; i++) {
              Box2D.HEAPF32[this._verticesBuffer + offset >> 2] = (this.polygon.vertices[i][0] * this.shapeScale + originOffsetX) * this._sharedData.invScaleX + offsetX;
              Box2D.HEAPF32[this._verticesBuffer + (offset + 4) >> 2] = (this.polygon.vertices[i][1] * this.shapeScale + originOffsetY) * this._sharedData.invScaleY + offsetY;
              offset += 8;
            }
            const b2Vertices = Box2D.wrapPointer(this._verticesBuffer, Box2D.b2Vec2);
            shape.Set(b2Vertices, this.polygon.vertices.length);
          }
        } else {
          if (this.shape === "Edge") {
            shape = new Box2D.b2EdgeShape();
            const length = (this.shapeDimensionA > 0 ? this.shapeDimensionA * this.shapeScale : this.owner.getWidth() > 0 ? this.owner.getWidth() : 1) * this._sharedData.invScaleX;
            let height = this.owner.getHeight() > 0 ? this.owner.getHeight() * this._sharedData.invScaleY : 0;
            const angle = this.shapeDimensionB ? gdjs2.toRad(this.shapeDimensionB) : 0;
            shape.Set(this.b2Vec2(-length / 2 * Math.cos(angle) + offsetX, height / 2 - length / 2 * Math.sin(angle) + offsetY), this.b2Vec2Sec(length / 2 * Math.cos(angle) + offsetX, height / 2 + length / 2 * Math.sin(angle) + offsetY));
          } else {
            shape = new Box2D.b2PolygonShape();
            let width = (this.shapeDimensionA > 0 ? this.shapeDimensionA * this.shapeScale : this.owner.getWidth() > 0 ? this.owner.getWidth() : 1) * this._sharedData.invScaleX;
            let height = (this.shapeDimensionB > 0 ? this.shapeDimensionB * this.shapeScale : this.owner.getHeight() > 0 ? this.owner.getHeight() : 1) * this._sharedData.invScaleY;
            shape.SetAsBox(width / 2, height / 2, this.b2Vec2(offsetX, offsetY), 0);
          }
        }
      }
      const filter = new Box2D.b2Filter();
      filter.set_categoryBits(this.layers);
      filter.set_maskBits(this.masks);
      const fixDef = new Box2D.b2FixtureDef();
      fixDef.set_shape(shape);
      fixDef.set_filter(filter);
      if (this.density < 0) {
        this.density = 0;
      }
      fixDef.set_density(this.density);
      if (this.friction < 0) {
        this.friction = 0;
      }
      fixDef.set_friction(this.friction);
      if (this.restitution < 0) {
        this.restitution = 0;
      }
      fixDef.set_restitution(this.restitution);
      return fixDef;
    }
    recreateShape() {
      if (this._body === null) {
        this.createBody();
        return;
      }
      this._body.DestroyFixture(this._body.GetFixtureList());
      this._body.CreateFixture(this.createShape());
      this._objectOldWidth = this.owner.getWidth();
      this._objectOldHeight = this.owner.getHeight();
    }
    getShapeScale() {
      return this.shapeScale;
    }
    setShapeScale(shapeScale) {
      if (shapeScale !== this.shapeScale && shapeScale > 0) {
        this.shapeScale = shapeScale;
        this.recreateShape();
      }
    }
    getBody() {
      if (this._body === null) {
        this.createBody();
      }
      return this._body;
    }
    createBody() {
      const bodyDef = new Box2D.b2BodyDef();
      bodyDef.set_position(this.b2Vec2((this.owner.getDrawableX() + this.owner.getWidth() / 2) * this._sharedData.invScaleX, (this.owner.getDrawableY() + this.owner.getHeight() / 2) * this._sharedData.invScaleY));
      bodyDef.set_angle(gdjs2.toRad(this.owner.getAngle()));
      bodyDef.set_type(this.bodyType === "Static" ? Box2D.b2_staticBody : this.bodyType === "Kinematic" ? Box2D.b2_kinematicBody : Box2D.b2_dynamicBody);
      bodyDef.set_bullet(this.bullet);
      bodyDef.set_fixedRotation(this.fixedRotation);
      bodyDef.set_allowSleep(this.canSleep);
      bodyDef.set_linearDamping(this.linearDamping);
      bodyDef.set_angularDamping(this.angularDamping);
      bodyDef.set_gravityScale(this.gravityScale);
      this._body = this._sharedData.world.CreateBody(bodyDef);
      this._body.CreateFixture(this.createShape());
      this._body.gdjsAssociatedBehavior = this;
      this._objectOldWidth = this.owner.getWidth();
      this._objectOldHeight = this.owner.getHeight();
    }
    doStepPreEvents(runtimeScene) {
      if (this._body === null) {
        this.createBody();
      }
      if (!this._sharedData.stepped) {
        this._sharedData.step(runtimeScene.getTimeManager().getElapsedTime() / 1e3);
      }
      this.owner.setX(this._body.GetPosition().get_x() * this._sharedData.scaleX - this.owner.getWidth() / 2 + this.owner.getX() - this.owner.getDrawableX());
      this.owner.setY(this._body.GetPosition().get_y() * this._sharedData.scaleY - this.owner.getHeight() / 2 + this.owner.getY() - this.owner.getDrawableY());
      this.owner.setAngle(gdjs2.toDegrees(this._body.GetAngle()));
      this._objectOldX = this.owner.getX();
      this._objectOldY = this.owner.getY();
      this._objectOldAngle = this.owner.getAngle();
    }
    doStepPostEvents(runtimeScene) {
      this._updateBodyFromObject();
      this._sharedData.stepped = false;
    }
    onObjectHotReloaded() {
      this._updateBodyFromObject();
    }
    _updateBodyFromObject() {
      if (this._body === null) {
        this.createBody();
      }
      if (this._objectOldWidth !== this.owner.getWidth() && this.shapeDimensionA <= 0 || this._objectOldHeight !== this.owner.getHeight() && this.shape !== "Edge" && !(this.shape === "Box" && this.shapeDimensionB > 0) && !(this.shape === "Circle" && this.shapeDimensionA > 0)) {
        this.recreateShape();
      }
      if (this._objectOldX !== this.owner.getX() || this._objectOldY !== this.owner.getY() || this._objectOldAngle !== this.owner.getAngle()) {
        const pos = this.b2Vec2((this.owner.getDrawableX() + this.owner.getWidth() / 2) * this._sharedData.invScaleX, (this.owner.getDrawableY() + this.owner.getHeight() / 2) * this._sharedData.invScaleY);
        this._body.SetTransform(pos, gdjs2.toRad(this.owner.getAngle()));
        this._body.SetAwake(true);
      }
    }
    getGravityX() {
      return this._sharedData.gravityX;
    }
    getGravityY() {
      return this._sharedData.gravityY;
    }
    setGravity(x, y) {
      if (this._sharedData.gravityX === x && this._sharedData.gravityY === y) {
        return;
      }
      this._sharedData.gravityX = x;
      this._sharedData.gravityY = y;
      this._sharedData.world.SetGravity(this.b2Vec2(this._sharedData.gravityX, this._sharedData.gravityY));
    }
    getTimeScale() {
      return this._sharedData.timeScale;
    }
    setTimeScale(timeScale) {
      if (timeScale < 0) {
        return;
      }
      this._sharedData.timeScale = timeScale;
    }
    static setTimeScaleFromObject(object, behaviorName, timeScale) {
      if (object === null || !object.hasBehavior(behaviorName)) {
        return;
      }
      object.getBehavior(behaviorName).setTimeScale(timeScale);
    }
    isDynamic() {
      return this.bodyType === "Dynamic";
    }
    setDynamic() {
      if (this.bodyType === "Dynamic") {
        return;
      }
      this.bodyType = "Dynamic";
      if (this._body === null) {
        this.createBody();
        return;
      }
      this._body.SetType(Box2D.b2_dynamicBody);
      this._body.SetAwake(true);
    }
    isStatic() {
      return this.bodyType === "Static";
    }
    setStatic() {
      if (this.bodyType === "Static") {
        return;
      }
      this.bodyType = "Static";
      if (this._body === null) {
        this.createBody();
        return;
      }
      this._body.SetType(Box2D.b2_staticBody);
      this._body.SetAwake(true);
    }
    isKinematic() {
      return this.bodyType === "Kinematic";
    }
    setKinematic() {
      if (this.bodyType === "Kinematic") {
        return;
      }
      this.bodyType = "Kinematic";
      if (this._body === null) {
        this.createBody();
        return;
      }
      this._body.SetType(Box2D.b2_kinematicBody);
      this._body.SetAwake(true);
    }
    isBullet() {
      return this.bullet;
    }
    setBullet(enable) {
      if (this.bullet === enable) {
        return;
      }
      this.bullet = enable;
      if (this._body === null) {
        this.createBody();
        return;
      }
      this._body.SetBullet(this.bullet);
    }
    hasFixedRotation() {
      return this.fixedRotation;
    }
    setFixedRotation(enable) {
      this.fixedRotation = enable;
      if (this._body === null) {
        this.createBody();
        return;
      }
      this._body.SetFixedRotation(this.fixedRotation);
    }
    isSleepingAllowed() {
      return this.canSleep;
    }
    setSleepingAllowed(enable) {
      this.canSleep = enable;
      if (this._body === null) {
        this.createBody();
        return;
      }
      this._body.SetSleepingAllowed(this.canSleep);
    }
    isSleeping() {
      if (this._body === null) {
        this.createBody();
      }
      return !this._body.IsAwake();
    }
    getDensity() {
      return this.density;
    }
    setDensity(density) {
      if (density < 0) {
        density = 0;
      }
      if (this.density === density) {
        return;
      }
      this.density = density;
      if (this._body === null) {
        this.createBody();
        return;
      }
      this._body.GetFixtureList().SetDensity(this.density);
      this._body.ResetMassData();
    }
    getFriction() {
      return this.friction;
    }
    setFriction(friction) {
      if (friction < 0) {
        friction = 0;
      }
      if (this.friction === friction) {
        return;
      }
      this.friction = friction;
      if (this._body === null) {
        this.createBody();
        return;
      }
      this._body.GetFixtureList().SetFriction(this.friction);
      let contact = this._body.GetContactList();
      while (Box2D.getPointer(contact)) {
        contact.get_contact().ResetFriction();
        contact = contact.get_next();
      }
    }
    getRestitution() {
      return this.restitution;
    }
    setRestitution(restitution) {
      if (restitution < 0) {
        restitution = 0;
      }
      if (this.restitution === restitution) {
        return;
      }
      this.restitution = restitution;
      if (this._body === null) {
        this.createBody();
        return;
      }
      this._body.GetFixtureList().SetRestitution(this.restitution);
      let contact = this._body.GetContactList();
      while (Box2D.getPointer(contact)) {
        contact.get_contact().ResetRestitution();
        contact = contact.get_next();
      }
    }
    getLinearDamping() {
      return this.linearDamping;
    }
    setLinearDamping(linearDamping) {
      if (this.linearDamping === linearDamping) {
        return;
      }
      this.linearDamping = linearDamping;
      if (this._body === null) {
        this.createBody();
        return;
      }
      this._body.SetLinearDamping(this.linearDamping);
    }
    getAngularDamping() {
      return this.angularDamping;
    }
    setAngularDamping(angularDamping) {
      if (this.angularDamping === angularDamping) {
        return;
      }
      this.angularDamping = angularDamping;
      if (this._body === null) {
        this.createBody();
        return;
      }
      this._body.SetAngularDamping(this.angularDamping);
    }
    getGravityScale() {
      return this.gravityScale;
    }
    setGravityScale(gravityScale) {
      if (this.gravityScale === gravityScale) {
        return;
      }
      this.gravityScale = gravityScale;
      if (this._body === null) {
        this.createBody();
        return;
      }
      this._body.SetGravityScale(this.gravityScale);
    }
    layerEnabled(layer) {
      layer = Math.floor(layer);
      if (layer < 1 || layer > 16) {
        return false;
      }
      return !!(this.layers & 1 << layer - 1);
    }
    enableLayer(layer, enable) {
      layer = Math.floor(layer);
      if (layer < 1 || layer > 16) {
        return;
      }
      if (enable) {
        this.layers |= 1 << layer - 1;
      } else {
        this.layers &= ~(1 << layer - 1);
      }
      if (this._body === null) {
        this.createBody();
        return;
      }
      const filter = this._body.GetFixtureList().GetFilterData();
      filter.set_categoryBits(this.layers);
      this._body.GetFixtureList().SetFilterData(filter);
    }
    maskEnabled(mask) {
      mask = Math.floor(mask);
      if (mask < 1 || mask > 16) {
        return false;
      }
      return !!(this.masks & 1 << mask - 1);
    }
    enableMask(mask, enable) {
      mask = Math.floor(mask);
      if (mask < 1 || mask > 16) {
        return;
      }
      if (enable) {
        this.masks |= 1 << mask - 1;
      } else {
        this.masks &= ~(1 << mask - 1);
      }
      if (this._body === null) {
        this.createBody();
        return;
      }
      const filter = this._body.GetFixtureList().GetFilterData();
      filter.set_maskBits(this.masks);
      this._body.GetFixtureList().SetFilterData(filter);
    }
    getLinearVelocityX() {
      if (this._body === null) {
        this.createBody();
        return 0;
      }
      return this._body.GetLinearVelocity().get_x() * this._sharedData.scaleX;
    }
    setLinearVelocityX(linearVelocityX) {
      if (this._body === null) {
        this.createBody();
      }
      this._body.SetLinearVelocity(this.b2Vec2(linearVelocityX * this._sharedData.invScaleX, this._body.GetLinearVelocity().get_y()));
    }
    getLinearVelocityY() {
      if (this._body === null) {
        this.createBody();
        return 0;
      }
      return this._body.GetLinearVelocity().get_y() * this._sharedData.scaleY;
    }
    setLinearVelocityY(linearVelocityY) {
      if (this._body === null) {
        this.createBody();
      }
      this._body.SetLinearVelocity(this.b2Vec2(this._body.GetLinearVelocity().get_x(), linearVelocityY * this._sharedData.invScaleY));
    }
    getLinearVelocityLength() {
      if (this._body === null) {
        this.createBody();
        return 0;
      }
      return this.b2Vec2(this._body.GetLinearVelocity().get_x() * this._sharedData.scaleX, this._body.GetLinearVelocity().get_y() * this._sharedData.scaleY).Length();
    }
    getAngularVelocity() {
      if (this._body === null) {
        this.createBody();
      }
      return gdjs2.toDegrees(this._body.GetAngularVelocity());
    }
    setAngularVelocity(angularVelocity) {
      if (this._body === null) {
        this.createBody();
      }
      this._body.SetAngularVelocity(gdjs2.toRad(angularVelocity));
    }
    applyForce(forceX, forceY, positionX, positionY) {
      if (this._body === null) {
        this.createBody();
      }
      this._body.SetAwake(true);
      this._body.ApplyForce(this.b2Vec2(forceX, forceY), this.b2Vec2Sec(positionX * this._sharedData.invScaleX, positionY * this._sharedData.invScaleY));
    }
    applyPolarForce(angle, length, positionX, positionY) {
      if (this._body === null) {
        this.createBody();
      }
      this._body.SetAwake(true);
      angle = gdjs2.toRad(angle);
      this._body.ApplyForce(this.b2Vec2(length * Math.cos(angle), length * Math.sin(angle)), this.b2Vec2Sec(positionX * this._sharedData.invScaleX, positionY * this._sharedData.invScaleY));
    }
    applyForceTowardPosition(length, towardX, towardY, positionX, positionY) {
      if (this._body === null) {
        this.createBody();
      }
      this._body.SetAwake(true);
      const angle = Math.atan2(towardY * this._sharedData.invScaleY - this._body.GetPosition().get_y(), towardX * this._sharedData.invScaleX - this._body.GetPosition().get_x());
      this._body.ApplyForce(this.b2Vec2(length * Math.cos(angle), length * Math.sin(angle)), this.b2Vec2Sec(positionX * this._sharedData.invScaleX, positionY * this._sharedData.invScaleY));
    }
    applyImpulse(impulseX, impulseY, positionX, positionY) {
      if (this._body === null) {
        this.createBody();
      }
      this._body.SetAwake(true);
      this._body.ApplyLinearImpulse(this.b2Vec2(impulseX, impulseY), this.b2Vec2Sec(positionX * this._sharedData.invScaleX, positionY * this._sharedData.invScaleY));
    }
    applyPolarImpulse(angle, length, positionX, positionY) {
      if (this._body === null) {
        this.createBody();
      }
      this._body.SetAwake(true);
      angle = gdjs2.toRad(angle);
      this._body.ApplyLinearImpulse(this.b2Vec2(length * Math.cos(angle), length * Math.sin(angle)), this.b2Vec2Sec(positionX * this._sharedData.invScaleX, positionY * this._sharedData.invScaleY));
    }
    applyImpulseTowardPosition(length, towardX, towardY, positionX, positionY) {
      if (this._body === null) {
        this.createBody();
      }
      this._body.SetAwake(true);
      const angle = Math.atan2(towardY * this._sharedData.invScaleY - this._body.GetPosition().get_y(), towardX * this._sharedData.invScaleX - this._body.GetPosition().get_x());
      this._body.ApplyLinearImpulse(this.b2Vec2(length * Math.cos(angle), length * Math.sin(angle)), this.b2Vec2Sec(positionX * this._sharedData.invScaleX, positionY * this._sharedData.invScaleY));
    }
    applyTorque(torque) {
      if (this._body === null) {
        this.createBody();
      }
      this._body.SetAwake(true);
      this._body.ApplyTorque(torque);
    }
    applyAngularImpulse(angularImpulse) {
      if (this._body === null) {
        this.createBody();
      }
      this._body.SetAwake(true);
      this._body.ApplyAngularImpulse(angularImpulse);
    }
    getMassCenterX() {
      if (this._body === null) {
        this.createBody();
      }
      return this._body.GetWorldCenter().get_x() * this._sharedData.scaleX;
    }
    getMassCenterY() {
      if (this._body === null) {
        this.createBody();
      }
      return this._body.GetWorldCenter().get_y() * this._sharedData.scaleY;
    }
    isJointFirstObject(jointId) {
      if (this._body === null) {
        this.createBody();
        return false;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null) {
        return false;
      }
      return joint.GetBodyA() === this._body;
    }
    isJointSecondObject(jointId) {
      if (this._body === null) {
        this.createBody();
        return false;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null) {
        return false;
      }
      return joint.GetBodyB() === this._body;
    }
    getJointFirstAnchorX(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null) {
        return 0;
      }
      return joint.GetBodyA().GetWorldPoint(joint.GetLocalAnchorA()).get_x();
    }
    getJointFirstAnchorY(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null) {
        return 0;
      }
      return joint.GetBodyA().GetWorldPoint(joint.GetLocalAnchorA()).get_y();
    }
    getJointSecondAnchorX(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null) {
        return 0;
      }
      return joint.GetBodyB().GetWorldPoint(joint.GetLocalAnchorB()).get_x();
    }
    getJointSecondAnchorY(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null) {
        return 0;
      }
      return joint.GetBodyB().GetWorldPoint(joint.GetLocalAnchorB()).get_y();
    }
    getJointReactionForce(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null) {
        return 0;
      }
      return joint.GetReactionForce(1 / this._sharedData.timeStep).Length();
    }
    getJointReactionTorque(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null) {
        return 0;
      }
      return joint.GetReactionTorque(1 / this._sharedData.timeStep);
    }
    removeJoint(jointId) {
      this._sharedData.removeJoint(jointId);
    }
    addDistanceJoint(x1, y1, other, x2, y2, length, frequency, dampingRatio, collideConnected, variable) {
      if (this._body === null) {
        this.createBody();
      }
      if (other == null || !other.hasBehavior(this.name)) {
        return;
      }
      const otherBody = other.getBehavior(this.name).getBody();
      if (this._body === otherBody) {
        return;
      }
      const jointDef = new Box2D.b2DistanceJointDef();
      jointDef.set_bodyA(this._body);
      jointDef.set_localAnchorA(this._body.GetLocalPoint(this.b2Vec2(x1 * this._sharedData.invScaleX, y1 * this._sharedData.invScaleY)));
      jointDef.set_bodyB(otherBody);
      jointDef.set_localAnchorB(otherBody.GetLocalPoint(this.b2Vec2(x2 * this._sharedData.invScaleX, y2 * this._sharedData.invScaleY)));
      jointDef.set_length(length > 0 ? length * this._sharedData.invScaleX : this.b2Vec2((x2 - x1) * this._sharedData.invScaleX, (y2 - y1) * this._sharedData.invScaleY).Length());
      jointDef.set_frequencyHz(frequency >= 0 ? frequency : 0);
      jointDef.set_dampingRatio(dampingRatio >= 0 ? dampingRatio : 1);
      jointDef.set_collideConnected(collideConnected);
      const jointId = this._sharedData.addJoint(Box2D.castObject(this._sharedData.world.CreateJoint(jointDef), Box2D.b2DistanceJoint));
      variable.setNumber(jointId);
    }
    getDistanceJointLength(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_distanceJoint) {
        return 0;
      }
      return joint.GetLength() * this._sharedData.scaleX;
    }
    setDistanceJointLength(jointId, length) {
      if (length <= 0) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_distanceJoint) {
        return;
      }
      joint.SetLength(length * this._sharedData.invScaleX);
      joint.GetBodyA().SetAwake(true);
      joint.GetBodyB().SetAwake(true);
    }
    getDistanceJointFrequency(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_distanceJoint) {
        return 0;
      }
      return joint.GetFrequency();
    }
    setDistanceJointFrequency(jointId, frequency) {
      if (frequency < 0) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_distanceJoint) {
        return;
      }
      joint.SetFrequency(frequency);
    }
    getDistanceJointDampingRatio(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_distanceJoint) {
        return 0;
      }
      return joint.GetDampingRatio();
    }
    setDistanceJointDampingRatio(jointId, dampingRatio) {
      if (dampingRatio < 0) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_distanceJoint) {
      }
      joint.SetDampingRatio(dampingRatio);
    }
    addRevoluteJoint(x, y, enableLimit, referenceAngle, lowerAngle, upperAngle, enableMotor, motorSpeed, maxMotorTorque, variable) {
      if (this._body === null) {
        this.createBody();
      }
      const jointDef = new Box2D.b2RevoluteJointDef();
      jointDef.set_bodyA(this._sharedData.staticBody);
      jointDef.set_localAnchorA(this._sharedData.staticBody.GetLocalPoint(this.b2Vec2(x * this._sharedData.invScaleX, y * this._sharedData.invScaleY)));
      jointDef.set_bodyB(this._body);
      jointDef.set_localAnchorB(this._body.GetLocalPoint(this.b2Vec2(x * this._sharedData.invScaleX, y * this._sharedData.invScaleY)));
      jointDef.set_enableLimit(enableLimit);
      jointDef.set_referenceAngle(gdjs2.toRad(referenceAngle));
      if (upperAngle < lowerAngle) {
        const temp = lowerAngle;
        lowerAngle = upperAngle;
        upperAngle = temp;
      }
      jointDef.set_lowerAngle(gdjs2.toRad(lowerAngle));
      jointDef.set_upperAngle(gdjs2.toRad(upperAngle));
      jointDef.set_enableMotor(enableMotor);
      jointDef.set_motorSpeed(gdjs2.toRad(motorSpeed));
      jointDef.set_maxMotorTorque(maxMotorTorque >= 0 ? maxMotorTorque : 0);
      jointDef.set_collideConnected(false);
      const jointId = this._sharedData.addJoint(Box2D.castObject(this._sharedData.world.CreateJoint(jointDef), Box2D.b2RevoluteJoint));
      variable.setNumber(jointId);
    }
    addRevoluteJointBetweenTwoBodies(x1, y1, other, x2, y2, enableLimit, referenceAngle, lowerAngle, upperAngle, enableMotor, motorSpeed, maxMotorTorque, collideConnected, variable) {
      if (this._body === null) {
        this.createBody();
      }
      if (other == null || !other.hasBehavior(this.name)) {
        return;
      }
      const otherBody = other.getBehavior(this.name).getBody();
      if (this._body === otherBody) {
        return;
      }
      const jointDef = new Box2D.b2RevoluteJointDef();
      jointDef.set_bodyA(this._body);
      jointDef.set_localAnchorA(this._body.GetLocalPoint(this.b2Vec2(x1 * this._sharedData.invScaleX, y1 * this._sharedData.invScaleY)));
      jointDef.set_bodyB(otherBody);
      jointDef.set_localAnchorB(otherBody.GetLocalPoint(this.b2Vec2(x2 * this._sharedData.invScaleX, y2 * this._sharedData.invScaleY)));
      jointDef.set_enableLimit(enableLimit);
      jointDef.set_referenceAngle(gdjs2.toRad(referenceAngle));
      if (upperAngle < lowerAngle) {
        const temp = lowerAngle;
        lowerAngle = upperAngle;
        upperAngle = temp;
      }
      jointDef.set_lowerAngle(gdjs2.toRad(lowerAngle));
      jointDef.set_upperAngle(gdjs2.toRad(upperAngle));
      jointDef.set_enableMotor(enableMotor);
      jointDef.set_motorSpeed(gdjs2.toRad(motorSpeed));
      jointDef.set_maxMotorTorque(maxMotorTorque >= 0 ? maxMotorTorque : 0);
      jointDef.set_collideConnected(collideConnected);
      const jointId = this._sharedData.addJoint(Box2D.castObject(this._sharedData.world.CreateJoint(jointDef), Box2D.b2RevoluteJoint));
      variable.setNumber(jointId);
    }
    getRevoluteJointReferenceAngle(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_revoluteJoint) {
        return 0;
      }
      return gdjs2.toDegrees(joint.GetReferenceAngle());
    }
    getRevoluteJointAngle(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_revoluteJoint) {
        return 0;
      }
      return gdjs2.toDegrees(joint.GetJointAngle());
    }
    getRevoluteJointSpeed(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_revoluteJoint) {
        return 0;
      }
      return gdjs2.toDegrees(joint.GetJointSpeed());
    }
    isRevoluteJointLimitsEnabled(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_revoluteJoint) {
        return false;
      }
      return joint.IsLimitEnabled();
    }
    enableRevoluteJointLimits(jointId, enable) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_revoluteJoint) {
        return;
      }
      joint.EnableLimit(enable);
    }
    getRevoluteJointMinAngle(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_revoluteJoint) {
        return 0;
      }
      return gdjs2.toDegrees(joint.GetLowerLimit());
    }
    getRevoluteJointMaxAngle(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_revoluteJoint) {
        return 0;
      }
      return gdjs2.toDegrees(joint.GetUpperLimit());
    }
    setRevoluteJointLimits(jointId, lowerAngle, upperAngle) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_revoluteJoint) {
        return;
      }
      if (upperAngle < lowerAngle) {
        const temp = lowerAngle;
        lowerAngle = upperAngle;
        upperAngle = temp;
      }
      joint.SetLimits(gdjs2.toRad(lowerAngle), gdjs2.toRad(upperAngle));
    }
    isRevoluteJointMotorEnabled(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_revoluteJoint) {
        return false;
      }
      return joint.IsMotorEnabled();
    }
    enableRevoluteJointMotor(jointId, enable) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_revoluteJoint) {
        return;
      }
      joint.EnableMotor(enable);
    }
    getRevoluteJointMotorSpeed(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_revoluteJoint) {
        return 0;
      }
      return gdjs2.toDegrees(joint.GetMotorSpeed());
    }
    setRevoluteJointMotorSpeed(jointId, speed) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_revoluteJoint) {
        return;
      }
      joint.SetMotorSpeed(gdjs2.toRad(speed));
    }
    getRevoluteJointMaxMotorTorque(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_revoluteJoint) {
        return 0;
      }
      return joint.GetMaxMotorTorque();
    }
    setRevoluteJointMaxMotorTorque(jointId, maxTorque) {
      if (maxTorque < 0) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_revoluteJoint) {
        return;
      }
      joint.SetMaxMotorTorque(maxTorque);
    }
    getRevoluteJointMotorTorque(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_revoluteJoint) {
        return 0;
      }
      return joint.GetMotorTorque(1 / this._sharedData.timeStep);
    }
    addPrismaticJoint(x1, y1, other, x2, y2, axisAngle, referenceAngle, enableLimit, lowerTranslation, upperTranslation, enableMotor, motorSpeed, maxMotorForce, collideConnected, variable) {
      if (this._body === null) {
        this.createBody();
      }
      if (other == null || !other.hasBehavior(this.name)) {
        return;
      }
      const otherBody = other.getBehavior(this.name).getBody();
      if (this._body === otherBody) {
        return;
      }
      const jointDef = new Box2D.b2PrismaticJointDef();
      jointDef.set_bodyA(this._body);
      jointDef.set_localAnchorA(this._body.GetLocalPoint(this.b2Vec2(x1 * this._sharedData.invScaleX, y1 * this._sharedData.invScaleY)));
      jointDef.set_bodyB(otherBody);
      jointDef.set_localAnchorB(otherBody.GetLocalPoint(this.b2Vec2(x2 * this._sharedData.invScaleX, y2 * this._sharedData.invScaleY)));
      axisAngle = gdjs2.toRad(axisAngle) - this._body.GetAngle();
      jointDef.set_localAxisA(this.b2Vec2(Math.cos(axisAngle), Math.sin(axisAngle)));
      jointDef.set_referenceAngle(gdjs2.toRad(referenceAngle));
      jointDef.set_enableLimit(enableLimit);
      if (upperTranslation < lowerTranslation) {
        const temp = lowerTranslation;
        lowerTranslation = upperTranslation;
        upperTranslation = temp;
      }
      jointDef.set_lowerTranslation(lowerTranslation < 0 ? lowerTranslation * this._sharedData.invScaleX : 0);
      jointDef.set_upperTranslation(upperTranslation > 0 ? upperTranslation * this._sharedData.invScaleX : 0);
      jointDef.set_enableMotor(enableMotor);
      jointDef.set_motorSpeed(motorSpeed * this._sharedData.invScaleX);
      jointDef.set_maxMotorForce(maxMotorForce);
      jointDef.set_collideConnected(collideConnected);
      const jointId = this._sharedData.addJoint(Box2D.castObject(this._sharedData.world.CreateJoint(jointDef), Box2D.b2PrismaticJoint));
      variable.setNumber(jointId);
    }
    getPrismaticJointAxisAngle(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_prismaticJoint) {
        return 0;
      }
      return gdjs2.toDegrees(Math.atan2(joint.GetLocalAxisA().get_y(), joint.GetLocalAxisA().get_x()) + joint.GetBodyA().GetAngle());
    }
    getPrismaticJointReferenceAngle(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_prismaticJoint) {
        return 0;
      }
      return gdjs2.toDegrees(joint.GetReferenceAngle());
    }
    getPrismaticJointTranslation(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_prismaticJoint) {
        return 0;
      }
      return joint.GetJointTranslation() * this._sharedData.scaleX;
    }
    getPrismaticJointSpeed(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_prismaticJoint) {
        return 0;
      }
      return joint.GetJointSpeed() * this._sharedData.scaleX;
    }
    isPrismaticJointLimitsEnabled(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_prismaticJoint) {
        return false;
      }
      return joint.IsLimitEnabled();
    }
    enablePrismaticJointLimits(jointId, enable) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_prismaticJoint) {
        return;
      }
      joint.EnableLimit(enable);
    }
    getPrismaticJointMinTranslation(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_prismaticJoint) {
        return 0;
      }
      return joint.GetLowerLimit() * this._sharedData.scaleX;
    }
    getPrismaticJointMaxTranslation(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_prismaticJoint) {
        return 0;
      }
      return joint.GetUpperLimit() * this._sharedData.scaleX;
    }
    setPrismaticJointLimits(jointId, lowerTranslation, upperTranslation) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_prismaticJoint) {
        return;
      }
      if (upperTranslation < lowerTranslation) {
        const temp = lowerTranslation;
        lowerTranslation = upperTranslation;
        upperTranslation = temp;
      }
      lowerTranslation = lowerTranslation < 0 ? lowerTranslation : 0;
      upperTranslation = upperTranslation > 0 ? upperTranslation : 0;
      joint.SetLimits(lowerTranslation * this._sharedData.invScaleX, upperTranslation * this._sharedData.invScaleX);
    }
    isPrismaticJointMotorEnabled(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_prismaticJoint) {
        return false;
      }
      return joint.IsMotorEnabled();
    }
    enablePrismaticJointMotor(jointId, enable) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_prismaticJoint) {
        return;
      }
      joint.EnableMotor(enable);
    }
    getPrismaticJointMotorSpeed(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_prismaticJoint) {
        return 0;
      }
      return joint.GetMotorSpeed() * this._sharedData.scaleX;
    }
    setPrismaticJointMotorSpeed(jointId, speed) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_prismaticJoint) {
        return;
      }
      joint.SetMotorSpeed(speed * this._sharedData.invScaleX);
    }
    getPrismaticJointMaxMotorForce(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_prismaticJoint) {
        return 0;
      }
      return joint.GetMaxMotorForce();
    }
    setPrismaticJointMaxMotorForce(jointId, maxForce) {
      if (maxForce < 0) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_prismaticJoint) {
        return;
      }
      joint.SetMaxMotorForce(maxForce);
    }
    getPrismaticJointMotorForce(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_prismaticJoint) {
        return 0;
      }
      return joint.GetMotorForce(1 / this._sharedData.timeStep);
    }
    addPulleyJoint(x1, y1, other, x2, y2, groundX1, groundY1, groundX2, groundY2, lengthA, lengthB, ratio, collideConnected, variable) {
      if (this._body === null) {
        this.createBody();
      }
      if (other == null || !other.hasBehavior(this.name)) {
        return;
      }
      const otherBody = other.getBehavior(this.name).getBody();
      if (this._body === otherBody) {
        return;
      }
      const jointDef = new Box2D.b2PulleyJointDef();
      jointDef.set_bodyA(this._body);
      jointDef.set_localAnchorA(this._body.GetLocalPoint(this.b2Vec2(x1 * this._sharedData.invScaleX, y1 * this._sharedData.invScaleY)));
      jointDef.set_bodyB(otherBody);
      jointDef.set_localAnchorB(otherBody.GetLocalPoint(this.b2Vec2(x2 * this._sharedData.invScaleX, y2 * this._sharedData.invScaleY)));
      jointDef.set_groundAnchorA(this.b2Vec2(groundX1 * this._sharedData.invScaleX, groundY1 * this._sharedData.invScaleY));
      jointDef.set_groundAnchorB(this.b2Vec2(groundX2 * this._sharedData.invScaleX, groundY2 * this._sharedData.invScaleY));
      jointDef.set_lengthA(lengthA > 0 ? lengthA * this._sharedData.invScaleX : this.b2Vec2((groundX1 - x1) * this._sharedData.invScaleX, (groundY1 - y1) * this._sharedData.invScaleY).Length());
      jointDef.set_lengthB(lengthB > 0 ? lengthB * this._sharedData.invScaleX : this.b2Vec2((groundX2 - x2) * this._sharedData.invScaleX, (groundY2 - y2) * this._sharedData.invScaleY).Length());
      jointDef.set_ratio(ratio > 0 ? ratio : 1);
      jointDef.set_collideConnected(collideConnected);
      const jointId = this._sharedData.addJoint(Box2D.castObject(this._sharedData.world.CreateJoint(jointDef), Box2D.b2PulleyJoint));
      variable.setNumber(jointId);
    }
    getPulleyJointFirstGroundAnchorX(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_pulleyJoint) {
        return 0;
      }
      return joint.GetGroundAnchorA().get_x() * this._sharedData.scaleX;
    }
    getPulleyJointFirstGroundAnchorY(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_pulleyJoint) {
        return 0;
      }
      return joint.GetGroundAnchorA().get_y() * this._sharedData.scaleY;
    }
    getPulleyJointSecondGroundAnchorX(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_pulleyJoint) {
        return 0;
      }
      return joint.GetGroundAnchorB().get_x() * this._sharedData.scaleX;
    }
    getPulleyJointSecondGroundAnchorY(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_pulleyJoint) {
        return 0;
      }
      return joint.GetGroundAnchorB().get_y() * this._sharedData.scaleY;
    }
    getPulleyJointFirstLength(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_pulleyJoint) {
        return 0;
      }
      return joint.GetCurrentLengthA() * this._sharedData.scaleX;
    }
    getPulleyJointSecondLength(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_pulleyJoint) {
        return 0;
      }
      return joint.GetCurrentLengthB() * this._sharedData.scaleX;
    }
    getPulleyJointRatio(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_pulleyJoint) {
        return 0;
      }
      return joint.GetRatio();
    }
    addGearJoint(jointId1, jointId2, ratio, collideConnected, variable) {
      if (this._body === null) {
        this.createBody();
      }
      const joint1 = this._sharedData.getJoint(jointId1);
      if (joint1 === null || joint1.GetType() !== Box2D.e_revoluteJoint && joint1.GetType() !== Box2D.e_prismaticJoint) {
        return;
      }
      const joint2 = this._sharedData.getJoint(jointId2);
      if (joint2 === null || joint2.GetType() !== Box2D.e_revoluteJoint && joint2.GetType() !== Box2D.e_prismaticJoint) {
        return;
      }
      if (joint1 === joint2) {
        return;
      }
      const jointDef = new Box2D.b2GearJointDef();
      jointDef.set_bodyA(this._sharedData.staticBody);
      jointDef.set_bodyB(this._body);
      jointDef.set_joint1(joint1);
      jointDef.set_joint2(joint2);
      jointDef.set_ratio(ratio);
      jointDef.set_collideConnected(collideConnected);
      const jointId = this._sharedData.addJoint(Box2D.castObject(this._sharedData.world.CreateJoint(jointDef), Box2D.b2GearJoint));
      variable.setNumber(jointId);
    }
    getGearJointFirstJoint(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_gearJoint) {
        return 0;
      }
      return this._sharedData.getJointId(joint.GetJoint1());
    }
    getGearJointSecondJoint(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_gearJoint) {
        return 0;
      }
      return this._sharedData.getJointId(joint.GetJoint2());
    }
    getGearJointRatio(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_gearJoint) {
        return 0;
      }
      return joint.GetRatio();
    }
    setGearJointRatio(jointId, ratio) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_gearJoint) {
        return;
      }
      joint.SetRatio(ratio);
      joint.GetBodyA().SetAwake(true);
      joint.GetBodyB().SetAwake(true);
    }
    addMouseJoint(targetX, targetY, maxForce, frequency, dampingRatio, variable) {
      if (this._body === null) {
        this.createBody();
      }
      const jointDef = new Box2D.b2MouseJointDef();
      jointDef.set_bodyA(this._sharedData.staticBody);
      jointDef.set_bodyB(this._body);
      jointDef.set_target(this.b2Vec2(targetX * this._sharedData.invScaleX, targetY * this._sharedData.invScaleY));
      jointDef.set_maxForce(maxForce >= 0 ? maxForce : 0);
      jointDef.set_frequencyHz(frequency > 0 ? frequency : 1);
      jointDef.set_dampingRatio(dampingRatio >= 0 ? dampingRatio : 0);
      const jointId = this._sharedData.addJoint(Box2D.castObject(this._sharedData.world.CreateJoint(jointDef), Box2D.b2MouseJoint));
      variable.setNumber(jointId);
    }
    getMouseJointTargetX(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_mouseJoint) {
        return 0;
      }
      return joint.GetTarget().get_x() * this._sharedData.scaleX;
    }
    getMouseJointTargetY(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_mouseJoint) {
        return 0;
      }
      return joint.GetTarget().get_y() * this._sharedData.scaleY;
    }
    setMouseJointTarget(jointId, targetX, targetY) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_mouseJoint) {
        return;
      }
      joint.SetTarget(this.b2Vec2(targetX * this._sharedData.invScaleX, targetY * this._sharedData.invScaleY));
      joint.GetBodyB().SetAwake(true);
    }
    getMouseJointMaxForce(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_mouseJoint) {
        return 0;
      }
      return joint.GetMaxForce();
    }
    setMouseJointMaxForce(jointId, maxForce) {
      if (maxForce < 0) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_mouseJoint) {
        return;
      }
      joint.SetMaxForce(maxForce);
    }
    getMouseJointFrequency(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_mouseJoint) {
        return 0;
      }
      return joint.GetFrequency();
    }
    setMouseJointFrequency(jointId, frequency) {
      if (frequency <= 0) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_mouseJoint) {
        return;
      }
      joint.SetFrequency(frequency);
    }
    getMouseJointDampingRatio(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_mouseJoint) {
        return 0;
      }
      return joint.GetDampingRatio();
    }
    setMouseJointDampingRatio(jointId, dampingRatio) {
      if (dampingRatio < 0) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_mouseJoint) {
        return;
      }
      joint.SetDampingRatio(dampingRatio);
    }
    addWheelJoint(x1, y1, other, x2, y2, axisAngle, frequency, dampingRatio, enableMotor, motorSpeed, maxMotorTorque, collideConnected, variable) {
      if (this._body === null) {
        this.createBody();
      }
      if (other == null || !other.hasBehavior(this.name)) {
        return;
      }
      const otherBody = other.getBehavior(this.name).getBody();
      if (this._body === otherBody) {
        return;
      }
      const jointDef = new Box2D.b2WheelJointDef();
      jointDef.set_bodyA(this._body);
      jointDef.set_localAnchorA(this._body.GetLocalPoint(this.b2Vec2(x1 * this._sharedData.invScaleX, y1 * this._sharedData.invScaleY)));
      jointDef.set_bodyB(otherBody);
      jointDef.set_localAnchorB(otherBody.GetLocalPoint(this.b2Vec2(x2 * this._sharedData.invScaleX, y2 * this._sharedData.invScaleY)));
      axisAngle = gdjs2.toRad(axisAngle) - this._body.GetAngle();
      jointDef.set_localAxisA(this.b2Vec2(Math.cos(axisAngle), Math.sin(axisAngle)));
      jointDef.set_frequencyHz(frequency > 0 ? frequency : 1);
      jointDef.set_dampingRatio(dampingRatio >= 0 ? dampingRatio : 0);
      jointDef.set_enableMotor(enableMotor);
      jointDef.set_motorSpeed(gdjs2.toRad(motorSpeed));
      jointDef.set_maxMotorTorque(maxMotorTorque);
      jointDef.set_collideConnected(collideConnected);
      const jointId = this._sharedData.addJoint(Box2D.castObject(this._sharedData.world.CreateJoint(jointDef), Box2D.b2WheelJoint));
      variable.setNumber(jointId);
    }
    getWheelJointAxisAngle(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_wheelJoint) {
        return 0;
      }
      return gdjs2.toDegrees(Math.atan2(joint.GetLocalAxisA().get_y(), joint.GetLocalAxisA().get_x()) + joint.GetBodyA().GetAngle());
    }
    getWheelJointTranslation(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_wheelJoint) {
        return 0;
      }
      return joint.GetJointTranslation() * this._sharedData.scaleX;
    }
    getWheelJointSpeed(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_wheelJoint) {
        return 0;
      }
      return gdjs2.toDegrees(joint.GetJointSpeed());
    }
    isWheelJointMotorEnabled(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_wheelJoint) {
        return false;
      }
      return joint.IsMotorEnabled();
    }
    enableWheelJointMotor(jointId, enable) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_wheelJoint) {
        return;
      }
      joint.EnableMotor(enable);
    }
    getWheelJointMotorSpeed(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_wheelJoint) {
        return 0;
      }
      return gdjs2.toDegrees(joint.GetMotorSpeed());
    }
    setWheelJointMotorSpeed(jointId, speed) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_wheelJoint) {
        return;
      }
      joint.SetMotorSpeed(gdjs2.toRad(speed));
    }
    getWheelJointMaxMotorTorque(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_wheelJoint) {
        return 0;
      }
      return joint.GetMaxMotorTorque();
    }
    setWheelJointMaxMotorTorque(jointId, maxTorque) {
      if (maxTorque < 0) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_wheelJoint) {
        return;
      }
      joint.SetMaxMotorTorque(maxTorque);
    }
    getWheelJointMotorTorque(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_wheelJoint) {
        return 0;
      }
      return joint.GetMotorTorque(1 / this._sharedData.timeStep);
    }
    getWheelJointFrequency(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_wheelJoint) {
        return 0;
      }
      return joint.GetSpringFrequencyHz();
    }
    setWheelJointFrequency(jointId, frequency) {
      if (frequency < 0) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_wheelJoint) {
        return;
      }
      joint.SetSpringFrequencyHz(frequency);
    }
    getWheelJointDampingRatio(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_wheelJoint) {
        return 0;
      }
      return joint.GetSpringDampingRatio();
    }
    setWheelJointDampingRatio(jointId, dampingRatio) {
      if (dampingRatio < 0) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_wheelJoint) {
        return;
      }
      joint.SetSpringDampingRatio(dampingRatio);
    }
    addWeldJoint(x1, y1, other, x2, y2, referenceAngle, frequency, dampingRatio, collideConnected, variable) {
      if (this._body === null) {
        this.createBody();
      }
      if (other == null || !other.hasBehavior(this.name)) {
        return;
      }
      const otherBody = other.getBehavior(this.name).getBody();
      if (this._body === otherBody) {
        return;
      }
      const jointDef = new Box2D.b2WeldJointDef();
      jointDef.set_bodyA(this._body);
      jointDef.set_localAnchorA(this._body.GetLocalPoint(this.b2Vec2(x1 * this._sharedData.invScaleX, y1 * this._sharedData.invScaleY)));
      jointDef.set_bodyB(otherBody);
      jointDef.set_localAnchorB(otherBody.GetLocalPoint(this.b2Vec2(x2 * this._sharedData.invScaleX, y2 * this._sharedData.invScaleY)));
      jointDef.set_referenceAngle(gdjs2.toRad(referenceAngle));
      jointDef.set_frequencyHz(frequency > 0 ? frequency : 1);
      jointDef.set_dampingRatio(dampingRatio >= 0 ? dampingRatio : 0);
      jointDef.set_collideConnected(collideConnected);
      const joint = Box2D.castObject(this._sharedData.world.CreateJoint(jointDef), Box2D.b2WeldJoint);
      joint.referenceAngle = jointDef.get_referenceAngle();
      variable.setNumber(this._sharedData.addJoint(joint));
    }
    getWeldJointReferenceAngle(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_weldJoint) {
        return 0;
      }
      return gdjs2.toDegrees(joint.referenceAngle);
    }
    getWeldJointFrequency(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_weldJoint) {
        return 0;
      }
      return joint.GetFrequency();
    }
    setWeldJointFrequency(jointId, frequency) {
      if (frequency < 0) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_weldJoint) {
        return;
      }
      joint.SetFrequency(frequency);
    }
    getWeldJointDampingRatio(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_weldJoint) {
        return 0;
      }
      return joint.GetDampingRatio();
    }
    setWeldJointDampingRatio(jointId, dampingRatio) {
      if (dampingRatio < 0) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_weldJoint) {
        return;
      }
      joint.SetDampingRatio(dampingRatio);
    }
    addRopeJoint(x1, y1, other, x2, y2, maxLength, collideConnected, variable) {
      if (this._body === null) {
        this.createBody();
      }
      if (other == null || !other.hasBehavior(this.name)) {
        return;
      }
      const otherBody = other.getBehavior(this.name).getBody();
      if (this._body === otherBody) {
        return;
      }
      const jointDef = new Box2D.b2RopeJointDef();
      jointDef.set_bodyA(this._body);
      jointDef.set_localAnchorA(this._body.GetLocalPoint(this.b2Vec2(x1 * this._sharedData.invScaleX, y1 * this._sharedData.invScaleY)));
      jointDef.set_bodyB(otherBody);
      jointDef.set_localAnchorB(otherBody.GetLocalPoint(this.b2Vec2(x2 * this._sharedData.invScaleX, y2 * this._sharedData.invScaleY)));
      jointDef.set_maxLength(maxLength > 0 ? maxLength * this._sharedData.invScaleX : this.b2Vec2((x2 - x1) * this._sharedData.invScaleX, (y2 - y1) * this._sharedData.invScaleY).Length());
      jointDef.set_collideConnected(collideConnected);
      const jointId = this._sharedData.addJoint(Box2D.castObject(this._sharedData.world.CreateJoint(jointDef), Box2D.b2RopeJoint));
      variable.setNumber(jointId);
    }
    getRopeJointMaxLength(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_ropeJoint) {
        return 0;
      }
      return joint.GetMaxLength() * this._sharedData.scaleX;
    }
    setRopeJointMaxLength(jointId, maxLength) {
      if (maxLength < 0) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_ropeJoint) {
        return;
      }
      joint.SetMaxLength(maxLength * this._sharedData.invScaleX);
      joint.GetBodyA().SetAwake(true);
      joint.GetBodyB().SetAwake(true);
    }
    addFrictionJoint(x1, y1, other, x2, y2, maxForce, maxTorque, collideConnected, variable) {
      if (this._body === null) {
        this.createBody();
      }
      if (other == null || !other.hasBehavior(this.name)) {
        return;
      }
      const otherBody = other.getBehavior(this.name).getBody();
      if (this._body === otherBody) {
        return;
      }
      const jointDef = new Box2D.b2FrictionJointDef();
      jointDef.set_bodyA(this._body);
      jointDef.set_localAnchorA(this._body.GetLocalPoint(this.b2Vec2(x1 * this._sharedData.invScaleX, y1 * this._sharedData.invScaleY)));
      jointDef.set_bodyB(otherBody);
      jointDef.set_localAnchorB(otherBody.GetLocalPoint(this.b2Vec2(x2 * this._sharedData.invScaleX, y2 * this._sharedData.invScaleY)));
      jointDef.set_maxForce(maxForce >= 0 ? maxForce : 0);
      jointDef.set_maxTorque(maxTorque >= 0 ? maxTorque : 0);
      jointDef.set_collideConnected(collideConnected);
      const jointId = this._sharedData.addJoint(Box2D.castObject(this._sharedData.world.CreateJoint(jointDef), Box2D.b2FrictionJoint));
      variable.setNumber(jointId);
    }
    getFrictionJointMaxForce(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_frictionJoint) {
        return 0;
      }
      return joint.GetMaxForce();
    }
    setFrictionJointMaxForce(jointId, maxForce) {
      if (maxForce < 0) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_frictionJoint) {
        return;
      }
      joint.SetMaxForce(maxForce);
    }
    getFrictionJointMaxTorque(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_frictionJoint) {
        return 0;
      }
      return joint.GetMaxTorque();
    }
    setFrictionJointMaxTorque(jointId, maxTorque) {
      if (maxTorque < 0) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_frictionJoint) {
        return;
      }
      joint.SetMaxTorque(maxTorque);
    }
    addMotorJoint(other, offsetX, offsetY, offsetAngle, maxForce, maxTorque, correctionFactor, collideConnected, variable) {
      if (this._body === null) {
        this.createBody();
      }
      if (other == null || !other.hasBehavior(this.name)) {
        return;
      }
      const otherBody = other.getBehavior(this.name).getBody();
      if (this._body === otherBody) {
        return;
      }
      const jointDef = new Box2D.b2MotorJointDef();
      jointDef.set_bodyA(this._body);
      jointDef.set_bodyB(otherBody);
      jointDef.set_linearOffset(this.b2Vec2(offsetX * this._sharedData.invScaleX, offsetY * this._sharedData.invScaleY));
      jointDef.set_angularOffset(gdjs2.toRad(offsetAngle));
      jointDef.set_maxForce(maxForce >= 0 ? maxForce : 0);
      jointDef.set_maxTorque(maxTorque >= 0 ? maxTorque : 0);
      jointDef.set_correctionFactor(correctionFactor < 0 ? 0 : correctionFactor > 1 ? 1 : correctionFactor);
      jointDef.set_collideConnected(collideConnected);
      const jointId = this._sharedData.addJoint(Box2D.castObject(this._sharedData.world.CreateJoint(jointDef), Box2D.b2MotorJoint));
      variable.setNumber(jointId);
    }
    getMotorJointOffsetX(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_motorJoint) {
        return 0;
      }
      return joint.GetLinearOffset().get_x() * this._sharedData.scaleX;
    }
    getMotorJointOffsetY(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_motorJoint) {
        return 0;
      }
      return joint.GetLinearOffset().get_y() * this._sharedData.scaleY;
    }
    setMotorJointOffset(jointId, offsetX, offsetY) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_motorJoint) {
        return;
      }
      joint.SetLinearOffset(this.b2Vec2(offsetX * this._sharedData.invScaleX, offsetY * this._sharedData.invScaleY));
    }
    getMotorJointAngularOffset(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_motorJoint) {
        return 0;
      }
      return gdjs2.toDegrees(joint.GetAngularOffset());
    }
    setMotorJointAngularOffset(jointId, offsetAngle) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_motorJoint) {
        return;
      }
      joint.SetAngularOffset(gdjs2.toRad(offsetAngle));
    }
    getMotorJointMaxForce(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_motorJoint) {
        return 0;
      }
      return joint.GetMaxForce();
    }
    setMotorJointMaxForce(jointId, maxForce) {
      if (maxForce < 0) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_motorJoint) {
        return;
      }
      joint.SetMaxForce(maxForce);
    }
    getMotorJointMaxTorque(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_motorJoint) {
        return 0;
      }
      return joint.GetMaxTorque();
    }
    setMotorJointMaxTorque(jointId, maxTorque) {
      if (maxTorque < 0) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_motorJoint) {
        return;
      }
      joint.SetMaxTorque(maxTorque);
      joint.GetBodyA().SetAwake(true);
      joint.GetBodyB().SetAwake(true);
    }
    getMotorJointCorrectionFactor(jointId) {
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_motorJoint) {
        return 0;
      }
      return joint.GetCorrectionFactor();
    }
    setMotorJointCorrectionFactor(jointId, correctionFactor) {
      if (correctionFactor < 0 || correctionFactor > 1) {
        return;
      }
      const joint = this._sharedData.getJoint(jointId);
      if (joint === null || joint.GetType() !== Box2D.e_motorJoint) {
        return;
      }
      joint.SetCorrectionFactor(correctionFactor);
      joint.GetBodyA().SetAwake(true);
      joint.GetBodyB().SetAwake(true);
    }
    static collisionTest(object1, object2, behaviorName) {
      if (object1 === null || !object1.hasBehavior(behaviorName)) {
        return false;
      }
      if (object2 === null || !object2.hasBehavior(behaviorName)) {
        return false;
      }
      const behavior1 = object1.getBehavior(behaviorName);
      for (let i = 0, len = behavior1.currentContacts.length; i < len; ++i) {
        if (behavior1.currentContacts[i].owner === object2) {
          return true;
        }
      }
      return false;
    }
  }
  gdjs2.Physics2RuntimeBehavior = Physics2RuntimeBehavior;
  gdjs2.registerBehavior("Physics2::Physics2Behavior", gdjs2.Physics2RuntimeBehavior);
})(gdjs || (gdjs = {}));
//# sourceMappingURL=physics2runtimebehavior.js.map
