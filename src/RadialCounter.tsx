import {
    StyleSheet,
    View,
    Animated,
    ViewStyle,
    GestureResponderEvent
} from 'react-native';
import Svg, {
    Circle,
} from 'react-native-svg';
import * as React from "react";
import { Component } from 'react';

const rcbStyles = StyleSheet.create({
    absolute: { position: "absolute" },
    container: {
        alignItems: "center",
        justifyContent: "center",
    },
    svgContainer: { transform: [{ rotate: "-90deg" }] }
});


function layerSwitch(lastDeg: number, deg: number): number {
    interface Bounds { upper: number, lower: number }
    const isInsideBounds = ({ upper, lower }: Bounds) => deg <= upper && deg >= lower;
    const wasInsideBounds = ({ upper, lower }: Bounds) => lastDeg <= upper && lastDeg >= lower;
    const leftArea = { lower: 340, upper: 360 };
    const rightArea = { lower: 0, upper: 20 };

    if (isInsideBounds(rightArea) && wasInsideBounds(leftArea))
        return 1;
    else if (wasInsideBounds(rightArea) && isInsideBounds(leftArea))
        return -1;
    else return 0;
}

interface LoadingRingProps {
    backgroundColor: string,
    tintColor: string,
    innerRadius: number,
    outerRadius: number,
    progress: number
}

//https://codepen.io/xgad/post/svg-radial-progress-meters
function LoadingRing({ backgroundColor, tintColor, innerRadius, outerRadius, progress }: LoadingRingProps) {
    const borderWidth = outerRadius - innerRadius;
    const circleRadius = innerRadius + borderWidth / 2;
    const outerDiameter = outerRadius * 2;
    const stroke = 2 * Math.PI * circleRadius;

    return (<Svg width={outerDiameter} height={outerDiameter}
        viewBox={`0 0 ${outerDiameter} ${outerDiameter}`}>
        <Circle cx={outerRadius} cy={outerRadius}
            r={circleRadius}
            fill={"none"} stroke={backgroundColor}
            strokeWidth={borderWidth} />

        <Circle cx={outerRadius} cy={outerRadius}
            r={circleRadius}
            fill={"none"} stroke={tintColor}
            strokeWidth={borderWidth}
            strokeDasharray={stroke.toString()}
            strokeDashoffset={stroke * (1 - progress)} />
    </Svg>);
}

interface RadialCounterOwnProps {
    buttonOptions: {
        useButton: boolean,
        gap: number,
        buttonColor: string,
        buttonActiveColor: string
    },
    containerStyle: ViewStyle,
    longPressDelay: number,
    timesRounded: number,
    progress: number,
    onTimesRoundedChange: (timesRounded: number) => void,
    onRingProgressChange: (ringProgress: number) => void
}

export type RadialCounterProps = RadialCounterOwnProps & LoadingRingProps;

interface Point { x: number, y: number };

export interface State {
    touchState: {
        lastGrant: number | null,
        isSelected: boolean,
        lastDeg: number
    },
    showTimeSlider: false,
    longPressProgress: Animated.Value,
    longPressAnimation: Animated.CompositeAnimation,
    showRadial: boolean,
    initialPos: null | Point
}


export default class RadialCounter extends Component<RadialCounterProps, State> {

    buttonStyle: ViewStyle;

    constructor(props: RadialCounterProps) {
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
            showRadial: false,
            initialPos: null
        };
    }

    stopButtonAnimation = (o: State) => {
        o.longPressAnimation.stop();
        o.longPressProgress.setValue(0.01);
        return o;
    };

    resetTouch = () => {
        this.setState((o: State) => {
            o.touchState.lastGrant = null;
            o.touchState.isSelected = false;
            o.touchState.lastDeg = 0;
            o.initialPos = null;
            o.showRadial = false;
            o = this.stopButtonAnimation(o);
            return o;
        });
    };

    initTouchAfterLongPress = (evt: GestureResponderEvent) => {
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

                    return {
                        touchState: {
                            ...oldState.touchState,
                            isSelected: true
                        },
                        initialPos: {
                            x: pageCenterX,
                            y: pageCenterY
                        },
                        showRadial: true
                    };
                });
            }
        });
    }

    updateRadialState = (evt: GestureResponderEvent) => {
        const pageX = evt.nativeEvent.pageX;
        const pageY = evt.nativeEvent.pageY;

        if (this.state.touchState.isSelected)
            this.setState(oldState => {
                const diffX = pageX - this.state.initialPos!.x;
                const diffY = this.state.initialPos!.y - pageY;
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
                        <View style={this.buttonStyle} />
                        <Animated.View style={[this.buttonStyle,
                        {
                            backgroundColor: this.props.buttonOptions.buttonActiveColor,
                            transform: [{ scale: this.state.longPressProgress }]
                        }]} />
                    </View>}
                {(!this.props.buttonOptions.useButton || this.state.showRadial)
                    && <View style={rcbStyles.svgContainer}>
                        <LoadingRing {...this.props} />
                    </View>}
            </View>
        );
    }
}