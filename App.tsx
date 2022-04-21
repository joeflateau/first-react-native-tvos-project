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
  View,
} from 'react-native';
import Video from 'react-native-video';
import 'react-native/tvos-types.d';
import tw from './lib/tw';

const data: GridViewSection[] = range(1, 6).map((section) => ({
  title: `Section ${section}`,
  items: range(1, 15).map((item) => ({
    title: `Item ${item}`,
    videoUrl:
      'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8',
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
    <View style={tw(`bg-gray-900 flex-1`)}>
      <GridView
        sections={data}
        onItemPress={(item) => navigation.navigate('Detail', {item})}
      />
    </View>
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

const TRAY_HEIGHT = 320;

function useVideoScreenTray() {
  const trayTop = useRef(new Animated.Value(-TRAY_HEIGHT));
  const trayBottom = useRef(new Animated.Value(TRAY_HEIGHT));

  const trayOffset = useMemo(
    () => ({
      top: trayTop,
      bottom: trayBottom,
    }),
    [],
  );

  const [openTray, setOpenTray] = useState<'top' | 'bottom' | null>(null);

  const onOpenTray = useCallback(
    (targetTray: 'top' | 'bottom' | null) => {
      if (targetTray === openTray) {
        return;
      }
      if (openTray) {
        Animated.timing(trayOffset[openTray].current, {
          useNativeDriver: true,
          toValue: openTray === 'bottom' ? TRAY_HEIGHT : -TRAY_HEIGHT,
          duration: 500,
        }).start();
      }
      if (targetTray) {
        Animated.timing(trayOffset[targetTray].current, {
          useNativeDriver: true,
          toValue: 0,
          duration: 500,
        }).start();
      }
      setOpenTray(targetTray);
    },
    [openTray, trayOffset],
  );

  const navigation = useNavigation();
  useEffect(() => {
    const listener = (e: {preventDefault: () => void}) => {
      if (openTray != null) {
        e.preventDefault();
        onOpenTray(null);
      }
    };
    navigation.addListener('beforeRemove', listener);
    return () => navigation.removeListener('beforeRemove', listener);
  }, [navigation, onOpenTray, openTray]);

  return {openTray, onOpenTray, trayOffset};
}

function VideoScreen() {
  const route = useRoute<RouteProp<RootStackPropMap, 'Detail'>>();

  const [paused, setPaused] = useState(false);

  const {openTray, onOpenTray, trayOffset} = useVideoScreenTray();

  useTVEventHandler((ev) => {
    switch (ev.eventType) {
      case 'swipeUp':
        if (openTray == null) {
          onOpenTray('bottom');
        } else if (openTray === 'top') {
          onOpenTray(null);
        }
        break;
      case 'swipeDown':
        if (openTray == null) {
          onOpenTray('top');
        } else if (openTray === 'bottom') {
          onOpenTray(null);
        }
        break;
      case 'playPause':
        setPaused((p) => !p);
        break;
    }
  });

  return (
    <View style={tw(`flex-1 bg-black`)}>
      <Video
        controls={false}
        paused={paused}
        source={{uri: route.params.item.videoUrl}}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          tw(`bg-gray-700 absolute left-0 right-0 top-0`),
          {
            height: TRAY_HEIGHT,
            transform: [
              {
                translateY: trayOffset.top.current,
              },
            ],
          },
        ]}>
        <Text>Top tray</Text>
      </Animated.View>

      <Animated.View
        style={[
          tw(`bg-gray-700 absolute left-0 right-0 bottom-0`),
          {
            height: TRAY_HEIGHT,
            transform: [
              {
                translateY: trayOffset.bottom.current,
              },
            ],
          },
        ]}>
        <Text>Bottom tray</Text>
      </Animated.View>
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
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      {sections.map((section) => (
        <Fragment key={section.title}>
          <ScrollView horizontal contentInsetAdjustmentBehavior="automatic">
            <Text style={tw(`text-gray-200 p-2 text-2xl`)}>
              {section.title}
            </Text>
          </ScrollView>
          <ScrollView contentInsetAdjustmentBehavior="automatic" horizontal>
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
    </ScrollView>
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
