(function(){
  function shuffle(arr){
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function uniq(arr){ return [...new Set(arr.filter(Boolean).map(v => String(v).trim()).filter(Boolean))]; }
  function pickDistinct(arr, count, exclude){
    const avoid = new Set((exclude || []).map(v => String(v)));
    const source = uniq(arr).filter(v => !avoid.has(String(v)));
    return shuffle(source).slice(0, count);
  }
  function buildOptions(correct, distractors, size){
    const options = [String(correct)].concat(pickDistinct(distractors, Math.max(0, (size || 4) - 1), [correct]));
    return shuffle(uniq(options)).slice(0, size || 4);
  }

  const byStage = { starter: [], explorer: [], champion: [] };
  const seen = new Set();
  let idCounter = 1;
  function add(stage, q){
    if (!q || !q.text) return;
    const text = String(q.text).trim();
    if (!text || seen.has(text.toLowerCase())) return;
    const options = uniq(Array.isArray(q.options) ? q.options : []);
    const answer = String(q.answer || '').trim();
    if (!answer || options.length < 2 || !options.includes(answer)) return;
    const entry = {
      id: `ptq-${idCounter++}`,
      text,
      options: shuffle(options).slice(0, Math.max(2, options.length)),
      answer,
      difficulty: Number(q.difficulty || 1) || 1,
      skill: String(q.skill || 'Mixed').trim(),
      stage
    };
    seen.add(text.toLowerCase());
    byStage[stage].push(entry);
  }

  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const vowels = ['a','e','i','o','u'];
  const colors = ['red','blue','green','yellow','purple','orange','pink','brown','black','white','gray','gold'];
  const shapes = ['circle','square','triangle','rectangle','star','heart','oval','diamond'];
  const animals = ['cat','dog','lion','tiger','rabbit','monkey','zebra','elephant','bear','hippo','giraffe','panda','horse','sheep','goat','camel','dolphin','whale','shark','eagle'];
  const fruits = ['apple','banana','orange','grapes','mango','pear','peach','lemon','melon','plum','strawberry','pineapple'];
  const foods = ['bread','rice','cheese','milk','egg','fish','chicken','soup','salad','pizza'];
  const school = ['book','pencil','eraser','ruler','bag','desk','teacher','school','board','notebook'];
  const body = ['hand','foot','eye','ear','nose','mouth','arm','leg','head','shoulder'];
  const nature = ['sun','moon','star','cloud','rain','wind','tree','flower','river','mountain'];
  const jobs = ['doctor','teacher','pilot','chef','farmer','driver','artist','nurse'];
  const places = ['school','park','home','library','zoo','farm','beach','garden','market','museum'];
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const verbs = ['run','jump','read','write','sing','dance','swim','play','open','close','laugh','help','clean','paint','draw'];
  const adjectives = ['happy','sad','fast','slow','big','small','kind','brave','quiet','loud','cold','hot'];
  const antonyms = [['big','small'],['hot','cold'],['happy','sad'],['up','down'],['day','night'],['fast','slow'],['clean','dirty'],['full','empty'],['open','close'],['tall','short']];
  const synonyms = [['smart','clever'],['begin','start'],['tiny','small'],['silent','quiet'],['glad','happy'],['rapid','fast']];
  const pronouns = [['Ali','he'],['Mona','she'],['the children','they'],['my brother and I','we'],['the cat','it']];
  const irregularPast = [['go','went'],['see','saw'],['eat','ate'],['come','came'],['run','ran'],['drink','drank'],['sing','sang'],['write','wrote']];
  const pluralPairs = [['child','children'],['man','men'],['woman','women'],['mouse','mice'],['tooth','teeth'],['foot','feet'],['book','books'],['apple','apples'],['leaf','leaves'],['baby','babies']];
  const prefixes = [['un','happy','unhappy'],['re','write','rewrite'],['pre','heat','preheat'],['mis','place','misplace']];
  const suffixes = [['care','ful','careful'],['hope','less','hopeless'],['quick','ly','quickly'],['child','hood','childhood']];

  colors.forEach((color) => {
    add('starter', { text:'Which word is a color?', options:buildOptions(color, animals.concat(fruits, shapes, school), 4), answer:color, skill:'Vocabulary', difficulty:1 });
    add('starter', { text:`Complete the sentence: The balloon is ${color}.`, options:buildOptions(color, colors, 4), answer:color, skill:'Grammar', difficulty:1 });
    add('starter', { text:`How many letters are in ${color}?`, options:buildOptions(String(color.length), ['3','4','5','6','7','8'], 4), answer:String(color.length), skill:'Spelling', difficulty:1 });
  });
  shapes.forEach((shape) => {
    add('starter', { text:'Which word is a shape?', options:buildOptions(shape, colors.concat(animals, fruits, school), 4), answer:shape, skill:'Vocabulary', difficulty:1 });
    add('starter', { text:`Choose the first letter of ${shape}.`, options:buildOptions(shape[0], letters, 4), answer:shape[0], skill:'Phonics', difficulty:1 });
  });
  animals.forEach((animal) => {
    add('starter', { text:'Which one is an animal?', options:buildOptions(animal, fruits.concat(colors, places, shapes), 4), answer:animal, skill:'Vocabulary', difficulty:1 });
    add('starter', { text:`Choose the first letter of ${animal}.`, options:buildOptions(animal[0], letters, 4), answer:animal[0], skill:'Phonics', difficulty:1 });
    add('starter', { text:`How many letters are in the word ${animal}?`, options:buildOptions(String(animal.length), ['3','4','5','6','7','8','9'], 4), answer:String(animal.length), skill:'Spelling', difficulty:1 });
  });
  fruits.forEach((fruit) => {
    add('starter', { text:'Which one is a fruit?', options:buildOptions(fruit, animals.concat(colors, school, body), 4), answer:fruit, skill:'Vocabulary', difficulty:1 });
    add('starter', { text:`Choose the missing first letter: _${fruit.slice(1)}`, options:buildOptions(fruit[0], letters, 4), answer:fruit[0], skill:'Spelling', difficulty:1 });
  });
  school.concat(body, nature).forEach((word) => {
    add('starter', { text:`Choose the word ${word}.`, options:buildOptions(word, animals.concat(fruits, colors, shapes), 4), answer:word, skill:'Reading', difficulty:1 });
  });
  letters.forEach((letter, idx) => {
    add('starter', { text:`Which letter comes after ${letter.toUpperCase()}?`, options:buildOptions(letters[(idx+1)%letters.length].toUpperCase(), letters.map(l=>l.toUpperCase()), 4), answer:letters[(idx+1)%letters.length].toUpperCase(), skill:'Phonics', difficulty:1 });
    add('starter', { text:`Which letter is a vowel?`, options:buildOptions(vowels[idx%vowels.length].toUpperCase(), letters.map(l=>l.toUpperCase()), 4), answer:vowels[idx%vowels.length].toUpperCase(), skill:'Phonics', difficulty:1 });
  });
  antonyms.forEach(([a,b]) => {
    add('starter', { text:`What is the opposite of ${a}?`, options:buildOptions(b, antonyms.flat(), 4), answer:b, skill:'Vocabulary', difficulty:1 });
    add('starter', { text:`What is the opposite of ${b}?`, options:buildOptions(a, antonyms.flat(), 4), answer:a, skill:'Vocabulary', difficulty:1 });
  });
  pronouns.forEach(([noun, pronoun]) => {
    add('starter', { text:`Choose the correct pronoun for ${noun}.`, options:buildOptions(pronoun, ['he','she','they','we','it'], 4), answer:pronoun, skill:'Grammar', difficulty:1 });
  });
  for (let a = 1; a <= 25; a += 1) {
    for (let b = 1; b <= 10; b += 1) {
      add('starter', { text:`${a} + ${b} = ?`, options:buildOptions(String(a+b), [String(a+b+1),String(a+b-1),String(a+b+2),String(a+b-2)], 4), answer:String(a+b), skill:'Math', difficulty:1 });
    }
  }
  for (let a = 5; a <= 35; a += 1) {
    for (let b = 1; b <= Math.min(10, a-1); b += 1) {
      add('starter', { text:`${a} - ${b} = ?`, options:buildOptions(String(a-b), [String(a-b+1),String(a-b-1),String(a-b+2),String(a-b-2)], 4), answer:String(a-b), skill:'Math', difficulty:1 });
    }
  }
  for (let n = 1; n <= 90; n += 1) {
    add('starter', { text:`What number comes after ${n}?`, options:buildOptions(String(n+1), [String(n+2),String(Math.max(0,n-1)),String(n+3),String(n+4)], 4), answer:String(n+1), skill:'Math', difficulty:1 });
    if (n > 1) add('starter', { text:`What number comes before ${n}?`, options:buildOptions(String(n-1), [String(Math.max(0,n-2)),String(n+1),String(n+2),String(n+3)], 4), answer:String(n-1), skill:'Math', difficulty:1 });
  }
  [
    ['A baby cat is called a ___.','kitten',['puppy','cub','duck']],
    ['We wear shoes on our ___.','feet',['hands','eyes','ears']],
    ['The sun rises in the ___.','morning',['night','box','shoe']],
    ['An author writes a ___.','book',['banana','window','shirt']],
    ['We use a pencil to ___.','write',['eat','sleep','jump']],
    ['The teacher works in a ___.','school',['car','tree','apple']],
    ['Milk comes from a ___.','cow',['bird','bus','chair']],
    ['We brush our ___.','teeth',['knees','elbows','hats']],
    ['A fish lives in the ___.','water',['desert','classroom','forest']],
    ['A bird can ___.','fly',['drive','cook','sweep']]
  ].forEach(([text, answer, wrong]) => add('starter', { text, options:buildOptions(answer, wrong, 4), answer, skill:'Reading', difficulty:1 }));

  pluralPairs.forEach(([single, plural]) => {
    add('explorer', { text:`Choose the plural of ${single}.`, options:buildOptions(plural, pluralPairs.flat(), 4), answer:plural, skill:'Grammar', difficulty:2 });
    add('explorer', { text:`Choose the singular form of ${plural}.`, options:buildOptions(single, pluralPairs.flat(), 4), answer:single, skill:'Grammar', difficulty:2 });
  });
  irregularPast.forEach(([base, past]) => {
    add('explorer', { text:`Choose the past tense of ${base}.`, options:buildOptions(past, irregularPast.flat(), 4), answer:past, skill:'Grammar', difficulty:2 });
    add('explorer', { text:`Yesterday I ${past}. Which base verb fits?`, options:buildOptions(base, irregularPast.map(v => v[0]), 4), answer:base, skill:'Grammar', difficulty:2 });
  });
  synonyms.forEach(([word, same]) => add('explorer', { text:`Which word has the same meaning as ${word}?`, options:buildOptions(same, synonyms.flat(), 4), answer:same, skill:'Vocabulary', difficulty:2 }));
  adjectives.forEach((adj) => add('explorer', { text:'Choose the adjective in this list.', options:buildOptions(adj, verbs.concat(animals, school), 4), answer:adj, skill:'Grammar', difficulty:2 }));
  jobs.forEach((job) => add('explorer', { text:'Which job helps people every day?', options:buildOptions(job, animals.concat(fruits, nature), 4), answer:job, skill:'Reading', difficulty:2 }));
  days.forEach((day, i) => { if (i < days.length - 1) add('explorer', { text:`What day comes after ${day}?`, options:buildOptions(days[i+1], days, 4), answer:days[i+1], skill:'General Knowledge', difficulty:2 }); });
  months.forEach((month, i) => { if (i < months.length - 1) add('explorer', { text:`What month comes after ${month}?`, options:buildOptions(months[i+1], months, 4), answer:months[i+1], skill:'General Knowledge', difficulty:2 }); });
  for (let a = 2; a <= 12; a += 1) {
    for (let b = 2; b <= 12; b += 1) {
      add('explorer', { text:`${a} × ${b} = ?`, options:buildOptions(String(a*b), [String(a*b+a),String(a*b-b),String(a*b+2),String(a*b-2)], 4), answer:String(a*b), skill:'Math', difficulty:2 });
    }
  }
  for (let dividend = 4; dividend <= 144; dividend += 2) {
    for (let divisor = 2; divisor <= 12; divisor += 1) {
      if (dividend % divisor !== 0) continue;
      add('explorer', { text:`${dividend} ÷ ${divisor} = ?`, options:buildOptions(String(dividend/divisor), [String(dividend/divisor+1),String(dividend/divisor-1),String(dividend/divisor+2),String(dividend/divisor-2)], 4), answer:String(dividend/divisor), skill:'Math', difficulty:2 });
    }
  }
  for (let n = 10; n <= 300; n += 10) {
    add('explorer', { text:`What is half of ${n}?`, options:buildOptions(String(n/2), [String(n/2+5),String(n/2-5),String(n/4),String(n)], 4), answer:String(n/2), skill:'Math', difficulty:2 });
    add('explorer', { text:`What is double ${n/10}?`, options:buildOptions(String((n/10)*2), [String((n/10)*3),String((n/10)+2),String((n/10)-1),String((n/10)+1)], 4), answer:String((n/10)*2), skill:'Math', difficulty:2 });
  }
  [
    ['Choose the correct sentence.','She goes to school every day.',['She go to school every day.','She going to school every day.','She gone to school every day.']],
    ['Choose the correct sentence.','They are reading books.',['They is reading books.','They reading book.','They reads books.']],
    ['Which sentence uses the correct punctuation?','Where are you going?',['where are you going','Where are you going','where are you going.']],
    ['Read and choose: Sara lost her pencil, so she asked her friend for help. What happened first?','Sara lost her pencil.',['Her friend went home.','Sara ate lunch.','They visited the zoo.']],
    ['Which sentence shows good manners?','May I come in, please?',['Give me the book!','I want water now.','Move away.']],
    ['Choose the best ending: The children went to the park because...','they wanted to play.',['the moon was sleeping.','books can fly.','a fish drove a car.']],
    ['If a story says the sky turned dark and thunder began, what weather is coming?','a storm',['a rainbow party','a snowman contest','a football game']],
    ['A farmer grows vegetables on a ___.','farm',['bridge','airport','factory']]
  ].forEach(([text, answer, wrong]) => add('explorer', { text, options:buildOptions(answer, wrong, 4), answer, skill:'Reading', difficulty:2 }));

  prefixes.forEach(([pre, root, word]) => add('champion', { text:`Which word is formed by adding the prefix ${pre}- to ${root}?`, options:buildOptions(word, prefixes.map(v => v[2]).concat([root, pre+root+'e']), 4), answer:word, skill:'Vocabulary', difficulty:3 }));
  suffixes.forEach(([root, suf, word]) => add('champion', { text:`Which word is formed by adding the suffix -${suf} to ${root}?`, options:buildOptions(word, suffixes.map(v => v[2]).concat([root, root+suf+suf]), 4), answer:word, skill:'Vocabulary', difficulty:3 }));
  [['tall','taller'],['small','smaller'],['happy','happier'],['easy','easier'],['fast','faster'],['strong','stronger']].forEach(([base, comp]) => add('champion', { text:`Choose the comparative form of ${base}.`, options:buildOptions(comp, [base, comp+'er', comp+'est', base+'est'], 4), answer:comp, skill:'Grammar', difficulty:3 }));
  [
    ['I stayed home ___ it was raining.','because',['and','but','so']],
    ['She is tired, ___ she finished her homework.','but',['because','so','or']],
    ['Take an umbrella, ___ it might rain.','because',['and','or','but']],
    ['We can read a book ___ play a game.','or',['because','but','so']]
  ].forEach(([text, answer, wrong]) => add('champion', { text, options:buildOptions(answer, wrong, 4), answer, skill:'Grammar', difficulty:3 }));
  [
    ['Which word best describes a person who always tells the truth?','honest',['hungry','sleepy','noisy']],
    ['What can we infer from this sentence: Omar packed a towel, sunscreen, and goggles. Where is he going?','the beach',['the library','the mountain','the market']],
    ['If a paragraph says the road was slippery and the driver slowed down, what was the weather most likely like?','rainy',['sunny','windless','dry']],
    ['Which sentence is written in the passive voice?','The cake was baked by Lina.',['Lina baked the cake.','Lina is baking the cake.','Bake the cake, Lina.']],
    ['Choose the best summary of a story about teamwork helping a class win a science fair.','Working together helped the class succeed.',['The fair was cancelled.','Science is too difficult.','Only one student did all the work.']],
    ['What does the prefix re- mean in the word rewrite?','again',['before','without','wrongly']],
    ['Which sentence contains a simile?','The baby slept like a log.',['The baby slept quietly.','The baby was asleep.','The baby yawned twice.']]
  ].forEach(([text, answer, wrong]) => add('champion', { text, options:buildOptions(answer, wrong, 4), answer, skill:'Reading', difficulty:3 }));
  for (let a = 11; a <= 30; a += 1) {
    for (let b = 11; b <= 30; b += 1) {
      add('champion', { text:`${a} + ${b} = ?`, options:buildOptions(String(a+b), [String(a+b+1),String(a+b-1),String(a+b+10),String(a+b-10)], 4), answer:String(a+b), skill:'Math', difficulty:3 });
      if (a > b) add('champion', { text:`${a} - ${b} = ?`, options:buildOptions(String(a-b), [String(a-b+1),String(a-b-1),String(a-b+2),String(a-b-2)], 4), answer:String(a-b), skill:'Math', difficulty:3 });
    }
  }
  for (let a = 12; a <= 25; a += 1) {
    for (let b = 12; b <= 25; b += 1) {
      add('champion', { text:`${a} × ${b} = ?`, options:buildOptions(String(a*b), [String(a*b+a),String(a*b+b),String(a*b-10),String(a*b+10)], 4), answer:String(a*b), skill:'Math', difficulty:3 });
    }
  }
  for (let n = 2; n <= 50; n += 2) add('champion', { text:`What is 25% of ${n * 4}?`, options:buildOptions(String(n), [String(n+1),String(n-1),String(n+2),String(n*2)], 4), answer:String(n), skill:'Math', difficulty:3 });
  for (let n = 10; n <= 90; n += 10) add('champion', { text:`Which decimal is equal to ${n}%?`, options:buildOptions((n/100).toFixed(1), ['0.1','0.2','0.3','0.4','0.5','0.6','0.7','0.8','0.9'], 4), answer:(n/100).toFixed(1), skill:'Math', difficulty:3 });
  [
    ['What comes next: 3, 6, 9, 12, __','15',['13','14','16']],
    ['What comes next: 2, 4, 8, 16, __','32',['18','24','30']],
    ['Which number is the odd one out?','27',['18','36','42']],
    ['If all squares are shapes and all shapes are figures, what is true?','All squares are figures.',['All figures are squares.','No squares are figures.','Shapes are never figures.']],
    ['Which word does not belong?','banana',['apple','pear','grape']],
    ['A clock shows 3:00. What time will it show in 45 minutes?','3:45',['3:30','4:15','4:45']]
  ].forEach(([text, answer, wrong]) => add('champion', { text, options:buildOptions(answer, wrong, 4), answer, skill:'Logic', difficulty:3 }));

  function stagePoolFor(stage){
    if (stage === 'starter') return byStage.starter.slice();
    if (stage === 'explorer') return byStage.starter.concat(byStage.explorer);
    return byStage.starter.concat(byStage.explorer, byStage.champion);
  }

  window.PlayQuestionBank = {
    byStage,
    stats: {
      starter: byStage.starter.length,
      explorer: byStage.explorer.length,
      champion: byStage.champion.length,
      total: byStage.starter.length + byStage.explorer.length + byStage.champion.length
    },
    createMixedQuiz(count, stage, usedIds){
      const used = new Set(Array.isArray(usedIds) ? usedIds : []);
      const pool = shuffle(stagePoolFor(stage)).filter(q => !used.has(q.id));
      const target = Math.max(30, Math.min(count || 200, pool.length));
      return pool.slice(0, target).map(q => ({ ...q, options: shuffle(q.options) }));
    }
  };
})();
