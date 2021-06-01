var gdjs;
(function(gdjs2) {
  let physics2;
  (function(physics22) {
    physics22.objectsCollide = function(objectsLists1, behavior, objectsLists2, inverted) {
      return gdjs2.evtTools.object.twoListsTest(gdjs2.Physics2RuntimeBehavior.collisionTest, objectsLists1, objectsLists2, inverted, behavior);
    };
    physics22.setTimeScale = function(objectsLists, behavior, timeScale) {
      const lists = gdjs2.staticArray(gdjs2.physics2.setTimeScale);
      objectsLists.values(lists);
      for (let i = 0, len = lists.length; i < len; i++) {
        const list = lists[i];
        for (let j = 0, lenj = list.length; j < lenj; j++) {
          gdjs2.Physics2RuntimeBehavior.setTimeScaleFromObject(list[j], behavior, timeScale);
          return;
        }
      }
    };
  })(physics2 = gdjs2.physics2 || (gdjs2.physics2 = {}));
})(gdjs || (gdjs = {}));
//# sourceMappingURL=physics2tools.js.map
