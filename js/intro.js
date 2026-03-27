// intro.js - 인트로 페이지 배경 이미지 설정

// photos.json을 불러와 마지막 사진을 배경으로 설정
fetch('photos.json')
  .then(res => res.json())
  .then(photos => {
    const lastPhoto = photos[photos.length - 1];
    const bg = document.getElementById('introBg');
    bg.style.backgroundImage = `url('${lastPhoto.path}')`;
  })
  .catch(err => {
    console.error('photos.json 로드 실패:', err);
  });
