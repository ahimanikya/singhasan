/* Shared gesture decisions; kept independent of rendering and page content. */
export const clampTurn=value=>Math.max(0,Math.min(1,Number(value)||0));
export function turnAngle(direction,progress){return (direction>0?-180:180)*clampTurn(progress)}
export function completesTurn(progress,velocity=0){return clampTurn(progress)>=.3||(progress>=.06&&velocity>.45)}
export function settleDuration(progress,complete){return Math.max(110,Math.round(340*Math.abs((complete?1:0)-clampTurn(progress))))}
