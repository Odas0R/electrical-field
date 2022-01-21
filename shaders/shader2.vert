attribute vec4 uPosition;

uniform vec2 uRatio;

// color of charges
varying vec4 vColor;
varying float vCharge;

void main() 
{
    gl_Position = uPosition / vec4(uRatio / 2.0, 1.0, 1.0);
    gl_PointSize = 20.0;
    vCharge = uPosition.z;
}
