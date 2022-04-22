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
  StackActions,
  useNavigation,
  useNavigationContainerRef,
  useRoute,
} from '@react-navigation/native';
import {
  createStackNavigator,
  StackCardStyleInterpolator,
  StackNavigationProp,
} from '@react-navigation/stack';
import {range} from 'lodash';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  BackHandler,
  Button,
  ImageBackground,
  ImageURISource,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TVMenuControl,
  useTVEventHandler,
  useWindowDimensions,
  View,
} from 'react-native';
import Video from 'react-native-video';
import 'react-native/tvos-types.d';
import tw from './lib/tw';

const hlsUrls = [
  'https://multiplatform-f.akamaihd.net/i/multi/will/bunny/big_buck_bunny_,640x360_400,640x360_700,640x360_1000,950x540_1500,.f4v.csmil/master.m3u8',
  'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8',
];

let urlIndex = 0;
const data: GridViewSection[] = range(1, 8).map((section) => ({
  title: `Section ${section}`,
  items: range(1, 15).map((item) => ({
    title: `Item ${item}`,
    videoUrl: hlsUrls[urlIndex++ % hlsUrls.length],
  })),
}));

const Stack = createStackNavigator();

type RootStackPropMap = {
  Detail: {
    item: GridViewItem;
  };
  Video: {
    item: GridViewItem;
  };
};

const cardStyleFade: StackCardStyleInterpolator = ({current}) => ({
  cardStyle: {opacity: current.progress},
});

function useVideoBackButton() {
  const navRef = useNavigationContainerRef();

  const [canGoBack, setCanGoBack] = useState(false);

  navRef.addListener('state', () =>
    setCanGoBack(navRef.current?.canGoBack() ?? false),
  );

  useEffect(() => {
    if (canGoBack) {
      TVMenuControl.enableTVMenuKey();
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (navRef.current?.canGoBack()) {
            navRef.dispatch(StackActions.pop(1));
          } else {
            BackHandler.exitApp();
          }
          return true;
        },
      );

      return () => {
        TVMenuControl.disableTVMenuKey();
        backHandler.remove();
      };
    }
    return;
  }, [canGoBack, navRef]);

  return {navRef};
}

const App = () => {
  const {navRef} = useVideoBackButton();

  return (
    <>
      <NavigationContainer ref={navRef}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: cardStyleFade,
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
    useNavigation<StackNavigationProp<RootStackPropMap, 'Detail'>>();

  return (
    <ScrollView
      style={tw(`bg-gray-900 flex-1`)}
      contentInsetAdjustmentBehavior="automatic">
      <GridView
        sections={data}
        onItemPress={(item) => navigation.navigate('Detail', {item})}
      />
    </ScrollView>
  );
}

function DetailScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackPropMap>>();
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

function useVideoScreenTray({
  animationDuration = 350,
}: {
  animationDuration?: number;
} = {}) {
  const timingValue = useRef(new Animated.Value(0));

  const [isOpen, setOpen] = useState(false);
  const [isCompletelyClosed, setIsCompletelyClosed] = useState(true);

  const onOpenTray = useCallback(
    (shouldBeOpen: boolean) => {
      if (shouldBeOpen === isOpen) {
        return;
      }
      if (isOpen) {
        Animated.timing(timingValue.current, {
          useNativeDriver: true,
          toValue: 0,
          duration: animationDuration,
        }).start((end) => {
          if (end.finished) {
            setIsCompletelyClosed(true);
          }
        });
      }
      if (shouldBeOpen) {
        setIsCompletelyClosed(false);
        Animated.timing(timingValue.current, {
          useNativeDriver: true,
          toValue: 1,
          duration: animationDuration,
        }).start();
      }
      setOpen(shouldBeOpen);
    },
    [animationDuration, isOpen],
  );

  const navigation = useNavigation();
  useEffect(() => {
    const listener = (e: {preventDefault: () => void}) => {
      if (isOpen) {
        e.preventDefault();
        onOpenTray(false);
      }
    };
    navigation.addListener('beforeRemove', listener);
    return () => navigation.removeListener('beforeRemove', listener);
  }, [navigation, onOpenTray, isOpen]);

  return {
    isOpen,
    onOpenTray,
    isCompletelyClosed,
    timingValue: timingValue.current,
  };
}

const TRAY_HEIGHT = 320;

function VideoScreen() {
  const route = useRoute<RouteProp<RootStackPropMap, 'Detail'>>();
  const navigation = useNavigation<StackNavigationProp<RootStackPropMap>>();

  const [paused, setPaused] = useState(false);

  const topTray = useVideoScreenTray();
  const bottomTray = useVideoScreenTray();

  useTVEventHandler((ev) => {
    switch (ev.eventType) {
      case 'up':
      case 'swipeUp':
        if (!(topTray.isOpen || bottomTray.isOpen)) {
          bottomTray.onOpenTray(true);
        }
        break;
      case 'down':
      case 'swipeDown':
        if (!(topTray.isOpen || bottomTray.isOpen)) {
          topTray.onOpenTray(true);
        }
        break;
      case 'playPause':
        setPaused((p) => !p);
        break;
    }
  });

  const {height: windowHeight} = useWindowDimensions();

  const item = route.params.item;

  return (
    <View style={tw('flex-1 bg-black')}>
      <Video
        controls={false}
        paused={paused}
        source={{uri: item.videoUrl}}
        style={StyleSheet.absoluteFill}
      />
      {/* keyboard events are not triggered unless a scrollview is present?? */}
      <ScrollView />

      {!topTray.isCompletelyClosed && (
        <Animated.View
          style={[
            tw(`absolute inset-0`),
            {
              opacity: topTray.timingValue,
              transform: [
                {
                  translateY: topTray.timingValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-TRAY_HEIGHT, 0],
                  }),
                },
              ],
            },
          ]}>
          <View style={[tw('bg-gray-700/50 p-3'), {height: TRAY_HEIGHT}]}>
            <Text style={tw('text-5xl text-white')}>{item.title}</Text>
            <Text style={tw('text-2xl text-white')}>{item.videoUrl}</Text>
          </View>
        </Animated.View>
      )}

      {!bottomTray.isCompletelyClosed && (
        <Animated.ScrollView
          style={[
            tw(`absolute inset-0`),
            {
              opacity: bottomTray.timingValue,
              transform: [
                {
                  translateY: bottomTray.timingValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [TRAY_HEIGHT, 0],
                  }),
                },
              ],
            },
          ]}>
          <View
            style={{
              marginTop: windowHeight - TRAY_HEIGHT,
            }}>
            <View style={tw('bg-gray-700/50')}>
              <GridView
                sections={data}
                onItemPress={(item) => navigation.setParams({item})}
              />
            </View>
          </View>
        </Animated.ScrollView>
      )}
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
    <>
      {sections.map((section, i) => (
        <Fragment key={section.title}>
          <ScrollView horizontal contentInsetAdjustmentBehavior="automatic">
            <Text style={tw(`text-gray-200 p-2 text-2xl`)}>
              {section.title}
            </Text>
          </ScrollView>
          <ScrollView contentInsetAdjustmentBehavior="automatic" horizontal>
            {section.items.map((item, j) => (
              <GridViewItem
                key={item.title}
                item={item}
                onPress={() => onItemPress(item, section)}
                useAutoFocus={i + j === 0}
              />
            ))}
          </ScrollView>
        </Fragment>
      ))}
    </>
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
  useAutoFocus,
}: {
  item: GridViewItem;
  onPress: () => void;
  useAutoFocus?: boolean;
}) {
  const imageSource = useMemo(() => {
    const source: ImageURISource = {
      uri: `https://picsum.photos/320/180`,
      width: 320,
      height: 180,
    };
    return source;
  }, []);

  const [pressable, setPressable] = useState<View | null>(null);

  useEffect(() => {
    if (pressable && useAutoFocus) {
      // setTimeout(() => pressable.focus(), 50);
    }
  }, [useAutoFocus, pressable]);

  return (
    <Pressable ref={setPressable} onPress={() => onPress()}>
      {({focused}) => (
        <View
          style={tw(
            `mx-3
             w-[320px] h-[180px]
             border-4`,
            focused ? 'border-gray-50' : 'border-gray-50/0',
          )}>
          <ImageBackground
            style={tw(`flex-1 flex justify-center`)}
            source={imageSource}
            resizeMode="cover">
            <Text
              style={tw(
                `text-2xl text-center bg-black/50  px-2 py-1 rounded-lg`,
                focused ? 'text-white' : 'text-white/70',
              )}>
              {item.title}
            </Text>
          </ImageBackground>
        </View>
      )}
    </Pressable>
  );
}
