// gallery.js - 갤러리 메인 로직

let allPhotos = [];
let currentPhotos = []; // 현재 카테고리 사진 목록
let currentIndex = 0;   // 현재 히어로에 표시 중인 사진 인덱스

// ── 초기 실행 ──
fetch('photos.json')
  .then(res => res.json())
  .then(photos => {
    allPhotos = photos;

    // 초기 히어로: 전체 목록 마지막에서 2번째 사진
    const defaultPhotos = allPhotos.filter(p => p.category !== 'recent');
    currentPhotos = defaultPhotos;
    currentIndex = defaultPhotos.length - 2;

    renderHero(currentIndex);
    renderThumbnails(currentPhotos, currentIndex);
    initGnb();
    initArrows();
    initFooterGrid();
  })
  .catch(err => console.error('photos.json 로드 실패:', err));

// ── GNB 클릭 이벤트 초기화 ──
function initGnb() {
  const gnbLinks = document.querySelectorAll('[data-category]');

  gnbLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();

      const category = link.dataset.category;
      const subcategory = link.dataset.subcategory || null;

      // 활성 클래스 초기화 후 현재 링크에 적용
      gnbLinks.forEach(l => l.classList.remove('is-active'));
      link.classList.add('is-active');

      // 카테고리 필터링 후 첫 번째 사진부터 표시
      currentPhotos = filterPhotos(category, subcategory);
      currentIndex = 0;

      renderHero(currentIndex);
      renderThumbnails(currentPhotos, currentIndex);
    });
  });
}

// ── 화살표 클릭 이벤트 초기화 ──
function initArrows() {
  const prevBtn = document.querySelector('.hero__arrow--prev');
  const nextBtn = document.querySelector('.hero__arrow--next');

  prevBtn.addEventListener('click', () => {
    if (!currentPhotos.length) return;
    currentIndex = (currentIndex - 1 + currentPhotos.length) % currentPhotos.length;
    renderHero(currentIndex);
    renderThumbnails(currentPhotos, currentIndex);
  });

  nextBtn.addEventListener('click', () => {
    if (!currentPhotos.length) return;
    currentIndex = (currentIndex + 1) % currentPhotos.length;
    renderHero(currentIndex);
    renderThumbnails(currentPhotos, currentIndex);
  });
}

// ── 카테고리 필터링 ──
function filterPhotos(category, subcategory) {
  return allPhotos.filter(p => {
    if (p.category !== category) return false;
    if (subcategory && p.subcategory !== subcategory) return false;
    return true;
  });
}

// ── 히어로 이미지 렌더링 ──
function renderHero(index) {
  const slide = document.querySelector('.hero__slide');
  if (!currentPhotos.length) return;

  const photo = currentPhotos[index];
  slide.style.backgroundImage = `url('${photo.path}')`;
}

// ── 푸터 전체 그리드 초기화 ──
function initFooterGrid() {
  const toggleBtn = document.getElementById('toggleGridBtn');
  const grid = document.getElementById('footerGrid');
  const gridList = document.getElementById('footerGridList');

  // 전체 사진 미리 렌더링 (recent 제외)
  const allVisible = allPhotos.filter(p => p.category !== 'recent');
  allVisible.forEach(photo => {
    const li = document.createElement('li');
    li.style.backgroundImage = `url('${photo.path}')`;

    // 클릭 시 히어로로 이동
    li.addEventListener('click', () => {
      currentPhotos = filterPhotos(photo.category, photo.subcategory);
      currentIndex = currentPhotos.findIndex(p => p.id === photo.id);
      renderHero(currentIndex);
      renderThumbnails(currentPhotos, currentIndex);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    gridList.appendChild(li);
  });

  // 버튼 클릭 시 그리드 토글
  toggleBtn.addEventListener('click', () => {
    const isOpen = grid.classList.toggle('is-open');
    toggleBtn.classList.toggle('is-open', isOpen);
  });
}

// ── 썸네일 strip 렌더링 ──
function renderThumbnails(photos, activeIndex) {
  const list = document.querySelector('.hero__thumb-list');
  list.innerHTML = '';

  // 최대 6장 표시 (activeIndex 중심으로)
  const total = photos.length;
  const maxThumb = Math.min(6, total);

  // 시작 인덱스 계산: 활성 사진이 가능한 한 가운데 오도록
  let startIdx = Math.max(0, activeIndex - Math.floor(maxThumb / 2));
  if (startIdx + maxThumb > total) startIdx = Math.max(0, total - maxThumb);

  for (let i = startIdx; i < startIdx + maxThumb; i++) {
    const photo = photos[i];
    const li = document.createElement('li');

    li.style.backgroundImage = `url('${photo.path}')`;
    li.style.backgroundSize = 'cover';
    li.style.backgroundPosition = 'center';

    // 현재 히어로와 같은 사진이면 활성 표시
    if (i === activeIndex) li.classList.add('is-active');

    // 썸네일 클릭 시 히어로 교체
    li.addEventListener('click', () => {
      currentIndex = i;
      renderHero(currentIndex);
      renderThumbnails(currentPhotos, currentIndex);
    });

    list.appendChild(li);
  }
}
