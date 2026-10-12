// Shared metre coordinates: only X changes; Z and furniture sizes stay unchanged.
export const X_SCALE=.855, X_PIVOT=3.05;
export const scaleX=x=>X_PIVOT+(x-X_PIVOT)*X_SCALE;
export const kitchenStart=scaleX(3.115),kitchenEnd=scaleX(5.765);
export const entryZero=scaleX(2.985)-3.80;
export const entryX=cm=>entryZero+cm/100;
export const sinkX=kitchenEnd-.04-.65-.32-.36;
export const stoveX=kitchenEnd-.04-.325;
export const furnitureShift={
  tv:scaleX(.005)-.005,
  sofa:scaleX(3.28)-3.28,
  mainBed:scaleX(6.395)-6.395,
  childBed:scaleX(5.12)-5.12,
  basin:scaleX(4.45)-4.45,
  toilet:scaleX(6.395)-6.395,
  washer:scaleX(6.505)-6.505
};
export const pointXZ=p=>[scaleX(p[0]),p[1]];
export const furnitureXZ=(kind,p)=>[p[0]+(furnitureShift[kind]||0),p[1]];
export const furnitureXYZ=(kind,p)=>[p[0]+(furnitureShift[kind]||0),p[1],p[2]];

