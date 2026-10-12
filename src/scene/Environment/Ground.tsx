import { routeModel } from '../Road/route';

const SIZE = 2400;

// Centre the snow plane on the middle of the route so the horizon fog hides its edges.
const centre = routeModel.curve.getPointAt(0.5);

export function Ground() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[centre.x, -0.02, centre.z]}>
      <planeGeometry args={[SIZE, SIZE]} />
      <meshStandardMaterial color="#aab8cc" roughness={1} />
    </mesh>
  );
}
