import React from "react";
import Swiper from "react-native-web-swiper";
import { View } from "react-native";

export default function PagerViewWeb({ children, ...props }) {
  return (
    <Swiper {...props}>
      {React.Children.map(children, (child, index) => (
        <View key={index} style={{ flex: 1 }}>
          {child}
        </View>
      ))}
    </Swiper>
  );
}
