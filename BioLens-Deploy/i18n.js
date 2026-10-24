// =============================================
//  BioLens — Internationalization (i18n)
//
//  This file contains:
//    1. SUPPORTED_LANGUAGES — metadata for the 6 supported languages
//    2. UI_STRINGS          — interface labels in all 6 languages
//    3. DNA_CONTENT         — the four DNA step texts in all 6 languages
//    4. VOCABULARY          — academic glossary with translations
//    5. Public API          — applyLanguage(), applyDNAContent(),
//                             renderVocabulary(), initI18n()
//
//  HONESTY NOTES:
//  - Translations here cover ONLY the built-in DNA content.
//  - Uploaded PDF content is never auto-translated.
//  - No content is presented as AI-generated when it is not.
//  - All translations are authored for biological accuracy.
// =============================================

// ─────────────────────────────────────────────
//  1. SUPPORTED LANGUAGES
// ─────────────────────────────────────────────

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English',  nativeName: 'English'  },
  { code: 'zh', name: 'Chinese',  nativeName: '中文'      },
  { code: 'es', name: 'Spanish',  nativeName: 'Español'  },
  { code: 'ko', name: 'Korean',   nativeName: '한국어'    },
  { code: 'ja', name: 'Japanese', nativeName: '日本語'    },
  { code: 'fr', name: 'French',   nativeName: 'Français' },
];

// ─────────────────────────────────────────────
//  2. UI STRINGS
//  Keys match data-i18n="key" attributes in HTML.
// ─────────────────────────────────────────────

const UI_STRINGS = {
  'nav.logo': {
    en: 'BioLens', zh: 'BioLens', es: 'BioLens',
    ko: 'BioLens', ja: 'BioLens', fr: 'BioLens',
  },
  'nav.tagline': {
    en: 'Explore DNA Replication, Step by Step',
    zh: '逐步探索 DNA 复制',
    es: 'Explora la Replicación del ADN, Paso a Paso',
    ko: 'DNA 복제를 단계별로 탐구하세요',
    ja: 'DNA複製をステップごとに探求しよう',
    fr: 'Explorez la Réplication de l\'ADN, Étape par Étape',
  },
  'intro.heading': {
    en: 'What is DNA Replication?',
    zh: '什么是 DNA 复制？',
    es: '¿Qué es la Replicación del ADN?',
    ko: 'DNA 복제란 무엇인가?',
    ja: 'DNA複製とは何か？',
    fr: 'Qu\'est-ce que la Réplication de l\'ADN ?',
  },
  'intro.body': {
    en: 'Every time a cell divides, it must copy all of its DNA so each daughter cell gets a complete set of genetic instructions. This process — called DNA replication — happens in four key stages. Click each step below to explore what happens and why it matters.',
    zh: '每次细胞分裂时，都必须复制其所有 DNA，以确保每个子细胞获得完整的遗传信息。这一过程称为 DNA 复制，分为四个关键阶段。点击下方每个步骤，探索发生了什么以及为何重要。',
    es: 'Cada vez que una célula se divide, debe copiar todo su ADN para que cada célula hija reciba un conjunto completo de instrucciones genéticas. Este proceso — llamado replicación del ADN — ocurre en cuatro etapas clave. Haz clic en cada paso para explorar qué sucede y por qué importa.',
    ko: '세포가 분열할 때마다 각 딸세포가 완전한 유전 정보를 갖도록 모든 DNA를 복사해야 합니다. 이 과정을 DNA 복제라고 하며, 네 가지 핵심 단계로 이루어집니다. 아래의 각 단계를 클릭하여 무슨 일이 일어나는지, 왜 중요한지 탐구해 보세요.',
    ja: '細胞が分裂するたびに、すべてのDNAをコピーして各娘細胞が完全な遺伝情報を持つようにしなければなりません。このプロセスはDNA複製と呼ばれ、4つの主要な段階で起こります。以下の各ステップをクリックして、何が起こるのか、なぜ重要なのかを探ってみましょう。',
    fr: 'Chaque fois qu\'une cellule se divise, elle doit copier tout son ADN pour que chaque cellule fille reçoive un ensemble complet d\'instructions génétiques. Ce processus — appelé réplication de l\'ADN — se déroule en quatre étapes clés. Cliquez sur chaque étape pour explorer ce qui se passe et pourquoi c\'est important.',
  },
  'step.unwinding': {
    en: 'Unwinding', zh: '解旋', es: 'Desenrollamiento',
    ko: '풀림', ja: '巻き戻し', fr: 'Déroulement',
  },
  'step.priming': {
    en: 'Priming', zh: '引物合成', es: 'Iniciación',
    ko: '프라이밍', ja: 'プライミング', fr: 'Amorçage',
  },
  'step.elongation': {
    en: 'Elongation', zh: '延伸', es: 'Elongación',
    ko: '신장', ja: '伸長', fr: 'Élongation',
  },
  'step.finishing': {
    en: 'Finishing', zh: '终止', es: 'Finalización',
    ko: '완성', ja: '完成', fr: 'Finalisation',
  },
  'quiz.heading': {
    en: '🧬 Quick Quiz',
    zh: '🧬 快速测验',
    es: '🧬 Prueba Rápida',
    ko: '🧬 빠른 퀴즈',
    ja: '🧬 クイッククイズ',
    fr: '🧬 Quiz Rapide',
  },
  'quiz.intro': {
    en: 'Test what you\'ve learned! Choose the best answer for each question.',
    zh: '测试你所学的内容！为每道题选择最佳答案。',
    es: '¡Pon a prueba lo que has aprendido! Elige la mejor respuesta para cada pregunta.',
    ko: '배운 내용을 테스트해 보세요! 각 문제에서 가장 좋은 답을 선택하세요.',
    ja: '学んだことをテストしよう！各問題に最適な答えを選んでください。',
    fr: 'Testez ce que vous avez appris ! Choisissez la meilleure réponse pour chaque question.',
  },
  'quiz.submit': {
    en: 'Check My Answers',
    zh: '检查答案',
    es: 'Verificar Respuestas',
    ko: '답 확인하기',
    ja: '答えを確認する',
    fr: 'Vérifier mes Réponses',
  },
  'upload.tab.pdf': {
    en: '📄 Upload PDF',
    zh: '📄 上传 PDF',
    es: '📄 Subir PDF',
    ko: '📄 PDF 업로드',
    ja: '📄 PDF をアップロード',
    fr: '📄 Télécharger PDF',
  },
  'upload.tab.paste': {
    en: '✏️ Paste Notes',
    zh: '✏️ 粘贴笔记',
    es: '✏️ Pegar Notas',
    ko: '✏️ 노트 붙여넣기',
    ja: '✏️ ノートを貼り付ける',
    fr: '✏️ Coller les Notes',
  },
  'upload.label': {
    en: 'Click to choose a PDF, or drag it here',
    zh: '点击选择 PDF，或将其拖到此处',
    es: 'Haz clic para elegir un PDF, o arrástralo aquí',
    ko: 'PDF를 선택하거나 여기에 드래그하세요',
    ja: 'PDFを選択するか、ここにドラッグしてください',
    fr: 'Cliquez pour choisir un PDF, ou faites-le glisser ici',
  },
  'upload.hint': {
    en: 'Works with text-based PDFs (lecture slides exported from PowerPoint/Keynote). Scanned image PDFs cannot be read.',
    zh: '适用于文字版 PDF（从 PowerPoint/Keynote 导出的讲义）。扫描图像 PDF 无法读取。',
    es: 'Funciona con PDFs basados en texto (diapositivas exportadas de PowerPoint/Keynote). Los PDFs de imágenes escaneadas no se pueden leer.',
    ko: '텍스트 기반 PDF(PowerPoint/Keynote에서 내보낸 강의 슬라이드)에서 작동합니다. 스캔된 이미지 PDF는 읽을 수 없습니다.',
    ja: 'テキストベースのPDF（PowerPoint/KeynoteからエクスポートしたスライドPDF）に対応しています。スキャンした画像PDFは読み取れません。',
    fr: 'Fonctionne avec les PDF basés sur du texte (diaporamas exportés depuis PowerPoint/Keynote). Les PDF d\'images numérisées ne peuvent pas être lus.',
  },
  'paste.label': {
    en: 'Paste your lecture notes below:',
    zh: '在下方粘贴您的课堂笔记：',
    es: 'Pega tus apuntes de clase a continuación:',
    ko: '강의 노트를 아래에 붙여넣으세요:',
    ja: '授業ノートを以下に貼り付けてください：',
    fr: 'Collez vos notes de cours ci-dessous :',
  },
  'paste.placeholder': {
    en: 'Paste your lecture notes, textbook excerpts, or study guide here…',
    zh: '在此粘贴您的课堂笔记、教材摘录或学习指南……',
    es: 'Pega aquí tus apuntes de clase, extractos de libros de texto o guía de estudio…',
    ko: '강의 노트, 교재 발췌문 또는 학습 가이드를 여기에 붙여넣으세요…',
    ja: '授業ノート、教科書の抜粋、または学習ガイドをここに貼り付けてください…',
    fr: 'Collez ici vos notes de cours, extraits de manuel ou guide d\'étude…',
  },
  'paste.use-btn': {
    en: 'Use These Notes →',
    zh: '使用这些笔记 →',
    es: 'Usar Estas Notas →',
    ko: '이 노트 사용 →',
    ja: 'このノートを使用 →',
    fr: 'Utiliser ces Notes →',
  },
  'tutor.heading': {
    en: '📚 Study Assistant',
    zh: '📚 学习助手',
    es: '📚 Asistente de Estudio',
    ko: '📚 학습 도우미',
    ja: '📚 学習アシスタント',
    fr: '📚 Assistant d\'Étude',
  },
  'tutor.subtitle': {
    en: 'Upload your lecture slides or paste your notes — then search for concepts or generate practice questions from your own material.',
    zh: '上传您的讲义或粘贴笔记，然后搜索概念或根据您的材料生成练习题。',
    es: 'Sube tus diapositivas de clase o pega tus notas — luego busca conceptos o genera preguntas de práctica a partir de tu material.',
    ko: '강의 슬라이드를 업로드하거나 노트를 붙여넣은 후, 개념을 검색하거나 자신의 자료를 기반으로 연습 문제를 생성하세요.',
    ja: '講義スライドをアップロードするか、ノートを貼り付けてから、概念を検索したり、自分の教材から練習問題を生成したりしましょう。',
    fr: 'Téléchargez vos diapositives de cours ou collez vos notes — puis recherchez des concepts ou générez des questions d\'entraînement à partir de votre matériel.',
  },
  'ask.heading': {
    en: '🔎 Ask a Question',
    zh: '🔎 提问',
    es: '🔎 Hacer una Pregunta',
    ko: '🔎 질문하기',
    ja: '🔎 質問する',
    fr: '🔎 Poser une Question',
  },
  'ask.note': {
    en: 'Type a concept or question. The assistant will find the most relevant passage in your notes. It searches for matching words — it does not reason or paraphrase.',
    zh: '输入一个概念或问题。助手将在您的笔记中找到最相关的段落。它搜索匹配的词语——不进行推理或释义。',
    es: 'Escribe un concepto o pregunta. El asistente encontrará el pasaje más relevante en tus notas. Busca palabras coincidentes — no razona ni parafrasea.',
    ko: '개념이나 질문을 입력하세요. 도우미가 노트에서 가장 관련성 높은 구절을 찾아드립니다. 일치하는 단어를 검색하는 것으로, 추론하거나 바꾸어 말하지 않습니다.',
    ja: '概念や質問を入力してください。アシスタントはノートの中から最も関連性の高い箇所を見つけます。一致する単語を検索するもので、推論や言い換えは行いません。',
    fr: 'Tapez un concept ou une question. L\'assistant trouvera le passage le plus pertinent dans vos notes. Il recherche des mots correspondants — il ne raisonne pas et ne reformule pas.',
  },
  'ask.placeholder': {
    en: 'e.g. What is the role of helicase?',
    zh: '例如：螺旋酶的作用是什么？',
    es: 'ej. ¿Cuál es la función de la helicasa?',
    ko: '예: 헬리케이스의 역할은 무엇인가요?',
    ja: '例：ヘリカーゼの役割は何ですか？',
    fr: 'ex. Quel est le rôle de l\'hélicase ?',
  },
  'ask.button': {
    en: 'Search Notes',
    zh: '搜索笔记',
    es: 'Buscar Notas',
    ko: '노트 검색',
    ja: 'ノートを検索',
    fr: 'Rechercher dans les Notes',
  },
  'practice.heading': {
    en: '🧩 Practice Quiz Generator',
    zh: '🧩 练习测验生成器',
    es: '🧩 Generador de Preguntas de Práctica',
    ko: '🧩 연습 퀴즈 생성기',
    ja: '🧩 練習クイズジェネレーター',
    fr: '🧩 Générateur de Quiz d\'Entraînement',
  },
  'practice.note': {
    en: 'Generates 3 multiple-choice questions from your notes using pattern matching (looks for definition-style sentences). Questions come directly from your text — nothing is invented.',
    zh: '使用模式匹配从您的笔记中生成 3 道选择题（查找定义式句子）。问题直接来自您的文本——不会编造任何内容。',
    es: 'Genera 3 preguntas de opción múltiple de tus notas usando coincidencia de patrones (busca oraciones tipo definición). Las preguntas provienen directamente de tu texto — nada se inventa.',
    ko: '패턴 매칭을 사용하여 노트에서 3개의 객관식 문제를 생성합니다(정의형 문장 탐색). 질문은 텍스트에서 직접 가져오며 — 아무것도 만들어내지 않습니다.',
    ja: 'パターンマッチングを使用してノートから3つの選択式問題を生成します（定義スタイルの文を探します）。質問はテキストから直接生成されます — 何も作り話ではありません。',
    fr: 'Génère 3 questions à choix multiples à partir de vos notes en utilisant la correspondance de modèles (recherche des phrases de type définition). Les questions proviennent directement de votre texte — rien n\'est inventé.',
  },
  'practice.generate-btn': {
    en: 'Generate 3 Practice Questions',
    zh: '生成 3 道练习题',
    es: 'Generar 3 Preguntas de Práctica',
    ko: '연습 문제 3개 생성',
    ja: '練習問題を3問生成',
    fr: 'Générer 3 Questions d\'Entraînement',
  },
  'vocab.heading': {
    en: 'Academic Vocabulary',
    zh: '学术词汇',
    es: 'Vocabulario Académico',
    ko: '학술 어휘',
    ja: '学術用語',
    fr: 'Vocabulaire Académique',
  },
  'vocab.subheading': {
    en: '15 key terms · translations verified for built-in content only',
    zh: '15 个关键术语 · 翻译仅针对内置内容验证',
    es: '15 términos clave · traducciones verificadas solo para contenido integrado',
    ko: '15개 핵심 용어 · 번역은 내장 콘텐츠에 대해서만 검증됨',
    ja: '15の主要用語 · 翻訳は内蔵コンテンツのみ検証済み',
    fr: '15 termes clés · traductions vérifiées pour le contenu intégré uniquement',
  },
  'vocab.col.term': {
    en: 'Term (English)', zh: '术语（英文）', es: 'Término (Inglés)',
    ko: '용어 (영어)', ja: '用語（英語）', fr: 'Terme (Anglais)',
  },
  'vocab.col.translation': {
    en: 'Translation', zh: '翻译', es: 'Traducción',
    ko: '번역', ja: '翻訳', fr: 'Traduction',
  },
  'vocab.col.definition': {
    en: 'Definition', zh: '定义', es: 'Definición',
    ko: '정의', ja: '定義', fr: 'Définition',
  },
  'mode.label': {
    en: 'Study mode:', zh: '学习模式：', es: 'Modo de estudio:',
    ko: '학습 모드:', ja: '学習モード：', fr: 'Mode d\'étude :',
  },
  'mode.original': {
    en: 'Original', zh: '原文', es: 'Original',
    ko: '원본', ja: 'オリジナル', fr: 'Original',
  },
  'mode.translated': {
    en: 'Translated', zh: '译文', es: 'Traducido',
    ko: '번역', ja: '翻訳', fr: 'Traduit',
  },
  'mode.bilingual': {
    en: 'Bilingual', zh: '双语', es: 'Bilingüe',
    ko: '이중 언어', ja: 'バイリンガル', fr: 'Bilingue',
  },
  'translation.badge': {
    en: 'Translated content', zh: '翻译内容', es: 'Contenido traducido',
    ko: '번역된 내용', ja: '翻訳コンテンツ', fr: 'Contenu traduit',
  },
  'uploaded.no-translation': {
    en: 'Study modes apply to built-in DNA content only. Translating uploaded notes requires AI — not yet available.',
    zh: '学习模式仅适用于内置 DNA 内容。翻译上传的笔记需要 AI——目前尚不支持。',
    es: 'Los modos de estudio se aplican solo al contenido de ADN integrado. Traducir notas cargadas requiere IA — aún no disponible.',
    ko: '학습 모드는 내장된 DNA 콘텐츠에만 적용됩니다. 업로드된 노트 번역은 AI가 필요합니다 — 아직 이용 불가.',
    ja: '学習モードは内蔵DNAコンテンツにのみ適用されます。アップロードしたノートの翻訳にはAIが必要です — まだ利用できません。',
    fr: 'Les modes d\'étude s\'appliquent uniquement au contenu ADN intégré. La traduction des notes téléchargées nécessite une IA — pas encore disponible.',
  },
  'ask.result.lang-note': {
    en: 'Result shown in the source language of your uploaded notes. Translation requires AI.',
    zh: '结果以上传笔记的源语言显示。翻译需要 AI。',
    es: 'El resultado se muestra en el idioma fuente de tus notas cargadas. La traducción requiere IA.',
    ko: '결과는 업로드된 노트의 원본 언어로 표시됩니다. 번역은 AI가 필요합니다.',
    ja: '結果はアップロードされたノートのソース言語で表示されます。翻訳にはAIが必要です。',
    fr: 'Le résultat est affiché dans la langue source de vos notes téléchargées. La traduction nécessite une IA.',
  },
  'footer.main': {
    en: '🔬 BioLens — Built for curious biology students everywhere.',
    zh: '🔬 BioLens — 为每一位充满好奇心的生物学学生而建。',
    es: '🔬 BioLens — Creado para estudiantes de biología curiosos en todas partes.',
    ko: '🔬 BioLens — 호기심 많은 생물학 학생들을 위해 만들어졌습니다.',
    ja: '🔬 BioLens — 好奇心旺盛な生物学の学生すべてのために作られました。',
    fr: '🔬 BioLens — Conçu pour les étudiants en biologie curieux du monde entier.',
  },
  'footer.note': {
    en: 'No logins, no databases, just learning.',
    zh: '无需登录，无需数据库，专注学习。',
    es: 'Sin inicios de sesión, sin bases de datos, solo aprendizaje.',
    ko: '로그인 없음, 데이터베이스 없음, 순수한 학습.',
    ja: 'ログイン不要、データベース不要、ただ学ぶだけ。',
    fr: 'Pas de connexion, pas de base de données, juste de l\'apprentissage.',
  },
};

// ─────────────────────────────────────────────
//  3. DNA CONTENT — four steps in 6 languages
//
//  Each step has:
//    heading, subtitle, para1, para2 (optional),
//    bullets: [ { term, desc } ],
//    keyFact
// ─────────────────────────────────────────────

const DNA_CONTENT = {
  unwinding: {
    en: {
      heading:  'Step 1: Unwinding',
      subtitle: 'Breaking open the double helix',
      para1: 'DNA normally exists as a twisted "double helix" — two strands wound around each other like a spiral staircase. Before copying can begin, this twist must be unzipped.',
      bullets: [
        { term: 'Helicase', desc: 'is an enzyme (a biological machine) that travels along the DNA and breaks the weak bonds between the two strands, like unzipping a zipper.' },
        { term: 'Replication bubble', desc: 'is the open region created, with two exposed single strands, each ready to serve as a template for copying.' },
        { term: 'SSBPs', desc: '(single-strand binding proteins) hold the strands apart so they don\'t snap back together.' },
      ],
      keyFact: 'Key molecule: Helicase — the "unzipper" of DNA',
    },
    zh: {
      heading:  '第一步：解旋',
      subtitle: '打开双螺旋结构',
      para1: 'DNA 通常以扭曲的"双螺旋"形式存在——两条链像螺旋楼梯一样缠绕在一起。在复制开始之前，必须先将这种扭曲结构解开。',
      bullets: [
        { term: '解旋酶 (Helicase)', desc: '是一种沿 DNA 移动并断裂两条链之间弱键的酶（生物机器），就像拉开拉链一样。' },
        { term: '复制泡 (Replication bubble)', desc: '是由此产生的开放区域，两条暴露的单链各自作为复制的模板。' },
        { term: '单链结合蛋白 SSBPs (Single-strand binding proteins)', desc: '将两条链分开，防止它们重新结合。' },
      ],
      keyFact: '关键分子：解旋酶 (Helicase)——DNA 的"拉链开启者"',
    },
    es: {
      heading:  'Paso 1: Desenrollamiento',
      subtitle: 'Abriendo la doble hélice',
      para1: 'El ADN normalmente existe como una "doble hélice" torcida — dos hebras enrolladas una alrededor de la otra como una escalera de caracol. Antes de que pueda comenzar la copia, esta torsión debe desabrocharse.',
      bullets: [
        { term: 'Helicasa (Helicase)', desc: 'es una enzima que viaja a lo largo del ADN y rompe los enlaces débiles entre las dos hebras, como abrir una cremallera.' },
        { term: 'Burbuja de replicación (Replication bubble)', desc: 'es la región abierta creada, con dos hebras simples expuestas, cada una lista para servir de molde.' },
        { term: 'SSBPs (Proteínas de unión a cadena simple)', desc: 'mantienen las hebras separadas para que no vuelvan a unirse.' },
      ],
      keyFact: 'Molécula clave: Helicasa — el "descompresor" del ADN',
    },
    ko: {
      heading:  '1단계: 풀림',
      subtitle: '이중 나선 구조 열기',
      para1: 'DNA는 보통 꼬인 "이중 나선" 형태로 존재합니다 — 두 가닥이 나선형 계단처럼 서로 감겨 있습니다. 복제가 시작되기 전에 이 꼬임을 풀어야 합니다.',
      bullets: [
        { term: '헬리케이스 (Helicase)', desc: 'DNA를 따라 이동하며 두 가닥 사이의 약한 결합을 끊는 효소(생물학적 기계)로, 지퍼를 여는 것과 같습니다.' },
        { term: '복제 기포 (Replication bubble)', desc: '생성된 열린 영역으로, 두 개의 노출된 단일 가닥이 각각 복제 주형 역할을 합니다.' },
        { term: '단일가닥 결합 단백질 SSBPs', desc: '두 가닥이 다시 붙지 않도록 분리 상태를 유지합니다.' },
      ],
      keyFact: '핵심 분자: 헬리케이스 (Helicase) — DNA의 "지퍼 오프너"',
    },
    ja: {
      heading:  'ステップ1：巻き戻し',
      subtitle: '二重らせんを開く',
      para1: 'DNAは通常、ねじれた「二重らせん」として存在します — 2本の鎖がらせん階段のように互いに巻きついています。複製が始まる前に、このねじれをほどかなければなりません。',
      bullets: [
        { term: 'ヘリカーゼ (Helicase)', desc: 'DNAに沿って移動し、2本の鎖の間の弱い結合を切断する酵素（生体機械）です。ジッパーを開けるようなものです。' },
        { term: '複製バブル (Replication bubble)', desc: '形成された開放領域で、露出した2本の一本鎖が各々複製の鋳型として機能します。' },
        { term: '一本鎖結合タンパク質 SSBPs', desc: '鎖が再結合しないように離れた状態を保ちます。' },
      ],
      keyFact: '主要分子：ヘリカーゼ (Helicase) — DNAの「ジッパー開け役」',
    },
    fr: {
      heading:  'Étape 1 : Déroulement',
      subtitle: 'Ouverture de la double hélice',
      para1: 'L\'ADN existe normalement sous forme de "double hélice" torsadée — deux brins enroulés l\'un autour de l\'autre comme un escalier en colimaçon. Avant que la copie puisse commencer, cette torsion doit être dézippée.',
      bullets: [
        { term: 'Hélicase (Helicase)', desc: 'est une enzyme qui se déplace le long de l\'ADN et rompt les liaisons faibles entre les deux brins, comme l\'ouverture d\'une fermeture éclair.' },
        { term: 'Bulle de réplication (Replication bubble)', desc: 'est la région ouverte créée, avec deux brins simples exposés, chacun prêt à servir de matrice.' },
        { term: 'SSBPs (Protéines de liaison aux brins simples)', desc: 'maintiennent les brins écartés pour qu\'ils ne se reforment pas.' },
      ],
      keyFact: 'Molécule clé : Hélicase — le « dézipper » de l\'ADN',
    },
  },

  priming: {
    en: {
      heading:  'Step 2: Priming',
      subtitle: 'Setting the starting line',
      para1: 'DNA polymerase — the main copying enzyme — cannot start from scratch. It needs a short "starter" sequence to attach to. That starter is called a primer.',
      bullets: [
        { term: 'Primase', desc: 'reads the exposed single strand and builds a short RNA primer (about 10 nucleotides long).' },
        { term: 'Primer', desc: 'marks the exact spot where copying will begin — like placing a bookmark before you start reading.' },
        { term: 'Dual priming', desc: 'Each template strand gets its own primer, so both strands can be copied simultaneously.' },
      ],
      keyFact: 'Key molecule: Primase — writes the "start here" signal',
    },
    zh: {
      heading:  '第二步：引物合成',
      subtitle: '设置起始点',
      para1: 'DNA 聚合酶——主要的复制酶——无法从头开始。它需要一段短小的"启动"序列来附着，这段序列称为引物。',
      bullets: [
        { term: '引物酶 (Primase)', desc: '读取暴露的单链，并合成一段短 RNA 引物（约 10 个核苷酸）。' },
        { term: '引物 (Primer)', desc: '标记复制开始的确切位置——就像在阅读前放置书签一样。' },
        { term: '双重引发', desc: '每条模板链都有自己的引物，因此两条链可以同时复制。' },
      ],
      keyFact: '关键分子：引物酶 (Primase)——写下"从这里开始"的信号',
    },
    es: {
      heading:  'Paso 2: Iniciación',
      subtitle: 'Estableciendo el punto de partida',
      para1: 'La ADN polimerasa — la principal enzima copiadora — no puede comenzar desde cero. Necesita una corta secuencia "iniciadora" a la que unirse. Esa secuencia iniciadora se llama cebador o primer.',
      bullets: [
        { term: 'Primasa (Primase)', desc: 'lee la hebra sencilla expuesta y construye un corto cebador de ARN (de unas 10 nucleótidos de longitud).' },
        { term: 'Cebador (Primer)', desc: 'marca el lugar exacto donde comenzará la copia — como poner un marcador de página antes de empezar a leer.' },
        { term: 'Doble iniciación', desc: 'Cada hebra molde recibe su propio cebador, de modo que ambas hebras pueden copiarse simultáneamente.' },
      ],
      keyFact: 'Molécula clave: Primasa — escribe la señal de "comenzar aquí"',
    },
    ko: {
      heading:  '2단계: 프라이밍',
      subtitle: '시작점 설정',
      para1: 'DNA 중합효소 — 주요 복제 효소 — 는 처음부터 시작할 수 없습니다. 부착할 짧은 "시작" 서열이 필요합니다. 그 시작 서열을 프라이머라고 합니다.',
      bullets: [
        { term: '프라이메이스 (Primase)', desc: '노출된 단일 가닥을 읽고 짧은 RNA 프라이머(약 10개의 뉴클레오타이드)를 합성합니다.' },
        { term: '프라이머 (Primer)', desc: '복제가 시작될 정확한 위치를 표시합니다 — 읽기 전에 책갈피를 끼워두는 것과 같습니다.' },
        { term: '이중 프라이밍', desc: '각 주형 가닥마다 자체 프라이머가 있으므로 두 가닥을 동시에 복제할 수 있습니다.' },
      ],
      keyFact: '핵심 분자: 프라이메이스 (Primase) — "여기서 시작" 신호를 작성',
    },
    ja: {
      heading:  'ステップ2：プライミング',
      subtitle: '出発点の設定',
      para1: 'DNA ポリメラーゼ — 主要なコピー酵素 — はゼロから始めることができません。付着するための短い「スターター」配列が必要です。そのスターターをプライマーと呼びます。',
      bullets: [
        { term: 'プライマーゼ (Primase)', desc: '露出した一本鎖を読み取り、短いRNAプライマー（約10ヌクレオチド長）を合成します。' },
        { term: 'プライマー (Primer)', desc: '複製が始まる正確な場所を示します — 読む前にしおりを挟むようなものです。' },
        { term: '二重プライミング', desc: '各鋳型鎖に独自のプライマーがあるため、両方の鎖を同時に複製できます。' },
      ],
      keyFact: '主要分子：プライマーゼ (Primase) — 「ここから開始」の信号を書く',
    },
    fr: {
      heading:  'Étape 2 : Amorçage',
      subtitle: 'Définition du point de départ',
      para1: 'L\'ADN polymérase — la principale enzyme de copie — ne peut pas commencer de zéro. Elle a besoin d\'une courte séquence "d\'amorce" à laquelle s\'attacher. Cette amorce est appelée primer.',
      bullets: [
        { term: 'Primase (Primase)', desc: 'lit le brin simple exposé et construit un court primer d\'ARN (d\'environ 10 nucléotides).' },
        { term: 'Primer (Primer)', desc: 'marque l\'endroit exact où la copie commencera — comme placer un marque-page avant de commencer à lire.' },
        { term: 'Double amorçage', desc: 'Chaque brin matrice reçoit son propre primer, de sorte que les deux brins peuvent être copiés simultanément.' },
      ],
      keyFact: 'Molécule clé : Primase — écrit le signal « commencer ici »',
    },
  },

  elongation: {
    en: {
      heading:  'Step 3: Elongation',
      subtitle: 'Building the new strands',
      para1: 'This is the main copying phase. DNA Polymerase III attaches to the primer and reads the template strand, adding matching DNA nucleotides one at a time.',
      bullets: [
        { term: 'Base pairing rule', desc: 'A pairs with T, and C pairs with G. DNA polymerase follows this rule perfectly, letter by letter.' },
        { term: 'Leading strand', desc: 'One new strand built smoothly and continuously in the direction of the replication fork.' },
        { term: 'Lagging strand & Okazaki fragments', desc: 'The other strand is built in short chunks called Okazaki fragments, because its template runs in the opposite direction.' },
      ],
      keyFact: 'Key molecule: DNA Polymerase III — the main "copy machine"',
    },
    zh: {
      heading:  '第三步：延伸',
      subtitle: '合成新链',
      para1: '这是主要的复制阶段。DNA 聚合酶 III 附着于引物并读取模板链，逐一添加匹配的 DNA 核苷酸。',
      bullets: [
        { term: '碱基配对规则 (Base pairing rule)', desc: 'A 与 T 配对，C 与 G 配对。DNA 聚合酶完美地遵循这一规则，逐一进行。' },
        { term: '前导链 (Leading strand)', desc: '一条新链沿复制叉方向平滑连续地合成。' },
        { term: '滞后链与冈崎片段 (Lagging strand & Okazaki fragments)', desc: '另一条链以称为冈崎片段的短片段形式合成，因为其模板方向相反。' },
      ],
      keyFact: '关键分子：DNA 聚合酶 III (DNA Polymerase III)——主要"复印机"',
    },
    es: {
      heading:  'Paso 3: Elongación',
      subtitle: 'Construyendo las nuevas hebras',
      para1: 'Esta es la fase principal de copia. La ADN Polimerasa III se une al cebador y lee la hebra molde, añadiendo nucleótidos de ADN coincidentes uno a la vez.',
      bullets: [
        { term: 'Regla de apareamiento de bases', desc: 'A se empareja con T, y C con G. La ADN polimerasa sigue esta regla perfectamente, letra por letra.' },
        { term: 'Hebra líder (Leading strand)', desc: 'Una nueva hebra construida de manera continua y fluida en la dirección de la horquilla de replicación.' },
        { term: 'Hebra rezagada y fragmentos de Okazaki', desc: 'La otra hebra se construye en fragmentos cortos llamados fragmentos de Okazaki, porque su molde corre en sentido contrario.' },
      ],
      keyFact: 'Molécula clave: ADN Polimerasa III — la principal "máquina copiadora"',
    },
    ko: {
      heading:  '3단계: 신장',
      subtitle: '새로운 가닥 합성',
      para1: '이것이 주요 복제 단계입니다. DNA 중합효소 III가 프라이머에 부착하여 주형 가닥을 읽고, 일치하는 DNA 뉴클레오타이드를 하나씩 추가합니다.',
      bullets: [
        { term: '염기 쌍 규칙 (Base pairing rule)', desc: 'A는 T와 쌍을 이루고, C는 G와 쌍을 이룹니다. DNA 중합효소는 이 규칙을 완벽하게 따릅니다.' },
        { term: '선도 가닥 (Leading strand)', desc: '복제 분기점 방향으로 매끄럽고 연속적으로 합성되는 새로운 가닥입니다.' },
        { term: '지연 가닥과 오카자키 절편 (Lagging strand & Okazaki fragments)', desc: '주형 방향이 반대이므로 오카자키 절편이라 불리는 짧은 조각들로 합성됩니다.' },
      ],
      keyFact: '핵심 분자: DNA 중합효소 III (DNA Polymerase III) — 주요 "복사기"',
    },
    ja: {
      heading:  'ステップ3：伸長',
      subtitle: '新しい鎖の合成',
      para1: 'これが主要なコピーフェーズです。DNA ポリメラーゼIIIはプライマーに付着し、鋳型鎖を読み取り、一致するDNAヌクレオチドを一つずつ追加します。',
      bullets: [
        { term: '塩基対形成規則 (Base pairing rule)', desc: 'AはTと対を形成し、CはGと対を形成します。DNAポリメラーゼはこのルールを一文字ずつ完全に守ります。' },
        { term: 'リーディング鎖 (Leading strand)', desc: '複製フォークの方向に滑らかに連続して合成される新しい鎖です。' },
        { term: 'ラギング鎖と岡崎フラグメント (Lagging strand & Okazaki fragments)', desc: '鋳型が逆方向に走るため、岡崎フラグメントと呼ばれる短い断片として合成されます。' },
      ],
      keyFact: '主要分子：DNAポリメラーゼIII (DNA Polymerase III) — 主な「コピー機」',
    },
    fr: {
      heading:  'Étape 3 : Élongation',
      subtitle: 'Construction des nouveaux brins',
      para1: 'C\'est la phase principale de copie. L\'ADN Polymérase III s\'attache au primer et lit le brin matrice, ajoutant des nucléotides d\'ADN correspondants un à la fois.',
      bullets: [
        { term: 'Règle d\'appariement des bases', desc: 'A s\'apparie avec T, et C avec G. L\'ADN polymérase suit cette règle parfaitement, lettre par lettre.' },
        { term: 'Brin directeur (Leading strand)', desc: 'Un nouveau brin construit de manière fluide et continue dans la direction de la fourche de réplication.' },
        { term: 'Brin discontinu et fragments d\'Okazaki', desc: 'L\'autre brin est construit en courts segments appelés fragments d\'Okazaki, car sa matrice court dans la direction opposée.' },
      ],
      keyFact: 'Molécule clé : ADN Polymérase III — la principale « machine à copier »',
    },
  },

  finishing: {
    en: {
      heading:  'Step 4: Finishing',
      subtitle: 'Sealing and proofreading',
      para1: 'After elongation, the new DNA strands need to be completed and cleaned up before the cell can use them.',
      bullets: [
        { term: 'DNA Polymerase I', desc: 'removes the RNA primers and fills in the gaps with the correct DNA nucleotides.' },
        { term: 'DNA Ligase', desc: 'acts like molecular glue, sealing the small nicks (breaks) between fragments to form one continuous strand.' },
        { term: 'Semi-conservative replication', desc: 'The result is two identical double-stranded DNA molecules, each containing one original strand and one newly made strand.' },
      ],
      keyFact: 'Key molecule: DNA Ligase — the "glue" that seals the new strand',
    },
    zh: {
      heading:  '第四步：终止',
      subtitle: '封闭与校对',
      para1: '延伸完成后，新合成的 DNA 链需要完成并整理，才能被细胞使用。',
      bullets: [
        { term: 'DNA 聚合酶 I (DNA Polymerase I)', desc: '移除 RNA 引物，并用正确的 DNA 核苷酸填补空缺。' },
        { term: 'DNA 连接酶 (DNA Ligase)', desc: '充当分子胶水，封闭片段之间的小缺口，形成连续的单链。' },
        { term: '半保留复制 (Semi-conservative replication)', desc: '结果是两个相同的双链 DNA 分子，每个都含有一条原始链和一条新合成链。' },
      ],
      keyFact: '关键分子：DNA 连接酶 (DNA Ligase)——封闭新链的"胶水"',
    },
    es: {
      heading:  'Paso 4: Finalización',
      subtitle: 'Sellado y corrección',
      para1: 'Después de la elongación, las nuevas hebras de ADN deben completarse y limpiarse antes de que la célula pueda usarlas.',
      bullets: [
        { term: 'ADN Polimerasa I (DNA Polymerase I)', desc: 'elimina los cebadores de ARN y rellena los espacios con los nucleótidos de ADN correctos.' },
        { term: 'ADN Ligasa (DNA Ligase)', desc: 'actúa como pegamento molecular, sellando las pequeñas muescas (roturas) entre fragmentos para formar un hebra continua.' },
        { term: 'Replicación semiconservativa (Semi-conservative replication)', desc: 'El resultado son dos moléculas idénticas de ADN de doble hebra, cada una con una hebra original y una nueva.' },
      ],
      keyFact: 'Molécula clave: ADN Ligasa — el "pegamento" que sella la nueva hebra',
    },
    ko: {
      heading:  '4단계: 완성',
      subtitle: '밀봉 및 교정',
      para1: '신장이 완료된 후, 세포가 사용할 수 있도록 새로운 DNA 가닥을 완성하고 정리해야 합니다.',
      bullets: [
        { term: 'DNA 중합효소 I (DNA Polymerase I)', desc: 'RNA 프라이머를 제거하고 올바른 DNA 뉴클레오타이드로 빈 곳을 채웁니다.' },
        { term: 'DNA 연결효소 (DNA Ligase)', desc: '분자 접착제처럼 작용하여 조각 사이의 작은 틈새(절단부)를 봉합하여 연속적인 가닥을 형성합니다.' },
        { term: '반보존적 복제 (Semi-conservative replication)', desc: '결과는 동일한 두 개의 이중 가닥 DNA 분자로, 각각 하나의 원본 가닥과 새로 합성된 가닥을 포함합니다.' },
      ],
      keyFact: '핵심 분자: DNA 연결효소 (DNA Ligase) — 새 가닥을 봉합하는 "접착제"',
    },
    ja: {
      heading:  'ステップ4：完成',
      subtitle: '封止と校正',
      para1: '伸長後、細胞が使用できるように新しいDNA鎖を完成させ、整理する必要があります。',
      bullets: [
        { term: 'DNAポリメラーゼI (DNA Polymerase I)', desc: 'RNAプライマーを除去し、正しいDNAヌクレオチドで隙間を埋めます。' },
        { term: 'DNAリガーゼ (DNA Ligase)', desc: '分子接着剤のように機能し、断片間の小さな切れ目を封止して連続した鎖を形成します。' },
        { term: '半保存的複製 (Semi-conservative replication)', desc: '結果は2つの同一の二本鎖DNA分子で、それぞれが1本の元の鎖と1本の新しく合成された鎖を含みます。' },
      ],
      keyFact: '主要分子：DNAリガーゼ (DNA Ligase) — 新しい鎖を封止する「接着剤」',
    },
    fr: {
      heading:  'Étape 4 : Finalisation',
      subtitle: 'Scellement et relecture',
      para1: 'Après l\'élongation, les nouveaux brins d\'ADN doivent être complétés et nettoyés avant que la cellule puisse les utiliser.',
      bullets: [
        { term: 'ADN Polymérase I (DNA Polymerase I)', desc: 'retire les primers d\'ARN et comble les lacunes avec les nucléotides d\'ADN corrects.' },
        { term: 'ADN Ligase (DNA Ligase)', desc: 'agit comme une colle moléculaire, scellant les petites entailles (cassures) entre les fragments pour former un brin continu.' },
        { term: 'Réplication semi-conservative', desc: 'Le résultat est deux molécules d\'ADN double brin identiques, chacune contenant un brin d\'origine et un nouveau brin.' },
      ],
      keyFact: 'Molécule clé : ADN Ligase — la « colle » qui scelle le nouveau brin',
    },
  },
};

// ─────────────────────────────────────────────
//  4. ACADEMIC VOCABULARY — 15 key terms
// ─────────────────────────────────────────────

const VOCABULARY = [
  {
    term: 'DNA Replication',
    translations: { zh: 'DNA 复制', es: 'Replicación del ADN', ko: 'DNA 복제', ja: 'DNA複製', fr: 'Réplication de l\'ADN' },
    definition: {
      en: 'The biological process by which a DNA molecule is copied to produce two identical DNA molecules, occurring before cell division.',
      zh: '在细胞分裂前，DNA 分子被复制产生两个相同 DNA 分子的生物过程。',
      es: 'El proceso biológico por el cual una molécula de ADN se copia para producir dos moléculas de ADN idénticas, antes de la división celular.',
      ko: '세포 분열 전에 DNA 분자가 복제되어 두 개의 동일한 DNA 분자를 생성하는 생물학적 과정.',
      ja: '細胞分裂前に、DNA分子がコピーされて2つの同一なDNA分子を生成する生物学的プロセス。',
      fr: 'Le processus biologique par lequel une molécule d\'ADN est copiée pour produire deux molécules d\'ADN identiques, avant la division cellulaire.',
    },
    example: {
      en: 'DNA replication ensures that each daughter cell inherits an exact copy of the parent cell\'s genome.',
      zh: 'DNA 复制确保每个子细胞都继承亲代细胞基因组的精确拷贝。',
      es: 'La replicación del ADN asegura que cada célula hija herede una copia exacta del genoma de la célula madre.',
      ko: 'DNA 복제는 각 딸세포가 모세포 유전체의 정확한 사본을 물려받도록 보장합니다.',
      ja: 'DNA複製により、各娘細胞が親細胞のゲノムの正確なコピーを受け継ぐことが保証されます。',
      fr: 'La réplication de l\'ADN garantit que chaque cellule fille hérite d\'une copie exacte du génome de la cellule mère.',
    },
  },
  {
    term: 'Helicase',
    translations: { zh: '解旋酶', es: 'Helicasa', ko: '헬리케이스', ja: 'ヘリカーゼ', fr: 'Hélicase' },
    definition: {
      en: 'An enzyme that unwinds the DNA double helix by breaking the hydrogen bonds between complementary base pairs at the replication fork.',
      zh: '一种在复制叉处通过断裂互补碱基对之间的氢键来解开 DNA 双螺旋的酶。',
      es: 'Una enzima que desenrolla la doble hélice del ADN al romper los enlaces de hidrógeno entre los pares de bases complementarios en la horquilla de replicación.',
      ko: '복제 분기점에서 상보적 염기쌍 사이의 수소 결합을 끊어 DNA 이중 나선을 풀어주는 효소.',
      ja: '複製フォークで相補的な塩基対間の水素結合を切ることでDNA二重らせんを解く酵素。',
      fr: 'Une enzyme qui déroule la double hélice d\'ADN en rompant les liaisons hydrogène entre les paires de bases complémentaires au niveau de la fourche de réplication.',
    },
    example: {
      en: 'Helicase travels along the DNA like a locomotive, splitting the two strands and creating the replication fork.',
      zh: '解旋酶像机车一样沿着 DNA 移动，分开两条链并形成复制叉。',
      es: 'La helicasa viaja a lo largo del ADN como una locomotora, separando las dos hebras y creando la horquilla de replicación.',
      ko: '헬리케이스는 기관차처럼 DNA를 따라 이동하면서 두 가닥을 분리하고 복제 분기점을 만듭니다.',
      ja: 'ヘリカーゼは機関車のようにDNAに沿って移動し、2本の鎖を分離して複製フォークを作ります。',
      fr: 'L\'hélicase voyage le long de l\'ADN comme une locomotive, séparant les deux brins et créant la fourche de réplication.',
    },
  },
  {
    term: 'DNA Polymerase',
    translations: { zh: 'DNA 聚合酶', es: 'ADN Polimerasa', ko: 'DNA 중합효소', ja: 'DNAポリメラーゼ', fr: 'ADN Polymérase' },
    definition: {
      en: 'An enzyme that synthesizes new DNA strands by adding complementary nucleotides to the template strand in a 5\' to 3\' direction.',
      zh: '一种通过按 5′→3′ 方向向模板链添加互补核苷酸来合成新 DNA 链的酶。',
      es: 'Una enzima que sintetiza nuevas hebras de ADN añadiendo nucleótidos complementarios a la hebra molde en dirección 5\' a 3\'.',
      ko: '주형 가닥에 상보적 뉴클레오타이드를 5\'에서 3\' 방향으로 추가하여 새로운 DNA 가닥을 합성하는 효소.',
      ja: '鋳型鎖に相補的なヌクレオチドを5\'から3\'方向に付加することで新しいDNA鎖を合成する酵素。',
      fr: 'Une enzyme qui synthétise de nouveaux brins d\'ADN en ajoutant des nucléotides complémentaires au brin matrice dans la direction 5\' à 3\'.',
    },
    example: {
      en: 'DNA Polymerase III is the main polymerase in bacteria; it reads the template and builds the new strand with high fidelity.',
      zh: 'DNA 聚合酶 III 是细菌中的主要聚合酶，它读取模板并以高保真度合成新链。',
      es: 'La ADN Polimerasa III es la principal polimerasa en bacterias; lee la molde y construye la nueva hebra con alta fidelidad.',
      ko: 'DNA 중합효소 III는 세균의 주요 중합효소로, 주형을 읽고 높은 정확도로 새 가닥을 합성합니다.',
      ja: 'DNAポリメラーゼIIIは細菌の主要なポリメラーゼで、鋳型を読み取り、高い忠実度で新しい鎖を合成します。',
      fr: 'L\'ADN Polymérase III est la principale polymérase chez les bactéries ; elle lit la matrice et construit le nouveau brin avec haute fidélité.',
    },
  },
  {
    term: 'Primase',
    translations: { zh: '引物酶', es: 'Primasa', ko: '프라이메이스', ja: 'プライマーゼ', fr: 'Primase' },
    definition: {
      en: 'An RNA polymerase enzyme that synthesizes a short RNA primer complementary to the template strand, providing a free 3\'-OH end for DNA polymerase to extend.',
      zh: '一种 RNA 聚合酶，合成与模板链互补的短 RNA 引物，为 DNA 聚合酶的延伸提供游离 3′-OH 末端。',
      es: 'Una enzima ARN polimerasa que sintetiza un corto primer de ARN complementario a la hebra molde, proporcionando un extremo 3\'-OH libre para que la ADN polimerasa lo extienda.',
      ko: '주형 가닥과 상보적인 짧은 RNA 프라이머를 합성하여 DNA 중합효소가 연장할 수 있는 자유 3\'-OH 말단을 제공하는 RNA 중합효소.',
      ja: '鋳型鎖に相補的な短いRNAプライマーを合成し、DNAポリメラーゼが伸長するための遊離3\'-OH末端を提供するRNA重合酵素。',
      fr: 'Une enzyme ARN polymérase qui synthétise un court primer d\'ARN complémentaire au brin matrice, fournissant une extrémité 3\'-OH libre pour que l\'ADN polymérase s\'étende.',
    },
    example: {
      en: 'Primase lays down the RNA primer before DNA Polymerase III can begin copying the template.',
      zh: '引物酶在 DNA 聚合酶 III 开始复制模板之前合成 RNA 引物。',
      es: 'La primasa deposita el primer de ARN antes de que la ADN Polimerasa III pueda comenzar a copiar la molde.',
      ko: 'DNA 중합효소 III가 주형 복제를 시작하기 전에 프라이메이스가 RNA 프라이머를 합성합니다.',
      ja: 'DNAポリメラーゼIIIが鋳型のコピーを始める前に、プライマーゼがRNAプライマーを敷きます。',
      fr: 'La primase dépose le primer d\'ARN avant que l\'ADN Polymérase III puisse commencer à copier la matrice.',
    },
  },
  {
    term: 'Primer',
    translations: { zh: '引物', es: 'Cebador', ko: '프라이머', ja: 'プライマー', fr: 'Primer' },
    definition: {
      en: 'A short sequence of RNA (or DNA) that provides a free 3\'-hydroxyl group to which DNA polymerase can attach and begin synthesizing the new DNA strand.',
      zh: '一段短 RNA（或 DNA）序列，提供游离 3′-羟基，DNA 聚合酶可附着并开始合成新 DNA 链。',
      es: 'Una corta secuencia de ARN (o ADN) que proporciona un grupo 3\'-hidroxilo libre al que la ADN polimerasa puede unirse y comenzar a sintetizar la nueva hebra de ADN.',
      ko: 'DNA 중합효소가 부착하여 새로운 DNA 가닥 합성을 시작할 수 있는 자유 3\'-하이드록실기를 제공하는 짧은 RNA(또는 DNA) 서열.',
      ja: 'DNAポリメラーゼが付着して新しいDNA鎖の合成を開始できる遊離3\'-ヒドロキシル基を提供する短いRNA（またはDNA）配列。',
      fr: 'Une courte séquence d\'ARN (ou d\'ADN) qui fournit un groupe 3\'-hydroxyle libre auquel l\'ADN polymérase peut s\'attacher et commencer à synthétiser le nouveau brin d\'ADN.',
    },
    example: {
      en: 'Without a primer, DNA polymerase has no starting point and cannot begin replication.',
      zh: '没有引物，DNA 聚合酶就没有起始点，无法开始复制。',
      es: 'Sin un cebador, la ADN polimerasa no tiene punto de partida y no puede comenzar la replicación.',
      ko: '프라이머 없이는 DNA 중합효소가 시작점이 없어 복제를 시작할 수 없습니다.',
      ja: 'プライマーがなければ、DNAポリメラーゼは出発点がなく、複製を開始できません。',
      fr: 'Sans primer, l\'ADN polymérase n\'a pas de point de départ et ne peut pas commencer la réplication.',
    },
  },
  {
    term: 'DNA Ligase',
    translations: { zh: 'DNA 连接酶', es: 'ADN Ligasa', ko: 'DNA 연결효소', ja: 'DNAリガーゼ', fr: 'ADN Ligase' },
    definition: {
      en: 'An enzyme that catalyzes the formation of a phosphodiester bond between adjacent nucleotides, joining Okazaki fragments and sealing nicks in the DNA backbone.',
      zh: '一种催化相邻核苷酸之间磷酸二酯键形成的酶，连接冈崎片段并封闭 DNA 骨架上的缺口。',
      es: 'Una enzima que cataliza la formación de un enlace fosfodiéster entre nucleótidos adyacentes, uniendo los fragmentos de Okazaki y sellando las muescas en el esqueleto del ADN.',
      ko: '인접한 뉴클레오타이드 사이에 인산다이에스터 결합 형성을 촉매하여 오카자키 절편을 연결하고 DNA 골격의 틈을 봉합하는 효소.',
      ja: '隣接するヌクレオチド間のホスホジエステル結合の形成を触媒し、岡崎フラグメントを結合してDNAバックボーンの切れ目を封止する酵素。',
      fr: 'Une enzyme qui catalyse la formation d\'une liaison phosphodiester entre des nucléotides adjacents, joignant les fragments d\'Okazaki et scellant les entailles dans le squelette de l\'ADN.',
    },
    example: {
      en: 'After DNA Polymerase I replaces the RNA primers with DNA, Ligase seals the remaining nicks to create a seamless double strand.',
      zh: 'DNA 聚合酶 I 用 DNA 替换 RNA 引物后，连接酶封闭剩余的缺口，形成无缝的双链。',
      es: 'Después de que la ADN Polimerasa I reemplaza los primers de ARN con ADN, la Ligasa sella las muescas restantes para crear una doble hebra sin interrupciones.',
      ko: 'DNA 중합효소 I이 RNA 프라이머를 DNA로 교체한 후, 연결효소가 남은 틈새를 봉합하여 매끄러운 이중 가닥을 만듭니다.',
      ja: 'DNAポリメラーゼIがRNAプライマーをDNAに置き換えた後、リガーゼが残った切れ目を封止して継ぎ目のない二本鎖を作ります。',
      fr: 'Après que l\'ADN Polymérase I remplace les primers d\'ARN par de l\'ADN, la Ligase scelle les entailles restantes pour créer un double brin sans interruption.',
    },
  },
  {
    term: 'Okazaki Fragment',
    translations: { zh: '冈崎片段', es: 'Fragmento de Okazaki', ko: '오카자키 절편', ja: '岡崎フラグメント', fr: 'Fragment d\'Okazaki' },
    definition: {
      en: 'Short DNA segments synthesized discontinuously on the lagging strand template during DNA replication, named after Reiji Okazaki who discovered them.',
      zh: 'DNA 复制期间在滞后链模板上不连续合成的短 DNA 片段，以发现者冈崎令治命名。',
      es: 'Segmentos cortos de ADN sintetizados de forma discontinua en la hebra molde rezagada durante la replicación del ADN, llamados así por Reiji Okazaki, quien los descubrió.',
      ko: 'DNA 복제 중 지연 가닥 주형에서 불연속적으로 합성되는 짧은 DNA 절편으로, 이를 발견한 오카자키 레이지의 이름을 따서 명명됨.',
      ja: 'DNA複製中に鋳型の遅れ鎖側で不連続に合成される短いDNAセグメントで、発見者の岡崎令治にちなんで命名されました。',
      fr: 'Courts segments d\'ADN synthétisés de manière discontinue sur le brin matrice discontinu lors de la réplication de l\'ADN, nommés d\'après Reiji Okazaki qui les a découverts.',
    },
    example: {
      en: 'Each Okazaki fragment begins with its own RNA primer and is eventually joined together by DNA Ligase.',
      zh: '每个冈崎片段都以自己的 RNA 引物开始，最终由 DNA 连接酶连接在一起。',
      es: 'Cada fragmento de Okazaki comienza con su propio primer de ARN y eventualmente se une por la ADN Ligasa.',
      ko: '각 오카자키 절편은 자체 RNA 프라이머로 시작하며 궁극적으로 DNA 연결효소에 의해 연결됩니다.',
      ja: '各岡崎フラグメントは独自のRNAプライマーから始まり、最終的にDNAリガーゼによって結合されます。',
      fr: 'Chaque fragment d\'Okazaki commence par son propre primer d\'ARN et est finalement joint par l\'ADN Ligase.',
    },
  },
  {
    term: 'Semi-conservative Replication',
    translations: { zh: '半保留复制', es: 'Replicación Semiconservativa', ko: '반보존적 복제', ja: '半保存的複製', fr: 'Réplication Semi-conservative' },
    definition: {
      en: 'The mechanism of DNA replication in which each daughter molecule retains one original (parental) strand and gains one newly synthesized strand.',
      zh: 'DNA 复制的机制，其中每个子分子保留一条原始（亲代）链并获得一条新合成的链。',
      es: 'El mecanismo de replicación del ADN en el que cada molécula hija retiene una hebra original (parental) y obtiene una hebra recién sintetizada.',
      ko: '각 딸 분자가 하나의 원본(부모) 가닥을 유지하고 하나의 새로 합성된 가닥을 얻는 DNA 복제 메커니즘.',
      ja: '各娘分子が1本の元の（親）鎖を保持し、1本の新しく合成された鎖を獲得するDNA複製のメカニズム。',
      fr: 'Le mécanisme de réplication de l\'ADN dans lequel chaque molécule fille conserve un brin original (parental) et acquiert un brin nouvellement synthétisé.',
    },
    example: {
      en: 'The Meselson-Stahl experiment (1958) proved semi-conservative replication using nitrogen isotope labeling.',
      zh: 'Meselson-Stahl 实验（1958 年）利用氮同位素标记证明了半保留复制。',
      es: 'El experimento de Meselson-Stahl (1958) demostró la replicación semiconservativa utilizando marcado con isótopos de nitrógeno.',
      ko: 'Meselson-Stahl 실험(1958)은 질소 동위원소 표지를 사용하여 반보존적 복제를 증명했습니다.',
      ja: 'メセルソン-スタール実験（1958年）は窒素同位体ラベリングを使用して半保存的複製を証明しました。',
      fr: 'L\'expérience de Meselson-Stahl (1958) a prouvé la réplication semi-conservative en utilisant le marquage aux isotopes d\'azote.',
    },
  },
  {
    term: 'Replication Fork',
    translations: { zh: '复制叉', es: 'Horquilla de Replicación', ko: '복제 분기점', ja: '複製フォーク', fr: 'Fourche de Réplication' },
    definition: {
      en: 'The Y-shaped region of a replicating DNA molecule where the double helix is unwound and new strands are synthesized.',
      zh: '复制 DNA 分子中 Y 形区域，双螺旋在此解开，新链在此合成。',
      es: 'La región en forma de Y de una molécula de ADN en replicación donde la doble hélice se desenrolla y se sintetizan las nuevas hebras.',
      ko: '이중 나선이 풀리고 새로운 가닥이 합성되는 복제 중인 DNA 분자의 Y자 형태 영역.',
      ja: '二重らせんが解かれ、新しい鎖が合成されている複製中のDNA分子のY字型領域。',
      fr: 'La région en forme de Y d\'une molécule d\'ADN en cours de réplication où la double hélice est déroulée et de nouveaux brins sont synthétisés.',
    },
    example: {
      en: 'Both the leading and lagging strands are synthesized simultaneously at the replication fork.',
      zh: '前导链和滞后链在复制叉处同时合成。',
      es: 'Tanto la hebra líder como la rezagada se sintetizan simultáneamente en la horquilla de replicación.',
      ko: '선도 가닥과 지연 가닥 모두 복제 분기점에서 동시에 합성됩니다.',
      ja: 'リーディング鎖とラギング鎖の両方が複製フォークで同時に合成されます。',
      fr: 'Les brins directeur et discontinu sont synthétisés simultanément au niveau de la fourche de réplication.',
    },
  },
  {
    term: 'Template Strand',
    translations: { zh: '模板链', es: 'Hebra Molde', ko: '주형 가닥', ja: '鋳型鎖', fr: 'Brin Matrice' },
    definition: {
      en: 'The strand of DNA used as a guide for synthesizing a new complementary strand during replication, read in the 3\' to 5\' direction by DNA polymerase.',
      zh: '在复制过程中用作合成新互补链指导的 DNA 链，由 DNA 聚合酶按 3′→5′ 方向读取。',
      es: 'La hebra de ADN utilizada como guía para sintetizar una nueva hebra complementaria durante la replicación, leída en la dirección 3\' a 5\' por la ADN polimerasa.',
      ko: 'DNA 중합효소가 3\'에서 5\' 방향으로 읽으며 복제 중 새로운 상보적 가닥 합성의 지침으로 사용되는 DNA 가닥.',
      ja: 'DNA複製中に新しい相補鎖を合成するための指針として使用されるDNA鎖で、DNAポリメラーゼが3\'から5\'方向に読み取ります。',
      fr: 'Le brin d\'ADN utilisé comme guide pour synthétiser un nouveau brin complémentaire lors de la réplication, lu dans la direction 3\' à 5\' par l\'ADN polymérase.',
    },
    example: {
      en: 'The template strand sequence 3\'-ATCG-5\' directs the synthesis of a new 5\'-TAGC-3\' strand.',
      zh: '模板链序列 3′-ATCG-5′ 指导合成新的 5′-TAGC-3′ 链。',
      es: 'La secuencia de la hebra molde 3\'-ATCG-5\' dirige la síntesis de una nueva hebra 5\'-TAGC-3\'.',
      ko: '주형 가닥 서열 3\'-ATCG-5\'는 새로운 5\'-TAGC-3\' 가닥의 합성을 유도합니다.',
      ja: '鋳型鎖配列3\'-ATCG-5\'は新しい5\'-TAGC-3\'鎖の合成を誘導します。',
      fr: 'La séquence du brin matrice 3\'-ATCG-5\' dirige la synthèse d\'un nouveau brin 5\'-TAGC-3\'.',
    },
  },
  {
    term: 'Leading Strand',
    translations: { zh: '前导链', es: 'Hebra Líder', ko: '선도 가닥', ja: 'リーディング鎖', fr: 'Brin Directeur' },
    definition: {
      en: 'The newly synthesized DNA strand that is made continuously in the 5\' to 3\' direction toward the replication fork.',
      zh: '在 5′→3′ 方向朝复制叉连续合成的新 DNA 链。',
      es: 'La hebra de ADN recién sintetizada que se produce de forma continua en la dirección 5\' a 3\' hacia la horquilla de replicación.',
      ko: '복제 분기점 방향으로 5\'에서 3\' 방향으로 연속적으로 합성되는 새로운 DNA 가닥.',
      ja: '複製フォークに向かって5\'から3\'方向に連続的に合成される新しいDNA鎖。',
      fr: 'Le brin d\'ADN nouvellement synthétisé qui est produit de manière continue dans la direction 5\' à 3\' vers la fourche de réplication.',
    },
    example: {
      en: 'The leading strand requires only one primer and is extended continuously by DNA Polymerase III.',
      zh: '前导链只需要一个引物，由 DNA 聚合酶 III 连续延伸。',
      es: 'La hebra líder requiere solo un cebador y es extendida de forma continua por la ADN Polimerasa III.',
      ko: '선도 가닥은 하나의 프라이머만 필요하며 DNA 중합효소 III에 의해 연속적으로 연장됩니다.',
      ja: 'リーディング鎖は1つのプライマーのみを必要とし、DNAポリメラーゼIIIによって連続的に伸長されます。',
      fr: 'Le brin directeur ne nécessite qu\'un seul primer et est étendu de manière continue par l\'ADN Polymérase III.',
    },
  },
  {
    term: 'Lagging Strand',
    translations: { zh: '滞后链', es: 'Hebra Rezagada', ko: '지연 가닥', ja: 'ラギング鎖', fr: 'Brin Discontinu' },
    definition: {
      en: 'The newly synthesized DNA strand that is made discontinuously in short fragments (Okazaki fragments) in the direction away from the replication fork.',
      zh: '在远离复制叉的方向以短片段（冈崎片段）不连续合成的新 DNA 链。',
      es: 'La hebra de ADN recién sintetizada que se produce de forma discontinua en fragmentos cortos (fragmentos de Okazaki) en dirección opuesta a la horquilla de replicación.',
      ko: '복제 분기점에서 멀어지는 방향으로 짧은 절편(오카자키 절편)으로 불연속적으로 합성되는 새로운 DNA 가닥.',
      ja: '複製フォークから離れる方向に短いフラグメント（岡崎フラグメント）として不連続に合成される新しいDNA鎖。',
      fr: 'Le brin d\'ADN nouvellement synthétisé qui est produit de manière discontinue en courts fragments (fragments d\'Okazaki) dans la direction opposée à la fourche de réplication.',
    },
    example: {
      en: 'The lagging strand requires a new RNA primer for each Okazaki fragment, making its synthesis more complex.',
      zh: '滞后链的每个冈崎片段都需要一个新的 RNA 引物，使其合成更为复杂。',
      es: 'La hebra rezagada requiere un nuevo cebador de ARN para cada fragmento de Okazaki, lo que hace su síntesis más compleja.',
      ko: '지연 가닥은 각 오카자키 절편에 새로운 RNA 프라이머가 필요하여 합성이 더 복잡합니다.',
      ja: 'ラギング鎖は各岡崎フラグメントに新しいRNAプライマーを必要とするため、その合成はより複雑です。',
      fr: 'Le brin discontinu nécessite un nouveau primer d\'ARN pour chaque fragment d\'Okazaki, ce qui rend sa synthèse plus complexe.',
    },
  },
  {
    term: 'Nucleotide',
    translations: { zh: '核苷酸', es: 'Nucleótido', ko: '뉴클레오타이드', ja: 'ヌクレオチド', fr: 'Nucléotide' },
    definition: {
      en: 'The monomer unit of nucleic acids, consisting of a nitrogenous base, a five-carbon sugar (deoxyribose in DNA), and a phosphate group.',
      zh: '核酸的单体单位，由含氮碱基、五碳糖（DNA 中为脱氧核糖）和磷酸基团组成。',
      es: 'La unidad monómera de los ácidos nucleicos, que consiste en una base nitrogenada, un azúcar de cinco carbonos (desoxirribosa en el ADN) y un grupo fosfato.',
      ko: '핵산의 단량체 단위로, 질소 염기, 5탄당(DNA에서는 디옥시리보스), 인산기로 구성됩니다.',
      ja: '核酸の単量体単位で、含窒素塩基、5炭素糖（DNAではデオキシリボース）、リン酸基で構成されます。',
      fr: 'L\'unité monomère des acides nucléiques, constituée d\'une base azotée, d\'un sucre à cinq carbones (désoxyribose dans l\'ADN) et d\'un groupe phosphate.',
    },
    example: {
      en: 'The four DNA nucleotides contain the bases adenine (A), thymine (T), cytosine (C), and guanine (G).',
      zh: '四种 DNA 核苷酸含有碱基腺嘌呤 (A)、胸腺嘧啶 (T)、胞嘧啶 (C) 和鸟嘌呤 (G)。',
      es: 'Los cuatro nucleótidos del ADN contienen las bases adenina (A), timina (T), citosina (C) y guanina (G).',
      ko: '네 가지 DNA 뉴클레오타이드에는 아데닌(A), 티민(T), 시토신(C), 구아닌(G) 염기가 포함되어 있습니다.',
      ja: '4種類のDNAヌクレオチドには塩基アデニン(A)、チミン(T)、シトシン(C)、グアニン(G)が含まれています。',
      fr: 'Les quatre nucléotides de l\'ADN contiennent les bases adénine (A), thymine (T), cytosine (C) et guanine (G).',
    },
  },
  {
    term: 'Base Pair',
    translations: { zh: '碱基对', es: 'Par de Bases', ko: '염기쌍', ja: '塩基対', fr: 'Paire de Bases' },
    definition: {
      en: 'Two complementary nucleotide bases held together by hydrogen bonds in the DNA double helix: adenine pairs with thymine (A-T), and cytosine pairs with guanine (C-G).',
      zh: 'DNA 双螺旋中通过氢键结合的两个互补核苷酸碱基：腺嘌呤与胸腺嘧啶配对 (A-T)，胞嘧啶与鸟嘌呤配对 (C-G)。',
      es: 'Dos bases de nucleótidos complementarias unidas por enlaces de hidrógeno en la doble hélice del ADN: la adenina se empareja con la timina (A-T), y la citosina con la guanina (C-G).',
      ko: 'DNA 이중 나선에서 수소 결합으로 결합된 두 개의 상보적 뉴클레오타이드 염기: 아데닌은 티민(A-T), 시토신은 구아닌(C-G)과 쌍을 이룹니다.',
      ja: 'DNA二重らせんの水素結合で結合した2つの相補的なヌクレオチド塩基：アデニンはチミンと(A-T)、シトシンはグアニンと(C-G)対を形成します。',
      fr: 'Deux bases nucléotidiques complémentaires maintenues ensemble par des liaisons hydrogène dans la double hélice d\'ADN : l\'adénine s\'apparie avec la thymine (A-T), et la cytosine avec la guanine (C-G).',
    },
    example: {
      en: 'A DNA molecule with 1000 base pairs contains 1000 A-T pairs and/or C-G pairs holding the two strands together.',
      zh: '含有 1000 个碱基对的 DNA 分子包含 1000 个 A-T 和/或 C-G 对，将两条链连接在一起。',
      es: 'Una molécula de ADN con 1000 pares de bases contiene 1000 pares A-T y/o C-G que mantienen las dos hebras unidas.',
      ko: '1000개의 염기쌍을 가진 DNA 분자에는 두 가닥을 결합하는 1000개의 A-T 쌍 및/또는 C-G 쌍이 포함됩니다.',
      ja: '1000塩基対を持つDNA分子には、2本の鎖を結合する1000個のA-T対および/またはC-G対が含まれています。',
      fr: 'Une molécule d\'ADN avec 1000 paires de bases contient 1000 paires A-T et/ou C-G maintenant les deux brins ensemble.',
    },
  },
  {
    term: 'Single-Strand Binding Proteins (SSBPs)',
    translations: { zh: '单链结合蛋白', es: 'Proteínas de Unión a Cadena Simple', ko: '단일가닥 결합 단백질', ja: '一本鎖結合タンパク質', fr: 'Protéines de Liaison aux Brins Simples' },
    definition: {
      en: 'Proteins that bind to single-stranded DNA after unwinding, stabilizing the separated strands and preventing them from re-annealing or forming secondary structures.',
      zh: '在解旋后与单链 DNA 结合的蛋白质，稳定分离的链并防止它们重新退火或形成二级结构。',
      es: 'Proteínas que se unen al ADN de cadena simple después del desenrollamiento, estabilizando las hebras separadas y evitando que se vuelvan a unir o formen estructuras secundarias.',
      ko: '풀린 후 단일 가닥 DNA에 결합하여 분리된 가닥을 안정화하고 재어닐링 또는 2차 구조 형성을 방지하는 단백질.',
      ja: '解旋後に一本鎖DNAに結合し、分離した鎖を安定化させ、再アニーリングや二次構造の形成を防ぐタンパク質。',
      fr: 'Protéines qui se lient à l\'ADN simple brin après le déroulement, stabilisant les brins séparés et les empêchant de se ré-apparier ou de former des structures secondaires.',
    },
    example: {
      en: 'SSBPs coat the exposed single strands at the replication fork, keeping them available for DNA polymerase.',
      zh: '单链结合蛋白包覆复制叉处暴露的单链，使其对 DNA 聚合酶保持可用。',
      es: 'Las SSBPs recubren las hebras simples expuestas en la horquilla de replicación, manteniéndolas disponibles para la ADN polimerasa.',
      ko: 'SSBP는 복제 분기점에서 노출된 단일 가닥을 코팅하여 DNA 중합효소에 사용 가능한 상태로 유지합니다.',
      ja: 'SSBPは複製フォークで露出した一本鎖をコートし、DNAポリメラーゼが利用できる状態に保ちます。',
      fr: 'Les SSBPs recouvrent les brins simples exposés à la fourche de réplication, les maintenant disponibles pour l\'ADN polymérase.',
    },
  },
];

// ─────────────────────────────────────────────
//  5. STATE
// ─────────────────────────────────────────────

let currentLang = 'en';
let currentMode = 'original'; // 'original' | 'translated' | 'bilingual'

// ─────────────────────────────────────────────
//  6. PUBLIC API
// ─────────────────────────────────────────────

/**
 * Apply UI string translations to all [data-i18n] elements.
 * @param {string} lang - language code
 */
function applyLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const strings = UI_STRINGS[key];
    if (!strings) return;
    const val = strings[lang] || strings['en'];

    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else if (el.hasAttribute('data-i18n-attr')) {
      el.setAttribute(el.getAttribute('data-i18n-attr'), val);
    } else {
      el.textContent = val;
    }
  });

  // Update the language selector visual state
  const selector = document.getElementById('langSelector');
  if (selector) selector.value = lang;

  // Update study mode label visibility
  updateModeSwitcherVisibility();

  // Persist to storage
  try {
    sessionStorage.setItem('bl_lang', lang);
    localStorage.setItem('bl_lang', lang);
  } catch (_) {}
}

/**
 * Apply the DNA content for a given step and mode to the DOM.
 * Called whenever the active step changes or mode/language changes.
 * @param {string} stepName - 'unwinding' | 'priming' | 'elongation' | 'finishing'
 * @param {string} lang     - language code
 * @param {string} mode     - 'original' | 'translated' | 'bilingual'
 */
function applyDNAContent(stepName, lang, mode) {
  const panel = document.getElementById('step-' + stepName);
  if (!panel) return;

  const enData   = DNA_CONTENT[stepName]?.en;
  const langData = DNA_CONTENT[stepName]?.[lang];
  if (!enData) return;

  const textContainer = panel.querySelector('.step-text');
  if (!textContainer) return;

  if (lang === 'en' || mode === 'original') {
    renderDNATextBlock(textContainer, enData, false);
  } else if (mode === 'translated') {
    renderDNATextBlock(textContainer, langData || enData, true, lang);
  } else if (mode === 'bilingual') {
    renderBilingualBlock(textContainer, enData, langData || enData, lang);
  }
}

/**
 * Render the academic vocabulary table into a container element.
 * @param {string}      lang        - language code
 * @param {HTMLElement} containerEl - the element to render into
 */
function renderVocabulary(lang, containerEl) {
  if (!containerEl) return;

  const colTermLabel   = (UI_STRINGS['vocab.col.term']?.[lang])        || 'Term (English)';
  const colTransLabel  = (UI_STRINGS['vocab.col.translation']?.[lang]) || 'Translation';
  const colDefLabel    = (UI_STRINGS['vocab.col.definition']?.[lang])  || 'Definition';

  let html = `<table class="vocab-table" role="table">
    <thead>
      <tr>
        <th scope="col">${escI(colTermLabel)}</th>
        <th scope="col">${escI(colTransLabel)}</th>
        <th scope="col">${escI(colDefLabel)}</th>
      </tr>
    </thead>
    <tbody>`;

  VOCABULARY.forEach((entry, idx) => {
    const translation = (lang !== 'en' ? entry.translations[lang] : '—') || '—';
    const definition  = entry.definition[lang] || entry.definition['en'];
    const example     = entry.example[lang]    || entry.example['en'];

    html += `
      <tr class="vocab-row" data-idx="${idx}">
        <td class="vocab-term">${escI(entry.term)}</td>
        <td class="vocab-translation">${escI(translation)}</td>
        <td class="vocab-def-cell">
          <span class="vocab-def-short">${escI(definition)}</span>
          <details class="vocab-example-details">
            <summary>Example</summary>
            <p class="vocab-example-text">${escI(example)}</p>
          </details>
        </td>
      </tr>`;
  });

  html += '</tbody></table>';
  containerEl.innerHTML = html;
}

// ─────────────────────────────────────────────
//  7. INTERNAL HELPERS
// ─────────────────────────────────────────────

function renderDNATextBlock(container, data, isTranslation, lang) {
  let badge = '';
  if (isTranslation) {
    const badgeLabel = UI_STRINGS['translation.badge']?.[lang] || 'Translated content';
    badge = `<span class="translation-badge">${escI(badgeLabel)}</span>`;
  }

  let bulletsHtml = data.bullets.map(b =>
    `<li><strong>${escI(b.term)}</strong> ${escI(b.desc)}</li>`
  ).join('');

  container.innerHTML = `
    <div class="step-heading-row">
      <h2>${escI(data.heading)}</h2>
      ${badge}
    </div>
    <p class="step-subtitle">${escI(data.subtitle)}</p>
    <p>${escI(data.para1)}</p>
    <ul>${bulletsHtml}</ul>
    <div class="key-fact">💡 ${escI(data.keyFact)}</div>`;
}

function renderBilingualBlock(container, enData, translatedData, lang) {
  const badgeLabel = UI_STRINGS['translation.badge']?.[lang] || 'Translated content';

  let enBullets   = enData.bullets.map(b =>
    `<li><strong>${escI(b.term)}</strong> ${escI(b.desc)}</li>`).join('');
  let trBullets   = translatedData.bullets.map(b =>
    `<li><strong>${escI(b.term)}</strong> ${escI(b.desc)}</li>`).join('');

  container.innerHTML = `
    <div class="step-heading-row">
      <h2>${escI(enData.heading)}</h2>
    </div>
    <p class="step-subtitle">${escI(enData.subtitle)}</p>
    <p>${escI(enData.para1)}</p>
    <ul>${enBullets}</ul>
    <div class="key-fact">💡 ${escI(enData.keyFact)}</div>

    <div class="bilingual-divider">
      <span class="translation-badge">${escI(badgeLabel)}</span>
    </div>

    <div class="bilingual-translated">
      <h2 class="bilingual-heading">${escI(translatedData.heading)}</h2>
      <p class="step-subtitle">${escI(translatedData.subtitle)}</p>
      <p>${escI(translatedData.para1)}</p>
      <ul>${trBullets}</ul>
      <div class="key-fact">💡 ${escI(translatedData.keyFact)}</div>
    </div>`;
}

/** Show/hide mode switcher based on language */
function updateModeSwitcherVisibility() {
  const switcher = document.getElementById('modeSwitcher');
  if (!switcher) return;
  // Mode switcher only makes sense when a non-English language is selected
  switcher.style.display = (currentLang === 'en') ? 'none' : 'flex';
}

/** Minimal HTML escape for i18n strings (they may contain apostrophes etc.) */
function escI(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─────────────────────────────────────────────
//  8. INIT — called once the DOM is ready
// ─────────────────────────────────────────────

function initI18n() {
  // ── Language selector ──
  const selector = document.getElementById('langSelector');
  if (selector) {
    // Populate options
    selector.innerHTML = SUPPORTED_LANGUAGES.map(l =>
      `<option value="${l.code}">${l.nativeName}</option>`
    ).join('');

    selector.addEventListener('change', () => {
      currentLang = selector.value;
      applyLanguage(currentLang);
      // Re-apply DNA content for current active step
      const activeStep = document.querySelector('.step-btn.active');
      if (activeStep) applyDNAContent(activeStep.dataset.step, currentLang, currentMode);
    });
  }

  // ── Mode switcher buttons ──
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
      try { sessionStorage.setItem('bl_mode', currentMode); } catch (_) {}
      const activeStep = document.querySelector('.step-btn.active');
      if (activeStep) applyDNAContent(activeStep.dataset.step, currentLang, currentMode);
    });
  });

  // ── Patch step button clicks to re-apply translations ──
  // We wrap — not replace — script.js's listener by listening at the nav level
  const stepsNav = document.querySelector('.steps-nav');
  if (stepsNav) {
    stepsNav.addEventListener('click', (e) => {
      const btn = e.target.closest('.step-btn');
      if (btn && btn.dataset.step) {
        // script.js handles the panel show/hide; we handle the text
        // Use a brief timeout so script.js's DOM changes happen first
        setTimeout(() => {
          applyDNAContent(btn.dataset.step, currentLang, currentMode);
        }, 20);
      }
    });
  }

  // ── Vocabulary ──
  const vocabContainer = document.getElementById('vocabTableContainer');
  if (vocabContainer) renderVocabulary(currentLang, vocabContainer);

  // ── Restore saved preferences ──
  let savedLang = 'en';
  let savedMode = 'original';
  try {
    savedLang = sessionStorage.getItem('bl_lang') || localStorage.getItem('bl_lang') || 'en';
    savedMode = sessionStorage.getItem('bl_mode') || 'original';
  } catch (_) {}

  // Validate
  if (!SUPPORTED_LANGUAGES.find(l => l.code === savedLang)) savedLang = 'en';
  if (!['original','translated','bilingual'].includes(savedMode)) savedMode = 'original';

  currentLang = savedLang;
  currentMode = savedMode;

  applyLanguage(savedLang);

  // Activate the saved mode button
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === savedMode);
  });

  // Apply DNA content to the default first step
  applyDNAContent('unwinding', currentLang, currentMode);

  // Re-render vocabulary in saved language
  if (vocabContainer) renderVocabulary(currentLang, vocabContainer);
}

// Expose for inline script usage
window.i18n = { applyLanguage, applyDNAContent, renderVocabulary, initI18n };
