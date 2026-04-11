
// remove snapshot permanently
(function(){
  function kill(){
    document.querySelectorAll('[data-section*="snapshot"], .snapshot, .quick-school-snapshot')
      .forEach(el=>el.remove());
  }
  setInterval(kill,500);
  document.addEventListener('DOMContentLoaded',kill);
})();
