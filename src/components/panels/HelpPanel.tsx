export default function HelpPanel() {
  const sections = [
    {
      title: '대화 방식',
      items: [
        { label: '귀납 모드', desc: '말씀 길잡이가 질문으로 이끌며 스스로 발견하도록 돕습니다. 깊은 묵상에 적합합니다.' },
        { label: '자유 모드', desc: '편하게 이야기를 나누는 일상적 대화 방식입니다. 입력창 오른쪽 토글로 언제든 전환할 수 있습니다.' },
      ],
    },
    {
      title: '검색',
      items: [
        { label: '구절 검색', desc: '"용서가 어려워요", "두려움을 이기고 싶어요" 같은 자연어로 검색하면 의미적으로 가까운 구절 5개를 찾아드립니다. 31,103개 KRV 전체를 대상으로 합니다.' },
        { label: '주제 검색', desc: '사랑, 용서, 믿음 등 주제 키워드를 입력하면 12개 큐레이션 테마에서 일치하는 항목을 보여줍니다.' },
      ],
    },
    {
      title: '묵상 테마',
      items: [
        { label: '12개 테마', desc: '사랑 · 소망 · 용서 · 평안 · 인내 · 지혜 · 감사 · 기도 · 회개 · 믿음 · 위로 · 순종. 테마를 선택하면 RAG가 관련 구절을 동적으로 검색합니다.' },
        { label: '이 주제로 대화 시작', desc: '테마 상세 화면 상단 버튼을 누르면 해당 주제로 말씀 길잡이와 바로 대화를 시작합니다.' },
      ],
    },
    {
      title: '탐독',
      items: [
        { label: '책 · 장 · 절 탐색', desc: '창세기부터 요한계시록까지 원하는 책, 장, 절을 직접 선택해 본문을 읽을 수 있습니다.' },
      ],
    },
    {
      title: '원어 분석',
      items: [
        { label: '헬라어 · 히브리어', desc: '구절 카드의 "원어" 버튼을 누르면 핵심 단어의 음역 · 의미 · 본문 뉘앙스를 BDAG/HALOT 기준으로 설명합니다.' },
      ],
    },
    {
      title: '번역 비교',
      items: [
        { label: '5개 번역본 동시 표시', desc: '구절 카드의 "비교" 버튼을 누르면 KRV · 새번역 · NIV · ESV · KJV를 나란히 보여줍니다.' },
      ],
    },
    {
      title: '대화 기록',
      items: [
        { label: '자동 저장 · 복원', desc: '대화를 최대 10개까지 브라우저에 저장합니다. 새 대화를 시작하면 이전 대화가 기록에 보관됩니다. 새로고침해도 현재 대화가 복원됩니다.' },
      ],
    },
    {
      title: 'Gemini API 키',
      items: [
        { label: 'BYO 키 설정', desc: '상단 열쇠 아이콘(🔑)을 눌러 본인의 Gemini API 키를 입력하면 공유 키 대신 사용됩니다. 브라우저에만 저장되며 서버로 전송되지 않습니다.' },
        { label: '키 발급', desc: 'Google AI Studio(aistudio.google.com)에서 무료로 발급받을 수 있습니다.' },
      ],
    },
  ]

  return (
    <div className="space-y-5 pb-4">
      <p className="text-[0.8rem] text-[var(--ink-medium)] leading-relaxed">
        말씀의 길(VERBUM)은 하나님께 더 가까이 나아가도록 돕는 작은 도구입니다. 아래 기능들을 통해 성경을 더 깊이 탐구하세요.
      </p>

      {sections.map((section) => (
        <div key={section.title} className="space-y-2">
          <h3 className="verse-label border-b border-[var(--clay-border)] pb-1">
            {section.title}
          </h3>
          <ul className="space-y-2.5">
            {section.items.map((item) => (
              <li key={item.label} className="pl-3 border-l-2 border-[var(--clay-border)] space-y-0.5">
                <div className="text-[0.82rem] font-medium text-[var(--ink-dark)]">
                  {item.label}
                </div>
                <p className="text-[0.78rem] text-[var(--ink-medium)] leading-relaxed">
                  {item.desc}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
