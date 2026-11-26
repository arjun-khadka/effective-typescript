function asNumber(val: number | string): number {
  return Number(val);
}
// function asNumber(val: number | string): number {
//   return val as number;
// }

console.log(asNumber('value as number'));

//----------------------------------

// let x = 'hello';
// x = 1234;
// console.log(x);

//---------------------------------

function turnLightOn() {}
function turnLightOff() {}
function setLightSwitch(value: boolean) {
  switch (value) {
    case true:
      turnLightOn();
      break;
    case false:
      turnLightOff();
      break;
    default:
      console.log(`I'm afraid I can't do that.`);
  }
}
setLightSwitch(true);
