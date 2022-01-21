precision highp float;

varying float vCharge;

void main() {
  vec2 fragmentPosition = 2.0*gl_PointCoord - 1.0;
  float distance = length(fragmentPosition);
  float distanceSqrd = distance * distance;

  if(vCharge == -1.0) {
        // is negative
        gl_FragColor = vec4(0.0, 0.2/distanceSqrd, 0.0, 1.0 );
    } else {
        // is positive
        gl_FragColor = vec4(0.2/distanceSqrd, 0.0, 0.0, 1.0);
    }
  
}