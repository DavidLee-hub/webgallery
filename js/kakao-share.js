// kakao-share.js - 카카오톡 공유 및 링크 복사

const KAKAO_KEY = '343330c2a01d7c2b054e06070c3f871d';
const SITE_URL = 'https://junphoto.co.kr';

// ── Kakao SDK 초기화 ──
function initKakao() {
  if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
    Kakao.init(KAKAO_KEY);
  }
}

// ── 갤러리 현재 사진 공유 ──
function shareCurrentPhoto() {
  initKakao();

  // gallery.js 전역 변수 참조
  const photo = (typeof currentPhotos !== 'undefined') ? currentPhotos[currentIndex] : null;
  if (!photo) return;

  // 파일명 그대로인 제목(숫자·언더스코어로 시작)은 사이트명으로 대체
  const hasTitle = photo.title && !/^[_0-9A-Z]/.test(photo.title);
  const title = hasTitle ? `${photo.title} — 현준의 사진세상` : '현준의 사진세상';
  const imageUrl = `${SITE_URL}/${photo.path}`;

  Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: title,
      description: 'Photography by Lee Hyenjun',
      imageUrl: imageUrl,
      link: {
        mobileWebUrl: `${SITE_URL}/gallery.html`,
        webUrl: `${SITE_URL}/gallery.html`,
      },
    },
  });
}

// ── About 페이지 공유 ──
function shareAboutPage() {
  initKakao();

  Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: '이현준 — Lee Hyenjun',
      description: '빛과 시간이 머무는 자리를 기록하는 사진작가를 소개합니다.',
      imageUrl: `${SITE_URL}/%ED%94%84%EB%A1%9C%ED%95%84%EC%82%AC%EC%A7%84.jpg`,
      link: {
        mobileWebUrl: `${SITE_URL}/about.html`,
        webUrl: `${SITE_URL}/about.html`,
      },
    },
  });
}

// ── URL 복사 ──
function copyLink(url) {
  const target = url || location.href;
  navigator.clipboard.writeText(target).then(() => {
    showCopyToast();
  }).catch(() => {
    // clipboard API 미지원 환경 fallback
    const el = document.createElement('textarea');
    el.value = target;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showCopyToast();
  });
}

// ── 복사 완료 토스트 ──
function showCopyToast() {
  const toast = document.getElementById('copyToast');
  if (!toast) return;
  toast.classList.add('is-show');
  setTimeout(() => toast.classList.remove('is-show'), 2200);
}
