// Shared metre coordinates: only X changes; Z and furniture sizes stay unchanged.
export const X_SCALE=0.9988274809160306, X_PIVOT=3.05;
export const scaleX=x=>X_PIVOT+(x-X_PIVOT)*X_SCALE;
export const kitchenStart=scaleX(3.115),kitchenEnd=scaleX(5.765);
export const entryZero=scaleX(2.985)-3.80;
export const entryX=cm=>entryZero+cm/100;
export const sinkX=kitchenEnd-.04-.65-.32-.36;
export const stoveX=kitchenEnd-.04-.325;
// Washer centered between balcony inner wall faces, 2 cm clear of its rear wall.
export const washerPosition={x:(scaleX(5.895)+scaleX(7.18+.54/X_SCALE-.065))/2,z:6.60};
export const furnitureShift={
  tv:scaleX(.005)-.005,
  sofa:scaleX(3.28)-3.28,
  dining:-0.183671755725191,
  island:-.07,
  mainBed:scaleX(6.395)-6.395,
  childBed:scaleX(5.12)-5.12,
  basin:scaleX(4.45)-4.45,
  toilet:scaleX(6.395)-6.395,
  washer:scaleX(6.505)-6.505
};
export const pointXZ=p=>[scaleX(p[0]),p[1]];
export const furnitureXZ=(kind,p)=>[p[0]+(furnitureShift[kind]||0),p[1]];
export const furnitureXYZ=(kind,p)=>[p[0]+(furnitureShift[kind]||0),p[1],p[2]];

