/** Historical naming systems remain independent; do not remap card numbers across decks. */
export const DECKS = {
  thoth: { label: '托特 Thoth', short: '托特', accent: '#8d70c8', reverseMeaningDefault: false, majors: [
    ['愚者','The Fool'],['魔術師','The Magus'],['女祭司','The Priestess'],['皇后','The Empress'],['皇帝','The Emperor'],['教皇','The Hierophant'],['戀人','The Lovers'],['戰車','The Chariot'],['調整','Adjustment'],['隱者','The Hermit'],['命運之輪','Fortune'],['慾望','Lust'],['倒吊人','The Hanged Man'],['死亡','Death'],['藝術','Art'],['惡魔','The Devil'],['高塔','The Tower'],['星星','The Star'],['月亮','The Moon'],['太陽','The Sun'],['永劫','The Aeon'],['宇宙','The Universe']
  ], courts: [['knight','騎士','Knight'],['queen','皇后','Queen'],['prince','王子','Prince'],['princess','公主','Princess']] },
  rws: { label: '偉特 Rider–Waite–Smith', short: '偉特', accent: '#d0a057', reverseMeaningDefault: true, majors: [
    ['愚者','The Fool'],['魔術師','The Magician'],['女祭司','The High Priestess'],['皇后','The Empress'],['皇帝','The Emperor'],['教皇','The Hierophant'],['戀人','The Lovers'],['戰車','The Chariot'],['力量','Strength'],['隱者','The Hermit'],['命運之輪','Wheel of Fortune'],['正義','Justice'],['倒吊人','The Hanged Man'],['死神','Death'],['節制','Temperance'],['惡魔','The Devil'],['高塔','The Tower'],['星星','The Star'],['月亮','The Moon'],['太陽','The Sun'],['審判','Judgement'],['世界','The World']
  ], courts: [['king','國王','King'],['queen','皇后','Queen'],['knight','騎士','Knight'],['page','侍者','Page']] },
  marseille: { label: '馬賽 Tarot de Marseille', short: '馬賽', accent: '#69b2ad', reverseMeaningDefault: false, majors: [
    ['愚者','Le Mat'],['魔術師','Le Bateleur'],['女祭司','La Papesse'],['皇后','L’Imperatrice'],['皇帝','L’Empereur'],['教皇','Le Pape'],['戀人','L’Amoureux'],['戰車','Le Chariot'],['正義','La Justice'],['隱者','L’Hermite'],['命運之輪','La Roue de Fortune'],['力量','La Force'],['倒吊人','Le Pendu'],['無名牌（死神）','Arcane sans nom'],['節制','Tempérance'],['惡魔','Le Diable'],['高塔','La Maison Dieu'],['星星','L’Étoile'],['月亮','La Lune'],['太陽','Le Soleil'],['審判','Le Jugement'],['世界','Le Monde']
  ], courts: [['king','國王','Roi'],['queen','皇后','Reine'],['knight','騎士','Cavalier'],['page','侍者','Valet']] }
};

export const SUITS = {
  wands: {zh:'權杖',thoth:'Wands',rws:'Wands',marseille:'Bâtons',symbol:'♨',color:'#b06b42'},
  cups: {zh:'聖杯',thoth:'Cups',rws:'Cups',marseille:'Coupes',symbol:'◡',color:'#5284a6'},
  swords: {zh:'寶劍',thoth:'Swords',rws:'Swords',marseille:'Épées',symbol:'⚔',color:'#7785a2'},
  disks: {zh:'圓盤',thoth:'Disks',rws:'Pentacles',marseille:'Deniers',symbol:'✥',color:'#9d9550'}
};

const THOTH_PIPS = {
  wands: ['Dominion','Virtue','Completion','Strife','Victory','Valour','Swiftness','Strength','Oppression'],
  cups: ['Love','Abundance','Luxury','Disappointment','Pleasure','Debauch','Indolence','Happiness','Satiety'],
  swords: ['Peace','Sorrow','Truce','Defeat','Science','Futility','Interference','Cruelty','Ruin'],
  disks: ['Change','Works','Power','Worry','Success','Failure','Prudence','Gain','Wealth']
};
const THOTH_PIPS_ZH = {
  wands: ['統御','德性','完成','鬥爭','勝利','勇氣','迅捷','力量','壓迫'],
  cups: ['愛','豐盛','奢華','失望','喜悅','沉溺','怠惰','幸福','飽足'],
  swords: ['和平','悲傷','停戰','失敗','科學','徒勞','干擾','殘酷','毀滅'],
  disks: ['變化','工作','力量','擔憂','成功','失敗','謹慎','收穫','財富']
};
// Thoth numerical minor attributions (standard Golden Dawn decans).
const DECANS = {
  wands: ['火星·牡羊','太陽·牡羊','金星·牡羊','土星·獅子','木星·獅子','火星·獅子','水星·射手','太陽·射手','土星·射手'],
  cups: ['金星·巨蟹','水星·巨蟹','月亮·巨蟹','火星·天蠍','太陽·天蠍','金星·天蠍','土星·雙魚','木星·雙魚','火星·雙魚'],
  swords: ['月亮·天秤','土星·天秤','木星·天秤','金星·水瓶','水星·水瓶','月亮·水瓶','木星·雙子','火星·雙子','太陽·雙子'],
  disks: ['木星·摩羯','火星·摩羯','太陽·摩羯','水星·金牛','月亮·金牛','土星·金牛','太陽·處女','金星·處女','水星·處女']
};
const NUMBER_ZH = ['','一','二','三','四','五','六','七','八','九','十'];

export function deckCardIds() {
  const ids = [];
  for (let n=0;n<22;n++) ids.push(`major-${n}`);
  for (const suit of Object.keys(SUITS)) {
    for (let n=1;n<=10;n++) ids.push(`${suit}-${n}`);
    for (const court of ['a','b','c','d']) ids.push(`${suit}-${court}`);
  }
  return ids;
}

export function cardInfo(deckId, cardId) {
  const deck=DECKS[deckId];
  if (!deck) throw Error('Unknown deck');
  if (cardId.startsWith('major-')) {
    const n=Number(cardId.slice(6));
    const [zh,en]=deck.majors[n];
    return {id:cardId,zh,en,num:n,suit:null,kind:'major',symbol:'✦',subtitle:`大阿爾克那 · ${n===0 ? '0' : String(n).padStart(2,'0')}`};
  }
  const [suit,rank]=cardId.split('-');
  const suitObj=SUITS[suit];
  const num=Number(rank);
  const suitZH=(suit==='disks' && deckId!=='thoth')?'錢幣':suitObj.zh;
  if (Number.isInteger(num) && num>=1 && num<=10) {
    let zh=`${suitZH}${NUMBER_ZH[num]}`;
    let en=`${num===1?'Ace':num} of ${suitObj[deckId]}`;
    let subtitle='小阿爾克那';
    if (deckId==='thoth') {
      if (num>1) {
        zh+=` · ${THOTH_PIPS_ZH[suit][num-2]}`;
        en+=` · ${THOTH_PIPS[suit][num-2]}`;
        subtitle=DECANS[suit][num-2];
      }
    }
    return {id:cardId,zh,en,num,suit,kind:'pip',symbol:suitObj.symbol,subtitle};
  }
  const index={a:0,b:1,c:2,d:3}[rank];
  const [,courtZH,courtEN]=deck.courts[index];
  return {id:cardId,zh:`${suitZH}${courtZH}`,en:`${courtEN} of ${suitObj[deckId]}`,num:index,suit,kind:'court',symbol:suitObj.symbol,subtitle:'宮廷牌'};
}
