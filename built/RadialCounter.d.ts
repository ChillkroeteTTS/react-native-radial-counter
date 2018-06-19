import { Animated, ViewStyle, GestureResponderEvent } from 'react-native';
import { Component } from 'react';
interface LoadingRingProps {
    backgroundColor: string;
    tintColor: string;
    innerRadius: number;
    outerRadius: number;
    progress: number;
}
interface RadialCounterOwnProps {
    buttonOptions: {
        useButton: boolean;
        gap: number;
        buttonColor: string;
        buttonActiveColor: string;
    };
    containerStyle: ViewStyle;
    longPressDelay: number;
    timesRounded: number;
    progress: number;
    onTimesRoundedChange: (timesRounded: number) => void;
    onRingProgressChange: (ringProgress: number) => void;
}
export declare type RadialCounterProps = RadialCounterOwnProps & LoadingRingProps;
interface Point {
    x: number;
    y: number;
}
export interface State {
    touchState: {
        lastGrant: number | null;
        isSelected: boolean;
        lastDeg: number;
    };
    showTimeSlider: false;
    longPressProgress: Animated.Value;
    longPressAnimation: Animated.CompositeAnimation;
    showRadial: boolean;
    initialPos: null | Point;
}
export default class RadialCounter extends Component<RadialCounterProps, State> {
    buttonStyle: ViewStyle;
    constructor(props: RadialCounterProps);
    stopButtonAnimation: (o: State) => State;
    resetTouch: () => void;
    initTouchAfterLongPress: (evt: GestureResponderEvent) => void;
    updateRadialState: (evt: GestureResponderEvent) => void;
    render(): JSX.Element;
}
export {};
