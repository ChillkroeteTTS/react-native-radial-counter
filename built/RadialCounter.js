"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_native_1 = require("react-native");
var react_native_svg_1 = require("react-native-svg");
var React = require("react");
var react_1 = require("react");
var rcbStyles = react_native_1.StyleSheet.create({
    absolute: { position: "absolute" },
    container: {
        alignItems: "center",
        justifyContent: "center",
    },
    svgContainer: { transform: [{ rotate: "-90deg" }] }
});
function layerSwitch(lastDeg, deg) {
    var isInsideBounds = function (_a) {
        var upper = _a.upper, lower = _a.lower;
        return deg <= upper && deg >= lower;
    };
    var wasInsideBounds = function (_a) {
        var upper = _a.upper, lower = _a.lower;
        return lastDeg <= upper && lastDeg >= lower;
    };
    var leftArea = { lower: 340, upper: 360 };
    var rightArea = { lower: 0, upper: 20 };
    if (isInsideBounds(rightArea) && wasInsideBounds(leftArea))
        return 1;
    else if (wasInsideBounds(rightArea) && isInsideBounds(leftArea))
        return -1;
    else
        return 0;
}
//https://codepen.io/xgad/post/svg-radial-progress-meters
function LoadingRing(_a) {
    var backgroundColor = _a.backgroundColor, tintColor = _a.tintColor, innerRadius = _a.innerRadius, outerRadius = _a.outerRadius, progress = _a.progress;
    var borderWidth = outerRadius - innerRadius;
    var circleRadius = innerRadius + borderWidth / 2;
    var outerDiameter = outerRadius * 2;
    var stroke = 2 * Math.PI * circleRadius;
    return (<react_native_svg_1.default width={outerDiameter} height={outerDiameter} viewBox={"0 0 " + outerDiameter + " " + outerDiameter}>
        <react_native_svg_1.Circle cx={outerRadius} cy={outerRadius} r={circleRadius} fill={"none"} stroke={backgroundColor} strokeWidth={borderWidth}/>

        <react_native_svg_1.Circle cx={outerRadius} cy={outerRadius} r={circleRadius} fill={"none"} stroke={tintColor} strokeWidth={borderWidth} strokeDasharray={stroke.toString()} strokeDashoffset={stroke * (1 - progress)}/>
    </react_native_svg_1.default>);
}
;
var RadialCounter = /** @class */ (function (_super) {
    __extends(RadialCounter, _super);
    function RadialCounter(props) {
        var _this = _super.call(this, props) || this;
        _this.stopButtonAnimation = function (o) {
            o.longPressAnimation.stop();
            o.longPressProgress.setValue(0.01);
            return o;
        };
        _this.resetTouch = function () {
            _this.setState(function (o) {
                o.touchState.lastGrant = null;
                o.touchState.isSelected = false;
                o.touchState.lastDeg = 0;
                o.initialPos = null;
                o.showRadial = false;
                o = _this.stopButtonAnimation(o);
                return o;
            });
        };
        _this.initTouchAfterLongPress = function (evt) {
            var pageX = evt.nativeEvent.pageX;
            var pageY = evt.nativeEvent.pageY;
            var locationX = evt.nativeEvent.locationX;
            var locationY = evt.nativeEvent.locationY;
            _this.setState(function (oldState) {
                oldState.touchState.lastGrant = Date.now();
                return oldState;
            });
            _this.state.longPressAnimation.start(function () {
                if (_this.state.touchState.lastGrant
                    && (Date.now() - _this.state.touchState.lastGrant) <= (_this.props.longPressDelay + 50)) {
                    _this.setState(function (oldState) {
                        //X and Y are switched due to transform rotation -> transform to center and euclidic
                        var relativeX = locationX - _this.props.outerRadius;
                        var relativeY = -locationY + _this.props.outerRadius;
                        var pageCenterX = pageX - relativeX;
                        var pageCenterY = pageY + relativeY;
                        console.log("pure:       " + locationX + " |  " + locationY);
                        console.log("relative:   " + relativeX + " |  " + relativeY);
                        return {
                            touchState: __assign({}, oldState.touchState, { isSelected: true }),
                            initialPos: {
                                x: pageCenterX,
                                y: pageCenterY
                            },
                            showRadial: true
                        };
                    });
                }
            });
        };
        _this.updateRadialState = function (evt) {
            var pageX = evt.nativeEvent.pageX;
            var pageY = evt.nativeEvent.pageY;
            if (_this.state.touchState.isSelected)
                _this.setState(function (oldState) {
                    var diffX = pageX - _this.state.initialPos.x;
                    var diffY = _this.state.initialPos.y - pageY;
                    var rad = Math.atan2(diffY, diffX);
                    var deg = (rad * 180) / Math.PI;
                    deg = deg - 90;
                    if (diffX <= 0 && diffY >= 0) {
                        deg = -(270 + (90 - deg));
                    }
                    deg = -deg;
                    _this.props.onTimesRoundedChange(_this.props.timesRounded + layerSwitch(_this.state.touchState.lastDeg, deg));
                    _this.props.onRingProgressChange(deg / 360);
                    oldState.touchState.lastDeg = deg;
                    return oldState;
                });
        };
        var buttonRadius = _this.props.innerRadius * 2 - _this.props.buttonOptions.gap;
        _this.buttonStyle = {
            width: buttonRadius,
            height: buttonRadius,
            borderRadius: _this.props.innerRadius,
            backgroundColor: _this.props.buttonOptions.buttonColor,
            position: 'absolute'
        };
        var buttonAnimationValue = new react_native_1.Animated.Value(0.01);
        _this.state = {
            showTimeSlider: false,
            touchState: {
                lastGrant: null,
                isSelected: false,
                lastDeg: 0
            },
            longPressProgress: buttonAnimationValue,
            longPressAnimation: react_native_1.Animated.timing(buttonAnimationValue, {
                duration: _this.props.longPressDelay,
                toValue: 1.0
            }),
            showRadial: false,
            initialPos: null
        };
        return _this;
    }
    RadialCounter.prototype.render = function () {
        return (<react_native_1.View style={[rcbStyles.container, this.props.containerStyle,
            {
                width: this.props.outerRadius * 2,
                height: this.props.outerRadius * 2
            }]} onStartShouldSetResponder={function (evt) { return true; }} onMoveShouldSetResponder={function (evt) { return true; }} onResponderGrant={this.initTouchAfterLongPress} onResponderReject={this.resetTouch} onResponderRelease={this.resetTouch} onResponderMove={this.updateRadialState}>
                {this.props.buttonOptions.useButton
            && <react_native_1.View style={[rcbStyles.absolute, rcbStyles.container]}>
                        <react_native_1.View style={this.buttonStyle}/>
                        <react_native_1.Animated.View style={[this.buttonStyle,
                {
                    backgroundColor: this.props.buttonOptions.buttonActiveColor,
                    transform: [{ scale: this.state.longPressProgress }]
                }]}/>
                    </react_native_1.View>}
                {(!this.props.buttonOptions.useButton || this.state.showRadial)
            && <react_native_1.View style={rcbStyles.svgContainer}>
                        <LoadingRing {...this.props}/>
                    </react_native_1.View>}
            </react_native_1.View>);
    };
    return RadialCounter;
}(react_1.Component));
exports.default = RadialCounter;
