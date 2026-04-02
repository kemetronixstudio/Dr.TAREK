(function(){
  function shuffle(arr){
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function questionSig(q){
    return String((q.grade || '') + '||' + (q.text || '') + '||' + (q.answer || '')).trim().toLowerCase();
  }

  function dedupe(list){
    const seen = new Set();
    return (list || []).filter(function(q){
      if (!q || !q.text || !Array.isArray(q.options) || !q.options.length || !q.answer) return false;
      const sig = questionSig(q);
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
  }

  function normalizeGradeKey(value){
    const raw = String(value || '').trim().toLowerCase();
    if (raw === 'kg1' || raw === 'kg2') return raw;
    const compact = raw.replace(/[^a-z0-9]+/g, '');
    const map = {
      grade1: 'grade1',
      grade2: 'grade2',
      grade3: 'grade3',
      grade4: 'grade4',
      grade5: 'grade5',
      grade6: 'grade6'
    };
    return map[compact] || compact;
  }

  function collectGradeQuestions(keys){
    let out = [];
    keys.forEach(function(key){
      try {
        if (typeof allQuestionsFor === 'function') {
          out = out.concat(allQuestionsFor(key) || []);
        } else if (typeof baseQuestionPools !== 'undefined' && Array.isArray(baseQuestionPools[key])) {
          out = out.concat(baseQuestionPools[key]);
        }
      } catch (err) {}
    });
    return dedupe(out);
  }

  function stageKeys(stage){
    if (stage === 'champion') return ['grade5','grade6'];
    if (stage === 'explorer') return ['grade3','grade4'];
    return ['kg1','kg2','grade1','grade2'];
  }

  window.PlayQuestionBank = {
    all: function(){
      return collectGradeQuestions(['kg1','kg2','grade1','grade2','grade3','grade4','grade5','grade6']);
    },
    createMixedQuiz: function(count, stage, selectedGrade){
      const preferredKey = normalizeGradeKey(selectedGrade);
      const stagePool = collectGradeQuestions(stageKeys(stage));
      let pool = stagePool;
      const preferred = preferredKey ? collectGradeQuestions([preferredKey]) : [];
      const mixed = preferred.length ? dedupe(preferred.concat(stagePool)) : stagePool;
      if (mixed.length) pool = mixed;
      if (!pool.length) pool = this.all();
      const targetCount = Math.max(10, Number(count || 30));
      const unique = shuffle(pool).slice(0, Math.min(targetCount, pool.length)).map(function(q, idx){
        return Object.assign({ id: 'pq-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).slice(2,7) }, q);
      });
      return unique;
    }
  };
})();
