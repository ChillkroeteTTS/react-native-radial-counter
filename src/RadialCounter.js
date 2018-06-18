import {
    StyleSheet,
    View,
    Animated
} from 'react-native';
import Svg, {
    Circle,
} from 'react-native-svg';
import React, {Component} from 'react';

const rcbStyles = StyleSheet.create({
    absolute: {position: "absolute"},
    container: {
        alignItems: "center",
        justifyContent: "center",
    },
    svgContainer: {transform: [{rotate: "-90deg"}]}
});

function layerSwitch(lastDeg, deg) {
    const isInsideBounds = ({upper, lower}) => deg <= upper && deg >= lower;
    const wasInsideBounds = ({upper, lower}) => lastDeg <= upper && lastDeg >= lower;
    const leftArea = {lower: 340, upper: 360};
    const rightArea = {lower: 0, upper: 20};

    if (isInsideBounds(rightArea) && wasInsideBounds(leftArea))
        return 1;
    else if (wasInsideBounds(rightArea) && isInsideBounds(leftArea))
        return -1;
    else return 0;
}

//https://codepen.io/xgad/post/svg-radial-progress-meters
function LoadingRing({backgroundColor, tintColor, innerRadius, outerRadius, progress}) {
    const borderWidth = outerRadius - innerRadius;
    const circleRadius = innerRadius + borderWidth / 2;
    const outerDiameter = outerRadius * 2;
    const stroke = 2 * Math.PI * circleRadius;

    return (<Svg width={outerDiameter} height={outerDiameter}
                 viewBox={`0 0 ${outerDiameter} ${outerDiameter}`}>
        <Circle cx={outerRadius} cy={outerRadius}
                r={circleRadius}
                fill={"none"} stroke={backgroundColor}
                strokeWidth={borderWidth}/>

        <Circle cx={outerRadius} cy={outerRadius}
                r={circleRadius}
                fill={"none"} stroke={tintColor}
                strokeWidth={borderWidth}
                strokeDasharray={stroke}
                strokeDashoffset={stroke * (1 - progress)}/>
    </Svg>);
}

export default class RadialCounter extends Component {
    constructor(props) {
        super(props);
        let buttonRadius = this.props.innerRadius * 2 - this.props.buttonOptions.gap;
        this.buttonStyle = {
            width: buttonRadius,
            height: buttonRadius,
            borderRadius: this.props.innerRadius,
            backgroundColor: this.props.buttonOptions.buttonColor,
            position: 'absolute'
        };
        const buttonAnimationValue = new Animated.Value(0.01);
        this.state = {
            showTimeSlider: false,
            touchState: {
                lastGrant: null,
                isSelected: false,
                lastDeg: 0
            },
            longPressProgress: buttonAnimationValue,
            longPressAnimation: Animated.timing(buttonAnimationValue,
                {
                    duration: this.props.longPressDelay,
                    toValue: 1.0
                }),
            showRadial: false
        };
    }

    stopButtonAnimation = (o) => {
        o.longPressAnimation.stop();
        o.longPressProgress.setValue(0.01);
        return o;
    };

    resetTouch = () => {
        this.setState((o) => {
            o.touchState.lastGrant = null;
            o.touchState.isSelected = false;
            o.initialPos = null;
            o.lastDeg = 0;
            o.showRadial = false;
            o = this.stopButtonAnimation(o);
            return o;
        });
    };

    initTouchAfterLongPress = (evt) => {
        const pageX = evt.nativeEvent.pageX;
        const pageY = evt.nativeEvent.pageY;
        const locationX = evt.nativeEvent.locationX;
        const locationY = evt.nativeEvent.locationY;

        this.setState(oldState => {
            oldState.touchState.lastGrant = Date.now();
            return oldState;
        });
        this.state.longPressAnimation.start(() => {
            if (this.state.touchState.lastGrant
                && (Date.now() - this.state.touchState.lastGrant) <= (this.props.longPressDelay + 50)) {
                this.setState(oldState => {
                    //X and Y are switched due to transform rotation -> transform to center and euclidic
                    const relativeX = locationX - this.props.outerRadius;
                    const relativeY = -locationY + this.props.outerRadius;
                    const pageCenterX = pageX - relativeX;
                    const pageCenterY = pageY + relativeY;
                    console.log(`pure:       ${locationX} |  ${locationY}`);
                    console.log(`relative:   ${relativeX} |  ${relativeY}`);

                    oldState.touchState.isSelected = true;
                    oldState.initialPos = {
                        x: pageCenterX,
                        y: pageCenterY
                    };
                    oldState.showRadial = true;
                    return oldState;
                });
            }
        });
    };

    updateRadialState = (evt) => {
        const pageX = evt.nativeEvent.pageX;
        const pageY = evt.nativeEvent.pageY;

        if (this.state.touchState.isSelected)
            this.setState(oldState => {
                const diffX = pageX - this.state.initialPos.x;
                const diffY = this.state.initialPos.y - pageY;
                const rad = Math.atan2(diffY, diffX);
                let deg = (rad * 180) / Math.PI;


                deg = deg - 90;

                if (diffX <= 0 && diffY >= 0) {
                    deg = -(270 + (90 - deg))
                }
                deg = -deg;

                this.props.onTimesRoundedChange(this.props.timesRounded + layerSwitch(this.state.touchState.lastDeg, deg));
                this.props.onRingProgressChange(deg / 360);

                oldState.touchState.lastDeg = deg;
                return oldState;
            });
    };

    render() {
        return (
            <View style={[rcbStyles.container, this.props.containerStyle,
                {
                    width: this.props.outerRadius * 2,
                    height: this.props.outerRadius * 2
                }]}
                  onStartShouldSetResponder={(evt) => true}
                  onMoveShouldSetResponder={(evt) => true}
                  onResponderGrant={this.initTouchAfterLongPress}
                  onResponderReject={this.resetTouch}
                  onResponderRelease={this.resetTouch}
                  onResponderMove={this.updateRadialState}>
                {this.props.buttonOptions.useButton
                && <View style={[rcbStyles.absolute, rcbStyles.container]}>
                    <View style={this.buttonStyle}/>
                    <Animated.View style={[this.buttonStyle,
                        {
                            backgroundColor: this.props.buttonOptions.buttonActiveColor,
                            transform: [{scale: this.state.longPressProgress}]
                        }]}/>
                </View>}
                {(!this.props.buttonOptions.useButton || this.state.showRadial)
                && <View style={rcbStyles.svgContainer}>
                    <LoadingRing {...this.props}/>
                </View>}
            </View>
        );
    }
}