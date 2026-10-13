const bi = (zh, en) => ({ "zh-TW": zh, en });
export const COLLECTION_THEMES = [
  {
    id: "local-demo-034-window",
    title: bi("窗邊光譜 · 虛構範本", "Window Spectrum · Fictional template"),
    story: bi(
      "把窗邊當成一個小型舞台：遠景留下空間，近景觀察光落在衣料上的形狀。同一扇窗能產生不同節奏，收藏順序由玩家自己決定；這是未拍攝的虛構企劃。",
      "Imagine a window as a small stage: wide views leave space while close views examine light on fabric. One window can suggest different rhythms, and collectors choose their own reading order. This is a fictional concept that has not been photographed.",
    ),
    guide: bi(
      "先讀主故事，再看公開不同款式；重複卡不增加完成度。完成後可自選展示，不承諾獎勵。",
      "Read the main story, then explore distinct public designs. Duplicates do not increase completion. Choose a showcase when complete; no reward is promised.",
    ),
    bio: bi(
      "收藏光線變化，保留自己的閱讀順序。",
      "Collect changes in light and keep your own reading order.",
    ),
    badge: bi("光譜 · 視覺範本", "Spectrum · Visual sample"),
  },
  {
    id: "local-demo-034-city",
    title: bi("城市留白 · 虛構範本", "City Intervals · Fictional template"),
    story: bi(
      "以路口、牆面與遠處的線條構想城市故事，讓人物與環境各有呼吸的空間。卡冊可以從寬景讀到細節，也可以反過來；沒有真人合作或拍攝日期的宣告。",
      "Imagine a city story through crossings, walls and distant lines, giving both subject and surroundings room to breathe. Read the album from wide scenes to details or reverse that order. No real collaboration or photography date is announced.",
    ),
    guide: bi(
      "逐一看公開款式並設定自己的收藏目標；分享前確認公開設定與當前可見性。",
      "Explore public designs individually and choose your own collection goal. Before sharing, check public settings and current visibility.",
    ),
    bio: bi("把城市中的留白放進收藏櫃。", "Keep the quiet spaces of a city in my showcase."),
    badge: bi("留白 · 視覺範本", "Intervals · Visual sample"),
  },
  {
    id: "local-demo-034-paper",
    title: bi("紙上季節 · 虛構範本", "Paper Seasons · Fictional template"),
    story: bi(
      "用紙張的層次與簡單形狀構想季節變化，不借用未確認的真人照片。先排列顏色再比較構圖，讓收藏冊成為一段可重新閱讀的故事；素材仍是本機示意設計。",
      "Imagine seasonal change through layers of paper and simple shapes, without borrowing unconfirmed photographs of real people. Arrange colors before comparing compositions so the album becomes a story to revisit. Materials remain local sample designs.",
    ),
    guide: bi(
      "完成度以已取得公開不同款式計算；曾取得與目前持有分開查看。展示徽章只選已取得項目。",
      "Completion counts acquired distinct public designs. Review acquired designs separately from current holdings. Select only earned badges for your showcase.",
    ),
    bio: bi("以色彩與紙張的層次記錄收藏。", "Collect through color and layers of paper."),
    badge: bi("季節 · 視覺範本", "Seasons · Visual sample"),
  },
  {
    id: "local-demo-043-orbit",
    coverTone: "orbit",
    title: bi("軌道筆記 · 虛構範本", "Orbit Notes · Fictional template"),
    story: bi(
      "以圓弧與留白構想一冊關於距離的故事。第一張觀察兩條線如何相遇，第二張讓視線沿弧線移動，第三張把中心留給讀者想像。這是本機幾何設計範本，沒有使用真人肖像，也沒有宣告合作、日期或抽卡資格。",
      "Imagine a story about distance using arcs and open space. The first design explores where two lines meet, the second follows a curve, and the third leaves the center for the reader to imagine. This local geometric template uses no real portraits and announces no collaboration, date or draw eligibility.",
    ),
    guide: bi(
      "先比較構圖的重心，再讀每張公開文字示意。完整、部分与空收藏只是隔離測試情境；重複不增加不同款式完成度。",
      "Compare each composition's center before reading the public text designs. Full, partial and empty collections are isolated test scenarios; duplicates do not increase distinct-design completion.",
    ),
    bio: bi("把閱讀節奏留在自己的軌道上。", "Keep my reading rhythm in its own orbit."),
    badge: bi("軌道 · 視覺範本", "Orbit · Visual sample"),
  },
  {
    id: "local-demo-043-garden",
    coverTone: "garden",
    title: bi("葉影書房 · 虛構範本", "Leaflight Study · Fictional template"),
    story: bi(
      "用線條與疏密描繪想像中的葉影，而非挪用未確認的自然照片。封面留一處安靜的亮區，內頁從疏到密形成閱讀節奏。三張卡面都是幾何文字排版提案；尚無真人拍攝、正式素材授權或營運成果。",
      "Draw imagined leaf shadows with lines and spacing instead of borrowing unconfirmed nature photos. A quiet bright area anchors the cover while the inner pages move from sparse to dense. The three designs are geometric text-layout proposals, with no real shoot, formal rights or performance claims.",
    ),
    guide: bi(
      "觀察留白与線條的對比；曾取得款式与目前持有張數分開閱讀。公開展示由本人決定，不因範本預覽取得徽章或卡牌。",
      "Observe the contrast of lines and space. Read acquired designs separately from currently held copies. Sharing is your choice; template previews grant no badges or cards.",
    ),
    bio: bi("收藏一頁頁安靜的葉影。", "Collect quiet pages of imagined leaflight."),
    badge: bi("葉影 · 視覺範本", "Leaflight · Visual sample"),
  },
  {
    id: "local-demo-043-tide",
    coverTone: "tide",
    title: bi("潮汐色票 · 虛構範本", "Tidal Palette · Fictional template"),
    story: bi(
      "以冷暖色帶與水平線構想一段潮汐的閱讀旅程。從寬闊的色面到细窄的交界，三個版型呈現不同節奏，不指涉真實地點或拍攝事件。素材来自本機CSS幾何與文字，展示企劃不會自動成為可抽卡池。",
      "Imagine a tidal reading journey through warm and cool bands and horizontal lines. Three layouts move from broad color fields to narrow boundaries without referring to a real place or shoot. Materials use local CSS geometry and text; the showcase concept never automatically becomes a draw pool.",
    ),
    guide: bi(
      "先讀色面，再看邊界；可選自己的收藏順序。只展示目前合法公開資訊，不以隱藏款式或未取得成就作指引。",
      "Read the color fields, then their boundaries, and choose your own collection order. Show only currently public information; hidden designs and unearned achievements are never used as hints.",
    ),
    bio: bi("讓收藏像潮汐一樣留下自己的節奏。", "Let my collection keep its own tidal rhythm."),
    badge: bi("潮汐 · 視覺範本", "Tide · Visual sample"),
  },
  {
    id: "local-demo-067-fold",
    coverTone: "orbit",
    title: bi("摺頁之間 · 虛構範本", "Between Folds · Fictional template"),
    story: bi(
      "把一張想像中的紙分成開場、轉折與留白。開場用寬闊平面呈現折痕；轉折讓兩條邊線交會；最後一頁留下未填色的區域，邀請讀者選擇自己的閱讀方向。這是CSS幾何與文字的本機企劃，不代表拍攝、真人合作或可抽取卡池。",
      "Divide an imagined sheet into an opening, a turn and an interval. A broad plane introduces the crease, two edges meet at the turn, and an uncolored final area lets readers choose a direction. This local CSS-and-text concept represents no shoot, real collaboration or drawable pool.",
    ),
    guide: bi(
      "先看折痕方向，再比較三個公開文字版型。不同款式各計一次，重複卡與目前持有量另讀；收藏順序不是抽卡機率建議。",
      "Read the crease direction before comparing three public text layouts. Each distinct design counts once; duplicates and current holdings stay separate. Reading order is not advice about draw odds.",
    ),
    bio: bi(
      "收藏轉折與留白，保留自己的讀法。",
      "Collect turns and intervals, keeping my own reading path.",
    ),
    badge: bi("摺頁 · 視覺範本", "Fold · Visual sample"),
    cardStories: [
      bi(
        "開場：寬景版型以一條斜線引導視線。",
        "Opening: a wide layout guides the eye along a diagonal.",
      ),
      bi(
        "轉折：近景版型比較兩個邊緣的距離。",
        "Turn: a close layout compares the distance between two edges.",
      ),
      bi(
        "留白：簡約版型讓文字成為視覺中心。",
        "Interval: a minimal layout makes text the visual center.",
      ),
    ],
  },
  {
    id: "local-demo-067-echo",
    coverTone: "garden",
    title: bi("回聲走廊 · 虛構範本", "Echo Corridor · Fictional template"),
    story: bi(
      "用重複線條構想一條不存在的走廊。第一章把線條排成節奏，第二章讓相同節奏逐步偏移，第三章減少線條，留下安靜的終點。故事只描述公開構圖，不指涉真實地點、聲音採樣、人物或營運成果；不使用未確認外部素材。",
      "Imagine a corridor that does not exist through repeated lines. The first chapter establishes a rhythm, the second shifts it, and the third removes lines to leave a quiet ending. This story describes public composition only, with no real place, audio sample, person or performance claim, and no unconfirmed external materials.",
    ),
    guide: bi(
      "依序比較重複、偏移與空間；也可以反向閱讀。此處重複是構圖語言，與重複持卡數量不同，沒有新的成長或獎勵政策。",
      "Compare repetition, displacement and space in order, or read in reverse. Repetition here describes composition, not duplicate holdings; no new growth or reward policy exists.",
    ),
    bio: bi("把安靜的節奏留在收藏裡。", "Keep a quiet rhythm in my collection."),
    badge: bi("回聲 · 視覺範本", "Echo · Visual sample"),
    cardStories: [
      bi("節奏：條列版型展示等距線條。", "Rhythm: a stacked layout shows evenly spaced lines."),
      bi(
        "偏移：交錯版型留下不對稱空間。",
        "Displacement: a staggered layout leaves asymmetric space.",
      ),
      bi(
        "終點：單框版型讓線條停在邊界。",
        "Ending: a single-frame layout ends the lines at a boundary.",
      ),
    ],
  },
  {
    id: "local-demo-067-horizon",
    coverTone: "tide",
    title: bi("晨昏邊界 · 虛構範本", "Edges of Light · Fictional template"),
    story: bi(
      "把晨與昏當成兩種色彩提案，不假設任何實際拍攝時刻。先由冷色塊鋪出安靜背景，再用暖色線標示交界，最後讓兩種顏色並置。三個章節可作收藏故事與封面排版練習；這是隔離示意內容，沒有真人肖像、日期、合作或上架承諾。",
      "Treat morning and dusk as color proposals without assuming a real shooting time. A cool field establishes a quiet background, a warm line marks the edge, and the final chapter places both colors together. These chapters support collection-story and cover-layout practice. This is isolated sample content with no portrait, date, collaboration or launch promise.",
    ),
    guide: bi(
      "從背景讀到交界，依自己選擇設定私人目標。完整、部分、空收藏只是測試情境；示意內容與正式取得紀錄保持分開。",
      "Read from background to edge and choose your own private goals. Full, partial and empty collections are test scenarios only; samples remain separate from formal acquisitions.",
    ),
    bio: bi("收藏每一種閱讀色溫。", "Collect each reading temperature."),
    badge: bi("邊界 · 視覺範本", "Edge · Visual sample"),
    cardStories: [
      bi("冷色：留白版型讓背景先說故事。", "Cool: an open layout lets the background speak first."),
      bi(
        "暖線：水平版型標示色彩交界。",
        "Warm line: a horizontal layout marks the color boundary.",
      ),
      bi(
        "並置：雙欄版型比較兩種閱讀節奏。",
        "Together: a two-column layout compares two reading rhythms.",
      ),
    ],
  },
  {
    id: "local-demo-086-rain",
    coverTone: "tide",
    title: bi("雨聲索引 · 虛構範本", "Index of Rain · Fictional template"),
    story: bi(
      "想像雨滴在玻璃上留下三種閱讀節奏：疏落、交錯與留白。這不是實際拍攝紀錄，而是用線條與文字測試不同卡冊封面的故事企劃。收藏順序可自由選擇，不對應任何抽取機率。",
      "Imagine three reading rhythms traced by rain on glass: sparse marks, intersecting lines and open space. This is not a record of a real shoot; it is a story concept testing album covers through lines and text. Reading order is freely chosen and has no relation to draw odds.",
    ),
    guide: bi(
      "先觀察線條疏密，再讀各款式的留白；已公開不同款式才納入進度，重複卡不補成新款。",
      "Observe line density, then read each layout's open space. Only distinct public designs enter progress; duplicates do not create new designs.",
    ),
    bio: bi(
      "收藏雨聲的節奏，展示選擇由本人決定。",
      "Collect rhythms of rain; showcase choices belong to the collector.",
    ),
    badge: bi(
      "雨滴線條徽章示意，不是可取得成就。",
      "Raindrop-line badge concept, not an earnable achievement.",
    ),
    cardStories: [
      bi("疏落：單一斜線作為閱讀起点。", "Sparse: one diagonal starts the reading."),
      bi("交錯：兩組線條構成節奏。", "Intersecting: two sets of lines establish rhythm."),
      bi("留白：空間讓讀者放慢腳步。", "Open space: a pause for the reader."),
    ],
  },
  {
    id: "local-demo-086-thread",
    coverTone: "garden",
    title: bi("線的旅行 · 虛構範本", "A Thread's Journey · Fictional template"),
    story: bi(
      "把一條想像中的線放進不同構圖：平行、曲折、環繞。版型以既有幾何元件呈現，不使用未確認權利的織品或人物照片。三個章節是設計閱讀順序，不是必須完成的付費任務。",
      "Place an imagined thread in parallel, winding and enclosing compositions. Layouts use existing geometric components, without fabric or portrait photographs of unconfirmed rights. The three chapters suggest a design-reading order, not a required paid task.",
    ),
    guide: bi(
      "比較方向與邊界；部分與空收藏只是隔離測試情境，不能推定本人持卡。",
      "Compare direction and boundaries. Partial and empty collections are isolated test scenarios, never claims about your holdings.",
    ),
    bio: bi("以線條探索日常的閱讀方式。", "Explore everyday reading through lines."),
    badge: bi(
      "交織幾何徽章示意，沒有發放規則。",
      "Interwoven geometric badge concept, with no issuance rule.",
    ),
    cardStories: [
      bi(
        "平行：相近方向留下比較空間。",
        "Parallel: matching directions leave room for comparison.",
      ),
      bi("曲折：轉角延伸故事步伐。", "Winding: turns extend the story's pace."),
      bi("環繞：線條回到共同起點。", "Enclosing: lines return to a shared beginning."),
    ],
  },
  {
    id: "local-demo-086-small",
    coverTone: "orbit",
    title: bi("微小風景 · 虛構範本", "Small Landscapes · Fictional template"),
    story: bi(
      "用三個簡單色塊想像微型風景：入口、遠方與相遇。沒有真實地點、拍攝日期或合作人物。封面與卡面都只使用既有色彩與幾何版型，讓完整、部分、空收藏能以相同資料契約驗證。",
      "Imagine miniature landscapes with three simple color fields: an entrance, a distance and an encounter. No real place, shoot date or collaborator is asserted. Covers and card layouts use existing colors and geometry so full, partial and empty collection scenarios share one data contract.",
    ),
    guide: bi(
      "由色塊比例閱讀故事，完成回顧不承諾獎勵或復刻。",
      "Read the story through proportions of color; completion recaps promise neither rewards nor reruns.",
    ),
    bio: bi("在小尺度中收藏新的視角。", "Collect new viewpoints at a small scale."),
    badge: bi(
      "微型風景徽章範本，與未取得成就無關。",
      "Miniature-landscape badge template, unrelated to unearned achievements.",
    ),
    cardStories: [
      bi("入口：窄框引導第一眼。", "Entrance: a narrow frame guides the first glance."),
      bi("遠方：大面積留白建立距離。", "Distance: broad open space establishes depth."),
      bi("相遇：兩種色塊在中線相接。", "Encounter: two color fields meet along the center."),
    ],
  },
  {
    id: "local-demo-121-lantern",
    coverTone: "tide",
    title: bi("燈影書頁 · 虛構範本", "Lantern Pages · Fictional template"),
    story: bi(
      "以圓形燈光與書頁的幾何留白構想三段閱讀：入口、停留、回望。這是純文字与幾何美術企劃，不宣稱真人拍攝、合作或日期。",
      "Imagine three readings through circular light and geometric page space: arrival, pause and return. A text and geometry concept, without claims of real shoots, collaborations or dates.",
    ),
    guide: bi(
      "由公開款式閱讀故事；完整、部分與空收藏情境只用隔離fixture，不給原帳戶補卡。",
      "Read stories through public designs; full, partial and empty collection cases use isolated fixtures only, never grants to original accounts.",
    ),
    bio: bi("以安靜的閱讀節奏策展。", "Curate through a quiet reading rhythm."),
    badge: bi("書頁視覺範本，非新成就。", "Page visual sample, not a new achievement."),
    cardStories: [
      bi("入口：圓形光線建立閱讀落點。", "Arrival: circular light establishes an entry."),
      bi("停留：長方留白保持文字呼吸。", "Pause: rectangular space lets prose breathe."),
      bi("回望：重複線條帶回敘事起點。", "Return: repeated lines recall the opening."),
    ],
  },
  {
    id: "local-demo-121-wind",
    coverTone: "garden",
    title: bi("風向圖集 · 虛構範本", "Wind Atlas · Fictional template"),
    story: bi(
      "以線條方向、層次與比例構想風的變化，不借用地理或天氣成效。三款視覺分別代表沿行、交會、迴旋；只是閱讀方向，不是未核定的玩法獎勵。",
      "Imagine changes in wind through direction, layers and proportion, without claiming geographic or weather results. Three visuals represent passage, crossing and turning: reading directions, not unapproved game rewards.",
    ),
    guide: bi(
      "比較不同構圖，設定私人卡冊順序，再依目前合法不同款式回顧。",
      "Compare compositions, choose private album order and revisit current eligible distinct designs.",
    ),
    bio: bi("以線條與色彩整理觀察。", "Arrange observations through lines and color."),
    badge: bi(
      "風向幾何徽章範本，沒有發放規則。",
      "Directional geometric badge sample, with no issuance rule.",
    ),
    cardStories: [
      bi("沿行：平行線建立方向。", "Passage: parallel lines establish direction."),
      bi("交會：兩條線在中段相遇。", "Crossing: two lines meet at the middle."),
      bi("迴旋：弧線留下返回空間。", "Turning: curves leave room to return."),
    ],
  },
  {
    id: "local-demo-121-signal",
    coverTone: "orbit",
    title: bi("色彩訊號 · 虛構範本", "Color Signals · Fictional template"),
    story: bi(
      "將圓、方、三角排列為可重讀的色彩訊號。所有卡面與封面使用既有樣式，沒有外部照片、真人回答或合作宣告；不得自動上架為可抽卡池。",
      "Arrange circles, squares and triangles into color signals to reread. All faces and covers use existing styles, with no external photos, real answers or collaboration claims; never automatically published as a draw pool.",
    ),
    guide: bi(
      "閱讀形狀與留白，分享前核對本人同意與目前公開範圍。",
      "Read shapes and space; check personal consent and current public scope before sharing.",
    ),
    bio: bi("從簡單形狀開始收藏故事。", "Start collecting stories through simple shapes."),
    badge: bi(
      "訊號視覺範本，與正式成就分開。",
      "Signal visual sample, separate from formal achievements.",
    ),
    cardStories: [
      bi("圓：連續的輪廓建立節奏。", "Circle: a continuous outline establishes rhythm."),
      bi("方：邊界整理訊息順序。", "Square: boundaries order information."),
      bi("三角：尖端指向下一段閱讀。", "Triangle: a point directs the next reading."),
    ],
  },
  ...[
    {
      id: "local-demo-156-map",
      coverTone: "orbit",
      title: {
        "zh-TW": "地圖摺頁 · 虛構範本",
        en: "Folded Maps · Fictional template",
      },
      story: {
        "zh-TW":
          "將路徑畫成線條，讓轉折與留白帶出閱讀順序。 三章以本機文字與幾何版型呈現；沒有真人合作、外部圖片、拍攝日期或營運成果。",
        en: "Draw paths as lines, using turns and open space to guide reading. Three chapters use local text and geometric templates, without real collaborators, external images, shoot dates or performance claims.",
      },
      guide: {
        "zh-TW":
          "先閱讀三章，再核對公開不同款式；完整、部分與空收藏僅隔離情境，範本不成為可抽卡池。",
        en: "Read the three chapters, then check distinct public designs. Full, partial and empty collections are isolated scenarios; templates never become draw pools.",
      },
      bio: {
        "zh-TW": "以地圖摺頁記錄自己的閱讀節奏。",
        en: "Keep my own reading rhythm through Folded Maps.",
      },
      badge: {
        "zh-TW": "地圖摺頁視覺範本，不是已取得成就。",
        en: "Folded Maps visual sample, not an earned achievement.",
      },
      cardStories: [
        {
          "zh-TW": "章節一：線條建立閱讀入口。",
          en: "Chapter one: lines establish a reading entrance.",
        },
        {
          "zh-TW": "章節二：留白分開相鄰的訊息。",
          en: "Chapter two: space separates adjacent messages.",
        },
        {
          "zh-TW": "章節三：排列引導下一段閱讀。",
          en: "Chapter three: arrangement guides the next passage.",
        },
      ],
    },
    {
      id: "local-demo-156-rhythm",
      coverTone: "garden",
      title: {
        "zh-TW": "節奏標本 · 虛構範本",
        en: "Rhythm Studies · Fictional template",
      },
      story: {
        "zh-TW":
          "用重複與間隔排列文字，比較寬窄不同的節拍。 三章以本機文字與幾何版型呈現；沒有真人合作、外部圖片、拍攝日期或營運成果。",
        en: "Arrange text through repetition and intervals, comparing broad and narrow beats. Three chapters use local text and geometric templates, without real collaborators, external images, shoot dates or performance claims.",
      },
      guide: {
        "zh-TW":
          "先閱讀三章，再核對公開不同款式；完整、部分與空收藏僅隔離情境，範本不成為可抽卡池。",
        en: "Read the three chapters, then check distinct public designs. Full, partial and empty collections are isolated scenarios; templates never become draw pools.",
      },
      bio: {
        "zh-TW": "以節奏標本記錄自己的閱讀節奏。",
        en: "Keep my own reading rhythm through Rhythm Studies.",
      },
      badge: {
        "zh-TW": "節奏標本視覺範本，不是已取得成就。",
        en: "Rhythm Studies visual sample, not an earned achievement.",
      },
      cardStories: [
        {
          "zh-TW": "章節一：線條建立閱讀入口。",
          en: "Chapter one: lines establish a reading entrance.",
        },
        {
          "zh-TW": "章節二：留白分開相鄰的訊息。",
          en: "Chapter two: space separates adjacent messages.",
        },
        {
          "zh-TW": "章節三：排列引導下一段閱讀。",
          en: "Chapter three: arrangement guides the next passage.",
        },
      ],
    },
    {
      id: "local-demo-156-prism",
      coverTone: "tide",
      title: {
        "zh-TW": "稜鏡便箋 · 虛構範本",
        en: "Prism Notes · Fictional template",
      },
      story: {
        "zh-TW":
          "以幾何色帶構想折射的閱讀層次，不描述真實攝影。 三章以本機文字與幾何版型呈現；沒有真人合作、外部圖片、拍攝日期或營運成果。",
        en: "Use geometric bands to imagine layers of refraction without describing real photography. Three chapters use local text and geometric templates, without real collaborators, external images, shoot dates or performance claims.",
      },
      guide: {
        "zh-TW":
          "先閱讀三章，再核對公開不同款式；完整、部分與空收藏僅隔離情境，範本不成為可抽卡池。",
        en: "Read the three chapters, then check distinct public designs. Full, partial and empty collections are isolated scenarios; templates never become draw pools.",
      },
      bio: {
        "zh-TW": "以稜鏡便箋記錄自己的閱讀節奏。",
        en: "Keep my own reading rhythm through Prism Notes.",
      },
      badge: {
        "zh-TW": "稜鏡便箋視覺範本，不是已取得成就。",
        en: "Prism Notes visual sample, not an earned achievement.",
      },
      cardStories: [
        {
          "zh-TW": "章節一：線條建立閱讀入口。",
          en: "Chapter one: lines establish a reading entrance.",
        },
        {
          "zh-TW": "章節二：留白分開相鄰的訊息。",
          en: "Chapter two: space separates adjacent messages.",
        },
        {
          "zh-TW": "章節三：排列引導下一段閱讀。",
          en: "Chapter three: arrangement guides the next passage.",
        },
      ],
    },
  ],
  ...[
    {
      id: "local-demo-176-seam",
      coverTone: "garden",
      title: {
        "zh-TW": "縫線札記 · 虛構範本",
        en: "Seam Notes · Fictional template",
      },
      story: {
        "zh-TW":
          "線條沿著想像中的縫線轉折，將三個閱讀位置串成一頁。 全部為本機幾何與文字企劃，沒有真人照片、合作、日期或營運成果。",
        en: "Lines follow imagined seams to connect three reading positions. All material is a local geometric and textual concept, without real photographs, collaborators, dates or performance claims.",
      },
      guide: {
        "zh-TW":
          "先讀背景與三章，再查看不同款式。完整／部分／空收藏僅隔離測試，不自動成為可抽卡池。",
        en: "Read the background and three chapters, then distinct designs. Full / partial / empty collections are isolated tests; never automatically draw pools.",
      },
      bio: {
        "zh-TW": "以縫線札記整理自己的閱讀路徑。",
        en: "Arrange my reading path through Seam Notes.",
      },
      badge: {
        "zh-TW": "縫線札記 · 視覺範本，非正式成就",
        en: "Seam Notes · Visual sample, not a formal achievement",
      },
      cardStories: [
        {
          "zh-TW": "縫線札記一：入口以線條建立方向。",
          en: "Seam Notes I: lines set the entrance direction.",
        },
        {
          "zh-TW": "縫線札記二：間隔將相鄰文字分開。",
          en: "Seam Notes II: intervals separate adjacent text.",
        },
        {
          "zh-TW": "縫線札記三：留白連接下一段閱讀。",
          en: "Seam Notes III: open space connects the next passage.",
        },
      ],
    },
    {
      id: "local-demo-176-compass",
      coverTone: "orbit",
      title: {
        "zh-TW": "羅盤書籤 · 虛構範本",
        en: "Compass Bookmarks · Fictional template",
      },
      story: {
        "zh-TW":
          "以方向與幾何符號整理閱讀順序，不對真實旅程或地點作出聲明。 全部為本機幾何與文字企劃，沒有真人照片、合作、日期或營運成果。",
        en: "Direction and geometric symbols order the reading without claiming a real journey or location. All material is a local geometric and textual concept, without real photographs, collaborators, dates or performance claims.",
      },
      guide: {
        "zh-TW":
          "先讀背景與三章，再查看不同款式。完整／部分／空收藏僅隔離測試，不自動成為可抽卡池。",
        en: "Read the background and three chapters, then distinct designs. Full / partial / empty collections are isolated tests; never automatically draw pools.",
      },
      bio: {
        "zh-TW": "以羅盤書籤整理自己的閱讀路徑。",
        en: "Arrange my reading path through Compass Bookmarks.",
      },
      badge: {
        "zh-TW": "羅盤書籤 · 視覺範本，非正式成就",
        en: "Compass Bookmarks · Visual sample, not a formal achievement",
      },
      cardStories: [
        {
          "zh-TW": "羅盤書籤一：入口以線條建立方向。",
          en: "Compass Bookmarks I: lines set the entrance direction.",
        },
        {
          "zh-TW": "羅盤書籤二：間隔將相鄰文字分開。",
          en: "Compass Bookmarks II: intervals separate adjacent text.",
        },
        {
          "zh-TW": "羅盤書籤三：留白連接下一段閱讀。",
          en: "Compass Bookmarks III: open space connects the next passage.",
        },
      ],
    },
    {
      id: "local-demo-176-echo",
      coverTone: "tide",
      title: {
        "zh-TW": "回聲色階 · 虛構範本",
        en: "Echo Gradients · Fictional template",
      },
      story: {
        "zh-TW":
          "用重複色带和間隔構想一段回聲，安靜區域留給讀者決定下一步。 全部為本機幾何與文字企劃，沒有真人照片、合作、日期或營運成果。",
        en: "Repeated bands and intervals suggest an echo, leaving quiet space for the reader to choose what follows. All material is a local geometric and textual concept, without real photographs, collaborators, dates or performance claims.",
      },
      guide: {
        "zh-TW":
          "先讀背景與三章，再查看不同款式。完整／部分／空收藏僅隔離測試，不自動成為可抽卡池。",
        en: "Read the background and three chapters, then distinct designs. Full / partial / empty collections are isolated tests; never automatically draw pools.",
      },
      bio: {
        "zh-TW": "以回聲色階整理自己的閱讀路徑。",
        en: "Arrange my reading path through Echo Gradients.",
      },
      badge: {
        "zh-TW": "回聲色階 · 視覺範本，非正式成就",
        en: "Echo Gradients · Visual sample, not a formal achievement",
      },
      cardStories: [
        {
          "zh-TW": "回聲色階一：入口以線條建立方向。",
          en: "Echo Gradients I: lines set the entrance direction.",
        },
        {
          "zh-TW": "回聲色階二：間隔將相鄰文字分開。",
          en: "Echo Gradients II: intervals separate adjacent text.",
        },
        {
          "zh-TW": "回聲色階三：留白連接下一段閱讀。",
          en: "Echo Gradients III: open space connects the next passage.",
        },
      ],
    },
  ],
  ...[
    {
      id: "local-demo-206-rain",
      coverTone: "tide",
      title: {
        "zh-TW": "雨線索引 · 虛構範本",
        en: "Rainline Index · Fictional template",
      },
      story: {
        "zh-TW":
          "用斜線的間距構想雨聲，不描繪未確認的真實天氣或地點。 這是未拍攝本機文字與幾何企劃，沒有真人、合作、日期或成效宣告。",
        en: "The spacing of diagonal lines suggests rainfall, without claiming actual weather or locations. This is an unphotographed local text and geometric concept, with no claims about real people, collaboration, dates or performance.",
      },
      guide: {
        "zh-TW": "先讀三章，再比較公開不同款式；全／部分／空收藏僅隔離fixture，不自動成為抽卡池。",
        en: "Read three chapters, then compare distinct public designs. Full / partial / empty collections are isolated fixtures, never automatically draw pools.",
      },
      bio: {
        "zh-TW": "從雨線索引選擇自己的閱讀節奏。",
        en: "Choose my reading rhythm through Rainline Index.",
      },
      badge: {
        "zh-TW": "雨線索引 · 視覺範本，非正式成就",
        en: "Rainline Index · Visual sample, not a formal achievement",
      },
      cardStories: [
        {
          "zh-TW": "第一章：一條細線引導視線，背景保持安靜。",
          en: "Chapter I: a fine line guides the eye against a quiet background.",
        },
        {
          "zh-TW": "第二章：兩組線条交錯，空白區分出閱讀層次。",
          en: "Chapter II: two line groups overlap, with space separating reading layers.",
        },
        {
          "zh-TW": "第三章：雨線逐漸疏開，留下接續故事的位置。",
          en: "Chapter III: the lines open out, leaving room for the next passage.",
        },
      ],
    },
    {
      id: "local-demo-206-letter",
      coverTone: "orbit",
      title: {
        "zh-TW": "圓環書信 · 虛構範本",
        en: "Circular Letters · Fictional template",
      },
      story: {
        "zh-TW":
          "圓環像沒有寄出的信封，將開口方向與文字順序排成故事。 這是未拍攝本機文字與幾何企劃，沒有真人、合作、日期或成效宣告。",
        en: "Open rings suggest unsent envelopes, arranging openings and text into a story. This is an unphotographed local text and geometric concept, with no claims about real people, collaboration, dates or performance.",
      },
      guide: {
        "zh-TW": "先讀三章，再比較公開不同款式；全／部分／空收藏僅隔離fixture，不自動成為抽卡池。",
        en: "Read three chapters, then compare distinct public designs. Full / partial / empty collections are isolated fixtures, never automatically draw pools.",
      },
      bio: {
        "zh-TW": "從圓環書信選擇自己的閱讀節奏。",
        en: "Choose my reading rhythm through Circular Letters.",
      },
      badge: {
        "zh-TW": "圓環書信 · 視覺範本，非正式成就",
        en: "Circular Letters · Visual sample, not a formal achievement",
      },
      cardStories: [
        {
          "zh-TW": "第一章：圓環的缺口標記故事入口。",
          en: "Chapter I: an opening in the ring marks the entrance.",
        },
        {
          "zh-TW": "第二章：大小不同的圓環留下內外兩種距離。",
          en: "Chapter II: different ring sizes establish inner and outer distances.",
        },
        {
          "zh-TW": "第三章：一個空白中心接住讀者自己的註記。",
          en: "Chapter III: an empty center receives the reader’s own notes.",
        },
      ],
    },
    {
      id: "local-demo-206-moon",
      coverTone: "garden",
      title: {
        "zh-TW": "月頁留邊 · 虛構範本",
        en: "Moonlit Margins · Fictional template",
      },
      story: {
        "zh-TW":
          "以淡色頁邊與幾何弧線構想夜讀，不模擬真人攝影或天文事實。 這是未拍攝本機文字與幾何企劃，沒有真人、合作、日期或成效宣告。",
        en: "Pale margins and geometric arcs suggest reading at night, without simulating real photographs or astronomical facts. This is an unphotographed local text and geometric concept, with no claims about real people, collaboration, dates or performance.",
      },
      guide: {
        "zh-TW": "先讀三章，再比較公開不同款式；全／部分／空收藏僅隔離fixture，不自動成為抽卡池。",
        en: "Read three chapters, then compare distinct public designs. Full / partial / empty collections are isolated fixtures, never automatically draw pools.",
      },
      bio: {
        "zh-TW": "從月頁留邊選擇自己的閱讀節奏。",
        en: "Choose my reading rhythm through Moonlit Margins.",
      },
      badge: {
        "zh-TW": "月頁留邊 · 視覺範本，非正式成就",
        en: "Moonlit Margins · Visual sample, not a formal achievement",
      },
      cardStories: [
        {
          "zh-TW": "第一章：頁邊一道弧線把視線帶向正文。",
          en: "Chapter I: a margin arc leads the eye toward the text.",
        },
        {
          "zh-TW": "第二章：文字與淡色塊留出各自可讀的邊界。",
          en: "Chapter II: text and pale blocks keep separate readable boundaries.",
        },
        {
          "zh-TW": "第三章：最後的留白讓本冊結束，並保留下一冊入口。",
          en: "Chapter III: final open space closes this album while leaving an entrance to another.",
        },
      ],
    },
  ],
  ...[
    {
      id: "local-demo-246-prism",
      coverTone: "orbit",
      title: {
        "zh-TW": "折光舞台 · 虛構範本",
        en: "Prism Stage · Fictional template",
      },
      story: {
        "zh-TW":
          "用多邊形與亮暗色面構想一座不存在的紙上舞台，觀看方向由讀者選擇。 這是本機CSS幾何與文字示意，沒有真人、合作、拍攝日期或營運成效。",
        en: "Imagine a paper stage that does not exist through polygons and contrasting fields; readers choose their viewing direction. Local CSS geometry and text samples, with no real person, collaboration, shoot date or performance claim.",
      },
      guide: {
        "zh-TW":
          "先讀三章，再選自己的閱讀順序；完整／部分／空收藏只在隔離fixture呈現。不同款式與重複卡分開，不自動上架抽卡。",
        en: "Read three chapters and choose a reading order. Full / partial / empty collections appear only in isolated fixtures. Distinct designs and duplicates stay separate; never automatically drawable.",
      },
      bio: {
        "zh-TW": "用折光舞台留下自己的閱讀節奏。",
        en: "Keep my reading rhythm through Prism Stage.",
      },
      badge: {
        "zh-TW": "折光舞台 · 視覺範本，非正式成就",
        en: "Prism Stage · Visual template, not a formal achievement",
      },
      cardStories: [
        {
          "zh-TW": "開場：一個三角形把視線引向舞台中心。",
          en: "Opening: a triangle guides the eye toward the stage center.",
        },
        {
          "zh-TW": "轉場：兩個色面在斜向邊界交會。",
          en: "Transition: two fields meet along a diagonal boundary.",
        },
        {
          "zh-TW": "落幕：縮小形狀，讓空白接住故事。",
          en: "Closing: smaller forms leave space to hold the story.",
        },
      ],
    },
    {
      id: "local-demo-246-map",
      coverTone: "garden",
      title: {
        "zh-TW": "留白地圖 · 虛構範本",
        en: "Maps of Space · Fictional template",
      },
      story: {
        "zh-TW":
          "以矩形、轉角與空白畫出想像中的閱讀路線，不表示真實道路或地理位置。 這是本機CSS幾何與文字示意，沒有真人、合作、拍攝日期或營運成效。",
        en: "Rectangles, corners and intervals form an imagined reading route, without representing real roads or geographic locations. Local CSS geometry and text samples, with no real person, collaboration, shoot date or performance claim.",
      },
      guide: {
        "zh-TW":
          "先讀三章，再選自己的閱讀順序；完整／部分／空收藏只在隔離fixture呈現。不同款式與重複卡分開，不自動上架抽卡。",
        en: "Read three chapters and choose a reading order. Full / partial / empty collections appear only in isolated fixtures. Distinct designs and duplicates stay separate; never automatically drawable.",
      },
      bio: {
        "zh-TW": "用留白地圖留下自己的閱讀節奏。",
        en: "Keep my reading rhythm through Maps of Space.",
      },
      badge: {
        "zh-TW": "留白地圖 · 視覺範本，非正式成就",
        en: "Maps of Space · Visual template, not a formal achievement",
      },
      cardStories: [
        {
          "zh-TW": "起點：一個短框標示閱讀入口。",
          en: "Start: a short frame marks the reading entrance.",
        },
        {
          "zh-TW": "路徑：兩條折線讓視線輪流轉向。",
          en: "Path: two angled lines let the eye turn in sequence.",
        },
        {
          "zh-TW": "停留：空白中心留下自己的註記。",
          en: "Pause: an open center leaves room for personal notes.",
        },
      ],
    },
    {
      id: "local-demo-246-ribbon",
      coverTone: "tide",
      title: {
        "zh-TW": "緞帶書頁 · 虛構範本",
        en: "Ribbon Pages · Fictional template",
      },
      story: {
        "zh-TW":
          "將色帶當作紙上排版的線索，而非宣稱使用真實織品或真人素材。 這是本機CSS幾何與文字示意，沒有真人、合作、拍攝日期或營運成效。",
        en: "Color bands guide a paper-layout concept, without claiming real fabrics or portrait materials. Local CSS geometry and text samples, with no real person, collaboration, shoot date or performance claim.",
      },
      guide: {
        "zh-TW":
          "先讀三章，再選自己的閱讀順序；完整／部分／空收藏只在隔離fixture呈現。不同款式與重複卡分開，不自動上架抽卡。",
        en: "Read three chapters and choose a reading order. Full / partial / empty collections appear only in isolated fixtures. Distinct designs and duplicates stay separate; never automatically drawable.",
      },
      bio: {
        "zh-TW": "用緞帶書頁留下自己的閱讀節奏。",
        en: "Keep my reading rhythm through Ribbon Pages.",
      },
      badge: {
        "zh-TW": "緞帶書頁 · 視覺範本，非正式成就",
        en: "Ribbon Pages · Visual template, not a formal achievement",
      },
      cardStories: [
        {
          "zh-TW": "展開：寬色帶連接頁面兩側。",
          en: "Unfold: a broad band connects two page edges.",
        },
        {
          "zh-TW": "交疊：細色帶分出前後閱讀層次。",
          en: "Overlap: narrow bands separate reading layers.",
        },
        {
          "zh-TW": "留邊：邊界外的空白保留下一章。",
          en: "Margin: space beyond the boundary reserves the next chapter.",
        },
      ],
    },
  ],
  ...[
    {
      id: "local-demo-270-round",
      coverTone: "orbit",
      composition: "round",
      title: {
        "zh-TW": "圓窗時刻 · 虛構範本",
        en: "Round Window Moments · Fictional template",
      },
      story: {
        "zh-TW":
          "三張紙上圓窗依序移動重心：首張把圓置於上方，第二張用交疊建立距離，第三張留下中央空白。紫色與淡金色僅是本機幾何設計，不是真人照片、拍攝紀錄或合作。",
        en: "Three paper windows shift their visual center: the first lifts a circle, the second creates distance through overlap, and the third opens the center. Violet and pale gold form local geometry, not photographs, shoot records or collaborations.",
      },
      guide: {
        "zh-TW":
          "先讀上移、交疊、留白三個構圖提案，再比較不同款式。完整、部分與空收藏只作隔離情境；範本不提供抽卡或獎勵。",
        en: "Read the raised, overlapping and open compositions before comparing designs. Full, partial and empty collections are isolated scenarios; templates offer no draws or rewards.",
      },
      bio: {
        "zh-TW": "以圓窗與留白整理自己的閱讀節奏。",
        en: "Arrange my reading rhythm through circles and open space.",
      },
      badge: {
        "zh-TW": "圓窗 · 視覺範本，非正式成就",
        en: "Round Window · Visual template, not a formal achievement",
      },
      cardStories: [
        {
          "zh-TW": "上移：單圓把重心移向上方，底部保留閱讀空間。",
          en: "Rise: one circle lifts the center, leaving reading space below.",
        },
        {
          "zh-TW": "交疊：雙圓以重疊區分前後層次。",
          en: "Overlap: two circles distinguish front and back through their intersection.",
        },
        {
          "zh-TW": "留白：圓環保留中間空間，讓故事暫停。",
          en: "Open: a ring reserves its center for a pause in the story.",
        },
      ],
    },
    {
      id: "local-demo-270-step",
      coverTone: "garden",
      composition: "steps",
      title: {
        "zh-TW": "階梯色譜 · 虛構範本",
        en: "Steps of Color · Fictional template",
      },
      story: {
        "zh-TW":
          "用三段矩形構成一座想像中的紙上階梯。綠色與深淺邊界帶出向上、轉角與休息平台，不表示真實場地或拍攝。每張卡面都是本機向量與文字示意。",
        en: "Three rectangular tiers form an imagined paper staircase. Green fields and contrasting edges suggest ascent, a turn and a landing, without representing a real location or shoot. Every design is local vector and text illustration.",
      },
      guide: {
        "zh-TW":
          "依向上、轉角、平台閱讀，也可自選順序。重複卡與不同款式分開；預覽不授予持卡、徽章或正式權利。",
        en: "Read ascent, turn and landing in sequence or choose another order. Duplicates and distinct designs stay separate; previews grant no holdings, badges or formal rights.",
      },
      bio: {
        "zh-TW": "收藏色塊之間的轉折。",
        en: "Collect the turns between color fields.",
      },
      badge: {
        "zh-TW": "階梯 · 視覺範本，非正式成就",
        en: "Steps · Visual template, not a formal achievement",
      },
      cardStories: [
        {
          "zh-TW": "向上：三個矩形依次增加高度。",
          en: "Ascent: three rectangles increase in height.",
        },
        {
          "zh-TW": "轉角：移動中段的位置，讓閱讀方向改變。",
          en: "Turn: shifting the middle tier changes the reading direction.",
        },
        {
          "zh-TW": "平台：上方水平線留出安靜的結尾。",
          en: "Landing: a horizontal upper edge leaves a quiet ending.",
        },
      ],
    },
    {
      id: "local-demo-270-wave",
      coverTone: "tide",
      composition: "waves",
      title: {
        "zh-TW": "波紋郵札 · 虛構範本",
        en: "Ripple Postcards · Fictional template",
      },
      story: {
        "zh-TW":
          "以藍色曲線構想三張不存在的郵札：平行線、相遇的弧線與漸疏的波紋。這些線條不描述真實海岸、天氣或寄送紀錄；素材完全來自本機向量與雙語文字。",
        en: "Blue curves imagine three postcards that do not exist: parallel lines, meeting arcs and widening ripples. The lines describe no real coast, weather or delivery record; materials are entirely local vectors and bilingual text.",
      },
      guide: {
        "zh-TW":
          "比較平行、相遇與漸疏的閱讀節奏。只在示意情境查看已展示款式；沒有真人素材、正式上架、實體寄送或營運成效宣告。",
        en: "Compare parallel, meeting and widening rhythms. View only the designs shown in sample scenarios; no real-person materials, release, physical delivery or performance claims.",
      },
      bio: {
        "zh-TW": "把曲線留下的空間放進收藏故事。",
        en: "Keep the space between curves in my collection story.",
      },
      badge: {
        "zh-TW": "波紋 · 視覺範本，非正式成就",
        en: "Ripples · Visual template, not a formal achievement",
      },
      cardStories: [
        {
          "zh-TW": "平行：三條曲線維持相同方向。",
          en: "Parallel: three curves keep the same direction.",
        },
        {
          "zh-TW": "相遇：中段弧線靠近，形成閱讀停點。",
          en: "Meeting: middle arcs approach to form a reading pause.",
        },
        {
          "zh-TW": "漸疏：線條距離增加，留下下一頁空間。",
          en: "Widening: the lines move apart, leaving space for the next page.",
        },
      ],
    },
  ],
].map((t) => ({
  ...t,
  synthetic: true,
  version: 1,
  source: bi(
    "既有本機panel／Progress／BadgeMark與文字範本；無外部照片。正式合作、素材權利與印製用途待核定。",
    "Existing local panel, Progress, BadgeMark and text templates; no external photographs. Real collaboration, material rights and print use remain unapproved.",
  ),
  materialReferences: [],
}));

/** Fictional editorial references, never confirmed interviews or collaborations. */
export const CREATOR_CONTENT_TEMPLATES = COLLECTION_THEMES.filter((t) =>
  t.id.startsWith("local-demo-086-"),
).map((t) => ({
  id: "creator-template-" + t.id,
  seriesId: t.id,
  version: 1,
  synthetic: true,
  workIntro: bi(
    `「${t.title["zh-TW"]}」以文字與幾何版型探索構圖，不代表真人作品、已完成拍攝或合作。`,
    `“${t.title.en}” explores composition through text and geometric layouts, without claiming a real person's work, completed shoot or collaboration.`,
  ),
  process: [
    bi(
      "企劃：先確認可使用來源與用途，選擇三種公開構圖。",
      "Planning: confirm permissible sources and uses, then choose three public compositions.",
    ),
    bi(
      "設計：比較留白、節奏與文字對比，保留可讀的替代文字。",
      "Design: compare open space, rhythm and text contrast, keeping readable alternative text.",
    ),
    bi(
      "檢查：完成雙語與素材用途核對，正常送審後才能指定版本發布。",
      "Check: complete bilingual and material-use checks, then submit for normal exact-version review before publication.",
    ),
  ],
  questions: [
    bi(
      "這個主題希望讀者先注意哪一個公開構圖？",
      "Which public composition should readers notice first?",
    ),
    bi(
      "三個版型如何建立不同閱讀節奏？",
      "How do the three layouts establish different reading rhythms?",
    ),
    bi(
      "哪些留白與色彩選擇有助於故事理解？",
      "Which choices of space and color help readers understand the story?",
    ),
    bi(
      "若延伸下一套內容，哪些素材與用途需要重新確認？",
      "For a later series, which materials and uses need renewed confirmation?",
    ),
  ],
  confirmedAnswers: null,
  collaborator: null,
  shootDate: null,
  source: t.source,
}));

/** Used only by isolated QA fixtures. Never attach this catalogue to the user's original SQLite. */
export function collectionSampleCatalog(base) {
  const pools = COLLECTION_THEMES.map((t) => ({
    ...base.discoveryPools[0],
    id: t.id,
    name: t.title["zh-TW"],
    description: t.story["zh-TW"],
    status: "upcoming",
    goddessIds: [],
    startAt: "",
    endAt: "",
  }));
  const cards = COLLECTION_THEMES.flatMap((t) =>
    ["C", "R", "SR"].map((grade, i) => ({
      id: t.id + "-design-" + i,
      poolId: t.id,
      grade,
      name: t.title["zh-TW"] + " · " + (i + 1),
    })),
  );
  return {
    ...base,
    discoveryPools: [...base.discoveryPools, ...pools],
    pools: [
      ...base.pools,
      ...pools.map((p) => ({ id: p.id, status: "upcoming", startAt: "", endAt: "" })),
    ],
    cards: [...base.cards, ...cards],
  };
}
