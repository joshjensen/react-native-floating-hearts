import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, ViewPropTypes, Animated, StyleSheet } from 'react-native';

import HeartShape from './HeartShape';

/**
 * @class FloatingHearts
 */

class FloatingHearts extends Component {
  state = {
    hearts: [],
    height: null,
  };

  constructor() {
    super();
    this.createHeart = this.createHeart.bind(this);
  }

  createHeart(index) {
    return {
      id: index,
      color: this.props.colors[
        Math.floor(getRandomNumber(0, this.props.colors.length))
      ],
      right: getRandomNumber(
        this.props.rightMin ? this.props.rightMin : 50,
        this.props.rightMax ? this.props.rightMax : 150
      ),
    };
  }

  removeHeart(id) {
    this.setState(prevState => {
      prevState.hearts.shift();
      return { hearts: prevState.hearts };
    });
  }

  componentWillUpdate(nextProps) {
    const oldCount = this.props.count;
    const newCount = nextProps.count;
    const numHearts = newCount - oldCount;

    if (numHearts <= 0) {
      return;
    }

    this.setState(prevState => {
      prevState.hearts.push(this.createHeart(nextProps.count));

      return {
        hearts: prevState.hearts,
      };
    });
  }

  handleOnLayout = e => {
    const height = e.nativeEvent.layout.height;

    this.setState({ height });
  };

  render() {
    const { height } = this.state;
    const { renderCustomShape } = this.props;
    const isReady = height !== null;

    let heartProps = {};

    return (
      <View
        style={[styles.container, this.props.style]}
        onLayout={this.handleOnLayout}
        pointerEvents="none"
      >
        {isReady &&
          this.state.hearts.map(({ id, right, color }) => {
            return (
              <AnimatedShape
                key={id}
                height={height}
                style={{ right }}
                onComplete={this.removeHeart.bind(this, id)}
              >
                {renderCustomShape ? (
                  renderCustomShape(id, color)
                ) : (
                  <HeartShape color={color} {...heartProps} />
                )}
              </AnimatedShape>
            );
          })}
      </View>
    );
  }
}

FloatingHearts.propTypes = {
  style: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
  count: PropTypes.number,
  colors: PropTypes.array,
  renderCustomShape: PropTypes.func,
};

FloatingHearts.defaultProps = {
  count: -1,
};

/**
 * @class AnimatedShape
 */

class AnimatedShape extends Component {
  constructor(props) {
    super(props);

    this.state = {
      position: new Animated.Value(0),
      shapeHeight: null,
      enabled: false,
      animationsReady: false,
    };
  }

  componentDidMount() {
    Animated.timing(this.state.position, {
      duration: 2000,
      useNativeDriver: true,
      toValue: this.props.height * -1,
    }).start(this.props.onComplete);
  }

  getAnimationStyle() {
    if (!this.state.animationsReady) {
      return { opacity: 0 };
    }

    return {
      transform: [
        { translateY: this.state.position },
        { translateX: this.xAnimation },
        { scale: this.scaleAnimation },
        { rotate: this.rotateAnimation },
      ],
      opacity: this.opacityAnimation,
    };
  }

  handleOnLayout = e => {
    if (this.rendered) {
      return null;
    }

    this.rendered = true;

    const height = Math.ceil(this.props.height);
    const negativeHeight = height * -1;
    const shapeHeight = e.nativeEvent.layout.height;

    this.yAnimation = this.state.position.interpolate({
      inputRange: [negativeHeight, 0],
      outputRange: [height, 0],
    });

    this.opacityAnimation = this.yAnimation.interpolate({
      inputRange: [0, height - shapeHeight],
      outputRange: [1, 0],
    });

    this.scaleAnimation = this.yAnimation.interpolate({
      inputRange: [0, 15, 30, height],
      outputRange: [0, 1.2, 1, this.props.shrinkTo ? this.props.shrinkTo : 1],
    });

    this.xAnimation = this.yAnimation.interpolate({
      inputRange: [0, height / 2, height],
      outputRange: [0, 15, 0],
    });

    this.rotateAnimation = this.yAnimation.interpolate({
      inputRange: [0, height / 4, height / 3, height / 2, height],
      outputRange: ['0deg', '-2deg', '0deg', '2deg', '0deg'],
    });

    this.setState({ animationsReady: true });
  };

  render() {
    return (
      <Animated.View
        style={[
          styles.shapeWrapper,
          this.getAnimationStyle(),
          this.props.style,
        ]}
        onLayout={this.handleOnLayout}
      >
        {this.props.children}
      </Animated.View>
    );
  }
}

AnimatedShape.propTypes = {
  height: PropTypes.number.isRequired,
  onComplete: PropTypes.func.isRequired,
  style: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
  children: PropTypes.node.isRequired,
};

AnimatedShape.defaultProps = {
  onComplete: () => {},
};

/**
 * Styles
 */

const styles = StyleSheet.create({
  container: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: 'absolute',
  },

  shapeWrapper: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'transparent',
  },
});

/**
 * Helpers
 */

const getRandomNumber = (min, max) => Math.random() * (max - min) + min;

/**
 * Exports
 */

export default FloatingHearts;
