import assert from 'node:assert/strict';
import {deckCardIds,cardInfo,DECKS} from './decks.js';
import {shuffleWholeDeck,reshuffleRemaining,drawNext} from './shuffle.js';
const ids=deckCardIds();
assert.equal(ids.length,78);
assert.equal(new Set(ids).size,78);
for(const name of Object.keys(DECKS)){
 for(const id of ids){const info=cardInfo(name,id);assert.ok(info.zh);assert.ok(info.en);}
}
assert.ok(cardInfo('rws','disks-d').zh.startsWith('錢幣'));
assert.ok(cardInfo('thoth','disks-d').zh.startsWith('圓盤'));
assert.equal(cardInfo('thoth','major-8').en,'Adjustment');
assert.equal(cardInfo('rws','major-8').en,'Strength');
assert.equal(cardInfo('marseille','major-8').en,'La Justice');
let reverses=0;
for(let t=0;t<250;t++){
 const deck=shuffleWholeDeck();
 const bottom=structuredClone(deck.bottom);
 assert.equal(deck.remaining.length,77);
 const seen=new Set([bottom.id]);
 for(let i=0;i<6;i++){
  const card=drawNext(deck);
  assert.ok(!seen.has(card.id));seen.add(card.id);
  reverses+=Number(card.reversed);
 }
 const mainCards=new Set(seen);
 for(let n=0;n<7;n++){
  reshuffleRemaining(deck);
  const card=drawNext(deck);
  assert.ok(!seen.has(card.id));seen.add(card.id);
  assert.deepEqual(deck.bottom,bottom);
  assert.equal(seen.size,8+n);
 }
 for(const card of deck.remaining){assert.ok(!seen.has(card.id));seen.add(card.id);}
 assert.equal(seen.size,78);
 assert.equal(deck.shuffles.length,8);
 for(const card of deck.remaining)reverses+=Number(card.reversed);
}
assert.ok(reverses>100 && reverses<20000);
console.log('通過：三系統各78張、正確命名／編號、牌堆唯一性、底牌固定、補牌重洗、正逆方向。');
