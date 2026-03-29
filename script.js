const translations = {"en": {"h

function getBuiltInAdmins(){
  return [
    { user:'dr. tarek', pass:'T01032188008', role:'admin', permissions:[...PERMISSIONS], builtIn:true, display:'Dr. Tarek' },
    { user:'hitman', pass:'01002439054', role:'admin', permissions:[...PERMISSIONS], builtIn:true, display:'HITMAN' }
  ];
}
function normalizeUserName(v){ return String(v || '').trim().toLowerCase(); }
function getAccessAccounts(){
  try{
    const raw = localStorage.getItem('kgEnglishAccessAccountsV35');
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch(e){ return []; }
}
function setAccessAccounts(accounts){
  localStorage.setItem('kgEnglishAccessAccountsV35', JSON.stringify(accounts || []));
}
function findBuiltInAdmin(user){
  const n = normalizeUserName(user);
  return getBuiltInAdmins().find(a => normalizeUserName(a.user) === n || normalizeUserName(a.display) === n) || null;
}
omeBadge": "English Learning for KG1 & KG2", "homeTitle": "Fun English Quiz for Kids", "homeText": "Play, learn, and grow with colorful English questions.", "teacherLabel": "Your Teacher", "sourceNote": "", "kg1Desc": "Letters, phonics, colors, feelings, body parts, and simple picture words.", "kg2Desc": "Step Ahead KG2 topics: food, phonics, numbers, and good manners.", "startKg1": "Start KG1", "startKg2": "Start KG2", "homeBtn": "⬅ Home", "kg1Subtitle": "Easy English questions for young learners.", "kg2Subtitle": "Book-based English questions from Step Ahead KG2.", "step1": "Step 1", "step2": "Step 2", "enterName": "Enter Student Name", "studentPlaceholder": "Type student name", "continueBtn": "Continue", "chooseLevel": "Choose Quiz Level", "pickQuestionCount": "Pick how many questions you want.", "level1": "Level 1", "level2": "Level 2", "level3": "Level 3", "level4": "Level 4", "level5": "Level 5", "q10": "10 Questions", "q20": "20 Questions", "q30": "30 Questions", "q40": "40 Questions", "q50": "50 Questions", "studentLabel": "Student", "quizLabel": "Quiz", "questionLabel": "Question", "timeLeft": "Time Left", "scoreLabel": "Score", "nextQuestion": "Next Question", "autoNext": "Auto next after answer", "manualNext": "Use manual Next button", "certificateActions": "Certificate Actions", "downloadPdf": "Download PDF", "shareCertificate": "Share Certificate", "shareNote": "On supported mobile browsers, the PDF can be shared directly. If file sharing is not supported, WhatsApp text sharing will open as a fallback.", "enterNameAlert": "Please enter the student name first.", "progressTitle": "Progress", "bestScore": "Best Score", "lastScore": "Last Score", "attempts": "Attempts", "badge": "Badge", "resetProgress": "Reset Progress", "badgeStarter": "Starter Star", "badgeRising": "Rising Reader", "badgeMaster": "English Master", "progressEmpty": "No saved progress yet.", "improvedFrom": "Improved from", "to": "to", "historyWeak": "Focus skills", "grade": "Grade", "level": "Quiz Level", "score": "Score", "date": "Date", "strengths": "Strengths", "focus": "Focus More On", "advice": "Teacher Advice", "teacher": "Teacher", "result": "Result", "certificateTitle": "Certificate of Achievement", "presentedTo": "Proudly presented to", "completedMsg": "has successfully completed the English quiz.", "excellent": "Excellent", "veryGood": "Very Good", "good": "Good", "keepPracticing": "Keep Practicing", "noMajor": "No major weak area", "dashboard": "Teacher Dashboard", "teacherTopline": "Dr. TAREK ABDALAZIZ 📞 01032188008", "readAloud": "🔊 Read aloud", "questionTypeDefault": "Question", "teacherDashboard": "Teacher Dashboard", "kg1Badge": "KG1 English", "kg2Badge": "KG2 English", "kg1Title": "KG1 English Quiz", "kg2Title": "KG2 English Quiz", "adminsLabel": "Admins:", "adminsNames": "Dr. Tarek / HITMAN", "adminNamePlaceholder": "Admin name", "passwordPlaceholder": "Password", "openDashboard": "Open Dashboard", "adminIntro": "Use one of the admin accounts to manage records and questions.", "adminClientNote": "This is a client-side demo dashboard. For real security, use a backend later.", "totalStudents": "Total Students", "totalAttempts": "Total Attempts", "averageScore": "Average Score", "mostMissedSkill": "Most Missed Skill", "studentProgress": "Student Progress", "allDates": "All Dates", "exportJpeg": "Export JPEG", "exportExcel": "Export Excel", "exportJson": "Export JSON", "resetData": "Reset Data", "weakAreas": "Weak Areas", "mostMissedQuestions": "Most Missed Questions", "missesLabel": "Misses", "levelVisibility": "Level Visibility", "showAllLevels": "Show All Levels", "chooseWhichLevels": "Choose which quiz levels students can see on KG1 and KG2 pages.", "saveLevelVisibility": "Save Level Visibility", "timerSettings": "Timer Settings", "turnTimersOn": "Turn Timers On", "timerInfo": "Turn the timer on or off for each grade. When timer is off, students answer without countdown and each correct answer gives fixed points.", "saveTimerSettings": "Save Timer Settings", "quizAccessPassword": "Quiz Access Password", "noPassword": "No Password", "setPasswordInfo": "Set a password for KG1 or KG2. Students will be asked for it before entering the quiz. Leave blank to disable password.", "kg1Short": "KG1", "kg2Short": "KG2", "protectKg1": "Protect KG1 with password", "protectKg2": "Protect KG2 with password", "kg1Password": "KG1 password", "kg2Password": "KG2 password", "saveQuizPassword": "Save Quiz Password", "teacherTestBuilder": "Teacher Test Builder", "clearTest": "Clear Test", "teacherTestInfo": "Create a named test for KG1 or KG2. Choose random questions or paste exact question texts line by line.", "gradePlaceholder": "Grade (KG1 or KG2)", "testName": "Test name", "randomQuestions": "Random Questions", "chooseByQuestionText": "Choose by Question Text", "chooseExistingQuestions": "Choose Existing Questions", "selectAll": "Select All", "clear": "Clear", "saveTeacherTest": "Save Teacher Test", "questionBankEditor": "Question Bank Editor", "refreshQuestionList": "Refresh Question List", "uploadImage": "Upload image", "addQuestion": "Add Question", "modifyExistingQuestions": "Modify Existing Questions", "allLabel": "All", "nameLabel": "Name", "starStudent": "STAR STUDENT", "testLabel": "Test", "teacherTestTitle": "Teacher Test", "teacherTestActive": "A teacher test is active for this grade.", "startTeacherTest": "Start Teacher Test", "usernamePlaceholder": "Username", "userRole": "User", "adminRole": "Admin", "collapseEditor": "Collapse", "expandEditor": "Expand", "collapseQuestions": "Collapse Questions", "expandQuestions": "Expand Questions", "deleteAccount": "Delete Account", "noExtraAccounts": "No extra accounts yet.", "howManyQuestions": "How many questions", "manualModePaste": "For manual mode: paste exact question texts, one per line", "editQuestionNote": "Edit any question below, then press save. Changes are stored locally and apply directly inside the app.", "noQuestionsFoundForGrade": "No questions found for this grade.", "noPermissionsAvailable": "No permissions available.", "excelLibraryMissingCsv": "Excel library not loaded. Downloading CSV instead.", "downloadQuestionsFailed": "Could not download current questions.", "staffRole": "Staff", "classManagerTitle": "Class Manager", "classManagerInfo": "Create extra classes like Class 1 or Class 2. You can build them from existing questions or upload a filled question file for the class.", "classNamePlaceholder": "Class name (example: Class 1)", "classDescPlaceholder": "Short description for home page", "classQuestionCountPlaceholder": "Question count shown on test builder (optional)", "uploadFilledForm": "Upload Filled Form", "saveClass": "Save Class", "hideClassFromHome": "Hide class from main page", "accountSaved": "Account saved.", "accountSaveFailed": "Could not save account.", "chooseOnePermission": "Please choose at least one permission for this staff account.", "usernamePasswordRequired": "Please enter username and password.", "existingAccountsTitle": "Existing Accounts", "editAccount": "Edit Account", "changePassword": "Change Password", "accountDeleted": "Account deleted.", "passwordUpdated": "Password updated.", "confirmDeleteAccount": "Delete this account?", "enterNewPassword": "Enter new password", "cannotDeleteBuiltInAdmins": "Built-in admin accounts cannot be deleted here."}, "ar": {"homeBadge": "تعلم الإنجليزية لرياض الأطفال 1 و 2", "homeTitle": "اختبار إنجليزي ممتع للأطفال", "homeText": "العب وتعلّم وتطوّر من خلال أسئلة إنجليزية ملوّنة.", "teacherLabel": "المعلم", "sourceNote": "", "kg1Desc": "حروف وأصوات وألوان ومشاعر وأجزاء الجسم وكلمات صور بسيطة.", "kg2Desc": "الحروف والقواعد والمفرد والجمع وهناك مفرد وجمع والقراءة والمفردات.", "startKg1": "ابدأ KG1", "startKg2": "ابدأ KG2", "homeBtn": "الرئيسية ⮌", "kg1Subtitle": "أسئلة إنجليزية سهلة للمتعلمين الصغار.", "kg2Subtitle": "أسئلة إنجليزية أقوى للمتعلمين الأكبر.", "step1": "الخطوة 1", "step2": "الخطوة 2", "enterName": "اكتب اسم الطالب", "studentPlaceholder": "اكتب اسم الطالب", "continueBtn": "متابعة", "chooseLevel": "اختر مستوى الاختبار", "pickQuestionCount": "اختر عدد الأسئلة.", "level1": "المستوى 1", "level2": "المستوى 2", "level3": "المستوى 3", "level4": "المستوى 4", "level5": "المستوى 5", "q10": "10 أسئلة", "q20": "20 سؤال", "q30": "30 سؤال", "q40": "40 سؤال", "q50": "50 سؤال", "studentLabel": "الطالب", "quizLabel": "الاختبار", "questionLabel": "السؤال", "timeLeft": "الوقت المتبقي", "scoreLabel": "النتيجة", "nextQuestion": "السؤال التالي", "autoNext": "الانتقال التلقائي بعد الإجابة", "manualNext": "استخدم زر التالي", "certificateActions": "خيارات الشهادة", "downloadPdf": "تحميل PDF", "shareCertificate": "مشاركة الشهادة", "shareNote": "في المتصفحات التي تدعم مشاركة الملفات يمكن مشاركة ملف PDF مباشرة، وإذا لم يدعم المتصفح ذلك سيتم فتح مشاركة واتساب كنص بديل.", "enterNameAlert": "من فضلك اكتب اسم الطالب أولاً.", "progressTitle": "التقدم", "bestScore": "أفضل نتيجة", "lastScore": "آخر نتيجة", "attempts": "عدد المحاولات", "badge": "الشارة", "resetProgress": "إعادة التقدم", "badgeStarter": "نجمة البداية", "badgeRising": "قارئ صاعد", "badgeMaster": "بطل الإنجليزية", "progressEmpty": "لا يوجد تقدم محفوظ بعد.", "improvedFrom": "تحسن من", "to": "إلى", "historyWeak": "مهارات تحتاج تركيز", "grade": "الصف", "level": "مستوى الاختبار", "score": "النتيجة", "date": "التاريخ", "strengths": "نقاط القوة", "focus": "ركّز أكثر على", "advice": "نصيحة المعلم", "teacher": "المعلم", "result": "التقدير", "certificateTitle": "شهادة تقدير", "presentedTo": "تُقدَّم بكل فخر إلى", "completedMsg": "لقد أكمل اختبار اللغة الإنجليزية بنجاح.", "excellent": "ممتاز", "veryGood": "جيد جدًا", "good": "جيد", "keepPracticing": "استمر في التدريب", "noMajor": "لا توجد نقطة ضعف رئيسية", "dashboard": "لوحة المعلم", "teacherTopline": "Dr. TAREK ABDALAZIZ 📞 01032188008", "readAloud": "🔊 اقرأ السؤال", "questionTypeDefault": "السؤال", "teacherDashboard": "لوحة المعلم", "kg1Badge": "إنجليزي KG1", "kg2Badge": "إنجليزي KG2", "kg1Title": "اختبار إنجليزي KG1", "kg2Title": "اختبار إنجليزي KG2", "adminsLabel": "المشرفون:", "adminsNames": "Dr. Tarek / HITMAN", "adminNamePlaceholder": "اسم المشرف", "passwordPlaceholder": "كلمة المرور", "openDashboard": "فتح اللوحة", "adminIntro": "استخدم أحد حسابات المشرفين لإدارة النتائج والأسئلة.", "adminClientNote": "هذه لوحة تجريبية تعمل داخل المتصفح. للحماية الفعلية استخدم خادماً لاحقاً.", "totalStudents": "إجمالي الطلاب", "totalAttempts": "إجمالي المحاولات", "averageScore": "متوسط النتيجة", "mostMissedSkill": "أكثر مهارة تم الخطأ فيها", "studentProgress": "تقدم الطلاب", "allDates": "كل التواريخ", "exportJpeg": "تصدير JPEG", "exportExcel": "تصدير Excel", "exportJson": "تصدير JSON", "resetData": "مسح البيانات", "weakAreas": "نقاط الضعف", "mostMissedQuestions": "الأسئلة الأكثر خطأ", "missesLabel": "عدد الأخطاء", "levelVisibility": "إظهار المستويات", "showAllLevels": "إظهار كل المستويات", "chooseWhichLevels": "اختر المستويات التي يمكن للطلاب رؤيتها في صفحات KG1 و KG2.", "saveLevelVisibility": "حفظ إظهار المستويات", "timerSettings": "إعدادات المؤقت", "turnTimersOn": "تشغيل كل المؤقتات", "timerInfo": "يمكنك تشغيل أو إيقاف المؤقت لكل صف. عند إيقافه يجيب الطالب بدون عد تنازلي وتحصل كل إجابة صحيحة على نقاط ثابتة.", "saveTimerSettings": "حفظ إعدادات المؤقت", "quizAccessPassword": "كلمة مرور دخول الاختبار", "noPassword": "بدون كلمة مرور", "setPasswordInfo": "يمكنك ضبط كلمة مرور لـ KG1 أو KG2. سيُطلب من الطالب إدخالها قبل بدء الاختبار. اترك الحقل فارغاً لإلغاء كلمة المرور.", "kg1Short": "KG1", "kg2Short": "KG2", "protectKg1": "حماية KG1 بكلمة مرور", "protectKg2": "حماية KG2 بكلمة مرور", "kg1Password": "كلمة مرور KG1", "kg2Password": "كلمة مرور KG2", "saveQuizPassword": "حفظ كلمة مرور الاختبار", "teacherTestBuilder": "منشئ اختبار المعلم", "clearTest": "مسح الاختبار", "teacherTestInfo": "أنشئ اختباراً باسم محدد لـ KG1 أو KG2. اختر أسئلة عشوائية أو الصق نصوص الأسئلة سطراً سطراً.", "gradePlaceholder": "الصف (KG1 أو KG2)", "testName": "اسم الاختبار", "randomQuestions": "أسئلة عشوائية", "chooseByQuestionText": "اختيار بنص السؤال", "chooseExistingQuestions": "اختيار من الأسئلة الموجودة", "selectAll": "تحديد الكل", "clear": "مسح", "saveTeacherTest": "حفظ اختبار المعلم", "questionBankEditor": "محرر بنك الأسئلة", "refreshQuestionList": "تحديث قائمة الأسئلة", "uploadImage": "رفع صورة", "addQuestion": "إضافة سؤال", "modifyExistingQuestions": "تعديل الأسئلة الحالية", "allLabel": "الكل", "nameLabel": "الاسم", "starStudent": "طالب متميز", "testLabel": "اختبار", "teacherTestTitle": "اختبار المعلم", "teacherTestActive": "يوجد اختبار معلم مفعّل لهذا الصف.", "startTeacherTest": "ابدأ اختبار المعلم", "usernamePlaceholder": "اسم المستخدم", "userRole": "مستخدم", "adminRole": "مشرف", "collapseEditor": "إخفاء", "expandEditor": "إظهار", "collapseQuestions": "إخفاء الأسئلة", "expandQuestions": "إظهار الأسئلة", "deleteAccount": "حذف الحساب", "noExtraAccounts": "لا توجد حسابات إضافية بعد.", "howManyQuestions": "عدد الأسئلة", "manualModePaste": "في الوضع اليدوي: الصق نصوص الأسئلة الدقيقة، كل سؤال في سطر", "editQuestionNote": "عدّل أي سؤال بالأسفل ثم اضغط حفظ. يتم حفظ التغييرات محليًا وتُطبق مباشرة داخل التطبيق.", "noQuestionsFoundForGrade": "لا توجد أسئلة لهذا الصف.", "noPermissionsAvailable": "لا توجد صلاحيات متاحة.", "excelLibraryMissingCsv": "مكتبة الإكسل غير متاحة. سيتم تنزيل ملف CSV بدلًا من ذلك.", "downloadQuestionsFailed": "تعذر تنزيل الأسئلة الحالية.", "staffRole": "مستخدم", "classManagerTitle": "إدارة الصفوف", "classManagerInfo": "أنشئ صفوفًا إضافية مثل Class 1 أو Class 2. يمكنك بناؤها من الأسئلة الموجودة أو رفع ملف أسئلة جاهز لهذا الصف.", "classNamePlaceholder": "اسم الصف (مثال: Class 1)", "classDescPlaceholder": "وصف قصير للصف في الصفحة الرئيسية", "classQuestionCountPlaceholder": "عدد الأسئلة الظاهر في منشئ الاختبار (اختياري)", "uploadFilledForm": "رفع النموذج المعبأ", "saveClass": "حفظ الصف", "hideClassFromHome": "إخفاء الصف من الصفحة الرئيسية", "accountSaved": "تم حفظ الحساب.", "accountSaveFailed": "تعذر حفظ الحساب.", "chooseOnePermission": "اختر صلاحية واحدة على الأقل لهذا الحساب.", "usernamePasswordRequired": "أدخل اسم المستخدم وكلمة المرور.", "existingAccountsTitle": "الحسابات الحالية", "editAccount": "تعديل الحساب", "changePassword": "تغيير كلمة المرور", "accountDeleted": "تم حذف الحساب.", "passwordUpdated": "تم تحديث كلمة المرور.", "confirmDeleteAccount": "هل تريد حذف هذا الحساب؟", "enterNewPassword": "أدخل كلمة المرور الجديدة", "cannotDeleteBuiltInAdmins": "لا يمكن حذف حسابات المشرفين الأساسية من هنا."}};
const skillLabels = {"en": {"Vocabulary": "Vocabulary", "Feelings": "Feelings", "School Vocabulary": "School Vocabulary", "Body Parts": "Body Parts", "Colors": "Colors", "Shapes": "Shapes", "Food": "Food", "Good Manners": "Good Manners", "Numbers": "Numbers", "Spelling": "Spelling", "Review": "Review", "Transport": "Transport", "Letters": "Letters", "Phonics": "Phonics", "Speaking": "Speaking", "Reading": "Reading", "Grammar": "Grammar", "Alphabet": "Alphabet", "There is / There are": "There is / There are", "Singular & Plural": "Singular & Plural"}, "ar": {"Vocabulary": "المفردات", "Feelings": "المشاعر", "School Vocabulary": "مفردات المدرسة", "Body Parts": "أجزاء الجسم", "Colors": "الألوان", "Shapes": "الأشكال", "Food": "الطعام", "Good Manners": "السلوكيات الجيدة", "Numbers": "الأرقام", "Spelling": "التهجئة", "Review": "المراجعة", "Transport": "المواصلات", "Letters": "الحروف", "Phonics": "الأصوات", "Speaking": "التحدث", "Reading": "القراءة", "Grammar": "القواعد", "Alphabet": "الحروف", "There is / There are": "هناك مفرد / جمع", "Singular & Plural": "المفرد والجمع"}};
const adviceMap = {"en": {"Phonics": "Focus on letter sounds like A, E, and I with short picture words.", "Vocabulary": "Review picture words and name objects around the home every day.", "Reading": "Read one short sentence and two picture words every day.", "Speaking": "Use greetings and short polite sentences in English daily.", "Grammar": "Practice one thing / many things and simple sentence forms.", "Alphabet": "Revise letter names and order with songs and flashcards.", "There is / There are": "Practice using There is for one thing and There are for many things.", "Singular & Plural": "Practice one book / two books and one cat / two cats.", "Body Parts": "Point to body parts and say their names in English.", "Feelings": "Use happy, sad, angry, and sleepy in daily speaking.", "Colors": "Name colors in clothes, toys, and books.", "Shapes": "Find circles, squares, and triangles at home.", "Food": "Revise food words like fruits, vegetables, chicken, and meat with pictures.", "Good Manners": "Practice polite actions like wash your hands, say please, and take your seat.", "Numbers": "Count objects and revise number words every day.", "Spelling": "Practice one missing-letter word at a time with clear picture clues.", "Review": "Go back to the review pages and revise the core words again."}, "ar": {"Phonics": "ركز على أصوات الحروف مثل A و E و I مع كلمات وصور قصيرة.", "Vocabulary": "راجع كلمات الصور وسمِّ الأشياء الموجودة في البيت كل يوم.", "Reading": "اقرأ جملة قصيرة وكلمتين من كلمات الصور يوميًا.", "Speaking": "استخدم التحيات والجمل المهذبة القصيرة بالإنجليزية كل يوم.", "Grammar": "تدرّب على المفرد والجمع وعلى تكوين الجملة البسيطة.", "Alphabet": "راجع أسماء الحروف وترتيبها بالأغاني والبطاقات.", "There is / There are": "تدرّب على استخدام There is للمفرد و There are للجمع.", "Singular & Plural": "تدرّب على one book / two books و one cat / two cats.", "Body Parts": "أشر إلى أجزاء الجسم وقل أسماءها بالإنجليزية.", "Feelings": "استخدم happy و sad و angry و sleepy في الحديث اليومي.", "Colors": "سمِّ الألوان في الملابس والألعاب والكتب.", "Shapes": "ابحث عن الدائرة والمربع والمثلث في البيت.", "Food": "راجع كلمات الطعام مثل fruits و vegetables و chicken و meat بالصور.", "Good Manners": "تدرّب على السلوكيات الجيدة مثل wash your hands و say please و take your seat.", "Numbers": "عدّ الأشياء وراجع كلمات الأرقام كل يوم.", "Spelling": "تدرّب على كلمة واحدة ناقصة الحرف في كل مرة مع صورة واضحة.", "Review": "ارجع إلى صفحات المراجعة وراجع الكلمات الأساسية مرة أخرى."}};
const baseQuestionPools = {"kg1": [{"grade": "KG1", "skill": "Feelings", "type": "Picture", "text": "How does the child feel?", "options": ["Happy", "Sad", "Angry", "Sleepy"], "answer": "Happy", "image": "happy.svg", "difficulty": 1, "note": "Feeling words"}, {"grade": "KG1", "skill": "Feelings", "type": "Picture", "text": "How does the face feel?", "options": ["Sad", "Happy", "Hungry", "Hot"], "answer": "Sad", "image": "sad.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Vocabulary", "type": "Picture", "text": "What animal is this?", "options": ["Cat", "Rat", "Horse", "Dog"], "answer": "Cat", "image": "cat.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Vocabulary", "type": "Picture", "text": "What is this?", "options": ["Apple", "Ball", "Book", "Bag"], "answer": "Apple", "image": "apple.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "School Vocabulary", "type": "Picture", "text": "What is this school item?", "options": ["Book", "Apple", "Bus", "Cat"], "answer": "Book", "image": "book.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "School Vocabulary", "type": "Picture", "text": "What do we carry to school?", "options": ["School bag", "Ball", "Tree", "Dog"], "answer": "School bag", "image": "school-bag.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Body Parts", "type": "Choice", "text": "Which part helps you see?", "options": ["Eyes", "Nose", "Hands", "Feet"], "answer": "Eyes", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Body Parts", "type": "Choice", "text": "Which part helps you hear?", "options": ["Ears", "Eyes", "Knees", "Hair"], "answer": "Ears", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Colors", "type": "Choice", "text": "What color is the apple?", "options": ["Red", "Blue", "Black", "Purple"], "answer": "Red", "image": "apple.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Colors", "type": "Choice", "text": "What color is the school bus?", "options": ["Yellow", "Pink", "Gray", "Brown"], "answer": "Yellow", "image": "bus.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Shapes", "type": "Picture", "text": "How many sides does a triangle have?", "options": ["3", "2", "4", "5"], "answer": "3", "image": "triangle.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Shapes", "type": "Choice", "text": "Which shape has 3 sides?", "options": ["Circle", "Square", "Triangle", "Rectangle"], "answer": "Triangle", "image": "triangle.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Phonics", "type": "Choice", "text": "Which word starts with the sound /b/?", "options": ["Ball", "Apple", "Cat", "Dog"], "answer": "Ball", "image": "ball.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Phonics", "type": "Choice", "text": "Which word starts with the sound /c/?", "options": ["Cat", "Bus", "Apple", "Book"], "answer": "Cat", "image": "cat.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Phonics", "type": "Choice", "text": "Which word starts with the sound /a/?", "options": ["Apple", "Book", "Dog", "Ball"], "answer": "Apple", "image": "apple.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Alphabet", "type": "Choice", "text": "What letter comes after A?", "options": ["B", "C", "D", "Z"], "answer": "B", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Alphabet", "type": "Choice", "text": "What letter comes after B?", "options": ["C", "D", "E", "A"], "answer": "C", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Alphabet", "type": "Choice", "text": "Which letter is missing? A, B, __, D", "options": ["E", "C", "F", "A"], "answer": "C", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Reading", "type": "Choice", "text": "Choose the correct word for the picture.", "options": ["cat", "dog", "book", "ball"], "answer": "cat", "image": "cat.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Reading", "type": "Choice", "text": "Choose the correct word.", "options": ["apple", "bus", "book", "bag"], "answer": "apple", "image": "apple.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Speaking", "type": "Choice", "text": "What do you say in the morning?", "options": ["Good morning", "Good night", "Bye bye", "Thank you"], "answer": "Good morning", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Speaking", "type": "Choice", "text": "What do you say when you leave?", "options": ["Goodbye", "Hello", "Apple", "Blue"], "answer": "Goodbye", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Vocabulary", "type": "Choice", "text": "Which animal says meow?", "options": ["Cat", "Dog", "Cow", "Duck"], "answer": "Cat", "image": "cat.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Vocabulary", "type": "Choice", "text": "Which animal says woof?", "options": ["Dog", "Cat", "Fish", "Bird"], "answer": "Dog", "image": "dog.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Vocabulary", "type": "Choice", "text": "What do we read?", "options": ["Book", "Ball", "Bus", "Apple"], "answer": "Book", "image": "book.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Vocabulary", "type": "Choice", "text": "What do you throw and catch?", "options": ["Ball", "Book", "Apple", "Bag"], "answer": "Ball", "image": "ball.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Grammar", "type": "TrueFalse", "text": "This is a cat. Is this sentence correct for one cat?", "options": ["True", "False"], "answer": "True", "image": "cat.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Grammar", "type": "TrueFalse", "text": "We say an apple. Is this correct?", "options": ["True", "False"], "answer": "True", "image": "apple.svg", "difficulty": 2, "note": ""}, {"grade": "KG1", "skill": "Reading", "type": "Choice", "text": "Choose the first letter in dog.", "options": ["D", "G", "O", "B"], "answer": "D", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Reading", "type": "Choice", "text": "Choose the first letter in book.", "options": ["B", "D", "K", "C"], "answer": "B", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "School Vocabulary", "type": "Choice", "text": "Where do children learn?", "options": ["At school", "At the zoo", "At the beach", "On the bus"], "answer": "At school", "image": "school.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "School Vocabulary", "type": "Choice", "text": "Which one is a classroom thing?", "options": ["Book", "Fish", "Train", "Tree"], "answer": "Book", "image": "book.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Colors", "type": "Choice", "text": "What color is grass?", "options": ["Green", "Blue", "Pink", "Black"], "answer": "Green", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Colors", "type": "Choice", "text": "What color is the sky?", "options": ["Blue", "Brown", "Orange", "Gray"], "answer": "Blue", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Speaking", "type": "Choice", "text": "How do you answer: What is your name?", "options": ["My name is ...", "I am blue", "I have a ball", "There are two"], "answer": "My name is ...", "image": null, "difficulty": 2, "note": ""}, {"grade": "KG1", "skill": "Phonics", "type": "Choice", "text": "Which word starts like sun?", "options": ["Star", "Apple", "Dog", "Book"], "answer": "Star", "image": null, "difficulty": 2, "note": ""}, {"grade": "KG1", "skill": "Body Parts", "type": "Choice", "text": "Which part helps you walk?", "options": ["Feet", "Eyes", "Hair", "Mouth"], "answer": "Feet", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Body Parts", "type": "Choice", "text": "Which part helps you eat?", "options": ["Mouth", "Arm", "Leg", "Ear"], "answer": "Mouth", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Vocabulary", "type": "TrueFalse", "text": "There is an apple. Is this sentence correct for one apple?", "options": ["True", "False"], "answer": "True", "image": "apple.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Singular & Plural", "type": "Choice", "text": "One cat, two ...", "options": ["catts", "cats", "cat", "cates"], "answer": "cats", "image": "cat.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Alphabet", "type": "TrueFalse", "text": "Lemon starts with the letter L.", "options": ["True", "False"], "answer": "True", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Singular & Plural", "type": "Choice", "text": "One book, two ...", "options": ["bookes", "books", "book", "bookies"], "answer": "books", "image": "book.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "There is / There are", "type": "Choice", "text": "We use There is with ...", "options": ["Many things", "One thing", "Both", "None"], "answer": "One thing", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Singular & Plural", "type": "Choice", "text": "We use ___ when we talk about more than one thing.", "options": ["None", "Singular", "Plural", "Both"], "answer": "Plural", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Alphabet", "type": "TrueFalse", "text": "House starts with the letter H.", "options": ["True", "False"], "answer": "True", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Alphabet", "type": "Choice", "text": "What letter does Apple start with?", "options": ["A", "C", "B", "D"], "answer": "A", "image": "apple.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Singular & Plural", "type": "Choice", "text": "One car, three ...", "options": ["cars", "carres", "caros", "car"], "answer": "cars", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Alphabet", "type": "TrueFalse", "text": "Star starts with the letter S.", "options": ["True", "False"], "answer": "True", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Alphabet", "type": "Choice", "text": "Cat starts with the letter ...", "options": ["B", "A", "D", "C"], "answer": "C", "image": "cat.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Singular & Plural", "type": "Choice", "text": "We use ___ when we talk about one thing.", "options": ["Singular", "None", "Both", "Plural"], "answer": "Singular", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Alphabet", "type": "Choice", "text": "Ice cream starts with the letter ...", "options": ["H", "I", "A", "J"], "answer": "I", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "There is / There are", "type": "Choice", "text": "There ___ one ball.", "options": ["be", "am", "are", "is"], "answer": "is", "image": "ball.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Singular & Plural", "type": "Choice", "text": "One apple, many ...", "options": ["applys", "apples", "applees", "apple"], "answer": "apples", "image": "apple.svg", "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Alphabet", "type": "TrueFalse", "text": "Duck starts with the letter D.", "options": ["True", "False"], "answer": "True", "image": null, "difficulty": 1, "note": ""}, {"grade": "KG1", "skill": "Alphabet", "type": "Choice", "text": "B is for something you play with.", "options": ["Bus", "Banana", "Ball", "Book"], "answer": "Ball", "image": "ball.svg", "difficulty": 1, "note": ""}], "kg2": [{"grade": "KG2", "skill": "Vocabulary", "type": "Picture", "text": "What is this fruit?", "options": ["Orange", "Carrots", "Banana", "Meat"], "answer": "Orange", "image": "orange.svg", "difficulty": 1, "note": "Step Ahead Unit 1"}, {"grade": "KG2", "skill": "Vocabulary", "type": "Picture", "text": "What are these vegetables?", "options": ["Cucumbers", "Bananas", "Chickens", "Apricots"], "answer": "Cucumbers", "image": "cucumbers.svg", "difficulty": 1, "note": "Step Ahead Unit 1"}, {"grade": "KG2", "skill": "Vocabulary", "type": "Picture", "text": "What is this healthy food?", "options": ["Chicken", "Truck", "Tooth", "Head"], "answer": "Chicken", "image": "chicken.svg", "difficulty": 1, "note": "Step Ahead Unit 1"}, {"grade": "KG2", "skill": "Vocabulary", "type": "Picture", "text": "What are these orange vegetables?", "options": ["Carrots", "Meat", "Hippos", "Trucks"], "answer": "Carrots", "image": "carrots.svg", "difficulty": 1, "note": "Step Ahead Unit 1"}, {"grade": "KG2", "skill": "Vocabulary", "type": "Picture", "text": "What fruit is this?", "options": ["Banana", "Orange", "Apricot", "Head"], "answer": "Banana", "image": "banana.svg", "difficulty": 1, "note": "Step Ahead Unit 1"}, {"grade": "KG2", "skill": "Vocabulary", "type": "Picture", "text": "What food is this?", "options": ["Meat", "Healthy", "Truck", "Alligator"], "answer": "Meat", "image": "meat.svg", "difficulty": 1, "note": "Step Ahead Unit 1"}, {"grade": "KG2", "skill": "Reading", "type": "TrueFalse", "text": "Fruits are healthy.", "options": ["True", "False"], "answer": "True", "image": "healthy.svg", "difficulty": 1, "note": "Step Ahead Unit 1"}, {"grade": "KG2", "skill": "Reading", "type": "TrueFalse", "text": "Vegetables are healthy, too.", "options": ["True", "False"], "answer": "True", "image": "carrots.svg", "difficulty": 1, "note": "Step Ahead Unit 1"}, {"grade": "KG2", "skill": "Reading", "type": "Choice", "text": "Complete the sentence: I like _____.", "options": ["oranges", "truck", "head", "seat"], "answer": "oranges", "image": "orange.svg", "difficulty": 1, "note": "Language in use"}, {"grade": "KG2", "skill": "Reading", "type": "Choice", "text": "Complete the sentence: I eat _____.", "options": ["carrots", "hippo", "tooth", "truck"], "answer": "carrots", "image": "carrots.svg", "difficulty": 1, "note": "Language in use"}, {"grade": "KG2", "skill": "Grammar", "type": "Choice", "text": "Choose the correct sentence.", "options": ["Apples are red.", "Apples is red.", "Apples am red.", "Apple are red."], "answer": "Apples are red.", "image": "apple.svg", "difficulty": 2, "note": "Language in use"}, {"grade": "KG2", "skill": "Vocabulary", "type": "Choice", "text": "Choose the healthy food.", "options": ["Fruits", "Rocks", "Shoes", "Clock"], "answer": "Fruits", "image": "food.svg", "difficulty": 1, "note": "Step Ahead Unit 1"}, {"grade": "KG2", "skill": "Spelling", "type": "Choice", "text": "Write the missing letter: fru_ts", "options": ["i", "a", "o", "u"], "answer": "i", "image": "food.svg", "difficulty": 2, "note": "Page 13"}, {"grade": "KG2", "skill": "Spelling", "type": "Choice", "text": "Write the missing letter: cu_umbers", "options": ["c", "k", "m", "t"], "answer": "c", "image": "cucumbers.svg", "difficulty": 2, "note": "Page 13"}, {"grade": "KG2", "skill": "Spelling", "type": "Choice", "text": "Write the missing letter: chi_ken", "options": ["i", "o", "e", "a"], "answer": "i", "image": "chicken.svg", "difficulty": 2, "note": "Page 13"}, {"grade": "KG2", "skill": "Spelling", "type": "Choice", "text": "Write the missing letter: hea_thy", "options": ["l", "a", "i", "o"], "answer": "l", "image": "healthy.svg", "difficulty": 2, "note": "Page 13"}, {"grade": "KG2", "skill": "Spelling", "type": "Choice", "text": "Rearrange the letters: ongrae", "options": ["orange", "oragne", "groane", "ongera"], "answer": "orange", "image": "orange.svg", "difficulty": 2, "note": "Page 13"}, {"grade": "KG2", "skill": "Spelling", "type": "Choice", "text": "Rearrange the letters: eamt", "options": ["meat", "team", "mate", "tame"], "answer": "meat", "image": "meat.svg", "difficulty": 2, "note": "Page 13"}, {"grade": "KG2", "skill": "Phonics", "type": "Choice", "text": "Which A word matches the picture?", "options": ["Alligator", "Truck", "Head", "Hippo"], "answer": "Alligator", "image": "alligator.svg", "difficulty": 1, "note": "Aa phonics"}, {"grade": "KG2", "skill": "Phonics", "type": "Choice", "text": "Which A food word matches the picture?", "options": ["Apricot", "Truck", "Tooth", "Head"], "answer": "Apricot", "image": "apricot.svg", "difficulty": 1, "note": "Aa phonics"}, {"grade": "KG2", "skill": "Phonics", "type": "Choice", "text": "Which T word matches the picture?", "options": ["Tooth", "Head", "Hippo", "Alligator"], "answer": "Tooth", "image": "tooth.svg", "difficulty": 1, "note": "Tt phonics"}, {"grade": "KG2", "skill": "Phonics", "type": "Choice", "text": "Which T transport word matches the picture?", "options": ["Truck", "Apricot", "Hippo", "Banana"], "answer": "Truck", "image": "truck.svg", "difficulty": 1, "note": "Tt phonics"}, {"grade": "KG2", "skill": "Phonics", "type": "Choice", "text": "Which H body word matches the picture?", "options": ["Head", "Truck", "Alligator", "Tooth"], "answer": "Head", "image": "head.svg", "difficulty": 1, "note": "Hh phonics"}, {"grade": "KG2", "skill": "Phonics", "type": "Choice", "text": "Which H animal word matches the picture?", "options": ["Hippo", "Apricot", "Cucumbers", "Orange"], "answer": "Hippo", "image": "hippo.svg", "difficulty": 1, "note": "Hh phonics"}, {"grade": "KG2", "skill": "Spelling", "type": "Choice", "text": "Write the missing first letter: __lligator", "options": ["A", "T", "H", "O"], "answer": "A", "image": "alligator.svg", "difficulty": 2, "note": "Page 21"}, {"grade": "KG2", "skill": "Spelling", "type": "Choice", "text": "Write the missing first letter: __ooth", "options": ["T", "H", "A", "M"], "answer": "T", "image": "tooth.svg", "difficulty": 2, "note": "Page 21"}, {"grade": "KG2", "skill": "Spelling", "type": "Choice", "text": "Write the missing first letter: __ippo", "options": ["H", "T", "A", "C"], "answer": "H", "image": "hippo.svg", "difficulty": 2, "note": "Page 21"}, {"grade": "KG2", "skill": "Spelling", "type": "Choice", "text": "Write the missing first letter: __ruck", "options": ["T", "H", "A", "B"], "answer": "T", "image": "truck.svg", "difficulty": 2, "note": "Page 21"}, {"grade": "KG2", "skill": "Numbers", "type": "Choice", "text": "Which number is eleven?", "options": ["11", "12", "13", "10"], "answer": "11", "image": null, "difficulty": 1, "note": "Page 16"}, {"grade": "KG2", "skill": "Numbers", "type": "Choice", "text": "Which number is twelve?", "options": ["12", "11", "10", "9"], "answer": "12", "image": null, "difficulty": 1, "note": "Page 16"}, {"grade": "KG2", "skill": "Numbers", "type": "TrueFalse", "text": "I see 11 oranges.", "options": ["True", "False"], "answer": "True", "image": "orange.svg", "difficulty": 1, "note": "Page 17"}, {"grade": "KG2", "skill": "Numbers", "type": "TrueFalse", "text": "I see 12 carrots.", "options": ["True", "False"], "answer": "True", "image": "carrots.svg", "difficulty": 1, "note": "Page 17"}, {"grade": "KG2", "skill": "Good Manners", "type": "Choice", "text": "What should you do before and after eating?", "options": ["Wash your hands", "Jump high", "Run fast", "Sleep"], "answer": "Wash your hands", "image": "wash.svg", "difficulty": 1, "note": "Lesson 3"}, {"grade": "KG2", "skill": "Good Manners", "type": "Choice", "text": "Which sentence is polite?", "options": ["Say please", "Throw food", "Shout loudly", "Push friends"], "answer": "Say please", "image": "please.svg", "difficulty": 1, "note": "Lesson 3"}, {"grade": "KG2", "skill": "Good Manners", "type": "Choice", "text": "What is the good action?", "options": ["Take your seat", "Waste food", "Skip washing", "Be rude"], "answer": "Take your seat", "image": "seat.svg", "difficulty": 1, "note": "Lesson 3"}, {"grade": "KG2", "skill": "Good Manners", "type": "TrueFalse", "text": "Don’t waste food.", "options": ["True", "False"], "answer": "True", "image": "food.svg", "difficulty": 1, "note": "Lesson 3"}, {"grade": "KG2", "skill": "Good Manners", "type": "TrueFalse", "text": "Eat slowly.", "options": ["True", "False"], "answer": "True", "image": "food.svg", "difficulty": 1, "note": "Lesson 3"}, {"grade": "KG2", "skill": "Reading", "type": "Choice", "text": "Hesham likes ____ most.", "options": ["oranges", "trucks", "books", "chairs"], "answer": "oranges", "image": "orange.svg", "difficulty": 2, "note": "Story page 25"}, {"grade": "KG2", "skill": "Reading", "type": "Choice", "text": "Amina likes _____.", "options": ["fruits", "trucks", "chairs", "cats"], "answer": "fruits", "image": "food.svg", "difficulty": 2, "note": "Story page 25"}, {"grade": "KG2", "skill": "Reading", "type": "Choice", "text": "Hesham also likes vegetables. Which ones are named in the story?", "options": ["cucumbers and carrots", "bananas and oranges", "meat and chicken", "head and tooth"], "answer": "cucumbers and carrots", "image": "cucumbers.svg", "difficulty": 3, "note": "Story page 25"}, {"grade": "KG2", "skill": "Reading", "type": "TrueFalse", "text": "Fruits and vegetables make us strong.", "options": ["True", "False"], "answer": "True", "image": "healthy.svg", "difficulty": 2, "note": "Story page 25"}, {"grade": "KG2", "skill": "Good Manners", "type": "Choice", "text": "Complete the sentence: Say please and ____ you.", "options": ["thank", "eat", "run", "jump"], "answer": "thank", "image": "please.svg", "difficulty": 2, "note": "Page 24"}, {"grade": "KG2", "skill": "Spelling", "type": "Choice", "text": "Write the missing letter: fo_d", "options": ["o", "a", "e", "u"], "answer": "o", "image": "food.svg", "difficulty": 2, "note": "Page 29"}, {"grade": "KG2", "skill": "Spelling", "type": "Choice", "text": "Write the missing letter: wa_h", "options": ["s", "t", "r", "n"], "answer": "s", "image": "wash.svg", "difficulty": 2, "note": "Page 29"}, {"grade": "KG2", "skill": "Spelling", "type": "Choice", "text": "Write the missing letter: p_ease", "options": ["l", "r", "n", "t"], "answer": "l", "image": "please.svg", "difficulty": 2, "note": "Page 29"}, {"grade": "KG2", "skill": "Review", "type": "Choice", "text": "Choose the review word that starts with H.", "options": ["head", "banana", "orange", "truck"], "answer": "head", "image": "head.svg", "difficulty": 1, "note": "Review 1"}, {"grade": "KG2", "skill": "Review", "type": "Choice", "text": "Choose the review word that starts with T.", "options": ["tooth", "apricot", "alligator", "hippo"], "answer": "tooth", "image": "tooth.svg", "difficulty": 1, "note": "Review 1"}, {"grade": "KG2", "skill": "Food", "type": "Choice", "text": "Which food is a fruit?", "options": ["Orange", "Truck", "Tooth", "Seat"], "answer": "Orange", "image": "orange.svg", "difficulty": 1, "note": "Unit 1 review"}, {"grade": "KG2", "skill": "Food", "type": "Choice", "text": "Which food is meat?", "options": ["Chicken", "Truck", "Hippo", "Head"], "answer": "Chicken", "image": "chicken.svg", "difficulty": 1, "note": "Unit 1 review"}, {"grade": "KG2", "skill": "Numbers", "type": "Choice", "text": "What comes after 11?", "options": ["12", "10", "13", "9"], "answer": "12", "image": null, "difficulty": 1, "note": "Numbers review"}, {"grade": "KG2", "skill": "Good Manners", "type": "Choice", "text": "Which action is polite at the table?", "options": ["Eat slowly", "Waste food", "Shout loudly", "Throw food"], "answer": "Eat slowly", "image": "food.svg", "difficulty": 1, "note": "Lesson 3 review"}, {"grade": "KG2", "skill": "Reading", "type": "TrueFalse", "text": "Chicken and meat are healthy.", "options": ["True", "False"], "answer": "True", "image": "meat.svg", "difficulty": 2, "note": "Page 7"}]};

const ADMINS = [{user:'Dr. Tarek', pass:'T01032188008'},{user:'HITMAN', pass:'01002439054'}];
const typeLabels = {en:{Choice:'Choice', TrueFalse:'True or False', Picture:'Picture'}, ar:{Choice:'اختر', TrueFalse:'صح أم خطأ', Picture:'صورة'}};

translations.en.bulkQuestionsTitle='Bulk Question Import';
translations.en.bulkQuestionsInfo='Download the ready Excel form, fill it with questions, then upload it to add many questions at once.';
translations.en.downloadExcelForm='Download Excel Form';
translations.en.downloadCurrentQuestions='Download Current Questions';
translations.en.uploadFilledForm='Upload Filled Form';
translations.en.accessAccounts='Access Accounts';
translations.en.accessAccountsInfo='Create admin or user accounts. User accounts only see the sections you allow.';
translations.en.saveAccessAccount='Save Account';
translations.en.collapseEditor='Collapse';
translations.en.expandEditor='Expand';
translations.en.collapseQuestions='Collapse Questions';
translations.en.expandQuestions='Expand Questions';
translations.en.permissionDashboard='Dashboard';
translations.en.permissionLevelVisibility='Level Visibility';
translations.en.permissionTimerSettings='Timer Settings';
translations.en.permissionQuizAccess='Quiz Password';
translations.en.permissionTeacherTest='Teacher Test Builder';
translations.en.permissionBulkQuestions='Bulk Question Import';
translations.en.permissionQuestionBank='Question Bank Editor';
translations.en.permissionAccountManager='Access Accounts';
translations.en.username='Username';
translations.en.userRole='Role';
translations.en.user='User';
translations.en.admin='Admin';
translations.en.deleteAccount='Delete';
translations.en.noExtraAccounts='No saved accounts yet.';
translations.ar.bulkQuestionsTitle='استيراد أسئلة بالجملة';
translations.ar.bulkQuestionsInfo='حمّل نموذج الإكسل الجاهز ثم املأه بالأسئلة وارفعه لإضافة عدد كبير من الأسئلة دفعة واحدة.';
translations.ar.downloadExcelForm='تحميل نموذج الإكسل';
translations.ar.downloadCurrentQuestions='تحميل الأسئلة الحالية';
translations.ar.uploadFilledForm='رفع النموذج المعبأ';
translations.ar.accessAccounts='حسابات الوصول';
translations.ar.accessAccountsInfo='أنشئ حسابات مشرف أو مستخدم. المستخدم يرى فقط الأقسام التي تسمح بها.';
translations.ar.saveAccessAccount='حفظ الحساب';
translations.ar.collapseEditor='طي';
translations.ar.expandEditor='فتح';
translations.ar.collapseQuestions='طي الأسئلة';
translations.ar.expandQuestions='فتح الأسئلة';
translations.ar.permissionDashboard='النتائج';
translations.ar.permissionLevelVisibility='إظهار المستويات';
translations.ar.permissionTimerSettings='إعدادات المؤقت';
translations.ar.permissionQuizAccess='كلمة مرور الاختبار';
translations.ar.permissionTeacherTest='منشئ اختبار المعلم';
translations.ar.permissionBulkQuestions='استيراد أسئلة بالجملة';
translations.ar.permissionQuestionBank='محرر بنك الأسئلة';
translations.ar.permissionAccountManager='حسابات الوصول';
translations.ar.username='اسم المستخدم';
translations.ar.userRole='الدور';
translations.ar.user='مستخدم';
translations.ar.admin='مشرف';
translations.ar.deleteAccount='حذف';
translations.ar.noExtraAccounts='لا توجد حسابات محفوظة بعد.';


function normalizeQuestion(question){
  if (!question || !Array.isArray(question.options)) return null;
  const clean = {...question};
  clean.options = question.options.map(opt => String(opt).trim()).filter(Boolean);
  clean.answer = String(question.answer ?? '').trim();
  clean.text = String(question.text ?? '').trim();
  if (!clean.text || !clean.options.length || !clean.answer) return null;
  if (!clean.options.includes(clean.answer)) {
    const ci = clean.options.find(opt => opt.toLowerCase() === clean.answer.toLowerCase());
    if (ci) clean.answer = ci;
  }
  if (!clean.options.includes(clean.answer)) return null;
  return clean;
}
function sanitizedPool(grade){
  const pool = allQuestionsFor(grade).map(normalizeQuestion).filter(Boolean);
  const seen = new Set();
  return pool.filter(q => {
    const key = questionSignature(q);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const storeKeys = {
  lang:'kgAppLang',
  progress:'kgEnglishProgressV7',
  records:'kgEnglishStudentRecordsV7',
  analytics:'kgEnglishAnalyticsV7',
  cert:'kgEnglishCertificateV7',
  customQuestions:'kgEnglishCustomQuestionsV7',
  questionOverrides:'kgEnglishQuestionOverridesV7',
  levelVisibility:'kgEnglishLevelVisibilityV7',
  attemptsLog:'kgEnglishAttemptsLogV22',
  timerSettings:'kgEnglishTimerSettingsV23',
  quizAccess:'kgEnglishQuizAccessV23',
  teacherTests:'kgEnglishTeacherTestsV23',
  studentRotation:'kgEnglishStudentRotationV23',
  accessAccounts:'kgEnglishAccessAccountsV26'
};
function $(sel, root=document){ return root.querySelector(sel); }
function shuffle(arr){ return arr.map(v=>({v,s:Math.random()})).sort((a,b)=>a.s-b.s).map(x=>x.v); }
function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
function getLang(){ return localStorage.getItem(storeKeys.lang) || 'en'; }
function setLang(lang){ localStorage.setItem(storeKeys.lang, lang); document.body.dataset.lang = lang; document.documentElement.lang = lang === 'ar' ? 'ar' : 'en'; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang)); applyTranslations(); if (document.body.dataset.page === 'home') renderHomeProgress(); if (document.body.dataset.page === 'certificate') renderCertificate(); }
function applyTranslations(){
  const lang = getLang();
  document.querySelectorAll('[data-i18n]').forEach(el=>{ const key = el.dataset.i18n; if (translations[lang] && translations[lang][key] !== undefined) el.textContent = translations[lang][key]; });
  document.querySelectorAll('[data-placeholder-i18n]').forEach(el=>{ const key = el.dataset.placeholderI18n; if (translations[lang] && translations[lang][key] !== undefined) el.placeholder = translations[lang][key]; });
  document.querySelectorAll('option[data-i18n]').forEach(el=>{ const key = el.dataset.i18n; if (translations[lang] && translations[lang][key] !== undefined) el.textContent = translations[lang][key]; });
  if(document.getElementById('accessAccountRole')) renderAccessPermissions(Array.from(document.querySelectorAll('.perm-check:checked')).map(el=>el.value));
  if(document.getElementById('teacherQuestionPickerWrap')) renderTeacherQuestionPicker(); wireCollapseButtons(); wireQuestionFilterButtons(); const cm=document.querySelector('[data-section-key="classManager"]'); if(cm){ cm.classList.remove('hidden'); cm.style.display=''; }
  if (document.body.dataset.page === 'home') document.title = translations[lang].homeTitle;
}
function initLangButtons(){ document.querySelectorAll('.lang-btn').forEach(btn=>btn.addEventListener('click', ()=> setLang(btn.dataset.lang))); setLang(getLang()); }
function readJson(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
function writeJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function getProgress(){ return readJson(storeKeys.progress, {}); }
function getRecords(){ return readJson(storeKeys.records, {}); }
function getAnalytics(){ return readJson(storeKeys.analytics, {questionMisses:{}, skillMisses:{}}); }
function getCustomQuestions(){ return readJson(storeKeys.customQuestions, {kg1:[], kg2:[]}); }
function getQuestionOverrides(){ return readJson(storeKeys.questionOverrides, {}); }
function getLevelVisibility(){ return readJson(storeKeys.levelVisibility, {kg1:[10,20,30,40,50], kg2:[10,20,30,40,50]}); }
function setLevelVisibility(value){ writeJson(storeKeys.levelVisibility, value); }
function getTimerSettings(){ return readJson(storeKeys.timerSettings, {kg1:true, kg2:true}); }
function setTimerSettings(value){ writeJson(storeKeys.timerSettings, value); }
function getAttemptsLog(){ return readJson(storeKeys.attemptsLog, []); }
function setAttemptsLog(value){ writeJson(storeKeys.attemptsLog, value); }

function getQuizAccess(){ return readJson(storeKeys.quizAccess, {kg1:{enabled:false,password:''}, kg2:{enabled:false,password:''}}); }
function setQuizAccess(value){ writeJson(storeKeys.quizAccess, value); }
function getTeacherTests(){ return readJson(storeKeys.teacherTests, {kg1:null, kg2:null}); }
function setTeacherTests(value){ writeJson(storeKeys.teacherTests, value); }
function getStudentRotation(){ return readJson(storeKeys.studentRotation, {}); }
function setStudentRotation(value){ writeJson(storeKeys.studentRotation, value); }

function getAccessAccounts(){ return readJson(storeKeys.accessAccounts, []); }
function setAccessAccounts(value){ writeJson(storeKeys.accessAccounts, value); }
const PERMISSIONS = ['dashboard','levelVisibility','timerSettings','quizAccess','teacherTest','bulkQuestions','questionBank','classManager','accountManager'];
function defaultAdminPermissions(){ return [...PERMISSIONS]; }
function getLoginAccount(user, pass){
  const builtIn = findBuiltInAdmin(user);
  const cleanPass = String(pass || '').trim();
  if (builtIn && builtIn.pass === cleanPass){
    return { user: builtIn.user, role:'admin', permissions:[...PERMISSIONS], builtIn:true, display: builtIn.display };
  }
  const accounts = getAccessAccounts();
  const match = accounts.find(acc => normalizeUserName(acc.user) === normalizeUserName(user) && String(acc.pass || '') === cleanPass);
  return match ? { ...match, builtIn:false } : null;
}
function applySectionPermissions(account){
  const perms = account?.role === 'admin' ? defaultAdminPermissions() : Array.isArray(account?.permissions) ? account.permissions : [];
  document.querySelectorAll('[data-section-key]').forEach(sec => {
    const show = perms.includes(sec.dataset.sectionKey);
    sec.classList.toggle('hidden', !show);
  });
}
function permissionLabel(key){ const lang=getLang(); const map={dashboard:'permissionDashboard',levelVisibility:'permissionLevelVisibility',timerSettings:'permissionTimerSettings',quizAccess:'permissionQuizAccess',teacherTest:'permissionTeacherTest',bulkQuestions:'permissionBulkQuestions',questionBank:'permissionQuestionBank',classManager:'classManagerTitle',accountManager:'permissionAccountManager'}; return translations[lang][map[key]] || key; }
function renderAccessPermissions(selected){
  const wrap=document.getElementById('accessPermissionsWrap'); if(!wrap) return;
  const role=(document.getElementById('accessAccountRole')?.value||'user').trim();
  if(role==='admin'){
    wrap.innerHTML='<div class="muted-note">'+(getLang()==='ar'?'المشرف يحصل على كل الصلاحيات.':'Admin gets all permissions.')+'</div>';
    return;
  }
  const set=new Set(selected||[]);
  const html = PERMISSIONS.filter(p=>p!=='accountManager').map(key=>`<label class="level-toggle admin-toggle-row"><input type="checkbox" class="perm-check" value="${key}" ${set.has(key)?'checked':''}><span>${permissionLabel(key)}</span></label>`).join('');
  wrap.innerHTML = html || `<div class="muted-note">${translations[getLang()].noPermissionsAvailable || 'No permissions available.'}</div>`;
}
function renderAccessAccountsList(){
  const box=document.getElementById('accessAccountsList'); if(!box) return;
  const accounts=getAccessAccounts();
  box.innerHTML = accounts.length ? accounts.map((a,idx)=>`<div class="account-card"><div class="meta-line"><span>${escapeHtml(a.user)}</span><span>${escapeHtml(a.role)}</span><span>${escapeHtml((a.permissions||[]).map(permissionLabel).join(', ')||'-')}</span></div><div class="account-actions"><button class="ghost-btn delete-access-account" data-idx="${idx}">${translations[getLang()].deleteAccount}</button></div></div>`).join('') : `<div class="stored-question"><h4>${translations[getLang()].noExtraAccounts}</h4></div>`;
  box.querySelectorAll('.delete-access-account').forEach(btn=>btn.onclick=()=>{ const acc=getAccessAccounts(); acc.splice(Number(btn.dataset.idx),1); setAccessAccounts(acc); renderAccessAccountsList(); });
}
function saveAccessAccountFromAdmin(){
  try{
    const user = normalizeUserName(document.getElementById('accessAccountUser')?.value || '');
    const pass = String(document.getElementById('accessAccountPass')?.value || '').trim();
    const role = (document.getElementById('accessAccountRole')?.value || 'user').trim();
    if (!user || !pass){
      alert(translations[getLang()].usernamePasswordRequired || 'Please enter username and password.');
      return;
    }
    const permissions = role === 'admin' ? [...PERMISSIONS] : Array.from(document.querySelectorAll('.perm-check:checked')).map(el => el.value);
        if (role !== 'admin' && permissions.length === 0){
      alert(translations[getLang()].chooseOnePermission || 'Please choose at least one permission.');
      return;
    }
    const accounts = getAccessAccounts();
    const idx = accounts.findIndex(acc => normalizeUserName(acc.user) === user);
    const payload = { user, pass, role, permissions };
    if (idx >= 0) accounts[idx] = payload; else accounts.push(payload);
    setAccessAccounts(accounts);
    renderAccessAccountsList();
    const userEl = document.getElementById('accessAccountUser'); if (userEl) userEl.value = '';
    const passEl = document.getElementById('accessAccountPass'); if (passEl) passEl.value = '';
    const roleEl = document.getElementById('accessAccountRole'); if (roleEl) roleEl.value = 'user';
    renderAccessPermissions([]);
    alert(translations[getLang()].accountSaved || 'Account saved.');
  }catch(err){
    alert(translations[getLang()].accountSaveFailed || 'Could not save account.');
  }
}

function wireCollapseButtons(){
  const editorBtn = document.getElementById('toggleQuestionBankEditorBtn');
  if (editorBtn && !editorBtn.dataset.wired){
    editorBtn.dataset.wired = '1';
    editorBtn.addEventListener('click', ()=>toggleCollapse('questionBankEditorBody', editorBtn));
  }
}

function toggleCollapse(targetId, button){
  const box = document.getElementById(targetId);
  if (!box) return;
  const collapsed = !box.classList.contains('collapsed-body');
  if (collapsed){
    box.classList.add('collapsed-body');
    box.hidden = true;
    box.style.display = 'none';
  } else {
    box.classList.remove('collapsed-body');
    box.hidden = false;
    box.style.display = '';
  }
  if (button){
    const key = collapsed ? 'expandEditor' : 'collapseEditor';
    button.textContent = (translations[getLang()] && translations[getLang()][key]) || (collapsed ? 'Expand' : 'Collapse');
    button.setAttribute('aria-expanded', String(!collapsed));
  }
}
function downloadCurrentQuestionsExcel(){
  const rows=[]; ['kg1','kg2'].forEach(grade=>{ sanitizedPool(grade).forEach(q=> rows.push({KG:grade.toUpperCase(),Question:q.text,'Choice 1':q.options[0]||'','Choice 2':q.options[1]||'','Choice 3':q.options[2]||'','Choice 4':q.options[3]||'', 'Correct Answer':q.answer,'Skill (optional)':q.skill||'','Type (optional)':q.type||'','Image (optional)':q.image||'','Difficulty 1-3 (optional)':q.difficulty||1,'Note (optional)':q.note||''})); });
  try{
    if(typeof XLSX!=='undefined'){
      const wb=XLSX.utils.book_new(); const ws=XLSX.utils.json_to_sheet(rows); XLSX.utils.book_append_sheet(wb,ws,'Questions'); XLSX.writeFile(wb,'current-questions.xlsx'); return;
    }
    alert(translations[getLang()].excelLibraryMissingCsv || 'Excel library not loaded. Downloading CSV instead.');
    const headers = Object.keys(rows[0] || {KG:'',Question:'','Choice 1':'','Choice 2':'','Choice 3':'','Choice 4':'','Correct Answer':'','Skill (optional)':'','Type (optional)':'','Image (optional)':'','Difficulty 1-3 (optional)':'','Note (optional)':''});
    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(String(r[h] ?? ''))).join(','))).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'current-questions.csv'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1500);
  }catch(err){
    alert(translations[getLang()].downloadQuestionsFailed || 'Could not download current questions.');
  }
}
function importBulkQuestionsFromWorkbook(file){
  if(typeof XLSX==='undefined'){ alert('Excel library not loaded.'); return; }
  const reader=new FileReader();
  reader.onload=(e)=>{
    try{
      const wb=XLSX.read(e.target.result,{type:'binary'}); const sheet=wb.Sheets[wb.SheetNames[0]]; const rows=XLSX.utils.sheet_to_json(sheet,{defval:''});
      const custom=getCustomQuestions(); let added=0; let skipped=0;
      rows.forEach(r=>{
        const grade=String(r['KG']||r['Grade']||'').trim().toLowerCase();
        const text=String(r['Question']||'').trim();
        const options=[r['Choice 1'],r['Choice 2'],r['Choice 3'],r['Choice 4']].map(v=>String(v||'').trim()).filter(Boolean);
        const answer=String(r['Correct Answer']||'').trim();
        if(!['kg1','kg2'].includes(grade)||!text||options.length<2||!answer||!options.includes(answer)){ skipped++; return; }
        custom[grade].push({grade:grade.toUpperCase(), text, options, answer, skill:String(r['Skill (optional)']||'Vocabulary').trim()||'Vocabulary', type:String(r['Type (optional)']||'Choice').trim()||'Choice', image:String(r['Image (optional)']||'').trim()||null, difficulty:clamp(Number(r['Difficulty 1-3 (optional)']||1),1,3), note:String(r['Note (optional)']||'').trim()||''}); added++; 
      });
      writeJson(storeKeys.customQuestions, custom); renderStoredQuestions(); renderTeacherQuestionPicker();
      const msg = (getLang()==='ar') ? `تمت إضافة ${added} سؤال وتخطي ${skipped}.` : `Added ${added} questions, skipped ${skipped}.`;
      const status=document.getElementById('bulkImportStatus'); if(status) status.textContent=msg; alert(msg);
    }catch(err){ alert(getLang()==='ar'?'تعذر قراءة ملف الإكسل.':'Could not read the Excel file.'); }
  };
  reader.readAsBinaryString(file);
}

function studentRotationKey(studentName, grade, count){ return `${String(studentName||'').trim().toLowerCase()}__${grade}__${count}`; }
function pickSequentialQuestionSet(pool, count, studentName, grade){
  const needed = Math.min(count, pool.length);
  const rotation = getStudentRotation();
  const key = studentRotationKey(studentName, grade, needed);
  const used = Array.isArray(rotation[key]) ? rotation[key] : [];
  const sigs = pool.map(questionSignature);
  let available = pool.filter(q => !used.includes(questionSignature(q)));
  if (available.length < needed){
    rotation[key] = [];
    available = pool.slice();
  }
  const ordered = shuffle(available.slice()).slice(0, needed);
  rotation[key] = [...new Set((rotation[key] || []).concat(ordered.map(questionSignature)))];
  setStudentRotation(rotation);
  return ordered;
}
function timerEnabledFor(grade){ const cfg = getTimerSettings(); return cfg[grade] !== false; }
function visibleLevelsFor(grade){
  const defaults = [10,20,30,40,50];
  const config = getLevelVisibility();
  const levels = Array.isArray(config[grade]) ? config[grade].filter(v => defaults.includes(v)) : defaults;
  return levels.length ? levels : defaults;
}
function applyLevelVisibilityUI(grade, root=document){
  if (!grade) return;
  const visible = new Set(visibleLevelsFor(grade));
  const buttons = [...root.querySelectorAll('.level-pick-grid .level-btn[data-count]')];
  let shown = 0;
  buttons.forEach(btn => {
    const count = Number(btn.dataset.count);
    const show = visible.has(count);
    btn.classList.toggle('hidden', !show);
    btn.disabled = !show;
    if (show) shown += 1;
  });
  const chooser = root.querySelector('#levelChooser .level-pick-grid');
  if (chooser) chooser.dataset.visibleLevels = String(shown);
}
function normalizeQuestionId(text){ return (text || "").toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
function questionId(grade, q, idx, source){ return `${grade}-${source}-${idx}-${normalizeQuestionId(q.text)}`; }
function collectQuestionsWithMeta(grade){
  const custom = getCustomQuestions();
  const base = (baseQuestionPools[grade] || []).map((q,idx)=> ({...q, _meta:{id:questionId(grade,q,idx,'base'), grade, idx, source:'base'}}));
  const extra = (custom[grade] || []).map((q,idx)=> ({...q, _meta:{id:questionId(grade,q,idx,'custom'), grade, idx, source:'custom'}}));
  return [...base, ...extra];
}
function applyQuestionOverrides(question){ const overrides = getQuestionOverrides(); const meta = question._meta || {}; const patch = overrides[meta.id] || {}; return {...question, ...patch, _meta:meta}; }
function questionSignature(q){ return [q.grade || '', q.skill || '', q.text || '', q.answer || '', q.image || ''].join('||'); }
function sanitizeQuestions(list){
  const seen = new Set();
  return (list || []).filter(q => {
    if (!q || !q.text || !Array.isArray(q.options) || !q.options.length || !q.answer) return false;
    if (!q.options.includes(q.answer)) return false;
    const sig = questionSignature(q);
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
}
function allQuestionsFor(grade){ return sanitizeQuestions(collectQuestionsWithMeta(grade).map(applyQuestionOverrides).map(({_meta,...q})=> q)); }
function badgeFor(score){ const lang = getLang(); if (score >= 85) return translations[lang].badgeMaster; if (score >= 55) return translations[lang].badgeRising; return translations[lang].badgeStarter; }
function recordStudentAttempt(data){
  const progress = getProgress(); const records = getRecords(); const analytics = getAnalytics(); const attemptsLog = getAttemptsLog();
  const key = data.studentName.trim().toLowerCase();
  const item = progress[key] || {name:data.studentName, grade:data.grade, scores:[], bestScore:0, lastScore:0, levels:[], weakTimeline:[]};
  item.name = data.studentName; item.grade = data.grade; item.scores.push(data.percent); item.bestScore = Math.max(item.bestScore, data.percent); item.lastScore = data.percent; if (!item.levels.includes(data.quizLevel)) item.levels.push(data.quizLevel); item.weakTimeline.push({date:data.date, weaknesses:data.weaknesses}); progress[key]=item;
  const r = records[key] || {name:data.studentName, grades:{}, attempts:0, best:0, last:0, weakAreas:[], history:[]};
  r.name = data.studentName; r.attempts += 1; r.best = Math.max(r.best, data.percent); r.last = data.percent; r.grade = data.grade; r.weakAreas = data.weaknesses; r.history.push({grade:data.grade, percent:data.percent, date:data.date, weaknesses:data.weaknesses || [], missedQuestions:data.missedQuestions || []}); records[key]=r;
  (data.missedQuestions || []).forEach(q => { analytics.questionMisses[q] = (analytics.questionMisses[q] || 0) + 1; });
  (data.weaknesses || []).forEach(skill => { analytics.skillMisses[skill] = (analytics.skillMisses[skill] || 0) + 1; });
  const isoDate = (()=>{ const parts=String(data.date||'').split('/'); return parts.length===3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : new Date().toISOString().slice(0,10); })();
  attemptsLog.push({studentName:data.studentName, grade:data.grade, percent:data.percent, score:data.score, quizLevel:data.quizLevel, questionCount:data.questionCount, date:data.date, isoDate, weaknesses:data.weaknesses || [], missedQuestions:data.missedQuestions || []});
  writeJson(storeKeys.progress, progress); writeJson(storeKeys.records, records); writeJson(storeKeys.analytics, analytics); writeJson(storeKeys.attemptsLog, attemptsLog);
}
function renderHomeProgress(){
  const wrap = $('#progressSummary'); if (!wrap) return; const lang = getLang(); const progress = getProgress(); const entries = Object.values(progress);
  if (!entries.length){ wrap.innerHTML = `<div class="progress-chip">${translations[lang].progressEmpty}</div>`; return; }
  const best = Math.max(...entries.map(e=>e.bestScore||0)); const last = entries.sort((a,b)=>(b.scores?.length||0)-(a.scores?.length||0))[0]?.lastScore || 0; const attempts = entries.reduce((s,e)=>s+(e.attempts||0),0); const badge = badgeFor(best);
  wrap.innerHTML = `<div class="progress-chip">${translations[lang].bestScore}<b>${best}%</b></div><div class="progress-chip">${translations[lang].lastScore}<b>${last}%</b></div><div class="progress-chip">${translations[lang].attempts}<b>${attempts}</b></div><div class="progress-chip">${translations[lang].badge}<b>${badge}</b></div>`;
  const reset = $('#resetProgressBtn'); if (reset) reset.onclick = ()=>{ localStorage.removeItem(storeKeys.progress); localStorage.removeItem(storeKeys.records); localStorage.removeItem(storeKeys.analytics); renderHomeProgress(); };
}
function renderStudentHistory(name, grade){ const box = $('#studentHistory'); if (!box) return; const lang = getLang(); const progress = getProgress(); const item = progress[name.trim().toLowerCase()]; if (!item){ box.innerHTML = ''; return; } const prev = item.scores || []; const improve = prev.length >= 2 ? `${translations[lang].improvedFrom} ${prev[0]}% ${translations[lang].to} ${prev[prev.length-1]}%` : `${translations[lang].lastScore}: ${item.lastScore}%`; const weak = (item.weakTimeline?.[item.weakTimeline.length-1]?.weaknesses || []).slice(0,2).join(', '); box.innerHTML = `<span class="history-chip em">${improve}</span><span class="history-chip">${translations[lang].bestScore}: ${item.bestScore}%</span>${weak ? `<span class="history-chip">${translations[lang].historyWeak}: ${weak}</span>` : ''}`; }
function playTone(type){ try { const AudioContext = window.AudioContext || window.webkitAudioContext; if (!AudioContext) return; const ctx = new AudioContext(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.type = type === 'wrong' ? 'sine' : 'triangle'; osc.frequency.value = type === 'correct' ? 660 : type === 'wrong' ? 240 : 880; gain.gain.value = 0.001; osc.start(); gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (type === 'finish' ? 0.6 : 0.25)); osc.stop(ctx.currentTime + (type === 'finish' ? 0.6 : 0.25)); } catch(e){} }
let speechReady = false;
let speechUnlocked = false;
let speechVoices = [];
function refreshSpeechVoices(){ try { if ('speechSynthesis' in window) speechVoices = window.speechSynthesis.getVoices() || []; } catch(e){} }
function unlockSpeech(){
  try {
    if (!('speechSynthesis' in window)) return false;
    refreshSpeechVoices();
    speechReady = true;
    speechUnlocked = true;
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    const warm = new SpeechSynthesisUtterance('Ready');
    warm.volume = 0;
    warm.rate = 1;
    warm.pitch = 1;
    window.speechSynthesis.speak(warm);
    setTimeout(() => { try { window.speechSynthesis.cancel(); } catch(e){} }, 60);
    return true;
  } catch(e){
    return false;
  }
}
try {
  if ('speechSynthesis' in window) {
    refreshSpeechVoices();
    window.speechSynthesis.onvoiceschanged = refreshSpeechVoices;
    ['pointerdown','keydown','touchstart','click'].forEach(evt => window.addEventListener(evt, () => {
      if (speechUnlocked) return;
      unlockSpeech();
    }, {once:true}));
  }
} catch(e){}
function pickVoiceForLang(langCode){
  const voices = speechVoices && speechVoices.length ? speechVoices : (('speechSynthesis' in window) ? window.speechSynthesis.getVoices() : []);
  if (!voices || !voices.length) return null;
  return voices.find(v => (v.lang || '').toLowerCase().startsWith(langCode.toLowerCase()))
    || voices.find(v => (v.lang || '').toLowerCase().includes(langCode.split('-')[0].toLowerCase()))
    || voices.find(v => /en|ar/i.test(v.lang || ''))
    || voices[0];
}
function speakText(text, forceUnlock=false){
  try {
    if (!('speechSynthesis' in window) || !text) return false;
    refreshSpeechVoices();
    if (forceUnlock) unlockSpeech();
    if (!speechUnlocked) return false;
    const langCode = getLang() === 'ar' ? 'ar-EG' : 'en-US';
    const cleanText = String(text).replace(/\s+/g,' ').trim();
    if (!cleanText) return false;
    const runSpeak = ()=>{
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        const utter = new SpeechSynthesisUtterance(cleanText);
        utter.lang = langCode;
        utter.rate = 0.9;
        utter.pitch = 1;
        utter.volume = 1;
        const picked = pickVoiceForLang(langCode);
        if (picked) utter.voice = picked;
        utter.onerror = () => { try { window.speechSynthesis.cancel(); } catch(e){} };
        window.speechSynthesis.speak(utter);
      } catch(e){}
    };
    setTimeout(runSpeak, forceUnlock ? 220 : 120);
    return true;
  } catch(e){
    return false;
  }
}
function confettiBurst(){ const layer = $('#confettiLayer'); if (!layer) return; const colors=['#ffd54f','#ff8fab','#6ec6ff','#a8e6a1','#ffb347']; for(let i=0;i<24;i++){ const p=document.createElement('div'); p.className='confetti-piece'; p.style.left = `${Math.random()*100}%`; p.style.background = colors[i%colors.length]; p.style.transform = `translateY(0) rotate(${Math.random()*120}deg)`; p.style.animationDuration = `${1400+Math.random()*1200}ms`; layer.appendChild(p); setTimeout(()=>p.remove(),2800); } }
function showStars(count=3){ const wrap = $('#starBurst'); if (!wrap) return; wrap.innerHTML = '⭐'.repeat(count); wrap.classList.remove('animate'); void wrap.offsetWidth; wrap.classList.add('animate'); setTimeout(()=>wrap.innerHTML='', 1200); }
function resultRemark(percent){ const lang = getLang(); if (percent >= 85) return translations[lang].excellent; if (percent >= 70) return translations[lang].veryGood; if (percent >= 50) return translations[lang].good; return translations[lang].keepPracticing; }
function mappedSkills(list){ const lang = getLang(); return list.map(s => skillLabels[lang][s] || s); }
function smartAdvice(weaknesses){ const lang = getLang(); if (!weaknesses.length) return lang === 'ar' ? 'عمل ممتاز. استمر في القراءة والتحدث يوميًا.' : 'Excellent work. Keep reading and speaking every day.'; return weaknesses.map(skill => adviceMap[lang][skill] || adviceMap.en[skill] || skill).join(' '); }
function adaptiveQuestionSet(pool, count, studentName='', grade=''){
  const source = pickSequentialQuestionSet(pool.slice(), count, studentName, grade);
  const result = []; const used = new Set();
  let targetDifficulty = 1;
  while (result.length < Math.min(count, source.length)) {
    let pick = source.find(q => !used.has(q.text) && q.difficulty === targetDifficulty) || source.find(q => !used.has(q.text));
    if (!pick) break;
    result.push(pick); used.add(pick.text);
    if (result.length % 5 === 0 && targetDifficulty < 3) targetDifficulty += 1;
  }
  return result;
}
function initQuiz(){
  const grade = document.body.dataset.grade; if (!grade) return; const setupCard = $('#setupCard'); const studentNameInput = $('#studentName'); const goBtn = $('#goToLevelBtn'); const levelChooser = $('#levelChooser'); applyLevelVisibilityUI(grade); const levelBtns = [...levelChooser.querySelectorAll('.level-btn[data-count]')].filter(btn => !btn.classList.contains('hidden'));
  const quizSection = $('#quizSection'); const studentPreview = $('#studentPreview'); const quizLevelLabel = $('#quizLevelLabel'); const questionProgressEl = $('#questionProgress'); const timerValueEl = $('#timerValue'); const scoreValueEl = $('#scoreValue'); const skillBadge = $('#skillBadge'); const typeBadge = $('#questionTypeBadge'); const questionText = $('#questionText'); const questionImageWrap = $('#questionImageWrap'); const questionImage = $('#questionImage'); const optionsWrap = $('#optionsWrap'); const nextBtn = $('#nextBtn'); const autoNext = $('#autoNextToggle'); const voiceBtn = $('#voiceBtn'); const testLaunchWrap = $('#testLaunchWrap'); const startAssignedTestBtn = $('#startAssignedTestBtn');
  let selectedCount = 10, selectedLevelLabel = translations[getLang()].level1, studentName = '', questions = [], currentIndex = 0, score = 0, timer = 15, interval = null, autoAdvanceTimeout = null, answered = false, skillStats = {}, missedQuestions=[], adaptiveIndex = 0, sessionUsed = new Set(), activeTestConfig = null;
  function clearQuizTimers(){ if (interval){ clearInterval(interval); interval = null; } if (autoAdvanceTimeout){ clearTimeout(autoAdvanceTimeout); autoAdvanceTimeout = null; } try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch(e){} }
  function ensureSkillStat(skill, sampleText){ if (!skillStats[skill]) skillStats[skill] = {right:0, wrong:0, samples:[]}; if (sampleText && !skillStats[skill].samples.includes(sampleText)) skillStats[skill].samples.push(sampleText); }
  function updateHistory(){ renderStudentHistory(studentNameInput.value, grade); }
  studentNameInput?.addEventListener('input', updateHistory); updateHistory();
  function promptForQuizPassword(){
    const access = getQuizAccess()[grade] || {enabled:false,password:''};
    if (!access.enabled || !access.password) return true;
    const entered = window.prompt(`This quiz is protected. Enter password. If you do not know it, contact Dr. TAREK ABDALAZIZ 📞 01032188008`) || '';
    if (entered !== access.password){ alert('Wrong password. Contact Dr. TAREK ABDALAZIZ 📞 01032188008'); return false; }
    return true;
  }
  function updateTeacherTestLaunch(){
    const tests = getTeacherTests();
    activeTestConfig = tests[grade] || null;
    if (!testLaunchWrap) return;
    if (activeTestConfig && activeTestConfig.enabled){
      testLaunchWrap.classList.remove('hidden');
      const h2 = testLaunchWrap.querySelector('h2'); if (h2) h2.textContent = activeTestConfig.name || 'Teacher Test';
      const p = testLaunchWrap.querySelector('p'); if (p) p.textContent = activeTestConfig.mode === 'manual' ? `A custom teacher test is active with ${activeTestConfig.count} selected questions.` : `A random teacher test is active with ${activeTestConfig.count} questions.`;
    } else {
      testLaunchWrap.classList.add('hidden');
    }
  }
  goBtn?.addEventListener('click', ()=>{ const v = studentNameInput.value.trim(); if (!v){ alert(translations[getLang()].enterNameAlert); return; } if (!promptForQuizPassword()) return; studentName = v; levelChooser.classList.remove('hidden'); updateTeacherTestLaunch(); studentNameInput.disabled = true; goBtn.disabled = true; updateHistory(); });
  levelBtns.forEach((btn)=> btn.addEventListener('click', ()=>{ selectedCount = Number(btn.dataset.count); const levelMap = {10:'level1',20:'level2',30:'level3',40:'level4',50:'level5'}; selectedLevelLabel = translations[getLang()][levelMap[selectedCount] || 'level1']; activeTestConfig = null; startQuiz(); }));
  startAssignedTestBtn?.addEventListener('click', ()=>{ if (!activeTestConfig) return; selectedCount = Number(activeTestConfig.count || 10); selectedLevelLabel = activeTestConfig.name || 'Teacher Test'; startQuiz(); });
  nextBtn?.addEventListener('click', goNext);
  voiceBtn?.addEventListener('click', ()=> { try { const q = current(); unlockSpeech(); speakText((q && q.text) || questionText.textContent, true); } catch(e){ console.error('voice read failed', e); } });
  function startQuiz(){
    clearQuizTimers(); const pool = sanitizedPool(grade); if (!pool.length){ alert('No valid questions available for this grade yet.'); return; } let workingPool = pool.slice();
    if (activeTestConfig && activeTestConfig.enabled){
      selectedCount = Number(activeTestConfig.count || selectedCount || 10);
      if (activeTestConfig.mode === 'manual' && Array.isArray(activeTestConfig.questions) && activeTestConfig.questions.length){
        const wanted = new Set(activeTestConfig.questions.map(x => String(x).trim().toLowerCase()));
        workingPool = pool.filter(q => wanted.has(String(q.text).trim().toLowerCase()));
      }
    }
    const safeCount = Math.min(selectedCount, workingPool.length || selectedCount);
    let baseSet = adaptiveQuestionSet(workingPool, safeCount, studentName, grade);
    if (!baseSet.length){ alert('No valid questions available for this selection.'); return; }
    selectedCount = baseSet.length; questions = baseSet; sessionUsed = new Set(baseSet.map(questionSignature)); currentIndex = 0; score = 0; missedQuestions = []; skillStats = {}; adaptiveIndex = 0; questions.forEach(q=> ensureSkillStat(q.skill, q.text)); timer = grade === 'kg1' ? 15 : 18; unlockSpeech(); setupCard.classList.add('hidden'); quizSection.classList.remove('hidden'); studentPreview.textContent = studentName; quizLevelLabel.textContent = `${selectedLevelLabel} / ${selectedCount}`; scoreValueEl.textContent = '0'; try { renderQuestion(); } catch (e) { console.error('renderQuestion failed on startQuiz', e); finishQuiz(); }
  }
  function current(){ return questions[currentIndex]; }
  function renderQuestion(){
    clearQuizTimers(); answered = false; nextBtn.classList.add('hidden'); const q = current(); if (!q) { finishQuiz(); return; } ensureSkillStat(q.skill, q.text); if (questionProgressEl) questionProgressEl.textContent = `${currentIndex+1} / ${questions.length}`; skillBadge.textContent = skillLabels[getLang()][q.skill] || q.skill; typeBadge.textContent = typeLabels[getLang()][q.type] || q.type; questionText.textContent = q.text; if (q.image){ questionImage.src = q.image; questionImage.alt = q.text; questionImageWrap.classList.remove('hidden'); } else { questionImageWrap.classList.add('hidden'); questionImage.removeAttribute('src'); } optionsWrap.innerHTML = ''; const timerEnabled = timerEnabledFor(grade); timer = grade === 'kg1' ? 15 : 18; timerValueEl.textContent = timerEnabled ? String(timer) : '∞'; timerValueEl.closest('.status-card')?.classList.toggle('timer-disabled', !timerEnabled); shuffle(q.options).forEach(opt=>{ const b=document.createElement('button'); b.className='option-btn'; b.textContent = opt; b.onclick = ()=> answerQuestion(b, opt === q.answer); optionsWrap.appendChild(b); }); if (timerEnabled) { interval = setInterval(()=>{ try { timer -= 1; timerValueEl.textContent = String(timer); if (timer <= 0){ clearInterval(interval); interval = null; timeoutQuestion(); } } catch(err){ console.error('timer tick failed', err); clearQuizTimers(); finishQuiz(); } }, 1000); } else { interval = null; } }
  function markCorrect(buttons, q){ buttons.forEach(btn=>{ if (btn.textContent === q.answer) btn.classList.add('correct'); }); }
  function schedule(){ if (autoNext.checked) { autoAdvanceTimeout = setTimeout(goNext, 900); } else nextBtn.classList.remove('hidden'); }
  function tuneDifficulty(wasCorrect, remaining){ if (wasCorrect && remaining > 10) adaptiveIndex = Math.min(adaptiveIndex + 1, 2); if (!wasCorrect || remaining < 4) adaptiveIndex = Math.max(adaptiveIndex - 1, 0); }
  function maybeSwapFutureQuestions(){
    const pool = sanitizedPool(grade).filter(q => !questions.some(existing => questionSignature(existing) === questionSignature(q)) && !sessionUsed.has(questionSignature(q)));
    const nextSlot = currentIndex + 1; if (nextSlot >= questions.length || !pool.length) return; const desired = adaptiveIndex + 1; const found = pool.find(q => q.difficulty === desired) || pool[0]; if (found){ questions[nextSlot] = found; sessionUsed.add(questionSignature(found)); ensureSkillStat(found.skill, found.text); }
  }
  function answerQuestion(button, isCorrect){ if (answered) return; try { answered = true; clearInterval(interval); interval = null; const q = current(); ensureSkillStat(q.skill, q.text); const buttons=[...document.querySelectorAll('.option-btn')]; buttons.forEach(b=> b.classList.add('disabled')); if (isCorrect){ button.classList.add('correct'); const earned = timerEnabledFor(grade) ? (10 + timer) : 10; score += earned; scoreValueEl.textContent = String(score); skillStats[q.skill].right += 1; playTone('correct'); confettiBurst(); showStars(timer > 10 ? 3 : 2); } else { button.classList.add('wrong'); markCorrect(buttons, q); skillStats[q.skill].wrong += 1; missedQuestions.push(q.text); playTone('wrong'); showStars(1); }
    tuneDifficulty(isCorrect, timer); maybeSwapFutureQuestions(); schedule(); } catch(err){ console.error('answerQuestion failed', err); goNext(); } }
  function timeoutQuestion(){ if (answered) return; try { answered = true; const q = current(); ensureSkillStat(q.skill, q.text); const buttons=[...document.querySelectorAll('.option-btn')]; buttons.forEach(b=> b.classList.add('disabled')); markCorrect(buttons, q); skillStats[q.skill].wrong += 1; missedQuestions.push(q.text); playTone('wrong'); tuneDifficulty(false,0); maybeSwapFutureQuestions(); schedule(); } catch(err){ console.error('timeoutQuestion failed', err); goNext(); } }
  function goNext(){ clearQuizTimers(); if (!questions.length) return; currentIndex += 1; if (currentIndex >= questions.length) finishQuiz(); else { try { renderQuestion(); } catch (e) { console.error('renderQuestion failed on goNext', e); try { currentIndex += 1; if (currentIndex >= questions.length) finishQuiz(); else renderQuestion(); } catch(e2){ console.error('second render attempt failed', e2); finishQuiz(); } } } }
  function finishQuiz(){ clearQuizTimers(); playTone('finish'); const max = questions.length * (timerEnabledFor(grade) ? (10 + (grade === 'kg1' ? 15 : 18)) : 10); const percent = Math.round((score/max)*100); const weaknessEntries = Object.entries(skillStats).map(([skill, st])=>({skill, wrong:st.wrong, right:st.right})).sort((a,b)=> b.wrong - a.wrong); const strengthEntries = Object.entries(skillStats).map(([skill, st])=>({skill, wrong:st.wrong, right:st.right})).sort((a,b)=> b.right - a.right); const weaknesses = weaknessEntries.filter(x=>x.wrong>0).slice(0,2).map(x=>x.skill); const strengths = strengthEntries.filter(x=>x.right>0).slice(0,2).map(x=>x.skill); const data = {studentName, grade:grade.toUpperCase(), quizLevel:selectedLevelLabel, questionCount:selectedCount, score, percent, strengths: strengths.length ? strengths : ['Reading'], weaknesses, advice: smartAdvice(weaknesses), remark: resultRemark(percent), date: new Date().toLocaleDateString('en-GB'), lang:getLang(), missedQuestions}; localStorage.setItem(storeKeys.cert, JSON.stringify(data)); recordStudentAttempt(data); window.location.href = 'certificate.html'; }
  document.querySelectorAll('.lang-btn').forEach(btn=>btn.addEventListener('click', ()=>{ applyLevelVisibilityUI(grade); if (studentNameInput) updateHistory(); if (questions.length){ const levelMap = {10:'level1',20:'level2',30:'level3',40:'level4',50:'level5'}; selectedLevelLabel = translations[getLang()][levelMap[selectedCount] || 'level1']; quizLevelLabel.textContent = `${selectedLevelLabel} / ${selectedCount}`; skillBadge.textContent = skillLabels[getLang()][current().skill] || current().skill; typeBadge.textContent = typeLabels[getLang()][current().type] || current().type; nextBtn.textContent = translations[getLang()].nextQuestion; } }));
}
async function makeCertificatePdfBlob(){ const area = $('#certificateArea'); const canvas = await html2canvas(area, {scale:2, backgroundColor:'#fffdf4', useCORS:true}); const imgData = canvas.toDataURL('image/png'); const { jsPDF } = window.jspdf; const pdf = new jsPDF('p','pt','a4'); const pageWidth = pdf.internal.pageSize.getWidth(); const pageHeight = pdf.internal.pageSize.getHeight(); const ratio = Math.min((pageWidth-40)/canvas.width, (pageHeight-40)/canvas.height); const w = canvas.width*ratio, h = canvas.height*ratio; pdf.addImage(imgData,'PNG',(pageWidth-w)/2,20,w,h); return pdf.output('blob'); }
function renderCertificate(){
  const data = readJson(storeKeys.cert, null); if (!data || !$('#certificateArea')) return; const lang = getLang(); document.body.dataset.lang = lang; const title = lang === 'ar' ? 'شهادة تقدير' : translations[lang].certificateTitle; $('#certificateArea').setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr'); $('#certificateArea').setAttribute('lang', lang === 'ar' ? 'ar' : 'en'); $('#certTitle').innerText = title; $('#certTitle').classList.toggle('arabic-title', lang === 'ar'); $('#certTopText').innerText = title; $('#certSubtitle').textContent = translations[lang].presentedTo; $('#certStudentName').textContent = data.studentName; $('#certMessage').textContent = translations[lang].completedMsg; $('#labelGrade').textContent = translations[lang].grade; $('#labelLevel').textContent = translations[lang].level; $('#labelScore').textContent = translations[lang].score; $('#labelDate').textContent = translations[lang].date; $('#labelStrengths').textContent = translations[lang].strengths; $('#labelWeak').textContent = translations[lang].focus; $('#labelAdvice').textContent = translations[lang].advice; $('#labelTeacher').textContent = translations[lang].teacher; $('#labelResult').textContent = translations[lang].result; $('#certGrade').textContent = data.grade; $('#certLevel').textContent = `${data.quizLevel} / ${data.questionCount}`; $('#certScore').textContent = `${data.score} (${data.percent}%)`; $('#certDate').textContent = data.date; $('#certStrengths').textContent = mappedSkills(data.strengths).join(', '); $('#certWeaknesses').textContent = data.weaknesses.length ? mappedSkills(data.weaknesses).join(', ') : translations[lang].noMajor; $('#certAdvice').textContent = lang === 'ar' ? smartAdvice(data.weaknesses) : data.advice; $('#certRemark').textContent = resultRemark(data.percent); const homeUrl = (location.origin && location.origin !== 'null' ? location.origin + location.pathname.replace('certificate.html','index.html') : 'index.html'); $('#certQr').src = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(homeUrl)}`;
  $('#downloadPdfBtn')?.addEventListener('click', async ()=>{ const blob = await makeCertificatePdfBlob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${data.studentName}-certificate.pdf`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1500); });
  $('#shareCertBtn')?.addEventListener('click', async ()=>{ const blob = await makeCertificatePdfBlob(); const file = new File([blob], `${data.studentName}-certificate.pdf`, {type:'application/pdf'}); if (navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({title:'Certificate', files:[file], text:`${data.studentName} - ${data.percent}%`}); } else { window.open(`https://wa.me/?text=${encodeURIComponent(`${data.studentName} finished ${data.grade} with ${data.percent}%`)}`,'_blank'); } });
}
function initAdmin(){ if (document.body.dataset.page !== 'admin') return; const loginCard = $('#adminLoginCard'); const panel = $('#adminPanel'); $('#adminLoginBtn')?.addEventListener('click', ()=>{ const user = $('#adminUser').value.trim(); const pass = $('#adminPass').value.trim(); const account = getLoginAccount(user, pass); if (!account){ alert(getLang()==='ar'?'اسم المشرف أو كلمة المرور غير صحيحة.':'Wrong admin name or password.'); return; } loginCard.classList.add('hidden'); panel.classList.remove('hidden'); applySectionPermissions(account); populateDashboardDateFilter(); renderAdminDashboard(); renderLevelVisibilityEditor(); renderTimerSettingsEditor(); renderQuizAccessEditor(); renderTeacherTestEditor(); renderAccessPermissions([]); renderAccessAccountsList(); renderTeacherQuestionPicker(); wireCollapseButtons(); renderStoredQuestions(); wireQuestionFilterButtons(); const cm=document.querySelector('[data-section-key="classManager"]'); if(cm){ cm.classList.remove('hidden'); cm.style.display=''; } }); $('#addQuestionBtn')?.addEventListener('click', addCustomQuestion); $('#showStoredQuestionsBtn')?.addEventListener('click', renderStoredQuestions); $('#saveLevelsBtn')?.addEventListener('click', saveLevelVisibilityFromAdmin); $('#resetLevelsBtn')?.addEventListener('click', resetLevelVisibilityFromAdmin); $('#saveTimerSettingsBtn')?.addEventListener('click', saveTimerSettingsFromAdmin); $('#resetTimerSettingsBtn')?.addEventListener('click', resetTimerSettingsFromAdmin); $('#dashboardDateFilter')?.addEventListener('change', renderAdminDashboard); $('#exportDataBtn')?.addEventListener('click', ()=>{ const data = {progress:getProgress(), records:getRecords(), attemptsLog:getAttemptsLog(), analytics:getAnalytics(), customQuestions:getCustomQuestions(), questionOverrides:getQuestionOverrides(), levelVisibility:getLevelVisibility(), accessAccounts:getAccessAccounts()}; const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='kg-app-data.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1500); }); $('#exportExcelBtn')?.addEventListener('click', exportDashboardExcel); $('#exportJpegBtn')?.addEventListener('click', exportDashboardJpeg); $('#resetDashboardDataBtn')?.addEventListener('click', resetDashboardData); $('#saveQuizPasswordBtn')?.addEventListener('click', saveQuizAccessFromAdmin); $('#clearQuizPasswordBtn')?.addEventListener('click', clearQuizAccessFromAdmin); $('#saveTeacherTestBtn')?.addEventListener('click', saveTeacherTestFromAdmin); $('#clearTeacherTestBtn')?.addEventListener('click', clearTeacherTestFromAdmin); $('#downloadCurrentQuestionsExcelBtn')?.addEventListener('click', downloadCurrentQuestionsExcel); $('#bulkQuestionUpload')?.addEventListener('change', (e)=>{ const file=e.target.files?.[0]; if(file) importBulkQuestionsFromWorkbook(file); e.target.value=''; }); $('#saveAccessAccountBtn')?.addEventListener('click', saveAccessAccountFromAdmin); $('#accessAccountRole')?.addEventListener('change', ()=>renderAccessPermissions(Array.from(document.querySelectorAll('.perm-check:checked')).map(el=>el.value))); $('#toggleQuestionBankEditorBtn')?.addEventListener('click', (e)=> toggleCollapse('questionBankEditorBody', e.currentTarget)); $('#toggleStoredQuestionsBtn')?.addEventListener('click', (e)=> toggleCollapse('storedQuestionsWrap', e.currentTarget)); document.getElementById('testMode')?.addEventListener('change', ()=>{ renderTeacherQuestionPicker(); });
document.getElementById('testGrade')?.addEventListener('input', ()=>{ renderTeacherQuestionPicker(); });
document.getElementById('testGrade')?.addEventListener('change', ()=>{ renderTeacherQuestionPicker(); });
document.getElementById('testQuestionList')?.addEventListener('input', renderTeacherQuestionPicker); document.getElementById('teacherQuestionPickerList')?.addEventListener('change', (e)=>{ if (e.target && e.target.classList.contains('teacher-question-check')) syncTeacherQuestionTextarea(); }); document.getElementById('selectAllTeacherQuestionsBtn')?.addEventListener('click', ()=>{ document.querySelectorAll('.teacher-question-check').forEach(cb => cb.checked = true); syncTeacherQuestionTextarea(); }); document.getElementById('clearTeacherQuestionsBtn')?.addEventListener('click', ()=>{ document.querySelectorAll('.teacher-question-check').forEach(cb => cb.checked = false); syncTeacherQuestionTextarea(); }); }

function renderAdminDashboard(){ renderLevelVisibilityEditor(); renderTimerSettingsEditor(); populateDashboardDateFilter(); const data = getFilteredDashboardData(); const rows = data.groupedRows; $('#metricStudents').textContent = String(rows.length); $('#metricAttempts').textContent = String(data.filtered.length); const avg = data.filtered.length ? Math.round(data.filtered.reduce((s,r)=>s+(r.percent||0),0)/data.filtered.length) : 0; $('#metricAverage').textContent = `${avg}%`; const weakEntry = Object.entries(data.skillMisses || {}).sort((a,b)=>b[1]-a[1])[0]; $('#metricWeak').textContent = weakEntry ? weakEntry[0] : '-'; const tbody = $('#studentTableBody'); tbody.innerHTML = rows.map(r => `<tr><td>${r.name}</td><td>${r.grade || '-'}</td><td>${r.attempts || 0}</td><td>${r.best || 0}%</td><td>${r.last || 0}%</td><td>${(r.weakAreas || []).join(', ')}</td></tr>`).join('') || '<tr><td colspan="6">No student records for this day.</td></tr>'; const missed = Object.entries(data.questionMisses || {}).sort((a,b)=>b[1]-a[1]).slice(0,10); $('#missedTableBody').innerHTML = missed.map(([q,c]) => `<tr><td>${q}</td><td>${c}</td></tr>`).join('') || '<tr><td colspan="2">No missed-question data for this day.</td></tr>'; renderStoredQuestions(); }
function exportDashboardExcel(){ const data = getFilteredDashboardData(); const lines = []; lines.push('Student Progress'); lines.push(['Name','Grade','Attempts','Best','Last','Weak Areas'].join('\t')); data.groupedRows.forEach(r => lines.push([r.name,r.grade,r.attempts,`${r.best}%`,`${r.last}%`,(r.weakAreas||[]).join(', ')].join('\t'))); lines.push(''); lines.push('Most Missed Questions'); lines.push(['Question','Misses'].join('\t')); Object.entries(data.questionMisses || {}).sort((a,b)=>b[1]-a[1]).slice(0,50).forEach(([q,c]) => lines.push([q,c].join('\t'))); const blob = new Blob([lines.join('\n')], {type:'application/vnd.ms-excel;charset=utf-8;'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `dashboard-${data.selected === 'all' ? 'all-dates' : data.selected}.xls`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1500); }
async function exportDashboardJpeg(){ const node = $('#adminDashboardContent'); if (!node || typeof html2canvas === 'undefined') return; const canvas = await html2canvas(node, {scale:2, backgroundColor:'#fffdf4', useCORS:true}); canvas.toBlob(blob => { if (!blob) return; const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'teacher-dashboard.jpeg'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1500); }, 'image/jpeg', 0.95); }

function renderLevelVisibilityEditor(){
  const wrap = $('#adminLevelVisibility');
  if (!wrap) return;
  const labels = {10:'Level 1 (10)',20:'Level 2 (20)',30:'Level 3 (30)',40:'Level 4 (40)',50:'Level 5 (50)'};
  const cfg = getLevelVisibility();
  wrap.innerHTML = ['kg1','kg2'].map(grade => {
    const visible = new Set(Array.isArray(cfg[grade]) ? cfg[grade] : [10,20,30,40,50]);
    return `<div class="level-visibility-card"><h3>${grade.toUpperCase()}</h3><div class="level-visibility-list">${[10,20,30,40,50].map(count => `<label class="level-toggle"><input type="checkbox" data-level-grade="${grade}" value="${count}" ${visible.has(count)?'checked':''}> <span>${labels[count]}</span></label>`).join('')}</div></div>`;
  }).join('');
}
function saveLevelVisibilityFromAdmin(){
  const result = {kg1:[], kg2:[]};
  document.querySelectorAll('#adminLevelVisibility input[type="checkbox"][data-level-grade]').forEach(input => {
    if (input.checked) result[input.dataset.levelGrade].push(Number(input.value));
  });
  if (!result.kg1.length || !result.kg2.length){ alert('Keep at least one visible level for KG1 and KG2.'); return; }
  result.kg1.sort((a,b)=>a-b); result.kg2.sort((a,b)=>a-b);
  setLevelVisibility(result);
  alert('Level visibility saved.');
}
function resetLevelVisibilityFromAdmin(){
  const defaults = {kg1:[10,20,30,40,50], kg2:[10,20,30,40,50]};
  setLevelVisibility(defaults);
  renderLevelVisibilityEditor();
}

function renderTimerSettingsEditor(){
  const wrap = $('#adminTimerSettings');
  if (!wrap) return;
  const cfg = getTimerSettings();
  wrap.innerHTML = ['kg1','kg2'].map(grade => `
    <div class="level-visibility-card">
      <h3>${grade.toUpperCase()}</h3>
      <label class="level-toggle admin-toggle-row">
        <input type="checkbox" data-timer-grade="${grade}" ${cfg[grade] !== false ? 'checked' : ''}>
        <span>${cfg[grade] !== false ? 'Timer enabled' : 'Timer disabled'}</span>
      </label>
    </div>`).join('');
  wrap.querySelectorAll('input[data-timer-grade]').forEach(input => {
    input.addEventListener('change', () => {
      const span = input.closest('label')?.querySelector('span');
      if (span) span.textContent = input.checked ? 'Timer enabled' : 'Timer disabled';
    });
  });
}
function saveTimerSettingsFromAdmin(){
  const result = {kg1:true, kg2:true};
  document.querySelectorAll('#adminTimerSettings input[type="checkbox"][data-timer-grade]').forEach(input => {
    result[input.dataset.timerGrade] = !!input.checked;
  });
  setTimerSettings(result);
  renderTimerSettingsEditor();
  alert('Timer settings saved.');
}
function resetTimerSettingsFromAdmin(){
  const defaults = {kg1:true, kg2:true};
  setTimerSettings(defaults);
  renderTimerSettingsEditor();
}

function renderQuizAccessEditor(){
  const cfg = getQuizAccess();
  ['kg1','kg2'].forEach(grade => {
    const enabled = document.getElementById(`quizPasswordEnabled_${grade}`);
    const value = document.getElementById(`quizPasswordValue_${grade}`);
    if (enabled) enabled.checked = !!cfg[grade]?.enabled;
    if (value) value.value = cfg[grade]?.password || '';
  });
}
function saveQuizAccessFromAdmin(){
  const next = {kg1:{enabled:false,password:''}, kg2:{enabled:false,password:''}};
  ['kg1','kg2'].forEach(grade => {
    const enabled = document.getElementById(`quizPasswordEnabled_${grade}`);
    const value = document.getElementById(`quizPasswordValue_${grade}`);
    next[grade] = {enabled: !!enabled?.checked && !!value?.value.trim(), password: value?.value.trim() || ''};
  });
  setQuizAccess(next);
  renderQuizAccessEditor();
  alert('Quiz password settings saved.');
}
function clearQuizAccessFromAdmin(){
  setQuizAccess({kg1:{enabled:false,password:''}, kg2:{enabled:false,password:''}});
  renderQuizAccessEditor();
}


function escapeHtml(text){
  return String(text ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function escapeHtmlAttr(text){
  return escapeHtml(text);
}
function renderTeacherQuestionPicker(){
  const wrap = document.getElementById('teacherQuestionPickerWrap');
  const list = document.getElementById('teacherQuestionPickerList');
  const gradeEl = document.getElementById('testGrade');
  const modeEl = document.getElementById('testMode');
  const listEl = document.getElementById('testQuestionList');
  if (!wrap || !list || !gradeEl || !modeEl || !listEl) return;
  const grade = (gradeEl.value || 'KG1').trim().toLowerCase() === 'kg2' ? 'kg2' : 'kg1';
  const mode = (modeEl.value || 'random').trim();
  if (mode !== 'manual' && mode !== 'select'){
    wrap.classList.add('hidden');
    wrap.hidden = true;
    wrap.style.display = 'none';
    return;
  }
  wrap.hidden = false;
  wrap.classList.remove('hidden');
  wrap.style.display = 'block';
  const pool = sanitizedPool(grade);
  const selected = new Set((listEl.value || '').split(/\n+/).map(s => s.trim()).filter(Boolean).map(s => s.toLowerCase()));
  list.innerHTML = pool.map((q, idx) => {
    const checked = selected.has(String(q.text).trim().toLowerCase()) ? 'checked' : '';
    const meta = `${q.skill || 'Skill'} • ${q.type || 'Choice'} • ${q.answer || ''}`;
    return `<label class="teacher-question-row"><input type="checkbox" class="teacher-question-check" data-question-text="${escapeHtmlAttr(q.text)}" ${checked}><span><strong>${idx + 1}. ${escapeHtml(q.text)}</strong><span class="teacher-question-meta">${escapeHtml(meta)}</span></span></label>`;
  }).join('') || `<div class="teacher-question-row"><span>${translations[getLang()].noQuestionsFoundForGrade || 'No questions found for this grade.'}</span></div>`;
}
function syncTeacherQuestionTextarea(){
  const checks = Array.from(document.querySelectorAll('.teacher-question-check:checked'));
  const listEl = document.getElementById('testQuestionList');
  if (!listEl) return;
  listEl.value = checks.map(c => c.dataset.questionText || '').filter(Boolean).join('\\n');
}
function renderTeacherTestEditor(){
  const tests = getTeacherTests();
  const gradeEl = document.getElementById('testGrade');
  const nameEl = document.getElementById('testName');
  const modeEl = document.getElementById('testMode');
  const countEl = document.getElementById('testCount');
  const listEl = document.getElementById('testQuestionList');
  if (!gradeEl || !nameEl || !modeEl || !countEl || !listEl) return;
  const activeGrade = (gradeEl.value || 'KG1').trim().toLowerCase() === 'kg2' ? 'kg2' : 'kg1';
  const cfg = tests[activeGrade];
  if (cfg){
    gradeEl.value = activeGrade.toUpperCase();
    nameEl.value = cfg.name || '';
    if (![...modeEl.options].some(o=>o.value===cfg.mode)){ const opt=document.createElement('option'); opt.value='select'; opt.textContent=translations[getLang()].chooseExistingQuestions; modeEl.appendChild(opt); }
    modeEl.value = cfg.mode || 'random';
    countEl.value = cfg.count || '';
    listEl.value = (cfg.questions || []).join('\\n');
  } else {
    gradeEl.value = activeGrade.toUpperCase();
    nameEl.value = '';
    modeEl.value = 'random';
    countEl.value = '';
    listEl.value = '';
  }
  renderTeacherQuestionPicker();
}


function saveTeacherTestFromAdmin(){
  const grade = ((document.getElementById('testGrade')?.value || 'KG1').trim().toLowerCase() === 'kg2') ? 'kg2' : 'kg1';
  const name = (document.getElementById('testName')?.value || '').trim() || `${grade.toUpperCase()} Test`;
  const mode = (document.getElementById('testMode')?.value || 'random').trim();
  let count = clamp(Number(document.getElementById('testCount')?.value || 10), 1, 50);
  const textList = (document.getElementById('testQuestionList')?.value || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
  if ((mode === 'manual' || mode==='select') && !textList.length){
    alert('Please choose at least one question for manual mode.');
    return;
  }
  if (mode === 'manual' || mode==='select'){
    count = Math.min(count, textList.length);
  }
  const tests = getTeacherTests();
  tests[grade] = {enabled:true, name, mode, count, questions:textList};
  setTeacherTests(tests);
  renderTeacherQuestionPicker();
  alert('Teacher test saved.');
}


function clearTeacherTestFromAdmin(){
  const tests = getTeacherTests();
  tests.kg1 = null; tests.kg2 = null;
  setTeacherTests(tests);
  const listEl = document.getElementById('testQuestionList');
  if (listEl) listEl.value = '';
  renderTeacherTestEditor();
}


function addCustomQuestion(){ const grade = ($('#newQGrade').value || '').trim().toLowerCase(); const skill = $('#newQSkill').value.trim() || 'Vocabulary'; const type = $('#newQType').value.trim() || 'Choice'; const text = $('#newQText').value.trim(); const options = ($('#newQOptions').value || '').split('|').map(s=>s.trim()).filter(Boolean); const answer = $('#newQAnswer').value.trim(); const difficulty = clamp(Number($('#newQDifficulty').value || 1),1,3); const image = ($('#newQImage').value || '').trim() || $('#newQImageFile').dataset.savedImage || null; if (!['kg1','kg2'].includes(grade) || !text || !options.length || !answer){ alert('Please fill grade, question text, options, and answer.'); return; } const custom = getCustomQuestions(); custom[grade].push({grade:grade.toUpperCase(), skill, type, text, options, answer, image, difficulty}); writeJson(storeKeys.customQuestions, custom); ['#newQGrade','#newQSkill','#newQType','#newQText','#newQOptions','#newQAnswer','#newQDifficulty','#newQImage'].forEach(id=> $(id).value=''); $('#newQImageFile').value=''; $('#newQImageFile').dataset.savedImage=''; renderStoredQuestions(); alert('Question added.'); }
function questionEditorCard(question){ const meta = question._meta; const opts = (question.options || []).join(' | '); const srcLabel = meta.source === 'base' ? 'Base' : 'Custom'; return `<div class="question-edit-card" data-qid="${meta.id}" data-grade="${question.grade || meta.grade.toUpperCase()}"><div class="meta-line"><span>${question.grade || meta.grade.toUpperCase()}</span><span>${question.skill || '-'}</span><span>${question.type || 'Choice'}</span><span>${srcLabel}</span></div><div class="question-edit-grid"><textarea class="qe-text full">${question.text || ''}</textarea><input class="qe-skill" value="${question.skill || ''}" placeholder="Skill"><input class="qe-type" value="${question.type || ''}" placeholder="Type"><textarea class="qe-options full" placeholder="Options separated by |">${opts}</textarea><input class="qe-answer" value="${question.answer || ''}" placeholder="Answer"><input class="qe-difficulty" value="${question.difficulty || 1}" placeholder="Difficulty 1-3"><input class="qe-image full" value="${question.image || ''}" placeholder="Image filename or data URL"></div><div class="question-edit-actions"><button class="main-btn save-question-btn">Save Changes</button><button class="ghost-btn reset-question-btn">Reset</button></div></div>`; }
function bindQuestionEditorActions(){ document.querySelectorAll('[data-filter-grade]').forEach(btn => btn.onclick = ()=>{ document.querySelectorAll('[data-filter-grade]').forEach(b=>b.classList.toggle('active', b===btn)); const grade = btn.dataset.filterGrade; document.querySelectorAll('.question-edit-card').forEach(card=>{ card.style.display = grade === 'all' || card.dataset.grade === grade ? '' : 'none'; }); }); document.querySelectorAll('.save-question-btn').forEach(btn => btn.onclick = ()=> saveQuestionEdits(btn.closest('.question-edit-card'))); document.querySelectorAll('.reset-question-btn').forEach(btn => btn.onclick = ()=> resetQuestionEdits(btn.closest('.question-edit-card'))); }
function saveQuestionEdits(card){ if (!card) return; const id = card.dataset.qid; const grade = (card.dataset.grade || 'KG1').toLowerCase(); const payload = { text: $('.qe-text',card).value.trim(), skill: $('.qe-skill',card).value.trim() || 'Vocabulary', type: $('.qe-type',card).value.trim() || 'Choice', options: $('.qe-options',card).value.split('|').map(s=>s.trim()).filter(Boolean), answer: $('.qe-answer',card).value.trim(), difficulty: clamp(Number($('.qe-difficulty',card).value || 1),1,3), image: $('.qe-image',card).value.trim() || null }; if (!payload.text || !payload.options.length || !payload.answer){ alert('Question text, options, and answer are required.'); return; } const overrides = getQuestionOverrides(); overrides[id] = payload; writeJson(storeKeys.questionOverrides, overrides); alert('Question updated.'); }
function resetQuestionEdits(card){ if (!card) return; const id = card.dataset.qid; const overrides = getQuestionOverrides(); delete overrides[id]; writeJson(storeKeys.questionOverrides, overrides); renderStoredQuestions(); }
function renderStoredQuestions(){
  const list = document.getElementById('storedQuestionsList');
  if (!list) return;
  let items = [...collectQuestionsWithMeta('kg1'), ...collectQuestionsWithMeta('kg2')];
  if (typeof getCustomClasses === 'function'){
    getCustomClasses().forEach(cls => { items = items.concat(collectQuestionsWithMeta(cls.key)); });
  }
  items = items.map(applyQuestionOverrides);
  list.innerHTML = items.length ? items.map(questionEditorCard).join('') : '<div class="stored-question"><h4>No questions yet.</h4><p>Add questions from the editor above.</p></div>';
  bindQuestionEditorActions();
  wireQuestionFilterButtons();
  filterQuestionCards('all');
}
window.addEventListener('pagehide', ()=>{ try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch(e){} });
document.addEventListener('visibilitychange', ()=>{ if (document.hidden) { try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch(e){} } });
initLangButtons(); applyTranslations(); renderHomeProgress(); initQuiz(); renderCertificate(); initAdmin(); registerPwa();


window.addEventListener('error', (event) => { try { console.error('App error', event.error || event.message); } catch(e){} });
window.addEventListener('unhandledrejection', (event) => { try { console.error('Unhandled promise rejection', event.reason); } catch(e){} });

window.addEventListener('error', (event) => { try { console.error('App error:', event.message, event.filename, event.lineno); } catch(e){} });
window.addEventListener('unhandledrejection', (event) => { try { console.error('Unhandled promise rejection:', event.reason); } catch(e){} });

document.getElementById('testGrade')?.addEventListener('change', renderTeacherTestEditor);

function filterQuestionCards(grade){
  const wrap = document.getElementById('storedQuestionsWrap');
  if (!wrap) return;
  wrap.hidden = false;
  wrap.style.display = '';
  wrap.classList.remove('collapsed-body');
  const cards = wrap.querySelectorAll('.question-edit-card');
  cards.forEach(card => {
    const cardGrade = (card.getAttribute('data-grade') || '').toLowerCase();
    const show = grade === 'all' || cardGrade === String(grade).toLowerCase();
    card.style.display = show ? '' : 'none';
  });
  document.querySelectorAll('[data-filter-grade]').forEach(btn => {
    const active = (btn.dataset.filterGrade || 'all').toLowerCase() === grade;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function wireQuestionFilterButtons(){
  document.querySelectorAll('[data-filter-grade]').forEach(btn => {
    if (btn.dataset.wired === '1') return;
    btn.dataset.wired = '1';
    btn.classList.add('question-filter-btn');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      filterQuestionCards((btn.dataset.filterGrade || 'all').toLowerCase());
    });
  });
}


/* === v37 stability hotfix === */
(function(){
  function normUser(v){ return String(v||'').trim().toLowerCase(); }
  function builtIns(){
    return [
      { user:'dr. tarek', pass:'T01032188008', role:'admin', permissions:[...(typeof PERMISSIONS!=='undefined'?PERMISSIONS:[])], display:'Dr. Tarek' },
      { user:'hitman', pass:'01002439054', role:'admin', permissions:[...(typeof PERMISSIONS!=='undefined'?PERMISSIONS:[])], display:'HITMAN' }
    ];
  }
  function getAccounts(){
    try{
      const raw35 = localStorage.getItem('kgEnglishAccessAccountsV35');
      const arr35 = raw35 ? JSON.parse(raw35) : [];
      return Array.isArray(arr35) ? arr35 : [];
    }catch(e){ return []; }
  }
  function setAccounts(arr){
    localStorage.setItem('kgEnglishAccessAccountsV35', JSON.stringify(arr || []));
  }
  // safer login
  window.getLoginAccount = function(user, pass){
    const cleanUser = normUser(user);
    const cleanPass = String(pass || '').trim();
    const built = builtIns().find(a => normUser(a.user) === cleanUser || normUser(a.display) === cleanUser);
    if (built && built.pass === cleanPass) return { ...built, builtIn:true };
    const accounts = getAccounts();
    const match = accounts.find(a => normUser(a.user) === cleanUser && String(a.pass || '').trim() === cleanPass);
    return match ? { ...match, builtIn:false } : null;
  };
  // safer account list and save
  window.renderAccessAccountsList = function(){
    const box = document.getElementById('accessAccountsList');
    if (!box) return;
    const lang = typeof getLang === 'function' ? getLang() : 'en';
    const all = [...builtIns().map(a=>({...a,builtIn:true})), ...getAccounts().map(a=>({...a,builtIn:false}))];
    if (!all.length){
      box.innerHTML = '<div class="stored-question"><h4>' + ((translations[lang]&&translations[lang].existingAccountsTitle)||'Existing Accounts') + '</h4><p>No accounts.</p></div>';
      return;
    }
    box.innerHTML = all.map(acc => {
      const perms = acc.role === 'admin' ? 'All permissions' : ((acc.permissions||[]).map(permissionLabel).join(' • ') || '-');
      return `<div class="question-edit-card">
        <div class="class-manager-meta">
          <span class="class-chip"><strong>${escapeHtml(acc.display || acc.user)}</strong></span>
          <span class="class-chip">${acc.role === 'admin' ? 'Admin' : ((translations[lang]&&translations[lang].staffRole)||'Staff')}</span>
          ${acc.builtIn ? '<span class="class-manager-hidden-badge">Built-in</span>' : ''}
        </div>
        <p>${escapeHtml(perms)}</p>
        <div class="question-edit-actions">
          <button class="ghost-btn access-edit-btn" data-user="${escapeHtml(acc.user)}">${(translations[lang]&&translations[lang].editAccount)||'Edit Account'}</button>
          <button class="ghost-btn access-pass-btn" data-user="${escapeHtml(acc.user)}">${(translations[lang]&&translations[lang].changePassword)||'Change Password'}</button>
          ${acc.builtIn ? '' : `<button class="ghost-btn danger-btn access-delete-btn" data-user="${escapeHtml(acc.user)}">${(translations[lang]&&translations[lang].deleteAccount)||'Delete Account'}</button>`}
        </div>
      </div>`;
    }).join('');
    box.querySelectorAll('.access-edit-btn').forEach(btn => btn.onclick = ()=> {
      const u = btn.dataset.user;
      const built = builtIns().find(a=>normUser(a.user)===normUser(u));
      const acc = built || getAccounts().find(a=>normUser(a.user)===normUser(u));
      if (!acc) return;
      const userEl = document.getElementById('accessAccountUser'); if (userEl) userEl.value = acc.user;
      const passEl = document.getElementById('accessAccountPass'); if (passEl) passEl.value = acc.pass || '';
      const roleEl = document.getElementById('accessAccountRole'); if (roleEl) roleEl.value = acc.role || 'user';
      if (typeof renderAccessPermissions === 'function') renderAccessPermissions(acc.permissions || []);
    });
    box.querySelectorAll('.access-pass-btn').forEach(btn => btn.onclick = ()=> {
      const nextPass = prompt((translations[(typeof getLang==='function'?getLang():'en')]||{}).enterNewPassword || 'Enter new password');
      if (!nextPass) return;
      const u = btn.dataset.user;
      const arr = getAccounts();
      const idx = arr.findIndex(a=>normUser(a.user)===normUser(u));
      const built = builtIns().find(a=>normUser(a.user)===normUser(u));
      if (idx >= 0){
        arr[idx].pass = nextPass;
      } else if (built){
        arr.push({ user: built.user, pass: nextPass, role:'admin', permissions:[...(typeof PERMISSIONS!=='undefined'?PERMISSIONS:[])] });
      }
      setAccounts(arr);
      renderAccessAccountsList();
      alert((translations[(typeof getLang==='function'?getLang():'en')]||{}).passwordUpdated || 'Password updated.');
    });
    box.querySelectorAll('.access-delete-btn').forEach(btn => btn.onclick = ()=> {
      if (!confirm((translations[(typeof getLang==='function'?getLang():'en')]||{}).confirmDeleteAccount || 'Delete this account?')) return;
      const arr = getAccounts().filter(a=>normUser(a.user)!==normUser(btn.dataset.user));
      setAccounts(arr);
      renderAccessAccountsList();
      alert((translations[(typeof getLang==='function'?getLang():'en')]||{}).accountDeleted || 'Account deleted.');
    });
  };
  window.saveAccessAccountFromAdmin = function(){
    try{
      const user = normUser(document.getElementById('accessAccountUser')?.value || '');
      const pass = String(document.getElementById('accessAccountPass')?.value || '').trim();
      const role = (document.getElementById('accessAccountRole')?.value || 'user').trim();
      if (!user || !pass){
        alert(((translations[(typeof getLang==='function'?getLang():'en')]||{}).usernamePasswordRequired)||'Please enter username and password.');
        return;
      }
      const permissions = role === 'admin' ? [...(typeof PERMISSIONS!=='undefined'?PERMISSIONS:[])] : Array.from(document.querySelectorAll('.perm-check:checked')).map(el=>el.value);
      if (role !== 'admin' && permissions.length === 0){
        alert(((translations[(typeof getLang==='function'?getLang():'en')]||{}).chooseOnePermission)||'Please choose at least one permission.');
        return;
      }
      const arr = getAccounts();
      const idx = arr.findIndex(a=>normUser(a.user)===user);
      const payload = { user, pass, role, permissions };
      if (idx >= 0) arr[idx] = payload; else arr.push(payload);
      setAccounts(arr);
      if (document.getElementById('accessAccountUser')) document.getElementById('accessAccountUser').value = '';
      if (document.getElementById('accessAccountPass')) document.getElementById('accessAccountPass').value = '';
      if (document.getElementById('accessAccountRole')) document.getElementById('accessAccountRole').value = 'user';
      if (typeof renderAccessPermissions === 'function') renderAccessPermissions([]);
      renderAccessAccountsList();
      alert(((translations[(typeof getLang==='function'?getLang():'en')]||{}).accountSaved)||'Account saved.');
    }catch(err){
      alert(((translations[(typeof getLang==='function'?getLang():'en')]||{}).accountSaveFailed)||'Could not save account.');
    }
  };
  // stable certificate render + QR + PDF
  window.makeCertificatePdfBlob = async function(){
    const area = document.getElementById('certificateArea');
    if (!area || !window.html2canvas || !window.jspdf) throw new Error('Missing PDF libraries');
    const imgs = Array.from(area.querySelectorAll('img'));
    await Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(res => { img.onload = img.onerror = ()=>res(); })));
    await new Promise(res => setTimeout(res, 200));
    const canvas = await window.html2canvas(area, {scale:2, backgroundColor:'#fffdf4', useCORS:true, logging:false});
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p','pt','a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min((pageWidth-36)/canvas.width, (pageHeight-36)/canvas.height);
    const w = canvas.width * ratio, h = canvas.height * ratio;
    pdf.addImage(imgData, 'PNG', (pageWidth-w)/2, 18, w, h);
    return pdf.output('blob');
  };
  window.renderCertificate = function(){
    if (typeof storeKeys === 'undefined') return;
    const raw = localStorage.getItem(storeKeys.cert);
    const data = raw ? JSON.parse(raw) : null;
    if (!data) return;
    const lang = typeof getLang === 'function' ? getLang() : (data.lang || 'en');
    const set = (id,val) => { const el=document.getElementById(id); if(el) el.textContent = val ?? ''; };
    set('certTitle', (lang === 'ar' ? 'شهادة تقدير' : ((translations[lang]&&translations[lang].certificateTitle)||'Certificate of Achievement')));
    set('certTopText', (lang === 'ar' ? 'شهادة تقدير' : ((translations[lang]&&translations[lang].certificateTitle)||'Certificate of Achievement')));
    set('certSubtitle', (translations[lang]&&translations[lang].presentedTo) || 'Proudly presented to');
    set('certStudentName', data.studentName || 'Student');
    set('certMessage', (translations[lang]&&translations[lang].completedMsg) || 'has completed the quiz successfully.');
    set('labelGrade', (translations[lang]&&translations[lang].grade) || 'Grade');
    set('labelLevel', (translations[lang]&&translations[lang].level) || 'Quiz Level');
    set('labelScore', (translations[lang]&&translations[lang].score) || 'Score');
    set('labelDate', (translations[lang]&&translations[lang].date) || 'Date');
    set('labelStrengths', (translations[lang]&&translations[lang].strengths) || 'Strengths');
    set('labelWeak', (translations[lang]&&translations[lang].focus) || 'Focus More On');
    set('labelAdvice', (translations[lang]&&translations[lang].advice) || 'Teacher Advice');
    set('labelTeacher', (translations[lang]&&translations[lang].teacher) || 'Teacher');
    set('labelResult', (translations[lang]&&translations[lang].result) || 'Result');
    set('certGrade', data.grade || '');
    set('certLevel', `${data.quizLevel || ''} / ${data.questionCount || ''}`);
    set('certScore', `${data.score ?? ''} (${data.percent ?? 0}%)`);
    set('certDate', data.date || '');
    set('certStrengths', Array.isArray(data.strengths) ? data.strengths.join(', ') : (data.strengths || ''));
    set('certWeaknesses', Array.isArray(data.weaknesses) ? data.weaknesses.join(', ') : (data.weaknesses || ''));
    set('certAdvice', data.advice || '');
    set('certRemark', data.remark || '');
    const qrBox = document.getElementById('certQr');
    if (qrBox){
      qrBox.innerHTML = '';
      const targetUrl = location.href.replace('certificate.html','index.html');
      if (window.QRCode){
        new QRCode(qrBox, { text: targetUrl, width:110, height:110 });
      } else {
        qrBox.textContent = targetUrl;
      }
    }
  };
  function rebindAdminLogin(){
    if (document.body.dataset.page !== 'admin') return;
    const btn = document.getElementById('adminLoginBtn');
    if (!btn) return;
    const fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);
    fresh.addEventListener('click', ()=>{
      const user = document.getElementById('adminUser')?.value || '';
      const pass = document.getElementById('adminPass')?.value || '';
      const account = window.getLoginAccount(user, pass);
      if (!account){
        alert((typeof getLang==='function' && getLang()==='ar') ? 'اسم المشرف أو كلمة المرور غير صحيحة.' : 'Wrong admin name or password.');
        return;
      }
      const loginCard = document.getElementById('adminLoginCard');
      const panel = document.getElementById('adminPanel');
      if (loginCard) loginCard.classList.add('hidden');
      if (panel) panel.classList.remove('hidden');
      if (typeof applySectionPermissions === 'function') applySectionPermissions(account);
      if (typeof populateDashboardDateFilter === 'function') populateDashboardDateFilter();
      if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
      if (typeof renderLevelVisibilityEditor === 'function') renderLevelVisibilityEditor();
      if (typeof renderTimerSettingsEditor === 'function') renderTimerSettingsEditor();
      if (typeof renderQuizAccessEditor === 'function') renderQuizAccessEditor();
      if (typeof renderTeacherTestEditor === 'function') renderTeacherTestEditor();
      if (typeof renderAccessPermissions === 'function') renderAccessPermissions([]);
      if (typeof renderAccessAccountsList === 'function') renderAccessAccountsList();
      if (typeof renderTeacherQuestionPicker === 'function') renderTeacherQuestionPicker();
      if (typeof wireCollapseButtons === 'function') wireCollapseButtons();
      if (typeof renderStoredQuestions === 'function') renderStoredQuestions();
      if (typeof wireQuestionFilterButtons === 'function') wireQuestionFilterButtons();
      const cm = document.querySelector('[data-section-key="classManager"]');
      if (cm){ cm.classList.remove('hidden'); cm.style.display=''; }
      const saveAccBtn = document.getElementById('saveAccessAccountBtn');
      if (saveAccBtn && !saveAccBtn.dataset.bound){
        saveAccBtn.dataset.bound='1';
        saveAccBtn.addEventListener('click', function(e){ e.preventDefault(); window.saveAccessAccountFromAdmin(); });
      }
    });
  }
  window.addEventListener('load', ()=>{
    try{
      rebindAdminLogin();
      if (document.body.dataset.page === 'certificate'){
        window.renderCertificate();
        const pdfBtn = document.getElementById('downloadPdfBtn');
        if (pdfBtn && !pdfBtn.dataset.bound){
          pdfBtn.dataset.bound='1';
          pdfBtn.addEventListener('click', async ()=>{
            try{
              const blob = await window.makeCertificatePdfBlob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'certificate.pdf';
              document.body.appendChild(a);
              a.click();
              a.remove();
              setTimeout(()=>URL.revokeObjectURL(url), 1500);
            }catch(err){ alert('Could not generate PDF.'); }
          });
        }
        const shareBtn = document.getElementById('shareCertBtn');
        if (shareBtn && !shareBtn.dataset.bound){
          shareBtn.dataset.bound='1';
          shareBtn.addEventListener('click', async ()=>{
            try{
              const raw = localStorage.getItem(storeKeys.cert);
              const data = raw ? JSON.parse(raw) : {};
              const blob = await window.makeCertificatePdfBlob();
              const file = new File([blob], 'certificate.pdf', {type:'application/pdf'});
              if (navigator.canShare && navigator.canShare({files:[file]})){
                await navigator.share({ files:[file], title:'Certificate', text:`${data.studentName || 'Student'} - ${data.percent || 0}%` });
              } else {
                window.open(`https://wa.me/?text=${encodeURIComponent(`${data.studentName || 'Student'} finished ${data.grade || ''} with ${data.percent || 0}%`)}`,'_blank');
              }
            }catch(err){ alert('Could not share certificate.'); }
          });
        }
      }
    }catch(e){}
  });
})();

