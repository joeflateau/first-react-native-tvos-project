import {ReactNode} from 'react';
import 'react-native';

declare module 'react-native' {
  export interface PressableStateCallbackType {
    readonly focused: boolean;
  }

  export interface ImageBackgroundProps {
    children?: ReactNode;
  }
  export interface ButtonProps {
    children?: ReactNode;
  }
}
