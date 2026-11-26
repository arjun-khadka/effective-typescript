interface Vector3D {
  x: number;
  y: number;
  z: number;
}
function calculateLengthL1(v: Vector3D) {
  let length = 0;
  for (const axis of Object.keys(v)) {
    console.log(axis);
    const coord = v[axis];
    //            ~~~~~~~ Element implicitly has an 'any' type because ...
    //                    'string' can't be used to index type 'Vector3D'
    length += Math.abs(coord);
  }
  return length;
}

const vec3D = { x: 3, y: 4, z: 1, address: '123 Broadway' };
const value = calculateLengthL1(vec3D); // OK, returns NaN
console.log(value);

interface Vector2D {
  x: number;
  y: number;
}
function calculateLength(v: Vector2D) {
  return Math.sqrt(v.x ** 2 + v.y ** 2);
}

function normalize(v: Vector3D) {
  const length = calculateLength(v);
  return {
    x: v.x / length,
    y: v.y / length,
    z: v.z / length,
  };
}
console.log('normalize', normalize({ x: 3, y: 4, z: 5 }));
