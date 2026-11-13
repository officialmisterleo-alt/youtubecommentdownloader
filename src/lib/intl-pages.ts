import type { Metadata } from 'next'

// Translated landing pages for searches in other languages. The tool itself
// is in English, so each page says so and links straight to /tool.

export type IntlLang = 'es' | 'pt' | 'ru' | 'de' | 'fr'

export type IntlPage = {
  lang: IntlLang
  hreflang: string
  languageName: string
  path: string
  metaTitle: string
  description: string
  eyebrow: string
  title: string
  intro: string
  cta: string
  heroLabel: string
  heroPoints: string[]
  sections: Array<{ title: string; body: string }>
  stepsTitle: string
  steps: string[]
  plansTitle: string
  plans: Array<{ name: string; body: string }>
  faqTitle: string
  faq: Array<{ question: string; answer: string }>
  closingTitle: string
  closingBody: string
}

const SITE = 'https://www.youtubecommentdownloader.com'

export const intlPages: IntlPage[] = [
  {
    lang: 'es',
    hreflang: 'es',
    languageName: 'Español',
    path: '/es/descargar-comentarios-youtube',
    metaTitle: 'Descargar comentarios de YouTube gratis – CSV y Excel',
    description: 'Pega el enlace de un video de YouTube y descarga sus comentarios en segundos. Gratis para empezar, sin extensiones ni código. Exporta a CSV, Excel o JSON.',
    eyebrow: 'Descargador de comentarios de YouTube',
    title: 'Descargar comentarios de YouTube',
    intro: 'Pega el enlace de un video o Short de YouTube y obtén sus comentarios en un archivo que puedes abrir en Excel, Google Sheets o cualquier herramienta de análisis. Sin instalar extensiones y sin escribir código.',
    cta: 'Descargar comentarios',
    heroLabel: 'Lo que obtienes',
    heroPoints: [
      'Texto del comentario, autor, likes y fecha',
      'Exporta a CSV, Excel, JSON, TXT o HTML',
      'Funciona con videos y Shorts públicos',
      'Gratis para empezar, sin tarjeta',
    ],
    sections: [
      { title: 'Deja de copiar y pegar', body: 'Copiar comentarios a mano desde YouTube es lento y se pierde información. La herramienta los descarga en filas y columnas ordenadas, listas para filtrar.' },
      { title: 'Ideal para creadores e investigadores', body: 'Encuentra preguntas frecuentes de tu audiencia, ideas para nuevos videos, quejas sobre un producto o datos para un estudio académico.' },
      { title: 'Ordena por likes o por fecha', body: 'Descarga primero los comentarios más relevantes o los más recientes, y abre el archivo directamente en tu hoja de cálculo.' },
    ],
    stepsTitle: 'Cómo descargar comentarios de YouTube',
    steps: [
      'Copia el enlace del video o Short de YouTube.',
      'Pégalo en la herramienta y elige cuántos comentarios quieres.',
      'Elige el formato: CSV, Excel, JSON, TXT o HTML.',
      'Haz clic en "Start Export" y descarga el archivo.',
    ],
    plansTitle: '¿Cuántos comentarios puedo descargar gratis?',
    plans: [
      { name: 'Sin cuenta', body: 'Hasta 50 comentarios por descarga en TXT o HTML.' },
      { name: 'Cuenta gratuita', body: 'Hasta 500 comentarios por descarga y 1.000 al mes, con CSV, Excel y JSON.' },
      { name: 'Pro', body: 'Hasta 10.000 comentarios por descarga, respuestas incluidas y análisis con IA.' },
    ],
    faqTitle: 'Preguntas frecuentes',
    faq: [
      { question: '¿Es gratis descargar comentarios de YouTube?', answer: 'Sí. Puedes descargar hasta 50 comentarios sin cuenta. Con una cuenta gratuita descargas hasta 500 por video y 1.000 al mes en CSV, Excel o JSON.' },
      { question: '¿Necesito instalar algo?', answer: 'No. Todo funciona en el navegador: no hay extensiones de Chrome, scripts de Python ni claves de API que configurar.' },
      { question: '¿Puedo descargar los comentarios a Excel?', answer: 'Sí. Elige el formato Excel o CSV y abre el archivo en Excel o Google Sheets para ordenar y filtrar los comentarios.' },
      { question: '¿La herramienta está en español?', answer: 'La interfaz de la herramienta está en inglés, pero es muy sencilla: pega el enlace, elige el formato y pulsa "Start Export". Los comentarios se descargan en su idioma original.' },
      { question: '¿Puedo descargar las respuestas a los comentarios?', answer: 'Sí, con el plan Pro o superior puedes incluir las respuestas de cada comentario en la descarga.' },
    ],
    closingTitle: 'Descarga tus primeros comentarios ahora',
    closingBody: 'Pega un enlace de YouTube y obtén el archivo en segundos.',
  },
  {
    lang: 'pt',
    hreflang: 'pt-BR',
    languageName: 'Português',
    path: '/pt/baixar-comentarios-youtube',
    metaTitle: 'Baixar comentários do YouTube grátis – CSV e Excel',
    description: 'Cole o link de um vídeo do YouTube e baixe os comentários em segundos. Grátis para começar, sem extensão nem código. Exporte para CSV, Excel ou JSON.',
    eyebrow: 'Baixador de comentários do YouTube',
    title: 'Baixar comentários do YouTube',
    intro: 'Cole o link de um vídeo ou Short do YouTube e receba os comentários em um arquivo que você abre no Excel, no Google Planilhas ou em qualquer ferramenta de análise. Sem instalar extensões e sem programar.',
    cta: 'Baixar comentários',
    heroLabel: 'O que você recebe',
    heroPoints: [
      'Texto do comentário, autor, curtidas e data',
      'Exporte para CSV, Excel, JSON, TXT ou HTML',
      'Funciona com vídeos e Shorts públicos',
      'Grátis para começar, sem cartão',
    ],
    sections: [
      { title: 'Chega de copiar e colar', body: 'Copiar comentários do YouTube à mão é lento e perde informação. A ferramenta baixa tudo em linhas e colunas organizadas, prontas para filtrar.' },
      { title: 'Para criadores e pesquisadores', body: 'Descubra as perguntas mais comuns do seu público, ideias para novos vídeos, reclamações sobre um produto ou dados para uma pesquisa acadêmica.' },
      { title: 'Ordene por curtidas ou data', body: 'Baixe primeiro os comentários mais relevantes ou os mais recentes e abra o arquivo direto na sua planilha.' },
    ],
    stepsTitle: 'Como baixar comentários do YouTube',
    steps: [
      'Copie o link do vídeo ou Short do YouTube.',
      'Cole na ferramenta e escolha quantos comentários quer.',
      'Escolha o formato: CSV, Excel, JSON, TXT ou HTML.',
      'Clique em "Start Export" e baixe o arquivo.',
    ],
    plansTitle: 'Quantos comentários posso baixar de graça?',
    plans: [
      { name: 'Sem conta', body: 'Até 50 comentários por download em TXT ou HTML.' },
      { name: 'Conta grátis', body: 'Até 500 comentários por download e 1.000 por mês, com CSV, Excel e JSON.' },
      { name: 'Pro', body: 'Até 10.000 comentários por download, com respostas e análise por IA.' },
    ],
    faqTitle: 'Perguntas frequentes',
    faq: [
      { question: 'É grátis baixar comentários do YouTube?', answer: 'Sim. Você baixa até 50 comentários sem conta. Com uma conta grátis, baixa até 500 por vídeo e 1.000 por mês em CSV, Excel ou JSON.' },
      { question: 'Preciso instalar alguma coisa?', answer: 'Não. Tudo funciona no navegador: sem extensão do Chrome, sem script em Python e sem chave de API para configurar.' },
      { question: 'Posso exportar os comentários para o Excel?', answer: 'Sim. Escolha o formato Excel ou CSV e abra o arquivo no Excel ou no Google Planilhas para ordenar e filtrar os comentários.' },
      { question: 'A ferramenta está em português?', answer: 'A interface da ferramenta está em inglês, mas é bem simples: cole o link, escolha o formato e clique em "Start Export". Os comentários vêm no idioma original.' },
      { question: 'Dá para baixar as respostas dos comentários?', answer: 'Sim. No plano Pro ou superior você pode incluir as respostas de cada comentário no download.' },
    ],
    closingTitle: 'Baixe seus primeiros comentários agora',
    closingBody: 'Cole um link do YouTube e receba o arquivo em segundos.',
  },
  {
    lang: 'ru',
    hreflang: 'ru',
    languageName: 'Русский',
    path: '/ru/skachat-kommentarii-youtube',
    metaTitle: 'Скачать комментарии с YouTube бесплатно – CSV и Excel',
    description: 'Вставьте ссылку на видео YouTube и скачайте комментарии за несколько секунд. Бесплатно, без расширений и кода. Экспорт в CSV, Excel или JSON.',
    eyebrow: 'Загрузчик комментариев YouTube',
    title: 'Скачать комментарии с YouTube',
    intro: 'Вставьте ссылку на видео или Shorts и получите комментарии в файле, который открывается в Excel, Google Таблицах или любом инструменте для анализа. Без установки расширений и без программирования.',
    cta: 'Скачать комментарии',
    heroLabel: 'Что вы получите',
    heroPoints: [
      'Текст комментария, автор, лайки и дата',
      'Экспорт в CSV, Excel, JSON, TXT или HTML',
      'Работает с открытыми видео и Shorts',
      'Бесплатно для начала, без карты',
    ],
    sections: [
      { title: 'Больше не нужно копировать вручную', body: 'Копировать комментарии с YouTube вручную долго, и часть данных теряется. Инструмент сохраняет их аккуратной таблицей, которую легко фильтровать.' },
      { title: 'Для блогеров и исследователей', body: 'Находите частые вопросы аудитории, идеи для новых роликов, жалобы на продукт или данные для научного исследования.' },
      { title: 'Сортировка по лайкам или дате', body: 'Скачивайте сначала самые популярные или самые новые комментарии и открывайте файл прямо в таблице.' },
    ],
    stepsTitle: 'Как скачать комментарии с YouTube',
    steps: [
      'Скопируйте ссылку на видео или Shorts.',
      'Вставьте её в инструмент и выберите количество комментариев.',
      'Выберите формат: CSV, Excel, JSON, TXT или HTML.',
      'Нажмите «Start Export» и скачайте файл.',
    ],
    plansTitle: 'Сколько комментариев можно скачать бесплатно?',
    plans: [
      { name: 'Без аккаунта', body: 'До 50 комментариев за раз в формате TXT или HTML.' },
      { name: 'Бесплатный аккаунт', body: 'До 500 комментариев за раз и 1 000 в месяц, с CSV, Excel и JSON.' },
      { name: 'Pro', body: 'До 10 000 комментариев за раз, с ответами и анализом с помощью ИИ.' },
    ],
    faqTitle: 'Частые вопросы',
    faq: [
      { question: 'Скачивать комментарии с YouTube бесплатно?', answer: 'Да. Без аккаунта можно скачать до 50 комментариев. С бесплатным аккаунтом — до 500 с одного видео и 1 000 в месяц в CSV, Excel или JSON.' },
      { question: 'Нужно что-то устанавливать?', answer: 'Нет. Всё работает в браузере: никаких расширений Chrome, скриптов на Python или ключей API.' },
      { question: 'Можно выгрузить комментарии в Excel?', answer: 'Да. Выберите формат Excel или CSV и откройте файл в Excel или Google Таблицах, чтобы сортировать и фильтровать комментарии.' },
      { question: 'Инструмент на русском языке?', answer: 'Интерфейс инструмента на английском, но он очень простой: вставьте ссылку, выберите формат и нажмите «Start Export». Комментарии сохраняются на языке оригинала.' },
      { question: 'Можно скачать ответы на комментарии?', answer: 'Да, на тарифе Pro и выше можно включить в выгрузку ответы на каждый комментарий.' },
    ],
    closingTitle: 'Скачайте первые комментарии прямо сейчас',
    closingBody: 'Вставьте ссылку на YouTube и получите файл за несколько секунд.',
  },
  {
    lang: 'de',
    hreflang: 'de',
    languageName: 'Deutsch',
    path: '/de/youtube-kommentare-herunterladen',
    metaTitle: 'YouTube-Kommentare herunterladen – kostenlos, CSV & Excel',
    description: 'YouTube-Link einfügen und die Kommentare in Sekunden herunterladen. Kostenlos starten, ohne Erweiterung oder Code. Export als CSV, Excel oder JSON.',
    eyebrow: 'YouTube Comment Downloader',
    title: 'YouTube-Kommentare herunterladen',
    intro: 'Füge den Link zu einem YouTube-Video oder Short ein und erhalte die Kommentare als Datei für Excel, Google Tabellen oder dein Analyse-Tool. Ohne Browser-Erweiterung und ohne Programmierung.',
    cta: 'Kommentare herunterladen',
    heroLabel: 'Das bekommst du',
    heroPoints: [
      'Kommentartext, Autor, Likes und Datum',
      'Export als CSV, Excel, JSON, TXT oder HTML',
      'Funktioniert mit öffentlichen Videos und Shorts',
      'Kostenlos starten, keine Kreditkarte',
    ],
    sections: [
      { title: 'Schluss mit Kopieren und Einfügen', body: 'Kommentare von Hand aus YouTube zu kopieren dauert lange, und Informationen gehen verloren. Das Tool speichert sie in sauberen Zeilen und Spalten, bereit zum Filtern.' },
      { title: 'Für Creator und Forschung', body: 'Finde häufige Fragen deines Publikums, Ideen für neue Videos, Kritik an einem Produkt oder Daten für eine wissenschaftliche Arbeit.' },
      { title: 'Nach Likes oder Datum sortieren', body: 'Lade zuerst die relevantesten oder die neuesten Kommentare herunter und öffne die Datei direkt in deiner Tabelle.' },
    ],
    stepsTitle: 'So lädst du YouTube-Kommentare herunter',
    steps: [
      'Kopiere den Link zum YouTube-Video oder Short.',
      'Füge ihn im Tool ein und wähle, wie viele Kommentare du willst.',
      'Wähle das Format: CSV, Excel, JSON, TXT oder HTML.',
      'Klicke auf „Start Export" und lade die Datei herunter.',
    ],
    plansTitle: 'Wie viele Kommentare kann ich kostenlos herunterladen?',
    plans: [
      { name: 'Ohne Konto', body: 'Bis zu 50 Kommentare pro Download als TXT oder HTML.' },
      { name: 'Kostenloses Konto', body: 'Bis zu 500 Kommentare pro Download und 1.000 pro Monat, mit CSV, Excel und JSON.' },
      { name: 'Pro', body: 'Bis zu 10.000 Kommentare pro Download, inklusive Antworten und KI-Analyse.' },
    ],
    faqTitle: 'Häufige Fragen',
    faq: [
      { question: 'Ist das Herunterladen von YouTube-Kommentaren kostenlos?', answer: 'Ja. Ohne Konto kannst du bis zu 50 Kommentare herunterladen. Mit einem kostenlosen Konto sind es bis zu 500 pro Video und 1.000 pro Monat als CSV, Excel oder JSON.' },
      { question: 'Muss ich etwas installieren?', answer: 'Nein. Alles läuft im Browser: keine Chrome-Erweiterung, kein Python-Skript und kein API-Schlüssel.' },
      { question: 'Kann ich die Kommentare nach Excel exportieren?', answer: 'Ja. Wähle Excel oder CSV und öffne die Datei in Excel oder Google Tabellen, um die Kommentare zu sortieren und zu filtern.' },
      { question: 'Gibt es das Tool auf Deutsch?', answer: 'Die Oberfläche des Tools ist auf Englisch, aber sehr einfach: Link einfügen, Format wählen und „Start Export" klicken. Die Kommentare bleiben in ihrer Originalsprache.' },
      { question: 'Kann ich auch Antworten auf Kommentare herunterladen?', answer: 'Ja. Ab dem Pro-Tarif kannst du die Antworten zu jedem Kommentar mit herunterladen.' },
    ],
    closingTitle: 'Lade jetzt deine ersten Kommentare herunter',
    closingBody: 'YouTube-Link einfügen und die Datei in Sekunden erhalten.',
  },
  {
    lang: 'fr',
    hreflang: 'fr',
    languageName: 'Français',
    path: '/fr/telecharger-commentaires-youtube',
    metaTitle: 'Télécharger les commentaires YouTube gratuitement – CSV, Excel',
    description: 'Collez le lien d\'une vidéo YouTube et téléchargez ses commentaires en quelques secondes. Gratuit pour commencer, sans extension ni code. Export CSV, Excel, JSON.',
    eyebrow: 'Téléchargeur de commentaires YouTube',
    title: 'Télécharger les commentaires YouTube',
    intro: 'Collez le lien d\'une vidéo ou d\'un Short YouTube et récupérez ses commentaires dans un fichier à ouvrir dans Excel, Google Sheets ou votre outil d\'analyse. Sans extension à installer et sans coder.',
    cta: 'Télécharger les commentaires',
    heroLabel: 'Ce que vous obtenez',
    heroPoints: [
      'Texte du commentaire, auteur, likes et date',
      'Export en CSV, Excel, JSON, TXT ou HTML',
      'Fonctionne avec les vidéos et Shorts publics',
      'Gratuit pour commencer, sans carte bancaire',
    ],
    sections: [
      { title: 'Fini le copier-coller', body: 'Copier les commentaires YouTube à la main prend du temps et fait perdre des informations. L\'outil les enregistre en lignes et colonnes propres, prêtes à filtrer.' },
      { title: 'Pour les créateurs et les chercheurs', body: 'Repérez les questions fréquentes de votre audience, des idées de vidéos, les critiques d\'un produit ou des données pour une étude universitaire.' },
      { title: 'Triez par likes ou par date', body: 'Téléchargez d\'abord les commentaires les plus pertinents ou les plus récents, puis ouvrez le fichier directement dans votre tableur.' },
    ],
    stepsTitle: 'Comment télécharger les commentaires YouTube',
    steps: [
      'Copiez le lien de la vidéo ou du Short YouTube.',
      'Collez-le dans l\'outil et choisissez le nombre de commentaires.',
      'Choisissez le format : CSV, Excel, JSON, TXT ou HTML.',
      'Cliquez sur « Start Export » et téléchargez le fichier.',
    ],
    plansTitle: 'Combien de commentaires puis-je télécharger gratuitement ?',
    plans: [
      { name: 'Sans compte', body: 'Jusqu\'à 50 commentaires par téléchargement en TXT ou HTML.' },
      { name: 'Compte gratuit', body: 'Jusqu\'à 500 commentaires par téléchargement et 1 000 par mois, avec CSV, Excel et JSON.' },
      { name: 'Pro', body: 'Jusqu\'à 10 000 commentaires par téléchargement, réponses incluses, avec analyse par IA.' },
    ],
    faqTitle: 'Questions fréquentes',
    faq: [
      { question: 'Le téléchargement des commentaires YouTube est-il gratuit ?', answer: 'Oui. Vous pouvez télécharger jusqu\'à 50 commentaires sans compte. Avec un compte gratuit, c\'est jusqu\'à 500 par vidéo et 1 000 par mois en CSV, Excel ou JSON.' },
      { question: 'Faut-il installer quelque chose ?', answer: 'Non. Tout fonctionne dans le navigateur : pas d\'extension Chrome, pas de script Python, pas de clé API à configurer.' },
      { question: 'Puis-je exporter les commentaires vers Excel ?', answer: 'Oui. Choisissez le format Excel ou CSV et ouvrez le fichier dans Excel ou Google Sheets pour trier et filtrer les commentaires.' },
      { question: 'L\'outil est-il en français ?', answer: 'L\'interface de l\'outil est en anglais, mais elle est très simple : collez le lien, choisissez le format et cliquez sur « Start Export ». Les commentaires restent dans leur langue d\'origine.' },
      { question: 'Puis-je télécharger les réponses aux commentaires ?', answer: 'Oui. À partir de l\'offre Pro, vous pouvez inclure les réponses à chaque commentaire dans le téléchargement.' },
    ],
    closingTitle: 'Téléchargez vos premiers commentaires maintenant',
    closingBody: 'Collez un lien YouTube et obtenez le fichier en quelques secondes.',
  },
]

export function getIntlPage(lang: IntlLang): IntlPage {
  const page = intlPages.find((p) => p.lang === lang)
  if (!page) throw new Error(`No translated page for ${lang}`)
  return page
}

// Every translated page and the English homepage list each other, so Google
// shows searchers the version in their language.
export const languageAlternates: Record<string, string> = {
  en: SITE,
  ...Object.fromEntries(intlPages.map((p) => [p.hreflang, `${SITE}${p.path}`])),
  'x-default': SITE,
}

export function intlMetadata(lang: IntlLang): Metadata {
  const page = getIntlPage(lang)
  const url = `${SITE}${page.path}`
  return {
    title: page.metaTitle,
    description: page.description,
    alternates: { canonical: url, languages: languageAlternates },
    openGraph: {
      title: page.metaTitle,
      description: page.description,
      url,
      type: 'website',
      locale: page.hreflang.replace('-', '_'),
      images: [{ url: '/opengraph-image.jpg', width: 1200, height: 675 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle,
      description: page.description,
      images: ['/opengraph-image.jpg'],
    },
  }
}
