/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import {
  NavigationContainer,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {range} from 'lodash';
import React, {Fragment, useMemo} from 'react';
import {
  Button,
  ImageBackground,
  ImageURISource,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Video from 'react-native-video';
import 'react-native/tvos-types.d';
import tw from './lib/tw';

declare const global: {HermesInternal: null | {}};

const data: GridViewSection[] = range(1, 6).map((section) => ({
  title: `Section ${section}`,
  items: range(1, 15).map((item) => ({
    title: `Item ${item}`,
    videoUrl:
      'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8',
  })),
}));

const Stack = createNativeStackNavigator();

type RootStackPropMap = {
  Detail: {
    item: GridViewItem;
  };
  Video: {
    item: GridViewItem;
  };
};

const App = () => {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
          }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Detail" component={DetailScreen} />
          <Stack.Screen name="Video" component={VideoScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default App;

function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackPropMap, 'Detail'>>();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={tw(`bg-gray-900`)}>
      <GridView
        sections={data}
        onItemPress={(item) => navigation.navigate('Detail', {item})}
      />
    </ScrollView>
  );
}

function DetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackPropMap>>();
  const {
    params: {item},
  } = useRoute<RouteProp<RootStackPropMap, 'Detail'>>();

  return (
    <View>
      <Text>Detail Screen {item.title}</Text>
      <Button title="Play" onPress={() => navigation.navigate('Video', {item})}>
        Play
      </Button>
    </View>
  );
}

function VideoScreen() {
  const route = useRoute<RouteProp<RootStackPropMap, 'Detail'>>();

  return (
    <View style={tw(`flex-1 bg-black`)}>
      <Video
        controls
        source={{uri: route.params.item.videoUrl}}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function GridView({
  sections,
  onItemPress,
}: {
  sections: GridViewSection[];
  onItemPress: GridViewItemPressHandler;
}) {
  return (
    <View>
      {sections.map((section) => (
        <Fragment key={section.title}>
          <Text style={tw(`text-gray-200 text-lg`)}>{section.title}</Text>
          <ScrollView horizontal>
            {section.items.map((item) => (
              <GridViewItem
                key={item.title}
                item={item}
                onPress={() => onItemPress(item, section)}
              />
            ))}
          </ScrollView>
        </Fragment>
      ))}
    </View>
  );
}

type GridViewSection = {title: string; items: GridViewItem[]};
type GridViewItem = {title: string; videoUrl: string};
type GridViewItemPressHandler = (
  item: GridViewItem,
  section: GridViewSection,
) => void;

function GridViewItem({
  item,
  onPress,
}: {
  item: GridViewItem;
  onPress: () => void;
}) {
  const imageSource = useMemo(() => {
    const source: ImageURISource = {
      uri: `https://picsum.photos/320/180`,
      width: 320,
      height: 180,
    };
    return source;
  }, []);
  return (
    <Pressable onPress={() => onPress()}>
      {({focused}) => (
        <View
          style={tw(
            `mx-3
             w-[320px] h-[180px]
             border-4
             bg-gray-500`,
            focused ? 'border-gray-50' : 'border-gray-700',
          )}>
          <ImageBackground
            style={tw(`flex-1`)}
            source={imageSource}
            resizeMode="cover">
            <Text style={tw(`text-2xl`)}>{item.title}</Text>
          </ImageBackground>
        </View>
      )}
    </Pressable>
  );
}
