var gdjs;
(function(gdjs2) {
  let deviceVibration;
  (function(deviceVibration2) {
    deviceVibration2.startVibration = function(duration) {
      if (typeof navigator == "undefined" || !navigator.vibrate) {
        return;
      }
      navigator.vibrate([duration]);
    };
    deviceVibration2.startVibrationPattern = function(intervals) {
      const pattern = "^[0-9]+(,[0-9]+)*$";
      if (typeof navigator == "undefined" || !navigator.vibrate) {
        return;
      }
      if (intervals.match(pattern)) {
        navigator.vibrate(intervals.split(",").map((duration) => parseFloat(duration)));
      }
    };
    deviceVibration2.stopVibration = function() {
      if (typeof navigator == "undefined" || !navigator.vibrate) {
        return;
      }
      navigator.vibrate([]);
    };
  })(deviceVibration = gdjs2.deviceVibration || (gdjs2.deviceVibration = {}));
})(gdjs || (gdjs = {}));
//# sourceMappingURL=devicevibrationtools.js.map
