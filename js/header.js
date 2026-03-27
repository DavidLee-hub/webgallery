// header.js - 헤더 스크롤 감지

const header = document.getElementById('header');

// 스크롤 시 헤더에 is-scrolled 클래스 토글
window.addEventListener('scroll', () => {
  if (window.scrollY > 0) {
    header.classList.add('is-scrolled');
  } else {
    header.classList.remove('is-scrolled');
  }
});
