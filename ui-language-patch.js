
(function(){
  if (typeof window === 'undefined') return;
  const t = window.translations || null;
  if (t && t.en && t.ar){
    Object.assign(t.en, {
      playCardDesc:'Start a new mixed English challenge every time, save your score, and climb the live leaderboard.',
      playCardBtn:'Open Play Mode',
      homeworkCardDesc:'Open homework tasks by class, answer without instant right or wrong feedback, and submit to Dr. Tarek.',
      homeworkCardBtn:'Open Homework',
      homeworkBadge:'Homework',
      homeworkPageTitle:'Homework With Dr. Tarek',
      homeworkPageText:'Choose your grade and class to open available homework.',
      studentNamePlaceholder:'Student name',
      studentIdOptional:'Student ID (optional)',
      classNamePlaceholder:'Class name',
      showHomeworkBtn:'Show Homework',
      availableHomeworkLabel:'Available Homework',
      answeredLabel:'Answered',
      homeworkSubmittedTitle:'Homework submitted',
      homeworkSubmittedText:'Your homework has been sent.',
      openAnotherHomework:'Open another homework',
      availableQuestionsLabel:'Available Questions'
    });
    Object.assign(t.ar, {
      playCardDesc:'ابدأ تحديًا جديدًا كل مرة، واحفظ نتيجتك، واصعد في لوحة المتصدرين المباشرة.',
      playCardBtn:'افتح وضع اللعب',
      homeworkCardDesc:'افتح واجبات الصف، وأجب بدون إظهار الصحيح أو الخطأ فورًا، ثم أرسل الحل إلى د. طارق.',
      homeworkCardBtn:'افتح الواجب',
      homeworkBadge:'الواجب',
      homeworkPageTitle:'الواجب مع د. طارق',
      homeworkPageText:'اختر الصف والفصل لعرض الواجبات المتاحة.',
      studentNamePlaceholder:'اسم الطالب',
      studentIdOptional:'رقم الطالب (اختياري)',
      classNamePlaceholder:'اسم الفصل',
      showHomeworkBtn:'عرض الواجب',
      availableHomeworkLabel:'الواجبات المتاحة',
      answeredLabel:'تمت الإجابة',
      homeworkSubmittedTitle:'تم إرسال الواجب',
      homeworkSubmittedText:'تم إرسال الواجب بنجاح.',
      openAnotherHomework:'افتح واجبًا آخر',
      availableQuestionsLabel:'الأسئلة المتاحة'
    });
  }
})();
