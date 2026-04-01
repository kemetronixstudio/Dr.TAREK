(function(){
  function shuffle(arr){
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function sample(arr, n){ return shuffle(arr).slice(0, n); }
  function buildOptions(correct, distractors, size){
    const opts = shuffle([correct].concat(sample(distractors.filter(v => v !== correct), Math.max(0, (size || 4) - 1))));
    return opts;
  }

  const bank = [];
  function add(q){ bank.push(q); }

  const animals = ['cat','dog','lion','tiger','rabbit','monkey','zebra','elephant','bear','hippo','giraffe','panda'];
  const fruits = ['apple','banana','orange','grapes','mango','pear','peach','lemon','melon','plum'];
  const colors = ['red','blue','green','yellow','purple','pink','orange','brown','black','white'];
  const verbs = ['run','jump','read','write','sing','dance','swim','play','open','close'];
  const places = ['school','park','home','library','zoo','farm','beach','garden'];
  const opposites = [['big','small'],['hot','cold'],['happy','sad'],['up','down'],['day','night'],['fast','slow'],['clean','dirty'],['full','empty']];
  const singularPlural = [['child','children'],['man','men'],['woman','women'],['mouse','mice'],['tooth','teeth'],['foot','feet'],['book','books'],['apple','apples']];
  const riddles = [
    ['I have hands but cannot clap. What am I?','clock',['shoe','chair','plate']],
    ['I am yellow and shine in the sky. What am I?','sun',['moon','star','tree']],
    ['I have pages and words. What am I?','book',['ball','sock','apple']],
    ['I am full of water and fish live in me. What am I?','sea',['desert','road','forest']]
  ];

  colors.forEach((color, idx) => {
    add({ text: `Which word is a color?`, options: buildOptions(color, animals.concat(fruits, verbs, places), 4), answer: color, skill:'Vocabulary' });
    add({ text: `Choose the word with the first letter "${color.charAt(0).toUpperCase()}".`, options: buildOptions(color, shuffle(colors.filter(c => c !== color).concat(animals)).slice(0,8), 4), answer: color, skill:'Phonics' });
    add({ text: `Complete the sentence: The balloon is ${color}.`, options: buildOptions(color, colors, 4), answer: color, skill:'Grammar' });
  });

  animals.forEach((animal) => {
    add({ text: `Which one is an animal?`, options: buildOptions(animal, fruits.concat(colors, places), 4), answer: animal, skill:'Vocabulary' });
    add({ text: `Choose the first letter of ${animal}.`, options: buildOptions(animal.charAt(0), ['a','b','c','d','e','f','g','h','l','m','p','r','s','t','z'], 4), answer: animal.charAt(0), skill:'Phonics' });
    add({ text: `How many letters are in the word "${animal}"?`, options: buildOptions(String(animal.length), ['3','4','5','6','7','8','9'], 4), answer: String(animal.length), skill:'Spelling' });
  });

  fruits.forEach((fruit) => {
    add({ text: `Which one is a fruit?`, options: buildOptions(fruit, animals.concat(colors, places), 4), answer: fruit, skill:'Vocabulary' });
    add({ text: `Choose the missing first letter: _${fruit.slice(1)}`, options: buildOptions(fruit.charAt(0), ['a','b','c','g','l','m','o','p'], 4), answer: fruit.charAt(0), skill:'Spelling' });
  });

  opposites.forEach(([a,b]) => {
    add({ text: `What is the opposite of ${a}?`, options: buildOptions(b, opposites.flat().filter(v => v !== b && v !== a), 4), answer: b, skill:'Vocabulary' });
    add({ text: `What is the opposite of ${b}?`, options: buildOptions(a, opposites.flat().filter(v => v !== b && v !== a), 4), answer: a, skill:'Vocabulary' });
  });

  singularPlural.forEach(([single, plural]) => {
    add({ text: `Choose the plural of ${single}.`, options: buildOptions(plural, singularPlural.flat().filter(v => v !== plural && v !== single), 4), answer: plural, skill:'Grammar' });
    add({ text: `Choose the singular form of ${plural}.`, options: buildOptions(single, singularPlural.flat().filter(v => v !== plural && v !== single), 4), answer: single, skill:'Grammar' });
  });

  verbs.forEach((verb) => {
    add({ text: `Which word is an action word?`, options: buildOptions(verb, animals.concat(fruits, colors), 4), answer: verb, skill:'Vocabulary' });
    add({ text: `Complete the sentence: I like to ${verb}.`, options: buildOptions(verb, verbs, 4), answer: verb, skill:'Grammar' });
  });

  places.forEach((place) => {
    add({ text: `Which place do children visit?`, options: buildOptions(place, animals.concat(fruits, colors), 4), answer: place, skill:'Reading' });
  });

  for (let a = 1; a <= 12; a += 1) {
    for (let b = 1; b <= 6; b += 1) {
      add({ text: `${a} + ${b} = ?`, options: buildOptions(String(a + b), [String(a+b+1), String(a+b-1), String(a+b+2), String(a+b-2)], 4), answer: String(a + b), skill:'Math' });
    }
  }
  for (let a = 5; a <= 18; a += 1) {
    const b = Math.floor(a / 2);
    add({ text: `${a} - ${b} = ?`, options: buildOptions(String(a - b), [String(a-b+1), String(a-b-1), String(a-b+2), String(a-b-2)], 4), answer: String(a - b), skill:'Math' });
  }
  for (let n = 2; n <= 20; n += 2) {
    add({ text: `What number comes after ${n}?`, options: buildOptions(String(n+1), [String(n-1), String(n+2), String(n+3), String(n-2)], 4), answer: String(n+1), skill:'Math' });
  }
  for (let n = 5; n <= 30; n += 5) {
    add({ text: `What number comes before ${n}?`, options: buildOptions(String(n-1), [String(n+1), String(n-2), String(n+2), String(n-3)], 4), answer: String(n-1), skill:'Math' });
  }

  riddles.forEach(([text, correct, wrong]) => add({ text, options: buildOptions(correct, wrong.concat(animals, fruits), 4), answer: correct, skill:'Logic' }));

  const grammar = [
    ['She ___ happy.','is',['are','am','be']],
    ['They ___ playing.','are',['is','am','be']],
    ['I ___ a student.','am',['is','are','be']],
    ['This ___ my bag.','is',['are','am','be']],
    ['We ___ friends.','are',['is','am','be']],
    ['There ___ a cat on the mat.','is',['are','am','be']],
    ['There ___ three books on the desk.','are',['is','am','be']],
    ['He can ___ fast.','run',['runs','running','ran']],
    ['Birds can ___.','fly',['swim','read','sleep']],
    ['Fish can ___.','swim',['drive','cook','sing']]
  ];
  grammar.forEach(([text, answer, wrong]) => add({ text, options: buildOptions(answer, wrong, 4), answer, skill:'Grammar' }));

  const reading = [
    ['A baby cat is called a ___.','kitten',['puppy','cub','duck']],
    ['We wear shoes on our ___.','feet',['hands','eyes','ears']],
    ['The sun rises in the ___.','morning',['night','box','shoe']],
    ['An author writes a ___.','book',['banana','window','shirt']],
    ['We use a pencil to ___.','write',['eat','sleep','jump']],
    ['The teacher works in a ___.','school',['car','tree','apple']],
    ['Milk comes from a ___.','cow',['bird','bus','chair']],
    ['We brush our ___.','teeth',['knees','elbows','hats']]
  ];
  reading.forEach(([text, answer, wrong]) => add({ text, options: buildOptions(answer, wrong, 4), answer, skill:'Reading' }));

  window.PlayQuestionBank = {
    all: bank,
    createMixedQuiz(count){
      return sample(bank, Math.min(Math.max(10, count || 15), bank.length)).map((q, index) => Object.assign({ id:`pq-${Date.now()}-${index}-${Math.random().toString(36).slice(2,7)}` }, q));
    }
  };
})();
