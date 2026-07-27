import type { ThreeElements } from '@react-three/fiber';

// R3F 9 stopped augmenting the JSX namespace, so three.js intrinsics
// (<mesh>, <group>, <boxGeometry>…) have to be registered per-project.
// Under jsx: "react-jsx" the intrinsics are resolved from React.JSX.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
