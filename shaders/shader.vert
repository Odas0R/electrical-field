#define TWOPI 6.28318530718
#define Ke 8.988e9
#define SCALE 0.1

attribute vec4 uPosition;

const int MAX_CHARGES=20;
uniform vec3 uCharges[MAX_CHARGES];

varying vec4 vColor;
uniform vec2 uRatio;

// convert angle to hue; returns RGB
// colors corresponding to (angle mod TWOPI):
// 0=red, PI/2=yellow-green, PI=cyan, -PI/2=purple
vec3 angle_to_hue(float angle) {
angle /= TWOPI;
return clamp((abs(fract(angle+vec3(3.0, 2.0, 1.0)/3.0)*6.0-3.0)-1.0), 0.0, 1.0);
}

vec3 hsv2rgb(vec3 c)
{
vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 colorize(vec2 f)
{
float a = atan(f.y, f.x);
return vec4(angle_to_hue(a-TWOPI), 1.);
}

vec2 processEletricField() 
{
vec2 field = vec2(0.0,0.0);

for (int i = 0; i < MAX_CHARGES; i++) 
{
    
    float q = uCharges[i].z;
    float r = distance(vec2(uPosition.xy), vec2(uCharges[i].xy));
    float E = (Ke*q) / (r*r);
    vec2 direction = (vec2(uPosition.xy) - vec2(uCharges[i].xy));

    field += E * direction;
}

return field;
}

void main() 
{
vec4 initialPos = uPosition / vec4(uRatio / 2.0, 1.0, 1.0);

if (uPosition.z == 1.0) {
    // static dot
    gl_Position = initialPos;
    vColor = vec4(0.0, 0.0, 0.0, 1.0);
} else {
    // non-static dot
    vec2 field = processEletricField();

    vec4 fieldPos = initialPos + vec4(field.xy, 0.0, 0.0);

    if (length(fieldPos) >= 1.0) {
        vec2 normalized = normalize(field) * SCALE;
        fieldPos = initialPos + vec4(normalized.xy, 0.0, 0.0);
    }

    gl_Position = fieldPos;
    vColor = colorize(field);
}

gl_PointSize = 2.0;
}
