export function chartGeometry(values: number[]) {
  const data = values.map(n=>Number.isFinite(n)?n:0);
  const min = Math.min(0,...data), max = Math.max(1,...data);
  const points = data.map((n,i)=>({x:data.length===1?341:62+i*558/(data.length-1),y:20+(max-n)/(max-min)*171}));
  const path = points.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ');
  const zeroY = 20+max/(max-min)*171;
  const area = points.length ? `${path} L ${points[points.length-1].x} ${zeroY} L ${points[0].x} ${zeroY} Z` : '';
  return {points,path,area,min,max};
}
