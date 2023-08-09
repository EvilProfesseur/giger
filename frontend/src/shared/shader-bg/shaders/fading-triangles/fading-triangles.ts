import { IShader, UniformsRequired } from "../../shader.types";

export const fadingTriangles: IShader = {
    uniformsRequired: [UniformsRequired.resolution, UniformsRequired.time],
    code: `#define S(a, b, t) smoothstep(a, b, t)
    precision mediump float;   

    uniform float iTime;
    uniform vec3 iResolution;

    float distLine(vec2 p, vec2 a, vec2 b){
        vec2 pa = p - a;
        vec2 ba = b - a;
        float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return length(pa - ba*t);
    }
    
    float line(vec2 p, vec2 a, vec2 b){
        float d = distLine(p, a, b);
        float m = S(0.03, 0.01, d);
        float d2 =  length(a - b);
        m *= S(1.4, 0.8, d2) * 0.5 + S(0.05, 0.03, abs(d2 - 0.75));
        return m;
    }
    
    float distTriangle(in vec2 p, in vec2 p0, in vec2 p1, in vec2 p2 )
    {
        vec2 e0 = p1 - p0;
        vec2 e1 = p2 - p1;
        vec2 e2 = p0 - p2;
    
        vec2 v0 = p - p0;
        vec2 v1 = p - p1;
        vec2 v2 = p - p2;
    
        vec2 pq0 = v0 - e0*clamp( dot(v0,e0)/dot(e0,e0), 0.0, 1.0 );
        vec2 pq1 = v1 - e1*clamp( dot(v1,e1)/dot(e1,e1), 0.0, 1.0 );
        vec2 pq2 = v2 - e2*clamp( dot(v2,e2)/dot(e2,e2), 0.0, 1.0 );
        
        float s = sign( e0.x*e2.y - e0.y*e2.x );
        vec2 d = min( min( vec2( dot( pq0, pq0 ), s*(v0.x*e0.y-v0.y*e0.x) ),
                           vec2( dot( pq1, pq1 ), s*(v1.x*e1.y-v1.y*e1.x) )),
                           vec2( dot( pq2, pq2 ), s*(v2.x*e2.y-v2.y*e2.x) ));
    
        return -sqrt(d.x)*sign(d.y);
    }
    
    float triangle(vec2 p, vec2 a, vec2 b, vec2 c){
        float d = distTriangle(p, a, b, c);
        float m = S(0.13, 0.01, d);
        float d2 =  length(a - b);
        m *= S(1.2, 0.8, d2) * 0.25 + S(0.05, 0.03, abs(d2 - 0.75));
        return m;
    }
    
    float N21(vec2 p){
        p = fract(p * vec2(233.34, 851.73));
        p += dot(p, p + 23.45);
        return fract(p.x * p.y);
    }
    
    vec2 N22(vec2 p){
        float n = N21(p);
        return vec2(n, N21(p + n));
    }
    
    vec2 getPos(vec2 id, vec2 offset){
        vec2 n = N22(id + offset) * iTime;
        return offset + sin(n) * 0.4;
    }
    
    float layer(vec2 uv){
        vec2 gv = fract(uv) - 0.5;
        vec2 id = floor(uv);
    
        vec2 p[9];
        int i = 0;
        for(float y = -1.0; y <= 1.0; y++){
            for(float x = -1.0; x <= 1.0; x++){
                p[i++] = getPos(id, vec2(x, y));
            }    
        }
        
        
        float t = iTime * 10.0;
        float m = 0.0;
        for(int i = 0; i < 9; i++){
            m += line(gv, p[4], p[i]);
            
            vec2 j = (p[i] - gv) * 20.0;
            
            for(int yi= i + 1; yi < 9; yi++){
                for(int zi= yi + 1; zi < 9; zi++){
                    
                    float len1 = abs(length(p[i] - p[yi]));
                    float len2 = abs(length(p[yi] - p[zi]));
                    float len3 = abs(length(p[i] - p[zi]));
                    
                    if((len1 + len2 + len3) < 2.8){
                        m += triangle(gv, p[i], p[yi], p[zi]) * 0.8;
                    }
                }
            }
        }
        m += line(gv, p[1], p[3]);
        m += line(gv, p[1], p[5]);
        m += line(gv, p[7], p[3]);
        m += line(gv, p[7], p[5]);
    
        return m;
    }
    
    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
        vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
        
        float m = 0.0;
        float t = iTime * 0.02;
        
        float gradient = min(-uv.y,uv.y) * 0.25;
        
        float s = sin(t);
        float c = cos(t);
        mat2 rot = mat2(c, -s, s, c);
        uv *= rot;
        
        for(float i = 0.0; i < 1.0; i += 1.0 / 4.0){
            float z = fract(i + t);
            float size = mix(10.0, 0.5, z);
            float fade = S(0.0, 0.5, z) * S(1.0, 0.8, z);
            
            m += layer(uv * size + i * 10.0) * fade* 0.35;
        }
        
        
        vec3 base = vec3(0.845, 0.156, 0.167) * 0.8 + 0.6;
        vec3 gradc = vec3(0.045, 0.056, 0.967) * 0.8 + 0.6;
        vec3 col = m * base;
        
        col -= gradient * gradc;
        
        fragColor = vec4(col,1.0);
    }`
}
