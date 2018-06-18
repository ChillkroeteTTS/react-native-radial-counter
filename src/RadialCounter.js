import {
    StyleSheet,
    View,
} from 'react-native';
import Svg, {
    Circle,
} from 'react-native-svg';
import React, {Component} from 'react';

const rcbStyles = StyleSheet.create({
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
        this.longPressDelay = props.longPressDelay;
        this.state = {
            showTimeSlider: false,
            touchState: {
                lastGrant: null,
                isSelected: false,
                lastDeg: 0
            }
        };
    }

    resetTouch = () => {
        this.state.touchState.lastGrant = null;
        this.state.touchState.isSelected = false;
        this.state.initialPos = null;
        this.state.lastDeg = 0;
    };

    initTouchAfterLongPress = (evt) => {
        this.setState(oldState => {
            oldState.touchState.lastGrant = Date.now();
            return oldState;
        });
        const pageX = evt.nativeEvent.pageX;
        const pageY = evt.nativeEvent.pageY;
        setTimeout(() => {
                if (this.state.touchState.lastGrant
                    && (Date.now() - this.state.touchState.lastGrant) <= (this.longPressDelay + 50)) {
                    this.setState(oldState => {
                        oldState.touchState.isSelected = true;
                        oldState.initialPos = {
                            x: pageX,
                            y: pageY
                        };
                        return oldState;
                    });
                }
            }, this.longPressDelay
        )
    };

    updateRadialState = (evt) => {
        const pageX = evt.nativeEvent.pageX;
        const pageY = evt.nativeEvent.pageY;

        if (this.state.touchState.isSelected)
            this.setState(oldState => {
                const diffX = pageX - oldState.initialPos.x;
                const diffY = oldState.initialPos.y - pageY;
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
            <View style={[rcbStyles.container, this.props.containerStyle]}
                  onStartShouldSetResponder={(evt) => true}
                  onMoveShouldSetResponder={(evt) => true}
                  onResponderGrant={this.initTouchAfterLongPress}
                  onResponderReject={this.resetTouch}
                  onResponderRelease={this.resetTouch}
                  onResponderMove={this.updateRadialState}>
                <View style={rcbStyles.svgContainer}>
                    <LoadingRing {...this.props}/>
                </View>
            </View>
        );
    }
}