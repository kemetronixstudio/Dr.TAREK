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
    return shuffle([correct].concat(sample(distractors.filter(v => v !== correct), Math.max(0, (size || 4) - 1))));
  }

  const bank = [];
  function add(q){ bank.push(Object.assign({ difficulty:1 }, q)); }

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

  colors.forEach((color) => {
    add({ text:'Which word is a color?', options: buildOptions(color, animals.concat(fruits, verbs, places), 4), answer: color, skill:'Vocabulary', difficulty:1 });
    add({ text:`Choose the word with the first letter "${color.charAt(0).toUpperCase()}".`, options: buildOptions(color, shuffle(colors.filter(c => c !== color).concat(animals)).slice(0,8), 4), answer: color, skill:'Phonics', difficulty:1 });
    add({ text:`Complete the sentence: The balloon is ${color}.`, options: buildOptions(color, colors, 4), answer: color, skill:'Grammar', difficulty:1 });
  });

  animals.forEach((animal) => {
    add({ text:'Which one is an animal?', options: buildOptions(animal, fruits.concat(colors, places), 4), answer: animal, skill:'Vocabulary', difficulty:1 });
    add({ text:`Choose the first letter of ${animal}.`, options: buildOptions(animal.charAt(0), ['a','b','c','d','e','f','g','h','l','m','p','r','s','t','z'], 4), answer: animal.charAt(0), skill:'Phonics', difficulty:1 });
    add({ text:`How many letters are in the word "${animal}"?`, options: buildOptions(String(animal.length), ['3','4','5','6','7','8','9'], 4), answer: String(animal.length), skill:'Spelling', difficulty:2 });
  });

  fruits.forEach((fruit) => {
    add({ text:'Which one is a fruit?', options: buildOptions(fruit, animals.concat(colors, places), 4), answer: fruit, skill:'Vocabulary', difficulty:1 });
    add({ text:`Choose the missing first letter: _${fruit.slice(1)}`, options: buildOptions(fruit.charAt(0), ['a','b','c','g','l','m','o','p'], 4), answer: fruit.charAt(0), skill:'Spelling', difficulty:1 });
  });

  opposites.forEach(([a,b]) => {
    add({ text:`What is the opposite of ${a}?`, options: buildOptions(b, opposites.flat().filter(v => v !== b && v !== a), 4), answer: b, skill:'Vocabulary', difficulty:1 });
    add({ text:`What is the opposite of ${b}?`, options: buildOptions(a, opposites.flat().filter(v => v !== b && v !== a), 4), answer: a, skill:'Vocabulary', difficulty:1 });
  });

  singularPlural.forEach(([single, plural]) => {
    add({ text:`Choose the plural of ${single}.`, options: buildOptions(plural, singularPlural.flat().filter(v => v !== plural && v !== single), 4), answer: plural, skill:'Grammar', difficulty:2 });
    add({ text:`Choose the singular form of ${plural}.`, options: buildOptions(single, singularPlural.flat().filter(v => v !== plural && v !== single), 4), answer: single, skill:'Grammar', difficulty:2 });
  });

  verbs.forEach((verb) => {
    add({ text:'Which word is an action word?', options: buildOptions(verb, animals.concat(fruits, colors), 4), answer: verb, skill:'Vocabulary', difficulty:1 });
    add({ text:`Complete the sentence: I like to ${verb}.`, options: buildOptions(verb, verbs, 4), answer: verb, skill:'Grammar', difficulty:1 });
  });

  places.forEach((place) => {
    add({ text:'Which place do children visit?', options: buildOptions(place, animals.concat(fruits, colors), 4), answer: place, skill:'Reading', difficulty:1 });
  });

  for (let a = 1; a <= 12; a += 1) {
    for (let b = 1; b <= 6; b += 1) {
      add({ text:`${a} + ${b} = ?`, options: buildOptions(String(a + b), [String(a+b+1), String(a+b-1), String(a+b+2), String(a+b-2)], 4), answer: String(a + b), skill:'Math', difficulty:a + b > 12 ? 2 : 1 });
    }
  }
  for (let a = 5; a <= 24; a += 1) {
    const b = Math.floor(a / 2);
    add({ text:`${a} - ${b} = ?`, options: buildOptions(String(a - b), [String(a-b+1), String(a-b-1), String(a-b+2), String(a-b-2)], 4), answer: String(a - b), skill:'Math', difficulty:a > 16 ? 2 : 1 });
  }
  for (let n = 2; n <= 40; n += 2) {
    add({ text:`What number comes after ${n}?`, options: buildOptions(String(n+1), [String(n-1), String(n+2), String(n+3), String(n-2)], 4), answer: String(n+1), skill:'Math', difficulty:n > 20 ? 2 : 1 });
  }
  for (let n = 5; n <= 50; n += 5) {
    add({ text:`What number comes before ${n}?`, options: buildOptions(String(n-1), [String(n+1), String(n-2), String(n+2), String(n-3)], 4), answer: String(n-1), skill:'Math', difficulty:n > 25 ? 2 : 1 });
  }

  riddles.forEach(([text, correct, wrong]) => add({ text, options: buildOptions(correct, wrong.concat(animals, fruits), 4), answer: correct, skill:'Logic', difficulty:2 }));

  const grammar = [
    ['She ___ happy.','is',['are','am','be'],1],
    ['They ___ playing.','are',['is','am','be'],1],
    ['I ___ a student.','am',['is','are','be'],1],
    ['This ___ my bag.','is',['are','am','be'],1],
    ['We ___ friends.','are',['is','am','be'],1],
    ['There ___ a cat on the mat.','is',['are','am','be'],2],
    ['There ___ three books on the desk.','are',['is','am','be'],2],
    ['He can ___ fast.','run',['runs','running','ran'],2],
    ['Birds can ___.','fly',['swim','read','sleep'],2],
    ['Fish can ___.','swim',['drive','cook','sing'],2],
    ['Choose the correct sentence.','She goes to school.',['She go to school.','She going school.','She gone to school.'],3],
    ['Choose the correct sentence.','They are reading books.',['They is reading books.','They reading book.','They reads books.'],3]
  ];
  grammar.forEach(([text, answer, wrong, difficulty]) => add({ text, options: buildOptions(answer, wrong, 4), answer, skill:'Grammar', difficulty }));

  const reading = [
    ['A baby cat is called a ___.','kitten',['puppy','cub','duck'],1],
    ['We wear shoes on our ___.','feet',['hands','eyes','ears'],1],
    ['The sun rises in the ___.','morning',['night','box','shoe'],1],
    ['An author writes a ___.','book',['banana','window','shirt'],1],
    ['We use a pencil to ___.','write',['eat','sleep','jump'],1],
    ['The teacher works in a ___.','school',['car','tree','apple'],1],
    ['Milk comes from a ___.','cow',['bird','bus','chair'],1],
    ['We brush our ___.','teeth',['knees','elbows','hats'],1],
    ['Which sentence shows good manners?','May I come in, please?',['Give me the book!','I want water now.','Move away.'],2],
    ['Choose the best ending: The children went to the park because...','they wanted to play.',['the moon was sleeping.','books can fly.','a fish drove a car.'],2],
    ['Read and choose: Sara lost her pencil, so she asked her friend for help. What happened first?','Sara lost her pencil.',['Her friend went home.','Sara ate lunch.','They visited the zoo.'],3],
    ['Which word best describes a person who always tells the truth?','honest',['hungry','sleepy','noisy'],3]
  ];
  reading.forEach(([text, answer, wrong, difficulty]) => add({ text, options: buildOptions(answer, wrong, 4), answer, skill:'Reading', difficulty }));

  window.PlayQuestionBank = {
    all: bank,
    createMixedQuiz(count, stage){
      const stageMap = {
        starter: [1],
        explorer: [1,2],
        champion: [1,2,3]
      };
      const allowed = stageMap[stage] || [1];
      const filtered = bank.filter(q => allowed.includes(Number(q.difficulty || 1)));
      return sample(filtered.length >= count ? filtered : bank, Math.min(Math.max(10, count || 15), (filtered.length >= count ? filtered : bank).length)).map((q, index) => Object.assign({ id:`pq-${Date.now()}-${index}-${Math.random().toString(36).slice(2,7)}` }, q));
    }
  };
})();
