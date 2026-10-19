import {deckCardIds} from './decks.js';

/** Uniform, rejection-sampled bounded random integer from Web Crypto. */
export function randomInt(max) {
  if (!Number.isInteger(max)||max<1||max>0xffffffff) throw new Error('Invalid maximum');
  const bucket=Math.floor(0x100000000/max)*max;
  const word=new Uint32Array(1);
  do {crypto.getRandomValues(word);} while(word[0]>=bucket);
  return word[0]%max;
}
function fisherYates(array){
  for(let i=array.length-1;i>0;i--){const j=randomInt(i+1);[array[i],array[j]]=[array[j],array[i]];}
  return array;
}
function riffle(cards){
  if(cards.length<3) return cards;
  const mid=Math.round(cards.length/2);
  const split=Math.max(1,Math.min(cards.length-1,mid+randomInt(Math.min(19,cards.length))-Math.floor(Math.min(19,cards.length)/2)));
  const left=cards.slice(0,split),right=cards.slice(split),out=[];
  while(left.length||right.length){
    const pickLeft=left.length && (!right.length||randomInt(left.length+right.length)<left.length);
    const src=pickLeft?left:right;
    const n=Math.min(src.length,1+randomInt(Math.min(4,src.length)));
    for(let i=0;i<n;i++) out.push(src.shift());
  }
  return out;
}
function overhand(cards){
  const output=[],from=cards.slice();
  while(from.length){
    const n=Math.min(from.length,1+randomInt(Math.min(9,from.length)));
    output.unshift(...from.splice(0,n));
  }
  return output;
}
function rotatePackets(cards){
  if(!cards.length) return cards;
  // Rotate one or more packets 180 degrees in the plane of the table:
  // card faces remain down; upright/reversed orientation toggles in each packet.
  const count=3+randomInt(6);
  for(let k=0;k<count;k++){
    const start=randomInt(cards.length);
    const len=Math.min(cards.length-start,3+randomInt(Math.min(23,cards.length-start)));
    for(let i=start;i<start+len;i++)cards[i].reversed=!cards[i].reversed;
  }
  return cards;
}
function cut(cards){
  if(cards.length<2) return cards;
  const at=1+randomInt(cards.length-1);
  return [...cards.slice(at),...cards.slice(0,at)];
}

/** Fair initial distribution + physical-style interleaving, packet rotation and cut. */
export function shuffleWholeDeck(){
  let stack=fisherYates(deckCardIds().map(id=>({id,reversed:false})));
  rotatePackets(stack);
  for(let i=0;i<7;i++)stack=riffle(stack);
  stack=overhand(stack);
  stack=riffle(stack);
  stack=cut(stack);
  const bottom=stack.pop();
  return {remaining:stack,bottom,main:[],shuffles:[{at:new Date().toISOString(),mode:'whole',count:78}]};
}
/** Clarifier reshuffle: previously drawn cards and original bottom remain reserved. */
export function reshuffleRemaining(deck){
  let remaining=deck.remaining.slice();
  if(!remaining.length) throw new Error('剩餘牌已抽完');
  remaining=fisherYates(remaining);
  rotatePackets(remaining);
  for(let i=0;i<5;i++)remaining=riffle(remaining);
  remaining=overhand(remaining);
  remaining=cut(remaining);
  deck.remaining=remaining;
  deck.shuffles.push({at:new Date().toISOString(),mode:'clarifier',count:remaining.length});
}
export function drawNext(deck){
  if(!deck.remaining.length)throw new Error('剩餘牌已抽完');
  return deck.remaining.shift();
}
