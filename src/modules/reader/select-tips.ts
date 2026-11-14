/** Two distinct tips, shuffled once per opening rather than on each render. */
export function selectTips(pool: readonly string[], random:()=>number=Math.random):string[]{const items=[...new Set(pool)];for(let i=items.length-1;i>0;i--){const j=Math.min(i,Math.floor(random()*(i+1)));[items[i],items[j]]=[items[j],items[i]];}return items.slice(0,2);}
