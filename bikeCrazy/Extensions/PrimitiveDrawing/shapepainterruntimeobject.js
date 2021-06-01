var gdjs;
(function(gdjs2) {
  class ShapePainterRuntimeObject extends gdjs2.RuntimeObject {
    constructor(runtimeScene, shapePainterObjectData) {
      super(runtimeScene, shapePainterObjectData);
      this._fillColor = parseInt(gdjs2.rgbToHex(shapePainterObjectData.fillColor.r, shapePainterObjectData.fillColor.g, shapePainterObjectData.fillColor.b), 16);
      this._outlineColor = parseInt(gdjs2.rgbToHex(shapePainterObjectData.outlineColor.r, shapePainterObjectData.outlineColor.g, shapePainterObjectData.outlineColor.b), 16);
      this._fillOpacity = shapePainterObjectData.fillOpacity;
      this._outlineOpacity = shapePainterObjectData.outlineOpacity;
      this._outlineSize = shapePainterObjectData.outlineSize;
      this._absoluteCoordinates = shapePainterObjectData.absoluteCoordinates;
      this._clearBetweenFrames = shapePainterObjectData.clearBetweenFrames;
      this._renderer = new gdjs2.ShapePainterRuntimeObjectRenderer(this, runtimeScene);
      this.onCreated();
    }
    getRendererObject() {
      return this._renderer.getRendererObject();
    }
    updateFromObjectData(oldObjectData, newObjectData) {
      if (oldObjectData.fillColor.r !== newObjectData.fillColor.r || oldObjectData.fillColor.g !== newObjectData.fillColor.g || oldObjectData.fillColor.b !== newObjectData.fillColor.b) {
        this.setFillColor("" + newObjectData.fillColor.r + ";" + newObjectData.fillColor.g + ";" + newObjectData.fillColor.b);
      }
      if (oldObjectData.outlineColor.r !== newObjectData.outlineColor.r || oldObjectData.outlineColor.g !== newObjectData.outlineColor.g || oldObjectData.outlineColor.b !== newObjectData.outlineColor.b) {
        this.setOutlineColor("" + newObjectData.outlineColor.r + ";" + newObjectData.outlineColor.g + ";" + newObjectData.outlineColor.b);
      }
      if (oldObjectData.fillOpacity !== newObjectData.fillOpacity) {
        this.setFillOpacity(newObjectData.fillOpacity);
      }
      if (oldObjectData.outlineOpacity !== newObjectData.outlineOpacity) {
        this.setOutlineOpacity(newObjectData.outlineOpacity);
      }
      if (oldObjectData.outlineSize !== newObjectData.outlineSize) {
        this.setOutlineSize(newObjectData.outlineSize);
      }
      if (oldObjectData.absoluteCoordinates !== newObjectData.absoluteCoordinates) {
        this._absoluteCoordinates = newObjectData.absoluteCoordinates;
        this._renderer.updateXPosition();
        this._renderer.updateYPosition();
      }
      if (oldObjectData.clearBetweenFrames !== newObjectData.clearBetweenFrames) {
        this._clearBetweenFrames = newObjectData.clearBetweenFrames;
      }
      return true;
    }
    stepBehaviorsPreEvents(runtimeScene) {
      if (this._clearBetweenFrames) {
        this._renderer.clear();
      }
      super.stepBehaviorsPreEvents(runtimeScene);
    }
    getVisibilityAABB() {
      return this._absoluteCoordinates ? null : this.getAABB();
    }
    drawRectangle(x1, y1, x2, y2) {
      this._renderer.drawRectangle(x1, y1, x2, y2);
    }
    drawCircle(x, y, radius) {
      this._renderer.drawCircle(x, y, radius);
    }
    drawLine(x1, y1, x2, y2, thickness) {
      this._renderer.drawLine(x1, y1, x2, y2, thickness);
    }
    drawLineV2(x1, y1, x2, y2, thickness) {
      this._renderer.drawLineV2(x1, y1, x2, y2, thickness);
    }
    drawEllipse(centerX, centerY, width, height) {
      this._renderer.drawEllipse(centerX, centerY, width, height);
    }
    drawRoundedRectangle(startX1, startY1, endX2, endY2, radius) {
      this._renderer.drawRoundedRectangle(startX1, startY1, endX2, endY2, radius);
    }
    drawStar(centerX, centerY, points, radius, innerRadius, rotation) {
      this._renderer.drawStar(centerX, centerY, points, radius, innerRadius, rotation);
    }
    drawArc(centerX, centerY, radius, startAngle, endAngle, anticlockwise, closePath) {
      this._renderer.drawArc(centerX, centerY, radius, startAngle, endAngle, anticlockwise, closePath);
    }
    drawBezierCurve(x1, y1, cpX, cpY, cpX2, cpY2, x2, y2) {
      this._renderer.drawBezierCurve(x1, y1, cpX, cpY, cpX2, cpY2, x2, y2);
    }
    drawQuadraticCurve(x1, y1, cpX, cpY, x2, y2) {
      this._renderer.drawQuadraticCurve(x1, y1, cpX, cpY, x2, y2);
    }
    beginFillPath(x1, y1) {
      this._renderer.beginFillPath();
      this._renderer.drawPathMoveTo(x1, y1);
    }
    endFillPath() {
      this._renderer.endFillPath();
    }
    drawPathMoveTo(x1, y1) {
      this._renderer.drawPathMoveTo(x1, y1);
    }
    drawPathLineTo(x1, y1) {
      this._renderer.drawPathLineTo(x1, y1);
    }
    drawPathBezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY) {
      this._renderer.drawPathBezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY);
    }
    drawPathArc(cx, cy, radius, startAngle, endAngle, anticlockwise) {
      this._renderer.drawPathArc(cx, cy, radius, startAngle, endAngle, anticlockwise);
    }
    drawPathQuadraticCurveTo(cpX, cpY, toX, toY) {
      this._renderer.drawPathQuadraticCurveTo(cpX, cpY, toX, toY);
    }
    closePath() {
      this._renderer.closePath();
    }
    setClearBetweenFrames(value) {
      this._clearBetweenFrames = value;
    }
    isClearedBetweenFrames() {
      return this._clearBetweenFrames;
    }
    setCoordinatesRelative(value) {
      this._absoluteCoordinates = !value;
    }
    areCoordinatesRelative() {
      return !this._absoluteCoordinates;
    }
    setFillColor(rgbColor) {
      const colors = rgbColor.split(";");
      if (colors.length < 3) {
        return;
      }
      this._fillColor = parseInt(gdjs2.rgbToHex(parseInt(colors[0], 10), parseInt(colors[1], 10), parseInt(colors[2], 10)), 16);
    }
    getFillColorR() {
      return gdjs2.hexNumberToRGB(this._fillColor).r;
    }
    getFillColorG() {
      return gdjs2.hexNumberToRGB(this._fillColor).g;
    }
    getFillColorB() {
      return gdjs2.hexNumberToRGB(this._fillColor).b;
    }
    setOutlineColor(rgbColor) {
      const colors = rgbColor.split(";");
      if (colors.length < 3) {
        return;
      }
      this._outlineColor = parseInt(gdjs2.rgbToHex(parseInt(colors[0], 10), parseInt(colors[1], 10), parseInt(colors[2], 10)), 16);
      this._renderer.updateOutline();
    }
    getOutlineColorR() {
      return gdjs2.hexNumberToRGB(this._outlineColor).r;
    }
    getOutlineColorG() {
      return gdjs2.hexNumberToRGB(this._outlineColor).g;
    }
    getOutlineColorB() {
      return gdjs2.hexNumberToRGB(this._outlineColor).b;
    }
    setOutlineSize(size) {
      this._outlineSize = size;
      this._renderer.updateOutline();
    }
    getOutlineSize() {
      return this._outlineSize;
    }
    setFillOpacity(opacity) {
      this._fillOpacity = opacity;
    }
    getFillOpacity() {
      return this._fillOpacity;
    }
    setOutlineOpacity(opacity) {
      this._outlineOpacity = opacity;
      this._renderer.updateOutline();
    }
    getOutlineOpacity() {
      return this._outlineOpacity;
    }
    setX(x) {
      if (x === this.x) {
        return;
      }
      super.setX(x);
      this._renderer.updateXPosition();
    }
    setY(y) {
      if (y === this.y) {
        return;
      }
      super.setY(y);
      this._renderer.updateYPosition();
    }
    getWidth() {
      return 32;
    }
    getHeight() {
      return 32;
    }
  }
  gdjs2.ShapePainterRuntimeObject = ShapePainterRuntimeObject;
  gdjs2.registerObject("PrimitiveDrawing::Drawer", gdjs2.ShapePainterRuntimeObject);
  ShapePainterRuntimeObject.supportsReinitialization = false;
})(gdjs || (gdjs = {}));
//# sourceMappingURL=shapepainterruntimeobject.js.map
